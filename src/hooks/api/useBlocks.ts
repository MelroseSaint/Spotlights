import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useBlocks = (userId: Id<"users"> | null) => {
  const blockedUsers = useQuery(api.backend.blocks.getBlockedUsers, userId ? { userId } : "skip");
  const blockedBy = useQuery(api.backend.blocks.getBlockedByUsers, userId ? { userId } : "skip");
  
  return { blockedUsers, blockedBy };
};

export const useBlockUser = () => {
  return useMutation(api.backend.blocks.blockUser);
};

export const useUnblockUser = () => {
  return useMutation(api.backend.blocks.unblockUser);
};

export const useIsBlocked = (userId: Id<"users"> | null, targetId: Id<"users"> | null) => {
  return useQuery(
    api.backend.blocks.isBlocked, 
    userId && targetId ? { userId, targetId } : "skip"
  );
};
