import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";

export const createPlaylist = mutation({
  args: { ownerId: v.id("users"), name: v.string(), description: v.optional(v.string()), isPublic: v.optional(v.boolean()) },
  handler: async (ctx, { ownerId, name, description, isPublic = false }) => {
    return await ctx.db.insert("playlists", {
      ownerId,
      name,
      description,
      coverImageUrl: undefined,
      contentIds: [],
      isPublic,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const addToPlaylist = mutation({
  args: { playlistId: v.id("playlists"), contentId: v.id("artistContent"), userId: v.id("users") },
  handler: async (ctx, { playlistId, contentId, userId }) => {
    const playlist = await ctx.db.get(playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.ownerId !== userId) throw new Error("Not your playlist");
    if (playlist.contentIds.includes(contentId)) throw new Error("Already in playlist");
    
    await ctx.db.patch(playlistId, {
      contentIds: [...playlist.contentIds, contentId],
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

export const removeFromPlaylist = mutation({
  args: { playlistId: v.id("playlists"), contentId: v.id("artistContent"), userId: v.id("users") },
  handler: async (ctx, { playlistId, contentId, userId }) => {
    const playlist = await ctx.db.get(playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.ownerId !== userId) throw new Error("Not your playlist");
    
    await ctx.db.patch(playlistId, {
      contentIds: playlist.contentIds.filter(id => id !== contentId),
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

export const deletePlaylist = mutation({
  args: { playlistId: v.id("playlists"), userId: v.id("users") },
  handler: async (ctx, { playlistId, userId }) => {
    const playlist = await ctx.db.get(playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.ownerId !== userId) throw new Error("Not your playlist");
    
    await ctx.db.delete(playlistId);
    return { success: true };
  },
});

export const getUserPlaylists = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const playlists = await ctx.db.query("playlists").withIndex("by_owner", (q) => q.eq("ownerId", userId)).collect();
    
    return Promise.all(playlists.map(async (playlist) => {
      const contents = await Promise.all(playlist.contentIds.slice(0, 5).map(id => ctx.db.get(id)));
      return {
        ...playlist,
        previewContents: contents.filter(Boolean).map(c => ({ _id: c!._id, title: c!.title, artistName: c!.artistName, mediaUrl: c!.mediaUrl, thumbnailUrl: c!.thumbnailUrl })),
        totalTracks: playlist.contentIds.length,
      };
    }));
  },
});

export const getPublicPlaylists = query({
  args: {},
  handler: async (ctx) => {
    const playlists = await ctx.db.query("playlists").withIndex("by_isPublic", (q) => q.eq("isPublic", true)).collect();
    
    return Promise.all(playlists.map(async (playlist) => {
      const owner = await ctx.db.get(playlist.ownerId);
      const contents = await Promise.all(playlist.contentIds.slice(0, 5).map(id => ctx.db.get(id)));
      return {
        ...playlist,
        owner: owner ? { _id: owner._id, name: owner.name, avatarUrl: owner.avatarUrl } : null,
        previewContents: contents.filter(Boolean).map(c => ({ _id: c!._id, title: c!.title, artistName: c!.artistName, mediaUrl: c!.mediaUrl, thumbnailUrl: c!.thumbnailUrl })),
        totalTracks: playlist.contentIds.length,
      };
    }));
  },
});

export const getPlaylistWithContents = query({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, { playlistId }) => {
    const playlist = await ctx.db.get(playlistId);
    if (!playlist) throw new Error("Playlist not found");
    
    const owner = await ctx.db.get(playlist.ownerId);
    const contents = await Promise.all(playlist.contentIds.map(id => ctx.db.get(id)));
    
    return {
      ...playlist,
      owner: owner ? { _id: owner._id, name: owner.name, avatarUrl: owner.avatarUrl } : null,
      contents: contents.filter(Boolean),
    };
  },
});
