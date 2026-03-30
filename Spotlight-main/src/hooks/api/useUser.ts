import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  return useQuery(api.backend.users.getCurrentUser);
}

export function useUser(userId: string) {
  return useQuery(api.backend.users.getUser, { userId: userId as any });
}

export function useUserByEmail(email: string) {
  return useQuery(api.backend.users.getUserByEmailQuery, { email });
}

export function useUserUploadStatus(userId: string) {
  return useQuery(api.backend.users.getUserUploadStatus, { userId: userId as any });
}

export function useUserLightCredz(userId: string) {
  return useQuery(api.backend.users.getUserLightCredz, { userId: userId as any });
}

export function useLightCredzTransactions(userId: string, limit?: number) {
  return useQuery(api.backend.users.getLightCredzTransactions, { userId: userId as any, limit });
}

export function useFreshFaces(limit?: number) {
  return useQuery(api.backend.backend.feed.getFreshFaces, { limit });
}

export function useUserStats(userId: string) {
  return useQuery(api.backend.users.getUserStats, { userId: userId as any });
}

export function useFollowers(userId: string, limit?: number) {
  return useQuery(api.backend.users.getFollowers, { userId: userId as any, limit });
}

export function useFollowing(userId: string, limit?: number) {
  return useQuery(api.backend.users.getFollowing, { userId: userId as any, limit });
}

export function useCreateUser() {
  return useMutation(api.backend.users.createUser);
}

export function useUpdateUser() {
  return useMutation(api.backend.users.updateUser);
}

export function useFollowUser() {
  return useMutation(api.backend.users.followUser);
}

export function useUnfollowUser() {
  return useMutation(api.backend.users.unfollowUser);
}
