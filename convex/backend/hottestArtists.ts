import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { isRootAdmin } from "../helpers";

export const getHottestArtists = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const hottestArtists = await ctx.db
      .query("hottestArtists")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const sorted = hottestArtists.sort((a, b) => a.position - b.position);
    const limited = sorted.slice(0, limit);

    const artistsWithDetails = await Promise.all(
      limited.map(async (item) => {
        const artist = await ctx.db.get(item.artistId);
        if (!artist) return null;
        return {
          position: item.position,
          artist: {
            _id: artist._id,
            name: artist.name,
            username: artist.username,
            avatarUrl: artist.avatarUrl,
            bio: artist.bio,
            tier: artist.tier,
            isVerified: artist.isVerified,
            followers: artist.followers,
          },
          addedAt: item.createdAt,
          addedBy: item.createdBy,
        };
      })
    );

    return artistsWithDetails.filter(Boolean);
  },
});

export const addHottestArtist = mutation({
  args: {
    artistId: v.id("users"),
    position: v.optional(v.number()),
    addedBy: v.id("users"),
  },
  handler: async (ctx, { artistId, position, addedBy }) => {
    const admin = await ctx.db.get(addedBy);
    if (!admin) throw new Error("Admin not found");
    if (!isRootAdmin(admin.email) && admin.role !== "admin") {
      throw new Error("Admin access required");
    }

    const artist = await ctx.db.get(artistId);
    if (!artist) throw new Error("Artist not found");

    const existing = await ctx.db
      .query("hottestArtists")
      .withIndex("by_artist", (q) => q.eq("artistId", artistId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      throw new Error("Artist is already in Hottest list");
    }

    const currentHottest = await ctx.db
      .query("hottestArtists")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const nextPosition = position ?? currentHottest.length;

    const updatedOthers = currentHottest
      .filter((h) => h.position >= nextPosition)
      .sort((a, b) => b.position - a.position);

    for (const item of updatedOthers) {
      await ctx.db.patch(item._id, { position: item.position + 1 });
    }

    await ctx.db.insert("hottestArtists", {
      artistId,
      position: nextPosition,
      createdAt: Date.now(),
      createdBy: addedBy,
      isActive: true,
    });

    return { success: true, position: nextPosition };
  },
});

export const removeHottestArtist = mutation({
  args: {
    artistId: v.id("users"),
    removedBy: v.id("users"),
  },
  handler: async (ctx, { artistId, removedBy }) => {
    const admin = await ctx.db.get(removedBy);
    if (!admin) throw new Error("Admin not found");
    if (!isRootAdmin(admin.email) && admin.role !== "admin") {
      throw new Error("Admin access required");
    }

    const hottestItem = await ctx.db
      .query("hottestArtists")
      .withIndex("by_artist", (q) => q.eq("artistId", artistId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!hottestItem) {
      throw new Error("Artist not in Hottest list");
    }

    await ctx.db.patch(hottestItem._id, { isActive: false });

    const remaining = await ctx.db
      .query("hottestArtists")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const sorted = remaining.sort((a, b) => a.position - b.position);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].position !== i) {
        await ctx.db.patch(sorted[i]._id, { position: i });
      }
    }

    return { success: true };
  },
});

export const updateHottestPosition = mutation({
  args: {
    artistId: v.id("users"),
    newPosition: v.number(),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, { artistId, newPosition, updatedBy }) => {
    const admin = await ctx.db.get(updatedBy);
    if (!admin) throw new Error("Admin not found");
    if (!isRootAdmin(admin.email) && admin.role !== "admin") {
      throw new Error("Admin access required");
    }

    const hottestItem = await ctx.db
      .query("hottestArtists")
      .withIndex("by_artist", (q) => q.eq("artistId", artistId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!hottestItem) {
      throw new Error("Artist not in Hottest list");
    }

    const oldPosition = hottestItem.position;
    if (oldPosition === newPosition) {
      return { success: true };
    }

    const allHottest = await ctx.db
      .query("hottestArtists")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    if (newPosition < 0 || newPosition >= allHottest.length) {
      throw new Error("Invalid position");
    }

    for (const item of allHottest) {
      if (item._id === hottestItem._id) {
        await ctx.db.patch(item._id, { position: newPosition });
      } else if (oldPosition < newPosition) {
        if (item.position > oldPosition && item.position <= newPosition) {
          await ctx.db.patch(item._id, { position: item.position - 1 });
        }
      } else {
        if (item.position >= newPosition && item.position < oldPosition) {
          await ctx.db.patch(item._id, { position: item.position + 1 });
        }
      }
    }

    return { success: true };
  },
});

export const clearHottestArtists = mutation({
  args: { clearedBy: v.id("users") },
  handler: async (ctx, { clearedBy }) => {
    const admin = await ctx.db.get(clearedBy);
    if (!admin) throw new Error("Admin not found");
    if (!isRootAdmin(admin.email) && admin.role !== "admin") {
      throw new Error("Admin access required");
    }

    const allHottest = await ctx.db
      .query("hottestArtists")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    for (const item of allHottest) {
      await ctx.db.patch(item._id, { isActive: false });
    }

    return { success: true, count: allHottest.length };
  },
});

export const getAllHottestArtistsAdmin = query({
  args: {},
  handler: async (ctx) => {
    const allHottest = await ctx.db
      .query("hottestArtists")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const sorted = allHottest.sort((a, b) => a.position - b.position);

    return Promise.all(
      sorted.map(async (item) => {
        const artist = await ctx.db.get(item.artistId);
        return {
          _id: item._id,
          artistId: item.artistId,
          position: item.position,
          artist: artist
            ? {
                _id: artist._id,
                name: artist.name,
                username: artist.username,
                avatarUrl: artist.avatarUrl,
                email: artist.email,
              }
            : null,
          createdAt: item.createdAt,
          createdBy: item.createdBy,
        };
      })
    );
  },
});
