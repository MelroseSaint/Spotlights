import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useModerationLogs = (limit?: number, flaggedOnly?: boolean) => {
  return useQuery(api.backend.moderation.getModerationLogs, {
    limit: limit ?? 100,
    flaggedOnly: flaggedOnly ?? false,
  });
};

export const useUserModerationHistory = (userId: Id<"users"> | null) => {
  return useQuery(
    api.backend.moderation.getUserModerationHistory,
    userId ? { userId } : "skip"
  );
};

export const useUserStrikes = (userId: Id<"users"> | null) => {
  return useQuery(api.backend.moderation.getUserStrikes, userId ? { userId } : "skip");
};

export const useActiveStrikes = (userId: Id<"users"> | null) => {
  return useQuery(api.backend.moderation.getActiveStrikes, userId ? { userId } : "skip");
};

export const useCheckUserStatus = (userId: Id<"users"> | null) => {
  return useQuery(api.backend.moderation.checkUserStatus, userId ? { userId } : "skip");
};

export const useModerateContent = () => {
  return useMutation(api.backend.moderation.moderateText);
};

export const useIssueStrike = () => {
  return useMutation(api.backend.moderation.issueStrike);
};

export const useResolveStrike = () => {
  return useMutation(api.backend.moderation.resolveStrike);
};
