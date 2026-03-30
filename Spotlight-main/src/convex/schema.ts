import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    followers: v.number().default(0),
    following: v.number().default(0),
    postsCount: v.number().default(0),
    subscriptionTier: v.optional(v.string()),
    createdAt: v.any(),
    updatedAt: v.any(),
  }).index("by_email", ["email"]).index("by_createdAt", ["createdAt"]),

  posts: defineTable({
    authorId: v.id("users"),
    content: v.string(),
    tags: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    likes: v.number().default(0),
    comments: v.number().default(0),
    shares: v.number().default(0),
    isLiked: v.boolean().default(false),
    category: v.optional(v.string()),
    createdAt: v.any(),
    updatedAt: v.any(),
  }).index("by_author", ["authorId"]).index("by_createdAt", ["createdAt"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.any(),
  }).index("by_follower", ["followerId"]).index("by_following", ["followingId"]).compositeIndex(
    ["followerId", "followingId"],
    { unique: true }
  ),

  likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    createdAt: v.any(),
  }).compositeIndex(["userId", "postId"], { unique: true }).index("by_post", ["postId"]),

  comments: defineTable({
    authorId: v.id("users"),
    postId: v.id("posts"),
    content: v.string(),
    createdAt: v.any(),
  }).index("by_post", ["postId"]).index("by_author", ["authorId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    fromUserId: v.optional(v.id("users")),
    postId: v.optional(v.id("posts")),
    isRead: v.boolean().default(false),
    createdAt: v.any(),
  }).index("by_user", ["userId"]).index("by_createdAt", ["createdAt"]),
});