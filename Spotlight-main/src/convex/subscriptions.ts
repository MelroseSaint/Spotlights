import { defineMutation, defineQuery } from "convex/server";
import { v } from "convex/values";

// Get user's subscription
export const getUserSubscription = defineQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return {
      tier: user.subscriptionTier || "standard",
      startDate: user.subscriptionStartDate || null,
      endDate: user.subscriptionEndDate || null,
    };
  },
});

// Update user's subscription
export const updateSubscription = defineMutation({
  args: {
    userId: v.id("users"),
    tier: v.string(),
    startDate: v.optional(v.any()),
    endDate: v.optional(v.any()),
  },
  handler: async (ctx, { userId, tier, startDate, endDate }) => {
    await ctx.db.patch(userId, {
      subscriptionTier: tier,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      updatedAt: new Date(),
    });
    
    return { success: true };
  },
});

// Get all subscription tiers (static data)
export const getSubscriptionTiers = defineQuery({
  args: {},
  handler: async (ctx) => {
    return [
      {
        id: "standard",
        name: "Standard",
        price: "$9.99",
        period: "per month",
        description: "Perfect for emerging artists starting their journey",
        features: [
          "Upload up to 10 tracks monthly",
          "Basic analytics dashboard",
          "Profile customization",
          "Community access",
          "Standard audio quality"
        ],
        popular: false
      },
      {
        id: "growth",
        name: "Growth",
        price: "$19.99",
        period: "per month",
        description: "For growing artists expanding their reach",
        features: [
          "Unlimited track uploads",
          "Advanced analytics & insights",
          "Enhanced profile features",
          "Priority placement in feeds",
          "High-quality audio",
          "Collaboration tools",
          "Monthly performance reports"
        ],
        popular: true
      },
      {
        id: "elite",
        name: "Elite",
        price: "$39.99",
        period: "per month",
        description: "Premium features for professional artists",
        features: [
          "Everything in Growth tier",
          "Promoted content placement",
          "Dedicated account manager",
          "Custom domain for profile",
          "Early access to new features",
          "Exclusive networking events",
          "Professional analytics reports",
          "Marketing consultation sessions"
        ],
        popular: false
      }
    ];
  },
});