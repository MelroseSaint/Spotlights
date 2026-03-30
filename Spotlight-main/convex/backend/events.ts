import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { Id } from "convex/values";
import { LIGHTCREDZ_EARN, isRootAdmin } from "./constants";
import { awardLightCredz } from "./helpers";

export const createEvent = mutation({
  args: {
    creatorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.date(),
    isVirtual: v.boolean(),
    virtualLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error("User not found");
    
    const eventId = await ctx.db.insert("events", {
      creatorId: args.creatorId,
      title: args.title,
      description: args.description,
      location: args.location,
      eventDate: args.eventDate,
      isVirtual: args.isVirtual,
      virtualLink: args.virtualLink,
      isActive: true,
      createdAt: new Date(),
    });
    
    return eventId;
  },
});

export const getEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found");
    
    const creator = await ctx.db.get(event.creatorId);
    
    const checkIns = await ctx.db
      .query("eventCheckIns")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    
    const attendees = await Promise.all(
      checkIns.map(async (checkIn) => {
        const user = await ctx.db.get(checkIn.userId);
        return user ? {
          _id: user._id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          checkedInAt: checkIn.checkedInAt,
        } : null;
      })
    );
    
    return {
      ...event,
      creator: creator ? {
        _id: creator._id,
        name: creator.name,
        avatarUrl: creator.avatarUrl,
      } : null,
      attendeeCount: checkIns.length,
      attendees: attendees.filter(Boolean),
    };
  },
});

export const getUpcomingEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    const now = new Date();
    
    const events = await ctx.db
      .query("events")
      .withIndex("by_eventDate", (q) => q.gt(now))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(limit)
      .collect();
    
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const creator = await ctx.db.get(event.creatorId);
        const checkIns = await ctx.db
          .query("eventCheckIns")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();
        
        return {
          ...event,
          creator: creator ? {
            _id: creator._id,
            name: creator.name,
            avatarUrl: creator.avatarUrl,
          } : null,
          attendeeCount: checkIns.length,
        };
      })
    );
    
    return eventsWithDetails;
  },
});

export const getPastEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    const now = new Date();
    
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(200)
      .collect();
    
    return events
      .filter(e => new Date(e.eventDate) < now)
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
      .slice(0, limit);
  },
});

export const getUserEvents = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    return await ctx.db
      .query("events")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .order("desc")
      .take(limit)
      .collect();
  },
});

export const checkInToEvent = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
  },
  handler: async (ctx, { eventId, userId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found");
    
    if (!event.isActive) {
      throw new Error("This event is no longer active");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    const existingCheckIn = await ctx.db
      .query("eventCheckIns")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    
    if (existingCheckIn) {
      throw new Error("You have already checked in to this event");
    }
    
    await ctx.db.insert("eventCheckIns", {
      eventId,
      userId,
      checkedInAt: new Date(),
      lightCredzAwarded: true,
    });
    
    await awardLightCredz(
      ctx,
      userId,
      LIGHTCREDZ_EARN.EVENT_CHECKIN.amount,
      "event_checkin",
      `${LIGHTCREDZ_EARN.EVENT_CHECKIN.description}: ${event.title}`,
      undefined
    );
    
    await ctx.db.insert("notifications", {
      userId,
      type: "event_checkin",
      title: "Event Check-in Complete!",
      message: `You earned ${LIGHTCREDZ_EARN.EVENT_CHECKIN.amount} LightCredz for checking in to ${event.title}`,
      isRead: false,
      createdAt: new Date(),
    });
    
    return { success: true, creditsAwarded: LIGHTCREDZ_EARN.EVENT_CHECKIN.amount };
  },
});

export const hasCheckedIn = query({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
  },
  handler: async (ctx, { eventId, userId }) => {
    const checkIn = await ctx.db
      .query("eventCheckIns")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    
    return !!checkIn;
  },
});

export const cancelEvent = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
  },
  handler: async (ctx, { eventId, userId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found");
    
    if (event.creatorId !== userId) {
      const user = await ctx.db.get(userId);
      if (!user || !isRootAdmin(user.email) && user.role !== "admin" && user.role !== "root_admin") {
        throw new Error("Only the event creator or admin can cancel the event");
      }
    }
    
    await ctx.db.patch(eventId, {
      isActive: false,
    });
    
    const checkIns = await ctx.db
      .query("eventCheckIns")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    
    for (const checkIn of checkIns) {
      await ctx.db.insert("notifications", {
        userId: checkIn.userId,
        type: "event_cancelled",
        title: "Event Cancelled",
        message: `The event "${event.title}" has been cancelled.`,
        isRead: false,
        createdAt: new Date(),
      });
    }
    
    return { success: true };
  },
});

export const getUserCheckIns = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    const checkIns = await ctx.db
      .query("eventCheckIns")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .take(limit)
      .collect();
    
    const checkInsWithEvents = await Promise.all(
      checkIns.map(async (checkIn) => {
        const event = await ctx.db.get(checkIn.eventId);
        return {
          ...checkIn,
          event: event ? {
            _id: event._id,
            title: event.title,
            eventDate: event.eventDate,
            location: event.location,
          } : null,
        };
      })
    );
    
    return checkInsWithEvents;
  },
});

export const getEventAttendees = query({
  args: {
    eventId: v.id("events"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { eventId, limit = 100 }) => {
    const checkIns = await ctx.db
      .query("eventCheckIns")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .take(limit)
      .collect();
    
    const attendees = await Promise.all(
      checkIns.map(async (checkIn) => {
        const user = await ctx.db.get(checkIn.userId);
        return user ? {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
          checkedInAt: checkIn.checkedInAt,
        } : null;
      })
    );
    
    return attendees.filter(Boolean);
  },
});

export const searchEvents = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query: searchQuery, limit = 20 }) => {
    const now = new Date();
    const queryLower = searchQuery.toLowerCase();
    
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(200);
    
    return events
      .filter(e => 
        e.title.toLowerCase().includes(queryLower) ||
        e.description.toLowerCase().includes(queryLower) ||
        e.location.toLowerCase().includes(queryLower)
      )
      .filter(e => new Date(e.eventDate) > now)
      .slice(0, limit);
  },
});
