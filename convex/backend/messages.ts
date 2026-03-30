import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";

export const createConversation = mutation({
  args: { participantIds: v.array(v.id("users")), initiatorId: v.id("users") },
  handler: async (ctx, { participantIds, initiatorId }) => {
    const allParticipants = [...new Set([initiatorId, ...participantIds])];
    const existing = await ctx.db.query("conversations").collect();
    
    for (const convo of existing) {
      if (convo.participants.length === allParticipants.length && 
          allParticipants.every(p => convo.participants.includes(p))) {
        return convo._id;
      }
    }
    
    return await ctx.db.insert("conversations", {
      participants: allParticipants,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const sendMessage = mutation({
  args: { conversationId: v.id("conversations"), senderId: v.id("users"), content: v.string() },
  handler: async (ctx, { conversationId, senderId, content }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participants.includes(senderId)) throw new Error("Not a participant");
    
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      senderId,
      content,
      isRead: false,
      createdAt: Date.now(),
    });
    
    await ctx.db.patch(conversationId, {
      lastMessagePreview: content.slice(0, 100),
      lastMessageAt: Date.now(),
      lastMessageSenderId: senderId,
      updatedAt: Date.now(),
    });
    
    return messageId;
  },
});

export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const conversations = await ctx.db.query("conversations").collect();
    const userConvos = conversations.filter(c => c.participants.includes(userId))
      .sort((a, b) => (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt));
    
    return Promise.all(userConvos.map(async (convo) => {
      const otherParticipants = convo.participants.filter(p => p !== userId);
      const participantUsers = await Promise.all(otherParticipants.map(p => ctx.db.get(p)));
      const messages = await ctx.db.query("messages").withIndex("by_conversation", (q) => q.eq("conversationId", convo._id)).order("desc").take(1).collect();
      const allMessages = await ctx.db.query("messages").withIndex("by_conversation", (q) => q.eq("conversationId", convo._id)).collect();
      const unreadCount = allMessages.filter(m => !m.isRead && m.senderId !== userId).length;
      
      return {
        ...convo,
        participantUsers: participantUsers.filter(Boolean).map(u => ({ _id: u!._id, name: u!.name, avatarUrl: u!.avatarUrl, username: u!.username })),
        lastMessage: messages[0] || null,
        unreadCount,
      };
    }));
  },
});

export const getConversationMessages = query({
  args: { conversationId: v.id("conversations"), limit: v.optional(v.number()) },
  handler: async (ctx, { conversationId, limit = 50 }) => {
    const messages = await ctx.db.query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .order("desc")
      .take(limit);
    
    return Promise.all(messages.map(async (msg) => {
      const sender = await ctx.db.get(msg.senderId);
      return {
        ...msg,
        sender: sender ? { _id: sender._id, name: sender.name, avatarUrl: sender.avatarUrl, username: sender.username } : null,
      };
    }));
  },
});

export const markMessagesRead = mutation({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, { conversationId, userId }) => {
    const messages = await ctx.db.query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    
    for (const msg of messages) {
      if (!msg.isRead && msg.senderId !== userId) {
        await ctx.db.patch(msg._id, { isRead: true, readAt: Date.now() });
      }
    }
    
    return { success: true };
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, { conversationId, userId }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");
    
    const updatedParticipants = conversation.participants.filter(p => p !== userId);
    
    if (updatedParticipants.length <= 1) {
      const messages = await ctx.db.query("messages").withIndex("by_conversation", (q) => q.eq("conversationId", conversationId)).collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      await ctx.db.delete(conversationId);
    } else {
      await ctx.db.patch(conversationId, { participants: updatedParticipants, updatedAt: Date.now() });
    }
    
    return { success: true };
  },
});

export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const conversations = await ctx.db.query("conversations").collect();
    const userConvos = conversations.filter(c => c.participants.includes(userId));
    
    let totalUnread = 0;
    for (const convo of userConvos) {
      const messages = await ctx.db.query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", convo._id))
        .collect();
      totalUnread += messages.filter(m => !m.isRead && m.senderId !== userId).length;
    }
    
    return totalUnread;
  },
});
