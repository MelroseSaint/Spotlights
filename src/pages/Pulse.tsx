"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Flame, 
  Music,
  Heart,
  MessageCircle,
  Users,
  Bell,
  Calendar,
  Check,
  Eye,
  TrendingUp,
  Radio,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentCard from "@/components/ContentCard";
import { useUser, useUserNotifications, useUnreadCount, useMarkNotificationRead, useTrendingContent, useFreshFaceFeed } from "@/hooks/api";
import { toast } from "sonner";
import { Id } from "convex/_generated/dataModel";

const notificationIcons: Record<string, any> = {
  follow: Users,
  like: Heart,
  comment: MessageCircle,
  content_approved: Check,
  content_rejected: Flame,
  event_checkin: Calendar,
  promotion: Sparkles,
  default: Bell,
};

export default function Pulse() {
  const { user } = useUser();
  const markNotificationRead = useMarkNotificationRead();
  
  const [activeTab, setActiveTab] = useState("feed");
  
  const notifications = useUserNotifications(user?._id, 50, false);
  const unreadCount = useUnreadCount(user?._id);
  const trendingContent = useTrendingContent(5, "week");
  const freshFaces = useFreshFaceFeed(3);

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    if (!user) return;
    try {
      await markNotificationRead({ notificationId, userId: user._id });
    } catch (error: any) {
      toast.error(error.message || "Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!notifications || !user) return;
    try {
      const unread = notifications.filter((n: any) => !n.isRead);
      for (const notification of unread) {
        await markNotificationRead({ notificationId: notification._id, userId: user._id });
      }
      toast.success("All notifications marked as read");
    } catch (error: any) {
      toast.error(error.message || "Failed to mark all as read");
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="text-amber-500 w-5 h-5" />
            <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">Live Updates</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight italic uppercase">
            Pulse Feed
          </h2>
          <p className="text-zinc-400 mt-4 max-w-2xl text-lg leading-relaxed">
            Real-time updates from artists in your network. Stay connected with the heartbeat of Central PA's music scene.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900/50 rounded-2xl p-1 mb-8">
            <TabsTrigger
              value="feed"
              className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold"
            >
              <Flame className="w-4 h-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold relative"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {unreadCount && unreadCount.count > 0 && (
                <Badge className="ml-2 bg-red-500 text-white rounded-full text-xs">
                  {unreadCount.count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-8">
            {/* Fresh Faces Quick View */}
            {freshFaces && freshFaces.length > 0 && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Radio className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">Fresh Faces Rising</h3>
                  </div>
                  <Link to="/fresh-faces">
                    <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
                      View All
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {freshFaces.slice(0, 3).map((content: any) => (
                    <ContentCard key={content._id} content={content} showPromotionBadge={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Highlights */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <span className="text-amber-500 font-black tracking-[0.3em] uppercase text-[10px]">Weekly Recap</span>
                  <h2 className="text-4xl font-black text-white mt-2 italic uppercase tracking-tighter">Trending This Week</h2>
                </div>
                <Link to="/discovery">
                  <Button variant="outline" className="rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                    View Full Chart
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trendingContent && trendingContent.length > 0 ? (
                  trendingContent.slice(0, 3).map((content: any, idx: number) => (
                    <Card key={content._id} className="bg-zinc-900/50 border-zinc-800 rounded-2xl overflow-hidden">
                      <CardHeader className="pb-3 bg-zinc-800/30">
                        <CardTitle className="text-base flex items-center gap-2">
                          {idx === 0 && <span className="text-2xl">🥇</span>}
                          {idx === 1 && <span className="text-2xl">🥈</span>}
                          {idx === 2 && <span className="text-2xl">🥉</span>}
                          {idx > 2 && <span className="text-zinc-500">#{idx + 1}</span>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <h4 className="text-lg font-bold text-white mb-1 truncate">{content.title}</h4>
                        <p className="text-zinc-400 text-sm mb-2">by {content.artistName}</p>
                        <div className="flex items-center gap-4 text-zinc-500 text-sm">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {content.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {content.comments}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <TrendingUp className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500">No trending content yet</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {user ? (
              <>
                {notifications && notifications.length > 0 && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      onClick={handleMarkAllAsRead}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Mark all as read
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notification: any) => {
                      const IconComponent = notificationIcons[notification.type] || notificationIcons.default;
                      return (
                        <Card
                          key={notification._id}
                          className={`bg-zinc-900/50 border-zinc-800 rounded-2xl transition-all ${
                            !notification.isRead ? "border-l-4 border-l-amber-500" : ""
                          }`}
                        >
                          <CardContent className="p-4 flex items-start gap-4">
                            <div className={`p-3 rounded-full ${
                              notification.type === "content_approved" ? "bg-green-500/20 text-green-400" :
                              notification.type === "content_rejected" ? "bg-red-500/20 text-red-400" :
                              notification.type === "follow" ? "bg-blue-500/20 text-blue-400" :
                              notification.type === "event_checkin" ? "bg-amber-500/20 text-amber-400" :
                              "bg-zinc-800 text-zinc-400"
                            }`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white mb-1">{notification.title}</h4>
                              <p className="text-zinc-400 text-sm">{notification.message}</p>
                              <p className="text-zinc-500 text-xs mt-2">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification._id)}
                                className="text-zinc-400 hover:text-white"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
                      <Bell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">No Notifications</h3>
                      <p className="text-zinc-500 max-w-md mx-auto">
                        You're all caught up! Check back later for updates.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
                <Bell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Sign In Required</h3>
                <p className="text-zinc-400 mb-6">Please sign in to view your notifications.</p>
                <Link to="/signup">
                  <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingContent && trendingContent.length > 0 ? (
                trendingContent.map((content: any) => (
                  <ContentCard key={content._id} content={content} />
                ))
              ) : (
                <div className="col-span-3 text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
                  <TrendingUp className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Trending Content</h3>
                  <p className="text-zinc-500">Check back soon for trending tracks!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
