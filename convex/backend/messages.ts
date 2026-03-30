import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "convex/values";

export const createConversation = mutation({
  args: { participantIds: v.array(v.id("users")), initiatorId: v.id("users") },
  handler: async (ctx, { participantIds, initiatorId }) => {
    const allParticipants = [...new Set([initiatorId, ...participantIds])];
    
    const existing = await ctx.db.query("conversations").collect();
    for (const convo of existing) {
      if (!convo.participants) continue;
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
    if (!conversation.participants?.includes(senderId)) throw new Error("Not a participant");
    
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
    try {
      const allConversations = await ctx.db.query("conversations").collect();
      const userConvos = allConversations
        .filter(c => c.participants?.includes(userId))
        .sort((a, b) => (b.lastMessageAt || b.createdAt || 0) - (a.lastMessageAt || a.createdAt || 0));
      
      return await Promise.all(userConvos.map(async (convo) => {
        try {
          const otherParticipants = (convo.participants || []).filter((p: Id<"users">) => p !== userId);
          const participantUsers = await Promise.all(
            otherParticipants.map(async (p: Id<"users">) => {
              try {
                const user = await ctx.db.get(p);
                if (!user) return null;
                return { _id: user._id, name: user.name, avatarUrl: user.avatarUrl, username: user.username };
              } catch {
                return null;
              }
            })
          );
          
          let unreadCount = 0;
          try {
            const msgs = await ctx.db.query("messages")
              .withIndex("by_conversation", (q) => q.eq("conversationId", convo._id))
              .collect();
            unreadCount = msgs.filter(m => !m.isRead && m.senderId !== userId).length;
          } catch {
            // messages query failed
          }
          
          const lastMsg = await ctx.db.query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", convo._id))
            .order("desc")
            .first();
          
          return {
            _id: convo._id,
            participants: convo.participants,
            lastMessagePreview: convo.lastMessagePreview,
            lastMessageAt: convo.lastMessageAt,
            lastMessageSenderId: convo.lastMessageSenderId,
            createdAt: convo.createdAt,
            updatedAt: convo.updatedAt,
            participantUsers: participantUsers.filter(Boolean),
            lastMessage: lastMsg || null,
            unreadCount,
          };
        } catch {
          return null;
        }
      }));
    } catch {
      return [];
    }
  },
});

export const getConversationMessages = query({
  args: { conversationId: v.id("conversations"), limit: v.optional(v.number()) },
  handler: async (ctx, { conversationId, limit = 50 }) => {
    try {
      const msgs = await ctx.db.query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
        .order("desc")
        .take(limit);
      
      return await Promise.all(msgs.map(async (msg) => {
        try {
          const sender = await ctx.db.get(msg.senderId);
          return {
            _id: msg._id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            content: msg.content,
            isRead: msg.isRead,
            readAt: msg.readAt,
            createdAt: msg.createdAt,
            sender: sender ? { _id: sender._id, name: sender.name, avatarUrl: sender.avatarUrl, username: sender.username } : null,
          };
        } catch {
          return {
            _id: msg._id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            content: msg.content,
            isRead: msg.isRead,
            readAt: msg.readAt,
            createdAt: msg.createdAt,
            sender: null,
          };
        }
      }));
    } catch {
      return [];
    }
  },
});

export const markMessagesRead = mutation({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, { conversationId, userId }) => {
    try {
      const messages = await ctx.db.query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
        .collect();
      
      for (const msg of messages) {
        if (!msg.isRead && msg.senderId !== userId) {
          await ctx.db.patch(msg._id, { isRead: true, readAt: Date.now() });
        }
      }
    } catch (err) {
      console.error("Error marking messages read:", err);
    }
    return { success: true };
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, { conversationId, userId }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");
    
    const updatedParticipants = (conversation.participants || []).filter((p: Id<"users">) => p !== userId);
    
    if (updatedParticipants.length <= 1) {
      const messages = await ctx.db.query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
        .collect();
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
    try {
      const conversations = await ctx.db.query("conversations").collect();
      const userConvos = conversations.filter(c => c.participants?.includes(userId));
      
      let totalUnread = 0;
      for (const convo of userConvos) {
        try {
          const messages = await ctx.db.query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", convo._id))
            .collect();
          totalUnread += messages.filter(m => !m.isRead && m.senderId !== userId).length;
        } catch {
          // skip failed convo
        }
      }
      
      return totalUnread;
    } catch {
      return 0;
    }
  },
});
