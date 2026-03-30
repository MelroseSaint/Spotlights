import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useSpotlightFeed = (limit?: number, offset?: number, userId?: Id<"users">) => {
  return useQuery(api.backend.feed.getSpotlightFeed, {
    limit: limit ?? 50,
    offset: offset ?? 0,
    userId,
  });
};

export const useFreshFaceFeed = (limit?: number) => {
  return useQuery(api.backend.feed.getFreshFaceFeed, { limit: limit ?? 20 });
};

export const useTrendingContent = (limit?: number, period?: string) => {
  return useQuery(api.backend.feed.getTrendingContent, {
    limit: limit ?? 20,
    period: period ?? "week",
  });
};

export const useFeed = () => {
  return {
    getSpotlightFeed: useSpotlightFeed,
    getFreshFaceFeed: useFreshFaceFeed,
    getTrendingContent: useTrendingContent,
  };
};
