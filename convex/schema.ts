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
    zipCode: v.optional(v.string()),
    region: v.optional(v.string()),
    followers: v.optional(v.number()),
    following: v.optional(v.number()),
    postsCount: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    role: v.optional(v.string()),
    tier: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionStartDate: v.optional(v.number()),
    subscriptionEndDate: v.optional(v.number()),
    lightCredzBalance: v.optional(v.number()),
    lightCredzTotalEarned: v.optional(v.number()),
    lightCredzTotalSpent: v.optional(v.number()),
    activeContentCount: v.optional(v.number()),
    maxContentAllowed: v.optional(v.number()),
    totalViews: v.optional(v.number()),
    totalEngagements: v.optional(v.number()),
    isVerified: v.optional(v.boolean()),
    isSuspended: v.optional(v.boolean()),
    isFreshFace: v.optional(v.boolean()),
    freshFaceScore: v.optional(v.number()),
    firstContentDate: v.optional(v.number()),
    eventCount: v.optional(v.number()),
    maxEventsAllowed: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_tier", ["tier"])
    .index("by_subscriptionStatus", ["subscriptionStatus"])
    .index("by_createdAt", ["createdAt"])
    .index("by_freshFaceScore", ["freshFaceScore"]),

  artistContent: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    artistName: v.string(),
    description: v.string(),
    genre: v.string(),
    region: v.string(),
    contentType: v.string(),
    mediaUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    views: v.number(),
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    moderationStatus: v.string(),
    eligibilityStatus: v.string(),
    submissionStatus: v.string(),
    rejectionReason: v.optional(v.string()),
    isPromoted: v.boolean(),
    promotionType: v.optional(v.string()),
    promotionStartDate: v.optional(v.number()),
    promotionEndDate: v.optional(v.number()),
    promotionSource: v.optional(v.string()),
    promotionTier: v.optional(v.string()),
    engagementScore: v.number(),
    freshnessScore: v.number(),
    exposureCount: v.number(),
    lastExposureDate: v.optional(v.number()),
    tags: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
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

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_both", ["followerId", "followingId"]),

  likes: defineTable({
    userId: v.id("users"),
    contentId: v.id("artistContent"),
    createdAt: v.number(),
  })
    .index("by_content", ["contentId"])
    .index("by_user_content", ["userId", "contentId"]),

  comments: defineTable({
    authorId: v.id("users"),
    contentId: v.id("artistContent"),
    content: v.string(),
    wordCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_content", ["contentId"])
    .index("by_author", ["authorId"]),

  shares: defineTable({
    userId: v.id("users"),
    contentId: v.id("artistContent"),
    platform: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_content", ["contentId"])
    .index("by_user_content", ["userId", "contentId"]),

  lightCredzTransactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    action: v.string(),
    description: v.string(),
    relatedContentId: v.optional(v.id("artistContent")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_createdAt", ["createdAt"]),

  creditCooldowns: defineTable({
    userId: v.id("users"),
    action: v.string(),
    lastActionDate: v.number(),
    actionCount: v.number(),
  })
    .index("by_user_action", ["userId", "action"]),

  promotions: defineTable({
    contentId: v.id("artistContent"),
    userId: v.id("users"),
    promotionType: v.string(),
    promotionSource: v.string(),
    promotionDuration: v.string(),
    hours: v.number(),
    creditsUsed: v.optional(v.number()),
    paymentAmount: v.optional(v.number()),
    paymentId: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_content", ["contentId"])
    .index("by_user", ["userId"])
    .index("by_isActive", ["isActive"])
    .index("by_endDate", ["endDate"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    tier: v.string(),
    status: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    autoRenew: v.boolean(),
    paymentId: v.optional(v.string()),
    paymentAmount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_tier", ["tier"]),

  moderationQueue: defineTable({
    contentId: v.id("artistContent"),
    reviewerId: v.optional(v.id("users")),
    status: v.string(),
    rejectionReason: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_content", ["contentId"]),

  reports: defineTable({
    reporterId: v.id("users"),
    contentId: v.id("artistContent"),
    reason: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_content", ["contentId"])
    .index("by_reporter", ["reporterId"]),

  feedItems: defineTable({
    contentId: v.id("artistContent"),
    ownerId: v.id("users"),
    feedType: v.string(),
    weight: v.number(),
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_feedType", ["feedType"])
    .index("by_weight", ["weight"])
    .index("by_isActive", ["isActive"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    fromUserId: v.optional(v.id("users")),
    contentId: v.optional(v.id("artistContent")),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_isRead", ["isRead"])
    .index("by_createdAt", ["createdAt"]),

  events: defineTable({
    creatorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.number(),
    isVirtual: v.boolean(),
    virtualLink: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_eventDate", ["eventDate"])
    .index("by_creator", ["creatorId"])
    .index("by_isActive", ["isActive"]),

  eventCheckIns: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    checkedInAt: v.number(),
    lightCredzAwarded: v.boolean(),
  })
    .index("by_event", ["eventId"])
    .index("by_event_user", ["eventId", "userId"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  recoveryCodes: defineTable({
    userId: v.id("users"),
    code: v.string(),
    createdAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_code", ["code"]),

  blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_blocker", ["blockerId"])
    .index("by_blocked", ["blockedId"])
    .index("by_both", ["blockerId", "blockedId"]),

  announcements: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    type: v.string(), // "update", "announcement", "bug_report", "whats_new"
    isPinned: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_isActive", ["isActive"])
    .index("by_isPinned", ["isPinned"])
    .index("by_createdAt", ["createdAt"]),

  feedback: defineTable({
    userId: v.id("users"),
    type: v.string(), // "bug_report", "feature_request", "general_feedback"
    subject: v.string(),
    description: v.string(),
    status: v.string(), // "open", "in_progress", "resolved", "declined"
    adminResponse: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"]),

  userEvents: defineTable({
    creatorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.number(),
    isVirtual: v.boolean(),
    virtualLink: v.optional(v.string()),
    isActive: v.boolean(),
    eventType: v.string(), // "lightcredz" or "paid"
    creditsCost: v.optional(v.number()),
    maxAttendees: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_eventDate", ["eventDate"])
    .index("by_isActive", ["isActive"])
    .index("by_creator_active", ["creatorId", "isActive"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    lastMessagePreview: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    lastMessageSenderId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_participants", ["participants"])
    .index("by_lastMessageAt", ["lastMessageAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_created", ["conversationId", "createdAt"])
    .index("by_sender", ["senderId"]),

  playlists: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    contentIds: v.array(v.id("artistContent")),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_isPublic", ["isPublic"]),
});
