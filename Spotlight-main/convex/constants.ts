import { v } from "convex/values";

// ========== TIER CONFIGURATION ==========
export const TIERS = {
  STANDARD: {
    id: "standard",
    name: "Standard",
    price: 0,
    priceDisplay: "$0",
    period: "Free Forever",
    maxContent: 10,
    feedWeightMultiplier: 1.0,
    hasAnalytics: false,
    hasFeaturedBadge: false,
    hasVerifiedBadge: false,
    promotionDiscount: 0,
    description: "Perfect for emerging artists starting their journey",
    features: [
      "Upload up to 10 tracks",
      "Basic profile",
      "Community access",
      "Earn LightCredz",
      "Promote with credits or payment",
    ],
    popular: false,
  },
  GROWTH: {
    id: "growth",
    name: "Growth",
    price: 25,
    priceDisplay: "$25",
    period: "per month",
    maxContent: 50,
    feedWeightMultiplier: 1.5,
    hasAnalytics: true,
    hasFeaturedBadge: true,
    hasVerifiedBadge: false,
    promotionDiscount: 15,
    description: "For growing artists expanding their reach",
    features: [
      "Upload up to 50 tracks",
      "Basic analytics dashboard",
      "Featured badge on promoted posts",
      "Higher feed weighting during boost",
      "Longer promotion duration options",
      "Priority support",
    ],
    popular: true,
  },
  ELITE: {
    id: "elite",
    name: "Elite",
    price: 10,
    priceDisplay: "$10",
    period: "per month",
    maxContent: 500,
    feedWeightMultiplier: 2.0,
    hasAnalytics: true,
    hasFeaturedBadge: true,
    hasVerifiedBadge: true,
    promotionDiscount: 25,
    description: "Premium features for professional artists",
    features: [
      "Upload up to 500 tracks",
      "Full analytics dashboard",
      "Profile customization",
      "Verified badge",
      "Highest feed weighting",
      "25% promotion discount",
      "Dedicated support",
    ],
    popular: false,
  },
} as const;

export type TierType = keyof typeof TIERS;

// ========== ROLE CONFIGURATION ==========
export const ROLES = {
  ROOT_ADMIN: {
    id: "root_admin",
    name: "Root Admin",
    level: 100,
    canManageUsers: true,
    canManageContent: true,
    canManageTiers: true,
    canModerate: true,
    canOverrideFeed: true,
    canManageAdmins: true,
    canAccessAnalytics: true,
    isProtected: true,
  },
  ADMIN: {
    id: "admin",
    name: "Admin",
    level: 50,
    canManageUsers: true,
    canManageContent: true,
    canManageTiers: false,
    canModerate: true,
    canOverrideFeed: true,
    canManageAdmins: false,
    canAccessAnalytics: true,
    isProtected: false,
  },
  MODERATOR: {
    id: "moderator",
    name: "Moderator",
    level: 25,
    canManageUsers: false,
    canManageContent: true,
    canManageTiers: false,
    canModerate: true,
    canOverrideFeed: false,
    canManageAdmins: false,
    canAccessAnalytics: false,
    isProtected: false,
  },
  USER: {
    id: "user",
    name: "User",
    level: 1,
    canManageUsers: false,
    canManageContent: false,
    canManageTiers: false,
    canModerate: false,
    canOverrideFeed: false,
    canManageAdmins: false,
    canAccessAnalytics: false,
    isProtected: false,
  },
} as const;

export type RoleType = keyof typeof ROLES;

// ========== PROMOTION CONFIGURATION ==========
export const PROMOTION_CREDITS = {
  HOUR: { hours: 1, credits: 100, label: "1 Hour Boost" },
  SIX_HOURS: { hours: 6, credits: 300, label: "6 Hour Boost" },
  HALF_DAY: { hours: 12, credits: 500, label: "12 Hour Boost" },
} as const;

