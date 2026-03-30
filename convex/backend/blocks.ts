import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";

export const blockUser = mutation({
  args: { blockerId: v.id("users"), blockedId: v.id("users") },
  handler: async (ctx, { blockerId, blockedId }) => {
    if (blockerId === blockedId) throw new Error("Cannot block yourself");
    
    const existing = await ctx.db.query("blocks")
      .withIndex("by_both", (q) => q.eq("blockerId", blockerId).eq("blockedId", blockedId))
      .first();
    
    if (existing) throw new Error("User is already blocked");
    
    await ctx.db.insert("blocks", {
      blockerId,
      blockedId,
      createdAt: Date.now(),
    });
    
    // Remove any follows between these users
    const follow1 = await ctx.db.query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", blockerId))
      .filter((q) => q.eq(q.field("followingId"), blockedId))
      .first();
    
    if (follow1) await ctx.db.delete(follow1._id);
    
    const follow2 = await ctx.db.query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", blockedId))
      .filter((q) => q.eq(q.field("followingId"), blockerId))
      .first();
    
    if (follow2) await ctx.db.delete(follow2._id);
    
    return { success: true };
  },
});

export const unblockUser = mutation({
  args: { blockerId: v.id("users"), blockedId: v.id("users") },
  handler: async (ctx, { blockerId, blockedId }) => {
    const block = await ctx.db.query("blocks")
      .withIndex("by_both", (q) => q.eq("blockerId", blockerId).eq("blockedId", blockedId))
      .first();
    
    if (!block) throw new Error("User is not blocked");
    
    await ctx.db.delete(block._id);
    return { success: true };
  },
});

export const getBlockedUsers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const blocks = await ctx.db.query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", userId))
      .collect();
    
    const blockedUsers = await Promise.all(
      blocks.map(async (block) => {
        const user = await ctx.db.get(block.blockedId);
        return user ? { _id: user._id, name: user.name, username: user.username, avatarUrl: user.avatarUrl, blockedAt: block.createdAt } : null;
      })
    );
    
    return blockedUsers.filter(Boolean);
  },
});

export const isBlocked = query({
  args: { userId: v.id("users"), targetId: v.id("users") },
  handler: async (ctx, { userId, targetId }) => {
    const block = await ctx.db.query("blocks")
      .withIndex("by_both", (q) => q.eq("blockerId", userId).eq("blockedId", targetId))
      .first();
    
    return { isBlocked: !!block };
  },
});

export const getBlockedByUsers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const blocks = await ctx.db.query("blocks")
      .withIndex("by_blocked", (q) => q.eq("blockedId", userId))
      .collect();
    
    const blockerUsers = await Promise.all(
      blocks.map(async (block) => {
        const user = await ctx.db.get(block.blockerId);
        return user ? { _id: user._id, name: user.name, username: user.username, avatarUrl: user.avatarUrl } : null;
      })
    );
    
    return blockerUsers.filter(Boolean);
  },
});
