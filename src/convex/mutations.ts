// src/convex/mutations.ts
// Re-export all mutation functions for easier imports
export { 
  signUp, 
  signIn, 
  createUser, 
  updateUser, 
  getUserPosts, 
  getAllUsers, 
  searchUsers, 
  followUser, 
  unfollowUser, 
  isFollowing, 
  getUserFollowers, 
  getUserFollowing, 
  likePost, 
  unlikePost, 
  hasLikedPost, 
  addComment, 
  sharePost, 
  createPost 
} from "./users";

export { updateSubscription } from "./subscriptions";

export { 
  deletePost, 
  updateUserStatus 
} from "./admin";