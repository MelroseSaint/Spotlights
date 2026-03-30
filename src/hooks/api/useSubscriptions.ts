import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useSubscriptions = () => {
  const getSubscriptionTiers = () => useQuery(api.backend.subscriptions.getSubscriptionTiers, {});

  const getUserSubscription = (userId: Id<"users">) =>
    useQuery(
      api.backend.subscriptions.getUserSubscription,
      userId ? { userId } : "skip"
    );

  return { getSubscriptionTiers, getUserSubscription };
};

export const useUpgradeTier = () => {
  return useMutation(api.backend.subscriptions.upgradeTier);
};

export const useCancelSubscription = () => {
  return useMutation(api.backend.subscriptions.cancelSubscription);
};
