import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useHottestArtists = (limit?: number) => {
  return useQuery(api.backend.hottestArtists.getHottestArtists, {
    limit: limit ?? 10,
  });
};

export const useAllHottestArtistsAdmin = () => {
  return useQuery(api.backend.hottestArtists.getAllHottestArtistsAdmin);
};

export const useAddHottestArtist = () => {
  return useMutation(api.backend.hottestArtists.addHottestArtist);
};

export const useRemoveHottestArtist = () => {
  return useMutation(api.backend.hottestArtists.removeHottestArtist);
};

export const useUpdateHottestPosition = () => {
  return useMutation(api.backend.hottestArtists.updateHottestPosition);
};

export const useClearHottestArtists = () => {
  return useMutation(api.backend.hottestArtists.clearHottestArtists);
};
