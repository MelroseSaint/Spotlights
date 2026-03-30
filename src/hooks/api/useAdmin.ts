import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useAdmin = () => {
  const moderationQueue = useQuery(api.backend.admin.getModerationQueue, { limit: 50 });
  const allUsersData = useQuery(api.backend.users.getAllUsers, {});

  return { moderationQueue, allUsers: allUsersData };
};

export const useVerifyAdminAccess = (userId: Id<"users"> | undefined) => {
  return useQuery(api.backend.admin.verifyAdminAccess, userId ? { userId } : "skip");
};

export const useAdminDashboard = (userId: Id<"users"> | undefined) => {
  return useQuery(api.backend.admin.getAdminDashboard, userId ? { userId } : "skip");
};

export const useUpdateUserRole = () => {
  return useMutation(api.backend.admin.updateUserRole);
};

export const useSuspendUser = () => {
  return useMutation(api.backend.admin.suspendUser);
};

export const useApproveContent = () => {
  return useMutation(api.backend.admin.approveContent);
};

export const useRejectContent = () => {
  return useMutation(api.backend.admin.rejectContent);
};

export const useDeleteUser = () => {
  return useMutation(api.backend.admin.deleteUser);
};
