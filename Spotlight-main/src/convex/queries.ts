// src/convex/queries.ts
// Re-export all query functions for easier imports
export { 
  getUser, 
  getUserByEmail, 
  getAllUsers, 
  searchUsers, 
  getUserPosts, 
  getUserFollowers, 
  getUserFollowing 
} from "./users";

export { 
  getPosts, 
  getPostsByCategory, 
  getTrendingPosts, 
  getComments
} from "./posts";

export { 
  getPlatformStats, 
  getAllUsers as adminGetAllUsers, 
  getAllPosts as adminGetAllPosts, 
  getReportedContent 
} from "./admin";

export { getSubscriptionTiers } from "./subscriptions";