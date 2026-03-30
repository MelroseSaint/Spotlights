import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useMessages = (userId: Id<"users"> | null) => {
  const conversations = useQuery(api.backend.messages.getUserConversations, userId ? { userId } : "skip");
  const unreadCount = useQuery(api.backend.messages.getUnreadCount, userId ? { userId } : "skip");
  const createConversation = useMutation(api.backend.messages.createConversation);
  const sendMessage = useMutation(api.backend.messages.sendMessage);
  const markMessagesRead = useMutation(api.backend.messages.markMessagesRead);
  const deleteConversation = useMutation(api.backend.messages.deleteConversation);

  return {
    conversations,
    unreadCount,
    createConversation,
    sendMessage,
    markMessagesRead,
    deleteConversation,
    isLoading: conversations === undefined,
  };
};

export const useConversationMessages = (conversationId: Id<"conversations"> | null, limit?: number) => {
  return useQuery(api.backend.messages.getConversationMessages, conversationId ? { conversationId, limit } : "skip");
};
