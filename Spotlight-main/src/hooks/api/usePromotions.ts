import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function usePromotionOptions(tier?: string) {
  return useQuery(api.backend.promotions.getAllPromotionOptions, { tier });
}

export function useContentPromotionStatus(contentId: string) {
  return useQuery(api.backend.promotions.getContentPromotionStatus, { contentId: contentId as any });
}

export function useUserPromotions(userId: string, limit?: number) {
  return useQuery(api.backend.promotions.getUserPromotions, { userId: userId as any, limit });
}

export function useActivePromotions(limit?: number) {
  return useQuery(api.backend.promotions.getActivePromotions, { limit });
}

export function usePromoteWithCredits() {
  return useMutation(api.backend.promotions.promoteWithCredits);
}

export function usePromoteWithPayment() {
  return useMutation(api.backend.promotions.promoteWithPayment);
}

export function useStopPromotion() {
  return useMutation(api.backend.promotions.stopPromotion);
}
