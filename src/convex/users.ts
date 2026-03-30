import { defineMutation, defineQuery } from "convex/server";
import { v } from "convex/values";

// Get user profile by ID
export const getUser = defineQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },
});

// Get user profile by email
export const getUserByEmail = defineQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();
    return user;
  },
});

// Create a new user profile
export const createUser = defineMutation({
  args: {
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const userId = await ctx.db.insert("users", {
      ...args,
      followers: 0,
      following: 0,
      postsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return userId;
  },
});

// Update user profile
export const updateUser = defineMutation({
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
    
    // Filter out undefined values
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

// Get user's posts
export const getUserPosts = defineQuery({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    return await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), userId))
      .order("desc")
      .take(limit)
      .collect();
  },
});

// Get all users (for discovery)
export const getAllUsers = defineQuery({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 20, offset = 0 }) => {
    return await ctx.db
      .query("users")
      .order("desc")
      .take(limit, offset)
      .collect();
  },
});

// Search users by name or username
export const searchUsers = defineQuery({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query: searchQuery, limit = 10 }) => {
    return await ctx.db
      .query("users")
      .filter((q) => 
        q.or(
          q.regexMatch(q.field("name"), `.*${searchQuery}.*`, "i"),
          q.regexMatch(q.field("username"), `.*${searchQuery}.*`, "i")
        )
      )
      .take(limit)
      .collect();
  },
});

// Follow a user
export const followUser = defineMutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, { followerId, followingId }) => {
    // Prevent self-following
    if (followerId === followingId) {
      throw new Error("Cannot follow yourself");
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("follows")
      .filter((q) => 
        q.and(
          q.eq(q.field("followerId"), followerId),
          q.eq(q.field("followingId"), followingId)
        )
      )
      .first();

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    // Create follow relationship
    await ctx.db.insert("follows", {
      followerId,
      followingId,
      createdAt: new Date(),
    });

    // Update follower count for the user being followed
    const followingUser = await ctx.db.get(followingId);
    if (followingUser) {
      const followersCount = await ctx.db
        .query("follows")
        .filter((q) => q.eq(q.field("followingId"), followingId))
        .count();
      
      const followingCount = await ctx.db
        .query("follows")
        .filter((q) => q.eq(q.field("followerId"), followingId))
        .count();

      await ctx.db.patch(followingId, {
        followers: followersCount,
        following: followingCount,
        updatedAt: new Date(),
      });
    }

    // Update following count for the follower
    const followerUser = await ctx.db.get(followerId);
    if (followerUser) {
      const followingCount = await ctx.db
        .query("follows")
        .filter((q) => q.eq(q.field("followerId"), followerId))
        .count();

      await ctx.db.patch(followerId, {
        following: followingCount,
        updatedAt: new Date(),
      });
    }

    return { success: true };
  },
});

// Unfollow a user
export const unfollowUser = defineMutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, { followerId, followingId }) => {
    // Find and delete the follow relationship
    const follow = await ctx.db
      .query("follows")
      .filter((q) => 
        q.and(
          q.eq(q.field("followerId"), followerId),
          q.eq(q.field("followingId"), followingId)
        )
      )
      .first();

    if (!follow) {
      throw new Error("Not following this user");
    }

    await ctx.db.delete(follow._id);

    // Update follower count for the user being unfollowed
    const followingUser = await ctx.db.get(followingId);
    if (followingUser) {
      const followersCount = await ctx.db
        .query("follows")
        .filter((q) => q.eq(q.field("followingId"), followingId))
        .count();
      
      const followingCount = await ctx.db
        .query("follows")
        .filter((q) => q.eq(q.field("followerId"), followingId))
        .count();

      await ctx.db.patch(followingId, {
        followers: followersCount,
        following: followingCount,
        updatedAt: new Date(),
      });
    }

    // Update following count for the unfollower
    const followerUser = await ctx.db.get(followerId);
    if (followerUser) {
      const followingCount = await ctx.db
        .query("follows")
        .filter((q) => q.eq(q.field("followerId"), followerId))
        .count();

      await ctx.db.patch(followerId, {
        following: followingCount,
        updatedAt: new Date(),
      });
    }

    return { success: true };
  },
});

// Get user's followers
export const getUserFollowers = defineQuery({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const follows = await ctx.db
      .query("follows")
      .filter((q) => q.eq(q.field("followingId"), userId))
      .order("desc")
      .take(limit)
      .collect();

    // Get user details for each follower
    const followers = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followerId);
        return {
          ...user,
          _id: follow.followerId,
          followedAt: follow._creationTime,
        };
      })
    );

    return followers;
  },
});

// Get user's following
export const getUserFollowing = defineQuery({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const follows = await ctx.db
      .query("follows")
      .filter((q) => q.eq(q.field("followerId"), userId))
      .order("desc")
      .take(limit)
      .collect();

    // Get user details for each following
    const following = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followingId);
        return {
          ...user,
          _id: follow.followingId,
          followedAt: follow._creationTime,
        };
      })
    );

    return following;
  },
});

// Check if current user is following another user
export const isFollowing = defineQuery({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, { followerId, followingId }) => {
    const follow = await ctx.db
      .query("follows")
      .filter((q) => 
        q.and(
          q.eq(q.field("followerId"), followerId),
          q.eq(q.field("followingId"), followingId)
        )
      )
      .first();

    return !!follow;
  },
});