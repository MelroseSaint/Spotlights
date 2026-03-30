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
    description: "Perfect for emerging artists",
    features: [
      "Upload up to 10 tracks",
      "Basic profile",
      "Community access",
      "Earn LightCredz",
      "Promote with credits",
    ],
    popular: false,
  },
  GROWTH: {
    id: "growth",
    name: "Growth",
    price: 10,
    priceDisplay: "$10",
    period: "per month",
    maxContent: 50,
    feedWeightMultiplier: 1.5,
    hasAnalytics: true,
    hasFeaturedBadge: true,
    hasVerifiedBadge: false,
    promotionDiscount: 15,
    description: "For growing artists",
    features: [
      "Upload up to 50 tracks",
      "Basic analytics",
      "Featured badge",
      "Higher feed weighting",
      "15% promo discount",
      "Create events with LightCredz",
      "Earn extra LightCredz",
    ],
    popular: false,
  },
  ELITE: {
    id: "elite",
    name: "Elite",
    price: 25,
    priceDisplay: "$25",
    period: "per month",
    maxContent: 500,
    feedWeightMultiplier: 2.0,
    hasAnalytics: true,
    hasFeaturedBadge: true,
    hasVerifiedBadge: true,
    promotionDiscount: 25,
    description: "Premium for professionals",
    features: [
      "Upload up to 500 tracks",
      "Full analytics",
      "Verified badge",
      "Highest weighting",
      "25% promo discount",
      "Create up to 100 events",
      "Priority support",
    ],
    popular: true,
  },
} as const;

export const ROLES = {
  ROOT_ADMIN: { id: "root_admin", name: "Root Admin", level: 100, canManageUsers: true, canManageContent: true, canModerate: true, isProtected: true },
  ADMIN: { id: "admin", name: "Admin", level: 50, canManageUsers: true, canManageContent: true, canModerate: true, isProtected: false },
  MODERATOR: { id: "moderator", name: "Moderator", level: 25, canManageUsers: false, canManageContent: true, canModerate: true, isProtected: false },
  USER: { id: "user", name: "User", level: 1, canManageUsers: false, canManageContent: false, canModerate: false, isProtected: false },
} as const;

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

export const LIGHTCREDZ_EARN = {
  COMMENT: { amount: 5, minWords: 15, cooldown: 60000, description: "Comment (15+ words)" },
  SHARE: { amount: 3, cooldown: 300000, description: "Share content" },
  EVENT_CHECKIN: { amount: 10, cooldown: 0, description: "Event check-in" },
  ENGAGEMENT_LIKE: { amount: 2, cooldown: 60000, description: "Like content" },
  FIRST_UPLOAD: { amount: 25, cooldown: 0, description: "First content upload" },
} as const;

export const CONTENT_REQUIREMENTS = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_DURATION_SECONDS: 30,
  MAX_DURATION_SECONDS: 600,
  ALLOWED_CONTENT_TYPES: ["audio", "video"],
  ALLOWED_GENRES: ["Hip Hop", "R&B", "Trap", "Pop", "Rock", "Indie", "Jazz", "Soul", "Electronic", "Country", "Folk", "Metal", "Other"],
  ALLOWED_REGIONS: ["Dauphin County", "Lancaster County", "York County", "Cumberland County", "Lebanon County", "Adams County", "Franklin County", "Other"],
} as const;

export const CENTRAL_PA_ZIP_CODES: Record<string, string[]> = {
  "Dauphin County": [
    "17010", "17023", "17028", "17030", "17032", "17033", "17034", "17036", "17048", 
    "17057", "17097", "17101", "17102", "17103", "17104", "17105", "17106", "17107", 
    "17108", "17109", "17110", "17111", "17112", "17113", "17177"
  ],
  "Lancaster County": [
    "17501", "17502", "17503", "17504", "17505", "17506", "17507", "17508", "17519", 
    "17520", "17521", "17522", "17529", "17532", "17535", "17536", "17537", "17538", 
    "17539", "17540", "17543", "17545", "17550", "17551", "17552", "17555", "17557", 
    "17560", "17561", "17562", "17563", "17565", "17569", "17570", "17571", "17572", 
    "17575", "17576", "17578", "17579", "17581", "17582", "17584", "17601", "17602", 
    "17603", "17604", "17605", "17606", "17607", "17608"
  ],
  "York County": [
    "17301", "17302", "17309", "17311", "17312", "17313", "17314", "17315", "17316", 
    "17317", "17318", "17319", "17321", "17322", "17323", "17324", "17325", "17327", 
    "17329", "17331", "17332", "17333", "17334", "17337", "17339", "17340", "17342", 
    "17343", "17344", "17345", "17346", "17347", "17349", "17352", "17353", "17354", 
    "17355", "17356", "17360", "17361", "17362", "17363", "17364", "17365", "17366", 
    "17368", "17370", "17371", "17372", "17401", "17402", "17403", "17404", "17405", 
    "17406", "17407", "17408", "17415"
  ],
  "Cumberland County": [
    "17007", "17011", "17013", "17015", "17019", "17020", "17025", "17027", "17043", 
    "17050", "17053", "17055", "17065", "17081", "17089", "17093", "17222", "17241", 
    "17257", "17266"
  ],
  "Lebanon County": [
    "17003", "17016", "17038", "17039", "17041", "17042", "17046", "17064", "17067", 
    "17077", "17083", "17087", "17088"
  ],
  "Adams County": [
    "17301", "17302", "17303", "17304", "17306", "17307", "17309", "17311", "17316", 
    "17324", "17325", "17331", "17337", "17340", "17344", "17350", "17353", "17354", 
    "17372"
  ],
  "Franklin County": [
    "17201", "17211", "17214", "17219", "17221", "17222", "17224", "17225", "17228", 
    "17231", "17232", "17233", "17235", "17236", "17237", "17240", "17243", "17244", 
    "17246", "17247", "17250", "17251", "17252", "17254", "17255", "17256", "17257", 
    "17260", "17261", "17262", "17263", "17264", "17265", "17267", "17268", "17271", 
    "17272"
  ]
};

export const ALL_CENTRAL_PA_ZIPS = Object.values(CENTRAL_PA_ZIP_CODES).flat();

export function isValidCentralPAZipCode(zip: string): boolean {
  return ALL_CENTRAL_PA_ZIPS.includes(zip);
}

export function getRegionByZipCode(zip: string): string | null {
  for (const [region, zips] of Object.entries(CENTRAL_PA_ZIP_CODES)) {
    if (zips.includes(zip)) return region;
  }
  return null;
}

export const EVENT_RULES = {
  GROWTH_MIN_CREDITS: 100,
  GROWTH_CAN_CREATE_WITH_CREDITS: true,
  GROWTH_CAN_CREATE_WITH_PAYMENT: false,
  ELITE_MAX_EVENTS: 100,
} as const;

export const TIER_VISIBILITY_FAIRNESS = {
  MAX_TIER_DIFF_FOR_EQUAL_VISIBILITY: 2,
  ELITE_CONTENT_MAX_WEIGHT_MULTIPLIER: 2.5,
  STANDARD_CONTENT_MIN_WEIGHT_MULTIPLIER: 0.8,
} as const;

export const ROOT_ADMIN_EMAIL = "monroeodoses@gmail.com";

export const ELIGIBILITY_STATUS = {
  ELIGIBLE: "eligible",
  INELIGIBLE: "ineligible",
} as const;

export const SUBMISSION_STATUS = {
  UPLOADED: "uploaded",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export function isRootAdmin(email: string): boolean {
  return email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
}
