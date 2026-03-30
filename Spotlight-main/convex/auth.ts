import { mutation, query } from "convex/server";
import { v } from "convex/values";

// Simple authentication - in production, use proper password hashing
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
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

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      username: args.username || args.email.split("@")[0],
      followers: 0,
      following: 0,
      postsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // In a real app, you'd hash the password and store it
    // For demo purposes, we'll just return the userId
    return { userId, email: args.email, name: args.name };
  },
});

export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // In a real app, you would hash and compare passwords
    // For demo, we'll accept any password
    return {       userId: user._id,       email: user.email, 
      name: user.name 
    };
  },
});

// Get current user (for session management)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // In a real app, you'd get the user ID from the auth context
    // For now, return null (client will handle auth state)
    return null;
  },
});