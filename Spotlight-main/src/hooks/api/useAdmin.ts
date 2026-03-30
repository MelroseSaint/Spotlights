import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useVerifyAdminAccess(userId: string) {
  return useQuery(api.backend.admin.verifyAdminAccess, { userId: userId as any });
}

export function useAdminDashboard(userId: string) {
  return useQuery(api.backend.admin.getAdminDashboard, { userId: userId as any });
}

export function useAdminUsers(
  limit?: number, 
  offset?: number, 
  role?: string, 
  tier?: string, 
  search?: string
) {
  return useQuery(api.backend.admin.getAllUsersAdmin, { limit, offset, role, tier, search });
}

export function useModerationQueue(limit?: number) {
  return useQuery(api.backend.admin.getModerationQueue, { limit });
}

export function useReports(status?: string, limit?: number) {
  return useQuery(api.backend.admin.getReports, { status, limit });
}

export function useUpdateUserRole() {
  return useMutation(api.backend.admin.updateUserRole);
}

export function useUpdateUserTier() {
  return useMutation(api.backend.admin.updateUserTier);
}

export function useSuspendUser() {
  return useMutation(api.backend.admin.suspendUser);
}

export function useUnsuspendUser() {
  return useMutation(api.backend.admin.unsuspendUser);
}

export function useApproveContent() {
  return useMutation(api.backend.admin.approveContent);
}

export function useRejectContent() {
  return useMutation(api.backend.admin.rejectContent);
}

export function useDeleteContentAdmin() {
  return useMutation(api.backend.admin.deleteContentAdmin);
}

export function useAwardLightCredzAdmin() {
  return useMutation(api.backend.admin.awardLightCredzAdmin);
}

export function useSubmitReport() {
  return useMutation(api.backend.admin.submitReport);
}

export function useResolveReport() {
  return useMutation(api.backend.admin.resolveReport);
}
