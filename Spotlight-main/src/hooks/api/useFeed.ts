import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useSpotlightFeed(limit?: number, offset?: number, userId?: string) {
  return useQuery(api.backend.feed.getSpotlightFeed, { 
    limit, 
    offset, 
    userId: userId as any 
  });
}

export function useFreshFaceFeed(limit?: number) {
  return useQuery(api.backend.feed.getFreshFaceFeed, { limit });
}

export function useTrendingContent(limit?: number, period?: string) {
  return useQuery(api.backend.feed.getTrendingContent, { limit, period });
}

export function useFollowingFeed(userId: string, limit?: number) {
  return useQuery(api.backend.feed.getFollowingFeed, { userId: userId as any, limit });
}

export function useGenreFeed(genre: string, limit?: number) {
  return useQuery(api.backend.feed.getGenreFeed, { genre, limit });
}

export function useRegionFeed(region: string, limit?: number) {
  return useQuery(api.backend.feed.getRegionFeed, { region, limit });
}

export function useRecordExposure() {
  return useMutation(api.backend.feed.recordExposure);
}
