import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { EVENT_RULES, LIGHTCREDZ_EARN } from "../constants";
import { isAdmin, spendLightCredz, createNotification } from "../helpers";

export const createUserEvent = mutation({
  args: {
    creatorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.number(),
    isVirtual: v.boolean(),
    virtualLink: v.optional(v.string()),
    eventType: v.union(v.literal("lightcredz"), v.literal("paid")),
    maxAttendees: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.creatorId);
    if (!user) throw new Error("User not found");
    if (user.isSuspended) throw new Error("Account is suspended");
    
    // Admins can create unlimited events
    if (!isAdmin(user.role)) {
      // Check event count limits
      const eventCount = user.eventCount || 0;
      const maxEvents = user.maxEventsAllowed || 0;
      if (maxEvents > 0 && eventCount >= maxEvents) {
        throw new Error(`Event limit reached (${eventCount}/${maxEvents}). Upgrade to Elite for more events.`);
      }
      
      // Growth tier can ONLY create events with LightCredz, not paid
      if (user.tier === "growth" && args.eventType === "paid") {
        throw new Error("Growth tier can only create events using LightCredz. Please use 'LightCredz' option.");
      }
      
      // Check if user has enough LightCredz
      if (args.eventType === "lightcredz") {
        if (user.lightCredzBalance < EVENT_RULES.GROWTH_MIN_CREDITS) {
          throw new Error(`Insufficient LightCredz. You need at least ${EVENT_RULES.GROWTH_MIN_CREDITS} credits to create an event. Current balance: ${user.lightCredzBalance}`);
        }
      }
    }
    
    // Deduct credits for lightcredz events
    if (args.eventType === "lightcredz" && !isAdmin(user.role)) {
      const spendResult = await spendLightCredz(
        ctx,
        args.creatorId,
        EVENT_RULES.GROWTH_MIN_CREDITS,
        "event_creation",
        `Created event: ${args.title}`,
      );
      
      if (!spendResult.success) {
        throw new Error(spendResult.reason);
      }
    }
    
    const eventId = await ctx.db.insert("userEvents", {
      creatorId: args.creatorId,
      title: args.title,
      description: args.description,
      location: args.location,
      eventDate: args.eventDate,
      isVirtual: args.isVirtual,
      virtualLink: args.virtualLink,
      isActive: true,
      eventType: args.eventType,
      creditsCost: args.eventType === "lightcredz" ? EVENT_RULES.GROWTH_MIN_CREDITS : undefined,
      maxAttendees: args.maxAttendees,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Update user event count
    await ctx.db.patch(args.creatorId, {
      eventCount: (user.eventCount || 0) + 1,
      updatedAt: Date.now(),
    });
    
    return { success: true, eventId };
  },
});

export const updateUserEvent = mutation({
  args: {
    eventId: v.id("userEvents"),
    creatorId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    eventDate: v.optional(v.number()),
    isVirtual: v.optional(v.boolean()),
    virtualLink: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    maxAttendees: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.creatorId);
    if (!user) throw new Error("User not found");
    if (!isAdmin(user.role) && user.role !== "user") throw new Error("Not authorized");
    
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.creatorId !== args.creatorId && !isAdmin(user.role)) throw new Error("Not authorized");
    
    const updates: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.location !== undefined) updates.location = args.location;
    if (args.eventDate !== undefined) updates.eventDate = args.eventDate;
    if (args.isVirtual !== undefined) updates.isVirtual = args.isVirtual;
    if (args.virtualLink !== undefined) updates.virtualLink = args.virtualLink;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.maxAttendees !== undefined) updates.maxAttendees = args.maxAttendees;
    
    await ctx.db.patch(args.eventId, updates);
    
    return { success: true };
  },
});

export const deleteUserEvent = mutation({
  args: { eventId: v.id("userEvents"), creatorId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.creatorId);
    if (!user) throw new Error("User not found");
    
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.creatorId !== args.creatorId && !isAdmin(user.role)) throw new Error("Not authorized");
    
    await ctx.db.delete(args.eventId);
    
    // Update user event count (don't go below 0)
    await ctx.db.patch(args.creatorId, {
      eventCount: Math.max(0, (user.eventCount || 0) - 1),
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

export const getUserEvents = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, { creatorId }) => {
    const events = await ctx.db.query("userEvents")
      .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
      .collect();
    
    return events.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getUpcomingUserEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    const now = Date.now();
    const events = await ctx.db.query("userEvents")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    
    const upcoming = events
      .filter(e => e.eventDate > now)
      .sort((a, b) => a.eventDate - b.eventDate);
    
    const withCreators = await Promise.all(
      upcoming.slice(0, limit).map(async (event) => {
        const creator = await ctx.db.get(event.creatorId);
        return {
          ...event,
          creator: creator ? { _id: creator._id, name: creator.name, avatarUrl: creator.avatarUrl } : null,
        };
      })
    );
    
    return withCreators;
  },
});

export const getUserEventById = query({
  args: { eventId: v.id("userEvents") },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) return null;
    
    const creator = await ctx.db.get(event.creatorId);
    return {
      ...event,
      creator: creator ? { _id: creator._id, name: creator.name, avatarUrl: creator.avatarUrl } : null,
    };
  },
});
