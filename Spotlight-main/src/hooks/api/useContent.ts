import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useContent(contentId: string) {
  return useQuery(api.backend.content.getContent, { contentId: contentId as any });
}

export function useContentWithOwner(contentId: string) {
  return useQuery(api.backend.content.getContentWithOwner, { contentId: contentId as any });
}

export function useUserContent(userId: string, limit?: number) {
  return useQuery(api.backend.content.getUserContent, { userId: userId as any, limit });
}

export function useContentByGenre(genre: string, limit?: number) {
  return useQuery(api.backend.content.getContentByGenre, { genre, limit });
}

export function useContentByRegion(region: string, limit?: number) {
  return useQuery(api.backend.content.getContentByRegion, { region, limit });
}

export function useComments(contentId: string, limit?: number) {
  return useQuery(api.backend.content.getComments, { contentId: contentId as any, limit });
}

export function useHasLikedContent(userId: string, contentId: string) {
  return useQuery(api.backend.content.hasLikedContent, { userId: userId as any, contentId: contentId as any });
}

export function useSearchContent(query: string, limit?: number) {
  return useQuery(api.backend.content.searchContent, { query, limit });
}

export function useCreateContent() {
  return useMutation(api.backend.content.createContent);
}

export function useUpdateContent() {
  return useMutation(api.backend.content.updateContent);
}

export function useDeleteContent() {
  return useMutation(api.backend.content.deleteContent);
}

export function useSubmitContent() {
  return useMutation(api.backend.content.submitContent);
}

export function useLikeContent() {
  return useMutation(api.backend.content.likeContent);
}

export function useUnlikeContent() {
  return useMutation(api.backend.content.unlikeContent);
}

export function useAddComment() {
  return useMutation(api.backend.content.addComment);
}

export function useShareContent() {
  return useMutation(api.backend.content.shareContent);
}

export function useRecordView() {
  return useMutation(api.backend.content.recordView);
}
