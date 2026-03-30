import { mutation, query, action } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODERATION_MODEL = "omni-moderation-latest";

const HIGH_CONFIDENCE_THRESHOLD = 0.7;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.4;

const CATEGORIES_TO_BLOCK = [
  "hate",
  "violence",
  "sexual_minors",
  "self_harm_intent",
  "self_harm_instructions",
];

const CATEGORIES_TO_WARN = [
  "hate_threatening",
  "violence_graphic",
  "self_harm",
  "sexual",
];

interface ModerationResponse {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
}

async function moderateContent(content: string): Promise<ModerationResponse | null> {
  if (!OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not configured. Moderation skipped.");
    return null;
  }

  try {
    const normalized = content
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();

    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODERATION_MODEL,
        input: normalized,
      }),
    });

    if (!response.ok) {
      console.error("Moderation API error:", response.status);
      return null;
    }

    const data = await response.json();
    return data.results[0] as ModerationResponse;
  } catch (error) {
    console.error("Moderation error:", error);
    return null;
  }
}

function determineAction(
  moderationResult: ModerationResponse
): { action: "block" | "warn" | "allow"; severity: string; categories: string[] } {
  const flaggedCategories: string[] = [];

  for (const category of CATEGORIES_TO_BLOCK) {
    if (
      moderationResult.categories[category] &&
      moderationResult.category_scores[category] > HIGH_CONFIDENCE_THRESHOLD
    ) {
      flaggedCategories.push(category);
    }
  }

  if (flaggedCategories.length > 0) {
    return { action: "block", severity: "high", categories: flaggedCategories };
  }

  const warningCategories: string[] = [];
  for (const category of CATEGORIES_TO_WARN) {
    const score = moderationResult.category_scores[category] || 0;
    if (score >= MEDIUM_CONFIDENCE_THRESHOLD) {
      warningCategories.push(category);
    }
  }

  if (warningCategories.length > 0) {
    return { action: "warn", severity: "medium", categories: warningCategories };
  }

  for (const [category, flagged] of Object.entries(moderationResult.categories)) {
    if (flagged && moderationResult.category_scores[category] > MEDIUM_CONFIDENCE_THRESHOLD) {
      return { action: "allow", severity: "low", categories: [category] };
    }
  }

  return { action: "allow", severity: "none", categories: [] };
}

export const moderateText = action({
  args: { content: v.string(), contentType: v.string(), userId: v.id("users") },
  handler: async (ctx, { content, contentType, userId }) => {
    const moderationResult = await moderateContent(content);

    if (!moderationResult) {
      return {
        success: true,
        action: "pending",
        flagged: false,
        categories: {},
        scores: {},
        message: "Moderation service unavailable. Content will be reviewed manually.",
      };
    }

    const { action, severity, categories } = determineAction(moderationResult);

    await ctx.runMutation("backend:moderation:logModeration", {
      userId,
      contentId: undefined,
      contentType,
      rawContent: content,
      flagged: moderationResult.flagged,
      categories: JSON.stringify(moderationResult.categories),
      scores: JSON.stringify(moderationResult.category_scores),
      actionTaken: action,
      severity,
    });

    if (action === "block") {
      return {
        success: false,
        action: "block",
        flagged: true,
        categories: moderationResult.categories,
        scores: moderationResult.category_scores,
        message: "This content violates platform guidelines and cannot be posted.",
      };
    }

    if (action === "warn") {
      return {
        success: true,
        action: "warn",
        flagged: moderationResult.flagged,
        categories: moderationResult.categories,
        scores: moderationResult.category_scores,
        message: "This may violate guidelines. Please review before posting.",
      };
    }

    return {
      success: true,
      action: "allow",
      flagged: false,
      categories: {},
      scores: {},
      message: "Content approved.",
    };
  },
});

export const logModeration = mutation({
  args: {
    userId: v.id("users"),
    contentId: v.optional(v.id("artistContent")),
    contentType: v.string(),
    rawContent: v.string(),
    flagged: v.boolean(),
    categories: v.string(),
    scores: v.string(),
    actionTaken: v.string(),
    severity: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("moderationLogs", {
      ...args,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

export const getModerationLogs = query({
  args: { limit: v.optional(v.number()), flaggedOnly: v.optional(v.boolean()) },
  handler: async (ctx, { limit = 100, flaggedOnly = false }) => {
    const logs = await ctx.db.query("moderationLogs").collect();
    const sorted = logs.sort((a, b) => b.createdAt - a.createdAt);
    const filtered = flaggedOnly ? sorted.filter((l) => l.flagged) : sorted;
    return filtered.slice(0, limit);
  },
});

export const getUserModerationHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("moderationLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getUserStrikes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("moderationStrikes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getActiveStrikes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const strikes = await ctx.db
      .query("moderationStrikes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return strikes.filter((s) => !s.expiresAt || s.expiresAt > Date.now());
  },
});

export const issueStrike = mutation({
  args: {
    userId: v.id("users"),
    strikeType: v.string(),
    reason: v.string(),
    contentId: v.optional(v.id("artistContent")),
    issuedBy: v.id("users"),
    duration: v.optional(v.string()),
  },
  handler: async (ctx, { userId, strikeType, reason, contentId, issuedBy, duration }) => {
    let expiresAt: number | undefined;
    if (duration === "24h") {
      expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    } else if (duration === "7d") {
      expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    } else if (duration === "permanent") {
      expiresAt = undefined;
    }

    await ctx.db.insert("moderationStrikes", {
      userId,
      strikeType,
      reason,
      contentId,
      issuedBy,
      expiresAt,
      isActive: true,
      createdAt: Date.now(),
    });

    const activeStrikes = await ctx.runQuery("backend:moderation:getActiveStrikes", { userId });
    const strikeCount = activeStrikes.length;

    let action: "warn" | "restrict" | "suspend" | "ban" = "warn";
    if (strikeCount >= 4) {
      action = "ban";
    } else if (strikeCount >= 3) {
      action = "suspend";
    } else if (strikeCount >= 2) {
      action = "restrict";
    }

    return { success: true, strikeCount, action };
  },
});

export const resolveStrike = mutation({
  args: { strikeId: v.id("moderationStrikes"), notes: v.optional(v.string()) },
  handler: async (ctx, { strikeId, notes }) => {
    await ctx.db.patch(strikeId, { isActive: false });
    return { success: true };
  },
});

export const checkUserStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return { isSuspended: false, restrictionLevel: "none" };

    if (user.isSuspended) {
      return { isSuspended: true, restrictionLevel: "suspended" };
    }

    const activeStrikes = await ctx.runQuery("backend:moderation:getActiveStrikes", { userId });
    const strikeCount = activeStrikes.length;

    let restrictionLevel: "none" | "warned" | "restricted" | "suspended" = "none";
    if (strikeCount >= 4) {
      restrictionLevel = "suspended";
      await ctx.db.patch(userId, { isSuspended: true });
    } else if (strikeCount >= 3) {
      restrictionLevel = "suspended";
    } else if (strikeCount >= 2) {
      restrictionLevel = "restricted";
    } else if (strikeCount >= 1) {
      restrictionLevel = "warned";
    }

    return { isSuspended: user.isSuspended, restrictionLevel };
  },
});
