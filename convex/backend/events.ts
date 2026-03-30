import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { LIGHTCREDZ_EARN } from "../constants";
import { awardLightCredz, createNotification } from "../helpers";

export const createEvent = mutation({
  args: { creatorId: v.id("users"), title: v.string(), description: v.string(), location: v.string(), eventDate: v.number(), isVirtual: v.boolean(), virtualLink: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error("User not found");
    return await ctx.db.insert("events", { creatorId: args.creatorId, title: args.title, description: args.description, location: args.location, eventDate: args.eventDate, isVirtual: args.isVirtual, virtualLink: args.virtualLink, isActive: true, createdAt: Date.now() });
  },
});

export const getUpcomingEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    const now = Date.now();
    const events = await ctx.db.query("events").collect();
    const upcomingEvents = events
      .filter(e => e.isActive && e.eventDate > now)
      .sort((a, b) => a.eventDate - b.eventDate)
      .slice(0, limit);
    return Promise.all(upcomingEvents.map(async (event) => {
      const creator = await ctx.db.get(event.creatorId);
      const checkIns = await ctx.db.query("eventCheckIns").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect();
      return { ...event, creator: creator ? { _id: creator._id, name: creator.name, avatarUrl: creator.avatarUrl } : null, attendeeCount: checkIns.length };
    }));
  },
});

export const checkInToEvent = mutation({
  args: { eventId: v.id("events"), userId: v.id("users") },
  handler: async (ctx, { eventId, userId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found");
    if (!event.isActive) throw new Error("This event is no longer active");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const existingCheckIn = await ctx.db.query("eventCheckIns").withIndex("by_event_user", (q) => q.eq("eventId", eventId).eq("userId", userId)).first();
    if (existingCheckIn) throw new Error("You have already checked in to this event");
    await ctx.db.insert("eventCheckIns", { eventId, userId, checkedInAt: Date.now(), lightCredzAwarded: true });
    await awardLightCredz(ctx, userId, LIGHTCREDZ_EARN.EVENT_CHECKIN.amount, "event_checkin", `${LIGHTCREDZ_EARN.EVENT_CHECKIN.description}: ${event.title}`);
    await createNotification(ctx, userId, "event_checkin", "Event Check-in Complete!", `You earned ${LIGHTCREDZ_EARN.EVENT_CHECKIN.amount} LightCredz for checking in to ${event.title}`);
    return { success: true, creditsAwarded: LIGHTCREDZ_EARN.EVENT_CHECKIN.amount };
  },
});

export const hasCheckedIn = query({
  args: { eventId: v.id("events"), userId: v.id("users") },
  handler: async (ctx, { eventId, userId }) => {
    const checkIn = await ctx.db.query("eventCheckIns").withIndex("by_event_user", (q) => q.eq("eventId", eventId).eq("userId", userId)).first();
    return !!checkIn;
  },
});
