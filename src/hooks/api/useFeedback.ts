import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useUserFeedback = (userId: Id<"users"> | null) => {
  return useQuery(api.backend.feedback.getUserFeedback, userId ? { userId } : "skip");
};

export const useSubmitFeedback = () => {
  return useMutation(api.backend.feedback.submitFeedback);
};

export const useRespondToFeedback = () => {
  return useMutation(api.backend.feedback.respondToFeedback);
};

export const useOpenFeedbackCount = () => {
  return useQuery(api.backend.feedback.getOpenFeedbackCount, {});
};
