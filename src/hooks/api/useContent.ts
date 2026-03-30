import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useContent = () => {
  const getContent = (contentId: Id<"artistContent">) =>
    useQuery(api.backend.content.getContent, { contentId });

  const getUserContent = (userId: Id<"users">, limit?: number) =>
    useQuery(api.backend.content.getUserContent, { userId, limit: limit ?? 50 });

  const getComments = (contentId: Id<"artistContent">, limit?: number) =>
    useQuery(api.backend.content.getComments, { contentId, limit: limit ?? 50 });

  const searchContent = (query: string, limit?: number) =>
    useQuery(api.backend.content.searchContent, { query, limit: limit ?? 50 });

  return { getContent, getUserContent, getComments, searchContent };
};

export const useCreateContent = () => {
  return useMutation(api.backend.content.createContent);
};

export const useSubmitContent = () => {
  return useMutation(api.backend.content.submitContent);
};

export const useLikeContent = () => {
  return useMutation(api.backend.content.likeContent);
};

export const useUnlikeContent = () => {
  return useMutation(api.backend.content.unlikeContent);
};

export const useAddComment = () => {
  return useMutation(api.backend.content.addComment);
};

export const useShareContent = () => {
  return useMutation(api.backend.content.shareContent);
};

export const useDeleteContent = () => {
  return useMutation(api.backend.content.deleteContent);
};
