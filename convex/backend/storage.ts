import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {
    contentType: v.string(),
  },
  handler: async (ctx, { contentType }) => {
    const url = await ctx.storage.generateUploadUrl();
    return url;
  },
});

export const deleteFile = mutation({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, { storageId }) => {
    await ctx.storage.delete(storageId as any);
    return { success: true };
  },
});

export const getFileUrl = query({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, { storageId }) => {
    const url = await ctx.storage.getUrl(storageId as any);
    return url;
  },
});
