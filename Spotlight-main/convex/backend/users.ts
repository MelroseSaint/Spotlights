import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { TIERS, ROOT_ADMIN_EMAIL } from "./constants";
import {
  getUserByEmail,
  canUploadContent,
  incrementUserContentCount,
  decrementUserContentCount,
  createNotification,
  isRootAdmin,
  getMaxContentAllowed,
} from "./helpers";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();
    
    return user;
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    return {
      ...user,
      lightCredzBalance: undefined,
      lightCredzTotalEarned: undefined,
      lightCredzTotalSpent: undefined,
    };
  },
});

export const getUserByEmailQuery = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!user) return null;
    
    return {
      ...user,
      lightCredzBalance: undefined,
      lightCredzTotalEarned: undefined,
      lightCredzTotalSpent: undefined,
    };
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await getUserByEmail(ctx, args.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    
    const isRoot = isRootAdmin(args.email);
    
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      username: args.username,
      avatarUrl: args.avatarUrl,
      bio: args.bio,
      location: args.location,
      followers: 0,
      following: 0,
      postsCount: 0,
      role: isRoot ? "root_admin" : "user",
      tier: "standard",
      subscriptionStatus: "none",
      lightCredzBalance: 0,
      lightCredzTotalEarned: 0,
      lightCredzTotalSpent: 0,
      activeContentCount: 0,
      maxContentAllowed: TIERS.STANDARD.maxContent,
      totalViews: 0,
      totalEngagements: 0,
      isVerified: false,
      isSuspended: false,
      isFreshFace: true,
      freshFaceScore: 100,
      firstContentDate: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return userId;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updateData } = args;
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(filteredData).length === 0) {
      throw new Error("No data provided to update");
    }
    
    await ctx.db.patch(userId, {
      ...filteredData,
      updatedAt: new Date(),
    });
    
    return userId;
  },
});

export const getUserUploadStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    return {
      activeContentCount: user.activeContentCount,
      maxContentAllowed: user.maxContentAllowed,
      canUpload: user.activeContentCount < user.maxContentAllowed,
      tier: user.tier,
      subscriptionStatus: user.subscriptionStatus,
    };
  },
});

export const getAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50, offset = 0 }) => {
    return await ctx.db
      .query("users")
      .order("desc")
      .take(limit, offset)
      .collect();
  },
});

export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query: searchQuery, limit = 20 }) => {
    return await ctx.db
      .query("users")
      .filter((q) => 
        q.or(
          q.regexMatch(q.field("name"), `.*${searchQuery}.*`, "i"),
          q.regexMatch(q.field("username"), `.*${searchQuery}.*`, "i"),
          q.regexMatch(q.field("bio"), `.*${searchQuery}.*`, "i")
        )
      )
      .take(limit)
      .collect();
  },
});

export const getUsersByTier = query({
  args: {
    tier: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { tier, limit = 50 }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_tier", (q) => q.eq("tier", tier))
      .take(limit)
      .collect();
  },
});

export const getFreshFaces = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 20 }) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_freshFaceScore", (q) => q.order("desc"))
      .take(limit * 2)
      .collect();
    
    return users
      .filter(u => u.isFreshFace && u.freshFaceScore >= 50 && !u.isSuspended)
      .slice(0, limit);
  },
});

export const getUserLightCredz = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    return {
      balance: user.lightCredzBalance,
      totalEarned: user.lightCredzTotalEarned,
      totalSpent: user.lightCredzTotalSpent,
    };
  },
});

export const getLightCredzTransactions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    return await ctx.db
      .query("lightCredzTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit)
      .collect();
  },
});

export const followUser = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, { followerId, followingId }) => {
    if (followerId === followingId) {
      throw new Error("Cannot follow yourself");
    }
    
    const follower = await ctx.db.get(followerId);
    const following = await ctx.db.get(followingId);
    if (!follower || !following) throw new Error("User not found");
    
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", followerId))
      .filter((q) => q.eq(q.field("followingId"), followingId))
      .first();
    
    if (existingFollow) {
      throw new Error("Already following this user");
    }
    
    await ctx.db.insert("follows", {
      followerId,
      followingId,
      createdAt: new Date(),
    });
    
    await ctx.db.patch(followerId, {
      following: (follower.following || 0) + 1,
      updatedAt: new Date(),
    });
    
    await ctx.db.patch(followingId, {
      followers: (following.followers || 0) + 1,
      updatedAt: new Date(),
    });
    
    await createNotification(
      ctx,
      followingId,
      "follow",
      "New Follower",
      `${follower.name} started following you`,
      followerId
    );
    
    return { success: true };
  },
});

export const unfollowUser = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, { followerId, followingId }) => {
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", followerId))
      .filter((q) => q.eq(q.field("followingId"), followingId))
      .first();
    
    if (!follow) {
      throw new Error("Not following this user");
    }
    
    await ctx.db.delete(follow._id);
    
    const follower = await ctx.db.get(followerId);
    const following = await ctx.db.get(followingId);
    
    if (follower) {
      await ctx.db.patch(followerId, {
        following: Math.max(0, (follower.following || 0) - 1),
        updatedAt: new Date(),
      });
    }
    
    if (following) {
      await ctx.db.patch(followingId, {
        followers: Math.max(0, (following.followers || 0) - 1),
        updatedAt: new Date(),
      });
    }
    
    return { success: true };
  },
});

export const isFollowing = query({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, { followerId, followingId }) => {
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", followerId))
      .filter((q) => q.eq(q.field("followingId", followingId)))
      .first();
    
    return !!follow;
  },
});

export const getFollowers = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .take(limit)
      .collect();
    
    const followerIds = follows.map(f => f.followerId);
    const followers = await Promise.all(followerIds.map(id => ctx.db.get(id)));
    
    return followers.filter(Boolean);
  },
});

export const getFollowing = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .take(limit)
      .collect();
    
    const followingIds = follows.map(f => f.followingId);
    const following = await Promise.all(followingIds.map(id => ctx.db.get(id)));
    
    return following.filter(Boolean);
  },
});

export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    const content = await ctx.db
      .query("artistContent")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    
    const totalViews = content.reduce((sum, c) => sum + (c.views || 0), 0);
    const totalLikes = content.reduce((sum, c) => sum + (c.likes || 0), 0);
    const totalComments = content.reduce((sum, c) => sum + (c.comments || 0), 0);
    const totalShares = content.reduce((sum, c) => sum + (c.shares || 0), 0);
    
    return {
      followers: user.followers,
      following: user.following,
      contentCount: user.activeContentCount,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalEngagements: totalLikes + totalComments + totalShares,
    };
  },
});
