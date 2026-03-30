import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const usePromotions = () => {
  const getAllPromotionOptions = (tier?: string) =>
    useQuery(api.backend.promotions.getAllPromotionOptions, { tier });

  const getContentPromotionStatus = (contentId: Id<"artistContent">) =>
    useQuery(api.backend.promotions.getContentPromotionStatus, { contentId });

  return { getAllPromotionOptions, getContentPromotionStatus };
};

export const usePromoteWithCredits = () => {
  return useMutation(api.backend.promotions.promoteWithCredits);
};

export const usePromoteWithPayment = () => {
  return useMutation(api.backend.promotions.promoteWithPayment);
};
