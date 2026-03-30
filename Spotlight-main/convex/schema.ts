import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ========== USER MANAGEMENT ==========
  users: defineTable({
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    followers: v.number(),
    following: v.number(),
    postsCount: v.number(),
    createdAt: v.date(),
    updatedAt: v.date(),
    
    // Subscription & Tier
    role: v.string(), // ROOT_ADMIN, ADMIN, MODERATOR, USER
    tier: v.string(), // STANDARD, GROWTH, ELITE
    subscriptionStatus: v.string(), // active, expired, cancelled, none
    subscriptionStartDate: v.optional(v.date()),
    subscriptionEndDate: v.optional(v.date()),
    
    // LightCredz System
    lightCredzBalance: v.number(),
    lightCredzTotalEarned: v.number(),
    lightCredzTotalSpent: v.number(),
    
    // Upload Tracking
    activeContentCount: v.number(),
    maxContentAllowed: v.number(), // 10 for STANDARD, 50 for GROWTH, 500 for ELITE
    
    // Profile Stats
    totalViews: v.number(),
    totalEngagements: v.number(),
    isVerified: v.boolean(),
    isSuspended: v.boolean(),
    
    // Fresh Face Tracking
    isFreshFace: v.boolean(),
    freshFaceScore: v.number(),
    firstContentDate: v.optional(v.date()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_tier", ["tier"])
    .index("by_subscriptionStatus", ["subscriptionStatus"])
    .index("by_createdAt", ["createdAt"])
    .index("by_freshFaceScore", ["freshFaceScore"]),

  // ========== ARTIST CONTENT ==========
  // Artist content (audio/video tracks)
  artistContent: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    artistName: v.string(),
    description: v.string(),
    genre: v.string(),
    region: v.string(), // Central PA regions
    contentType: v.string(), // audio, video
    mediaUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()), // seconds
    
    // Engagement
    views: v.number(),
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    
    // Submission Status
    moderationStatus: v.string(), // pending, approved, rejected
    eligibilityStatus: v.string(), // eligible, ineligible, pending_review
    submissionStatus: v.string(), // draft, uploaded, submitted, approved, rejected
    rejectionReason: v.optional(v.string()),
    
    // Promotion
    isPromoted: v.boolean(),
    promotionType: v.optional(v.string()), // credits, paid
    promotionStartDate: v.optional(v.date()),
    promotionEndDate: v.optional(v.date()),
    promotionSource: v.optional(v.string()), // lightcredz, direct_payment
    promotionTier: v.optional(v.string()), // hour, day, week
    
    // Ranking
    engagementScore: v.number(),
    freshnessScore: v.number(),
    exposureCount: v.number(),
    lastExposureDate: v.optional(v.date()),
    
    // Metadata
    tags: v.array(v.string()),
    isActive: v.boolean(), // false if deleted
    createdAt: v.date(),
    updatedAt: v.date(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_genre", ["genre"])
    .index("by_region", ["region"])
    .index("by_moderationStatus", ["moderationStatus"])
    .index("by_eligibilityStatus", ["eligibilityStatus"])
    .index("by_submissionStatus", ["submissionStatus"])
    .index("by_isPromoted", ["isPromoted"])
    .index("by_isActive", ["isActive"])
    .index("by_engagementScore", ["engagementScore"])
    .index("by_freshnessScore", ["freshnessScore"])
    .index("by_createdAt", ["createdAt"]),

  // ========== ENGAGEMENT ==========
  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.date(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .compositeIndex(["followerId", "followingId"], { unique: true }),

  likes: defineTable({
    userId: v.id("users"),
    contentId: v.id("artistContent"),
    createdAt: v.date(),
  })
    .compositeIndex(["userId", "contentId"], { unique: true })
    .index("by_content", ["contentId"]),

  comments: defineTable({
    authorId: v.id("users"),
    contentId: v.id("artistContent"),
    content: v.string(),
    wordCount: v.number(),
    createdAt: v.date(),
  })
    .index("by_content", ["contentId"])
    .index("by_author", ["authorId"]),

  shares: defineTable({
    userId: v.id("users"),
    contentId: v.id("artistContent"),
    platform: v.optional(v.string()),
    createdAt: v.date(),
  })
    .compositeIndex(["userId", "contentId"], { unique: true })
    .index("by_content", ["contentId"]),

  // ========== LIGHTCREDZ SYSTEM ==========
  lightCredzTransactions: defineTable({
    userId: v.id("users"),
    amount: v.number(), // positive = earned, negative = spent
    action: v.string(), // comment, share, event_checkin, engagement, promotion_spent, promotion_refund
    description: v.string(),
    relatedContentId: v.optional(v.id("artistContent")),
    createdAt: v.date(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_createdAt", ["createdAt"]),

  // Anti-spam cooldowns
  creditCooldowns: defineTable({
    userId: v.id("users"),
    action: v.string(),
    lastActionDate: v.date(),
    actionCount: v.number(),
  })
    .compositeIndex(["userId", "action"], { unique: true }),

  // ========== PROMOTION SYSTEM ==========
  promotions: defineTable({
    contentId: v.id("artistContent"),
    userId: v.id("users"),
    promotionType: v.string(), // credits, paid
    promotionSource: v.string(), // lightcredz, direct_payment
    promotionDuration: v.string(), // hour, day, week (mapped to hours)
    hours: v.number(), // actual hours
    creditsUsed: v.optional(v.number()),
    paymentAmount: v.optional(v.number()),
    paymentId: v.optional(v.string()),
    startDate: v.date(),
    endDate: v.date(),
    isActive: v.boolean(),
    createdAt: v.date(),
  })
    .index("by_content", ["contentId"])
    .index("by_user", ["userId"])
    .index("by_isActive", ["isActive"])
    .index("by_endDate", ["endDate"]),

  // ========== SUBSCRIPTIONS ==========
  subscriptions: defineTable({
    userId: v.id("users"),
    tier: v.string(), // STANDARD, GROWTH, ELITE
    status: v.string(), // active, expired, cancelled
    startDate: v.date(),
    endDate: v.date(),
    autoRenew: v.boolean(),
    paymentId: v.optional(v.string()),
    paymentAmount: v.optional(v.number()),
    createdAt: v.date(),
    updatedAt: v.date(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_tier", ["tier"]),

  // ========== ADMIN & MODERATION ==========
  moderationQueue: defineTable({
    contentId: v.id("artistContent"),
    reviewerId: v.optional(v.id("users")),
    status: v.string(), // pending, approved, rejected
    rejectionReason: v.optional(v.string()),
    reviewedAt: v.optional(v.date()),
    createdAt: v.date(),
  })
    .index("by_status", ["status"])
    .index("by_content", ["contentId"]),

  reports: defineTable({
    reporterId: v.id("users"),
    contentId: v.id("artistContent"),
    reason: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // pending, reviewed, resolved, dismissed
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.date()),
    createdAt: v.date(),
  })
    .index("by_status", ["status"])
    .index("by_content", ["contentId"])
    .index("by_reporter", ["reporterId"]),

  // ========== FEED & DISCOVERY ==========
  feedItems: defineTable({
    contentId: v.id("artistContent"),
    ownerId: v.id("users"),
    feedType: v.string(), // spotlight, fresh_face, trending, following
    weight: v.number(),
    isActive: v.boolean(),
    expiresAt: v.optional(v.date()),
    createdAt: v.date(),
  })
    .index("by_feedType", ["feedType"])
    .index("by_weight", ["weight"])
    .index("by_isActive", ["isActive"]),

  // ========== NOTIFICATIONS ==========
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    fromUserId: v.optional(v.id("users")),
    contentId: v.optional(v.id("artistContent")),
    isRead: v.boolean(),
    createdAt: v.date(),
  })
    .index("by_user", ["userId"])
    .index("by_isRead", ["isRead"])
    .index("by_createdAt", ["createdAt"]),

  // ========== EVENTS (for LightCredz earning) ==========
  events: defineTable({
    creatorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.date(),
    isVirtual: v.boolean(),
    virtualLink: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.date(),
  })
    .index("by_eventDate", ["eventDate"])
    .index("by_creator", ["creatorId"])
    .index("by_isActive", ["isActive"]),

  eventCheckIns: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    checkedInAt: v.date(),
    lightCredzAwarded: v.boolean(),
  })
    .compositeIndex(["eventId", "userId"], { unique: true })
    .index("by_event", ["eventId"]),
});
