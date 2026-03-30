"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MessageSquare, Send, ArrowLeft, Search, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser, useMessages, useConversationMessages } from "@/hooks/api";
import { toast } from "sonner";
import { formatTimestamp } from "@/lib/utils";
import { Id } from "convex/_generated/dataModel";

export default function Messages() {
  const navigate = useNavigate();
  const params = useParams();
  const { user, isLoading } = useUser();
  const { conversations, unreadCount, createConversation, sendMessage, markMessagesRead, deleteConversation } = useMessages(user?._id || null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageContent, setMessageContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const messages = useConversationMessages(selectedConversation?._id || null, 100);

  useEffect(() => {
    if (params.conversationId && conversations) {
      const convo = conversations.find(c => c._id === params.conversationId);
      if (convo) {
        setSelectedConversation(convo);
        markMessagesRead({ conversationId: convo._id, userId: user!._id });
      }
    }
  }, [params.conversationId, conversations, user?._id]);

  const handleSelectConversation = async (convo: any) => {
    setSelectedConversation(convo);
    navigate(`/messages/${convo._id}`);
    if (user?._id) {
      await markMessagesRead({ conversationId: convo._id, userId: user._id });
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedConversation || !user?._id) return;
    
    try {
      await sendMessage({
        conversationId: selectedConversation._id,
        senderId: user._id,
        content: messageContent.trim(),
      });
      setMessageContent("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleDeleteConversation = async (conversationId: Id<"conversations">) => {
    if (!user?._id) return;
    try {
      await deleteConversation({ conversationId, userId: user._id });
      if (selectedConversation?._id === conversationId) {
        setSelectedConversation(null);
        navigate("/messages");
      }
      toast.success("Conversation deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete conversation");
    }
  };

  const handleNewConversation = async () => {
    if (!user?._id) return;
    toast.info("Select a user from their profile to start a conversation");
    navigate("/discovery");
  };

  if (!user && !isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <MessageSquare className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Sign In Required</h3>
        <p className="text-zinc-400 mb-6">Please sign in to view your messages.</p>
        <Link to="/signup">
          <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex">
      {/* Conversations List */}
      <div className={`w-full md:w-80 border-r border-zinc-800 flex flex-col ${selectedConversation ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            {unreadCount !== undefined && unreadCount > 0 && (
              <Badge className="bg-amber-500 text-black">{unreadCount}</Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 bg-zinc-800/50 border-zinc-700 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {conversations && conversations.length > 0 ? (
            <div className="divide-y divide-zinc-800/50">
              {conversations
                .filter(c => {
                  if (!searchQuery) return true;
                  return c.participantUsers.some((u: any) => 
                    u.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                })
                .map((convo) => (
                  <button
                    key={convo._id}
                    onClick={() => handleSelectConversation(convo)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-zinc-800/50 transition-colors ${
                      selectedConversation?._id === convo._id ? "bg-amber-500/10" : ""
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={convo.participantUsers[0]?.avatarUrl} />
                        <AvatarFallback className="bg-amber-500/20 text-amber-500">
                          {convo.participantUsers[0]?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {convo.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-xs font-bold text-black flex items-center justify-center">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white truncate">
                          {convo.participantUsers.map((u: any) => u.name).join(", ")}
                        </p>
                        <span className="text-xs text-zinc-500">
                          {convo.lastMessageAt ? formatTimestamp(convo.lastMessageAt) : ""}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 truncate">{convo.lastMessagePreview || "No messages yet"}</p>
                    </div>
                  </button>
                ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 mb-4">No conversations yet</p>
              <Button onClick={handleNewConversation} className="bg-amber-500 hover:bg-amber-400 text-black">
                Start a Conversation
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedConversation ? "hidden md:flex" : "flex"}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => { setSelectedConversation(null); navigate("/messages"); }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Link to={`/profile/${selectedConversation.participantUsers[0]?._id}`} className="flex items-center gap-3 flex-1">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConversation.participantUsers[0]?.avatarUrl} />
                  <AvatarFallback className="bg-amber-500/20 text-amber-500">
                    {selectedConversation.participantUsers[0]?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">
                    {selectedConversation.participantUsers.map((u: any) => u.name).join(", ")}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {selectedConversation.participantUsers.length} participant(s)
                  </p>
                </div>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-400"
                    onClick={() => handleDeleteConversation(selectedConversation._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages && messages.length > 0 ? (
                  messages.map((msg: any) => {
                    const isOwn = msg.senderId === user?._id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? "bg-amber-500 text-black rounded-br-md"
                              : "bg-zinc-800 text-white rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-amber-900" : "text-zinc-500"}`}>
                            {formatTimestamp(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-zinc-500 py-8">No messages yet. Start the conversation!</p>
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-zinc-800">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-800/50 border-zinc-700 text-white"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim()}
                  className="bg-amber-500 hover:bg-amber-400 text-black"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Select a conversation</h3>
              <p className="text-zinc-500">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
