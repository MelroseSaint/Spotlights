import { mutation, query } from "convex/server";
import { v } from "convex/values";

// Get user profile by ID
export const getUser = query({
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
export const getUserByEmail = query({
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
export const createUser = mutation({
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
    const existingUser = await ctx.db      .query("users")
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

// Upload profile picture
export const uploadProfilePicture = mutation({
  args: {
    userId: v.id("users"),
    file: v.file(),
  },
  handler: async (ctx, args) => {
    const { userId, file } = args;
    
    // Upload file to storage
    const storageId = await ctx.storage.store(file);
    
    // Update user's profile picture
    await ctx.db.patch(userId, {
      avatarUrl: storageId,
      updatedAt: new Date(),
    });

    return { storageId };
  },
});

// Upload banner
export const uploadBanner = mutation({
  args: {
    userId: v.id("users"),
    file: v.file(),
  },
  handler: async (ctx, args) => {
    const { userId, file } = args;
    
    // Upload file to storage
    const storageId = await ctx.storage.store(file);
    
    // Update user's banner
    await ctx.db.patch(userId, {
      bannerUrl: storageId,
      updatedAt: new Date(),
    });

    return { storageId };
  },
});

// Get user's posts
export const getUserPosts = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    return await ctx.db      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), userId))
      .order("desc")
      .take(limit)
      .collect();
  },
});

// Get all users (for discovery)
export const getAllUsers = query({
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
export const searchUsers = query({
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