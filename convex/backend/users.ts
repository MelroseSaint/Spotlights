import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { TIERS, ROOT_ADMIN_EMAIL, isValidCentralPAZipCode, getRegionByZipCode, EVENT_RULES } from "../constants";
import { getUserByEmail, canUploadContent, incrementUserContentCount, decrementUserContentCount, createNotification, isRootAdmin, isAdmin } from "../helpers";

export const testConnection = mutation({
  args: {},
  handler: async (ctx) => {
    return { success: true, message: "Backend is working!" };
  },
});

export const getCurrentUser = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, { sessionToken }) => {
    if (!sessionToken) return null;
    const session = await ctx.db.query("sessions").withIndex("by_token", (q) => q.eq("token", sessionToken)).first();
    if (!session) return null;
    if (session.expiresAt && session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id);
      return null;
    }
    const user = await ctx.db.get(session.userId);
    return user;
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    return { ...user, lightCredzBalance: undefined, lightCredzTotalEarned: undefined, lightCredzTotalSpent: undefined };
  },
});

function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createUser = mutation({
  args: { email: v.string(), name: v.string(), username: v.optional(v.string()), avatarUrl: v.optional(v.string()), bio: v.optional(v.string()), location: v.optional(v.string()), zipCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const isRoot = isRootAdmin(args.email);
    
    if (!args.zipCode) {
      throw new Error("Zip code is required for Central PA artists");
    }
    
    if (!isValidCentralPAZipCode(args.zipCode)) {
      throw new Error("Only Central PA zip codes are allowed (717, 170xx, 173xx, etc.)");
    }
    
    const region = getRegionByZipCode(args.zipCode);
    
    const userId = await ctx.db.insert("users", {
      email: args.email, 
      name: args.name, 
      username: args.username || undefined, 
      avatarUrl: args.avatarUrl || undefined, 
      bio: args.bio || undefined, 
      location: args.location || undefined,
      zipCode: args.zipCode,
      region: region || undefined,
      followers: 0, 
      following: 0, 
      postsCount: 0, 
      role: isRoot ? "root_admin" : "user", 
      tier: isRoot ? "elite" : "standard", 
      subscriptionStatus: "none",
      lightCredzBalance: isRoot ? 1000 : 0, 
      lightCredzTotalEarned: isRoot ? 1000 : 0, 
      lightCredzTotalSpent: 0, 
      activeContentCount: 0, 
      maxContentAllowed: isRoot ? 500 : 10,
      totalViews: 0, 
      totalEngagements: 0, 
      isVerified: isRoot, 
      isSuspended: false, 
      isFreshFace: true, 
      freshFaceScore: 100,
      eventCount: 0,
      maxEventsAllowed: isRoot ? 999 : 100,
      createdAt: Date.now(), 
      updatedAt: Date.now(),
    });
    
    await ctx.db.insert("playlists", {
      ownerId: userId,
      name: "Liked Songs",
      description: "Your liked tracks",
      isPublic: false,
      contentIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    const token = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    await ctx.db.insert("sessions", { 
      userId, 
      token, 
      createdAt: Date.now(), 
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 
    });
    
    return { userId: userId.toString(), token, success: true };
  },
});

export const signInUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email.toLowerCase())).first();
    if (!user) throw new Error("No account found with this email");
    if (user.isSuspended) throw new Error("This account has been suspended");
    const token = `${user._id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    await ctx.db.insert("sessions", { userId: user._id, token, createdAt: Date.now(), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
    return { token };
  },
});

export const signOutUser = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const session = await ctx.db.query("sessions").withIndex("by_token", (q) => q.eq("token", sessionToken)).first();
    if (session) {
      await ctx.db.delete(session._id);
    }
    return { success: true };
  },
});

export const setupRootAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(userId, {
      role: "root_admin",
      tier: "elite",
      isVerified: true,
      maxContentAllowed: 500,
      updatedAt: Date.now(),
    });
    return { success: true, message: "Root admin privileges applied" };
  },
});

export const getUserUploadStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const isAdmin = user.role === "root_admin" || user.role === "admin" || user.role === "moderator";
    return { 
      activeContentCount: user.activeContentCount, 
      maxContentAllowed: isAdmin ? -1 : user.maxContentAllowed, // -1 = unlimited for admins
      canUpload: isAdmin || user.activeContentCount < user.maxContentAllowed, 
      tier: user.tier, 
      subscriptionStatus: user.subscriptionStatus,
      isAdmin,
    };
  },
});

export const getUserLightCredz = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    return { balance: user.lightCredzBalance, totalEarned: user.lightCredzTotalEarned, totalSpent: user.lightCredzTotalSpent };
  },
});

export const followUser = mutation({
  args: { followerId: v.id("users"), followingId: v.id("users") },
  handler: async (ctx, { followerId, followingId }) => {
    if (followerId === followingId) throw new Error("Cannot follow yourself");
    const follower = await ctx.db.get(followerId);
    const following = await ctx.db.get(followingId);
    if (!follower || !following) throw new Error("User not found");
    const existingFollow = await ctx.db.query("follows").withIndex("by_follower", (q) => q.eq("followerId", followerId)).filter((q) => q.eq(q.field("followingId"), followingId)).first();
    if (existingFollow) throw new Error("Already following this user");
    await ctx.db.insert("follows", { followerId, followingId, createdAt: Date.now() });
    await ctx.db.patch(followerId, { following: (follower.following || 0) + 1, updatedAt: Date.now() });
    await ctx.db.patch(followingId, { followers: (following.followers || 0) + 1, updatedAt: Date.now() });
    await createNotification(ctx, followingId, "follow", "New Follower", `${follower.name} started following you`, followerId);
    return { success: true };
  },
});

export const unfollowUser = mutation({
  args: { followerId: v.id("users"), followingId: v.id("users") },
  handler: async (ctx, { followerId, followingId }) => {
    const follow = await ctx.db.query("follows").withIndex("by_follower", (q) => q.eq("followerId", followerId)).filter((q) => q.eq(q.field("followingId"), followingId)).first();
    if (!follow) throw new Error("Not following this user");
    await ctx.db.delete(follow._id);
    const follower = await ctx.db.get(followerId);
    const following = await ctx.db.get(followingId);
    if (follower) await ctx.db.patch(followerId, { following: Math.max(0, (follower.following || 0) - 1), updatedAt: Date.now() });
    if (following) await ctx.db.patch(followingId, { followers: Math.max(0, (following.followers || 0) - 1), updatedAt: Date.now() });
    return { success: true };
  },
});

export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.username !== undefined) updates.username = args.username;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.location !== undefined) updates.location = args.location;
    if (args.website !== undefined) updates.website = args.website;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.bannerUrl !== undefined) updates.bannerUrl = args.bannerUrl;
    
    await ctx.db.patch(args.userId, updates);
    return { success: true };
  },
});

export const getAllUsers = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, { search }) => {
    const users = await ctx.db.query("users").collect();
    if (!search) return users;
    const lowerSearch = search.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(lowerSearch) ||
      u.email.toLowerCase().includes(lowerSearch) ||
      (u.username && u.username.toLowerCase().includes(lowerSearch))
    );
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email.toLowerCase())).first();
  },
});

export const updateUserTier = mutation({
  args: {
    userId: v.id("users"),
    tier: v.string(),
    subscriptionStatus: v.string(),
    subscriptionStartDate: v.optional(v.number()),
    subscriptionEndDate: v.optional(v.number()),
    maxContentAllowed: v.number(),
    isVerified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    await ctx.db.patch(args.userId, {
      tier: args.tier,
      subscriptionStatus: args.subscriptionStatus,
      subscriptionStartDate: args.subscriptionStartDate,
      subscriptionEndDate: args.subscriptionEndDate,
      maxContentAllowed: args.maxContentAllowed,
      isVerified: args.isVerified,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});
