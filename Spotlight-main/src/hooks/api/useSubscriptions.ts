import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useSubscriptionTiers() {
  return useQuery(api.backend.subscriptions.getSubscriptionTiers);
}

export function useUserSubscription(userId: string) {
  return useQuery(api.backend.subscriptions.getUserSubscription, { userId: userId as any });
}

export function useSubscriptionHistory(userId: string, limit?: number) {
  return useQuery(api.backend.subscriptions.getSubscriptionHistory, { userId: userId as any, limit });
}

export function useUpgradeTier() {
  return useMutation(api.backend.subscriptions.upgradeTier);
}

export function useDowngradeTier() {
  return useMutation(api.backend.subscriptions.downgradeTier);
}

export function useCancelSubscription() {
  return useMutation(api.backend.subscriptions.cancelSubscription);
}