export const PROMOTION_PAID = {
  DAY: { hours: 24, price: 5, label: "24 Hour Boost" },
  THREE_DAYS: { hours: 72, price: 12, label: "3 Day Boost" },
  WEEK: { hours: 168, price: 25, label: "7 Day Boost" },
} as const;

// ========== LIGHTCREDZ CONFIGURATION ==========
export const LIGHTCREDZ_EARN = {
  COMMENT: { amount: 5, minWords: 15, cooldown: 60000, description: "Comment (15+ words)" },
  SHARE: { amount: 3, cooldown: 300000, description: "Share content" },
  EVENT_CHECKIN: { amount: 10, cooldown: 0, description: "Event check-in" },
  ENGAGEMENT_LIKE: { amount: 2, cooldown: 60000, description: "Like content" },
  ENGAGEMENT_VIEW: { amount: 1, cooldown: 60000, description: "View content (once per content)" },
  PROFILE_COMPLETE: { amount: 50, cooldown: 0, description: "Complete profile" },
  FIRST_UPLOAD: { amount: 25, cooldown: 0, description: "First content upload" },
  WEEKLY_STREAK: { amount: 20, cooldown: 604800000, description: "Weekly engagement streak" },
} as const;

// ========== CONTENT VALIDATION ==========
export const CONTENT_REQUIREMENTS = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_DURATION_SECONDS: 30,
  MAX_DURATION_SECONDS: 600,
  ALLOWED_CONTENT_TYPES: ["audio", "video"],
  ALLOWED_GENRES: [
    "Hip Hop",
    "R&B",
    "Trap",
    "Pop",
    "Rock",
    "Indie",
    "Jazz",
    "Soul",
    "Electronic",
    "Country",
    "Folk",
    "Metal",
    "Punk",
    "Latin",
    "Other",
  ],
  ALLOWED_REGIONS: [
    "Dauphin County",
    "Lancaster County",
    "York County",
    "Cumberland County",
    "Perry County",
    "Lebanon County",
    "Adams County",
    "Franklin County",
    "Mifflin County",
    "Juniata County",
    "Huntingdon County",
    "Snyder County",
    "Union County",
    "Northumberland County",
    "Schuylkill County",
    "Berks County",
    " Chester County",
    "Delaware County",
    "Philadelphia Metro",
    "Other",
  ],
} as const;

// ========== FEED CONFIGURATION ==========
export const FEED_CONFIG = {
  SPOTLIGHT_FEED: {
    maxSameArtistPerPage: 2,
    exposureCooldownHours: 24,
    promotionBoostMultiplier: 3.0,
    freshContentBoostHours: 72,
    engagementDecayDays: 7,
    minFreshnessScore: 0.1,
    maxEngagementScore: 10000,
  },
  FRESH_FACE: {
    maxPriorExposure: 5,
    minFreshFaceScore: 50,
    engagementGrowthBoost: 1.5,
    newArtistBoostHours: 168,
    maxDaysSinceLastUpload: 14,
  },
} as const;

// ========== MODERATION CONFIGURATION ==========
export const MODERATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const ELIGIBILITY_STATUS = {
  ELIGIBLE: "eligible",
  INELIGIBLE: "ineligible",
  PENDING_REVIEW: "pending_review",
} as const;

export const SUBMISSION_STATUS = {
  DRAFT: "draft",
  UPLOADED: "uploaded",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// ========== ROOT ADMIN ==========
export const ROOT_ADMIN_EMAIL = "monrodoses@gmail.com";

// ========== VALIDATORS ==========
export const userValidators = {
  email: v.string(),
  name: v.string(),
  username: v.optional(v.string()),
  role: v.optional(v.string()),
  tier: v.optional(v.string()),
};

export const contentValidators = {
  title: v.string(),
  artistName: v.string(),
  description: v.string(),
  genre: v.string(),
  region: v.string(),
  contentType: v.string(),
  mediaUrl: v.string(),
  thumbnailUrl: v.optional(v.string()),
  duration: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
};
