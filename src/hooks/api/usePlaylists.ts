import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const usePlaylists = (userId: Id<"users"> | null) => {
  const userPlaylists = useQuery(api.backend.playlists.getUserPlaylists, userId ? { userId } : "skip");
  const publicPlaylists = useQuery(api.backend.playlists.getPublicPlaylists);
  const createPlaylist = useMutation(api.backend.playlists.createPlaylist);
  const addToPlaylist = useMutation(api.backend.playlists.addToPlaylist);
  const removeFromPlaylist = useMutation(api.backend.playlists.removeFromPlaylist);
  const deletePlaylist = useMutation(api.backend.playlists.deletePlaylist);

  return {
    userPlaylists,
    publicPlaylists,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    deletePlaylist,
    isLoading: userPlaylists === undefined,
  };
};

export const usePlaylistWithContents = (playlistId: Id<"playlists"> | null) => {
  return useQuery(api.backend.playlists.getPlaylistWithContents, playlistId ? { playlistId } : "skip");
};
