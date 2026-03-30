"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  MapPin, 
  Link as LinkIcon, 
  Heart, 
  Share2, 
  Calendar,
  MessageCircle,
  User,
  Edit3,
  Settings,
  Users,
  Music,
  Zap,
  Check,
  PlusSquare,
  BadgeCheck,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ContentCard from "@/components/ContentCard";
import { useUser, useUserById, useFollowUser, useUnfollowUser, useContent, useMessages, useFileUrl } from "@/hooks/api";
import { toast } from "sonner";
import { Id } from "convex/_generated/dataModel";
import { formatTimestamp } from "@/lib/utils";

export default function Profile() {
  const params = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const { createConversation } = useMessages(currentUser?._id || null);
  
  const profileUserId = params.userId as Id<"users"> | undefined;
  const profileUser = useUserById(profileUserId || null);
  const { getUserContent } = useContent();
  
  const profileAvatarUrl = useFileUrl(profileUser.avatarUrl);
  
  const userContent = profileUserId ? getUserContent(profileUserId, 50) : null;
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "about">("content");
  const [isProcessing, setIsProcessing] = useState(false);

  const isOwnProfile = currentUser?._id === profileUserId;
  const isAdmin = currentUser?.role === "root_admin" || currentUser?.role === "admin";

  useEffect(() => {
    if (profileUser) {
      document.title = `${profileUser.name} - InThaSpotlight`;
    }
  }, [profileUser]);

  const handleFollow = async () => {
    if (!currentUser || !profileUserId) {
      toast.error("Please sign in to follow");
      navigate("/signup");
      return;
    }
    
    setIsProcessing(true);
    try {
      if (isFollowing) {
        await unfollowUser({ followerId: currentUser._id, followingId: profileUserId });
        setIsFollowing(false);
        toast.success(`Unfollowed ${profileUser?.name}`);
      } else {
        await followUser({ followerId: currentUser._id, followingId: profileUserId });
        setIsFollowing(true);
        toast.success(`Following ${profileUser?.name}!`);
      }
    } catch (error) {
      toast.error((error as Error).message || "Failed to update follow status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMessage = async () => {
    if (!currentUser || !profileUserId) {
      toast.error("Please sign in to send a message");
      navigate("/signup");
      return;
    }
    
    setIsProcessing(true);
    try {
      const conversationId = await createConversation({
        participantIds: [profileUserId],
        initiatorId: currentUser._id,
      });
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      toast.error((error as Error).message || "Failed to start conversation");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case "elite":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 rounded-full">
            <Crown className="w-3 h-3 mr-1" />
            Elite
          </Badge>
        );
      case "growth":
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 rounded-full">
            <Zap className="w-3 h-3 mr-1" />
            Growth
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-zinc-700/50 text-zinc-400 rounded-full">
            Standard
          </Badge>
        );
    }
  };

  if (!profileUserId) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Profile Not Found</h3>
        <p className="text-zinc-400 mb-6">The profile you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/")} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
          Go Home
        </Button>
      </div>
    );
  }

  if (profileUser === undefined) {
    return (
      <div className="space-y-8">
        <div className="h-64 bg-zinc-900/50 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-64 bg-zinc-900/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">User Not Found</h3>
        <p className="text-zinc-400 mb-6">This user doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/")} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <main className="container mx-auto px-6 py-6">
        {/* Profile Header */}
        <div className="relative rounded-3xl overflow-hidden mb-12">
          <div className="h-64 bg-gradient-to-r from-amber-900/30 to-orange-900/30 relative">
            {profileUser.bannerUrl && (
              <img 
                src={profileUser.bannerUrl} 
                alt="Banner" 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
          </div>
          
          <div className="relative -mt-20 px-6">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-zinc-950 shadow-2xl">
                  {profileUser.avatarUrl ? (
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={profileAvatarUrl} alt={profileUser.name} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-4xl font-bold">
                        {profileUser.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">
                        {profileUser.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                {profileUser.isFreshFace && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center border-4 border-zinc-950">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-black text-white">{profileUser.name}</h1>
                      {profileUser.isVerified && <BadgeCheck className="w-8 h-8 text-amber-500" />}
                      {getTierBadge(profileUser.tier)}
                    </div>
                    {profileUser.username && (
                      <p className="text-zinc-400">@{profileUser.username}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {profileUser.location && (
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          <span>{profileUser.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        <span>Joined {profileUser.createdAt ? new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    {isOwnProfile ? (
                      <>
                        <Button 
                          onClick={() => navigate("/settings")}
                          variant="outline" 
                          className="rounded-full border-zinc-700 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button 
                          onClick={() => navigate("/settings")}
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                        >
                          <Settings className="w-5 h-5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleMessage}
                          disabled={isProcessing}
                          variant="outline"
                          className="rounded-full border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button 
                          onClick={handleFollow}
                          disabled={isProcessing}
                          className={`rounded-full ${
                            isFollowing 
                              ? "bg-zinc-700 hover:bg-zinc-600 text-white" 
                              : "bg-amber-500 hover:bg-amber-400 text-black"
                          } font-bold`}
                        >
                          {isProcessing ? (
                            "Processing..."
                          ) : isFollowing ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Following
                            </>
                          ) : (
                            <>
                              <Users className="w-4 h-4 mr-2" />
                              Follow
                            </>
                          )}
                        </Button>
                        <Button variant="outline" className="rounded-full border-zinc-700">
                          Message
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {profileUser.bio && (
                  <p className="text-zinc-300 mb-6 max-w-2xl whitespace-pre-line">
                    {profileUser.bio}
                  </p>
                )}
                
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{profileUser.postsCount || 0}</div>
                    <div className="text-zinc-500 text-sm uppercase tracking-widest">Tracks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{profileUser.followers || 0}</div>
                    <div className="text-zinc-500 text-sm uppercase tracking-widest">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{profileUser.following || 0}</div>
                    <div className="text-zinc-500 text-sm uppercase tracking-widest">Following</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-zinc-800/50 pb-4">
          <button
            onClick={() => setActiveTab("content")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "content"
                ? "bg-amber-500/10 text-amber-500"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Music className="w-4 h-4 inline mr-2" />
            Content
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "about"
                ? "bg-amber-500/10 text-amber-500"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            About
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "content" && (
          <div>
            {userContent && userContent.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userContent.map((content: any) => (
                  <ContentCard key={content._id} content={content} />
                ))}
              </div>
            ) : (
              <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
                <CardContent className="p-12 text-center">
                  <Music className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No broadcasts yet</h3>
                  <p className="text-zinc-400 mb-6">
                    {isOwnProfile 
                      ? "Start sharing your music with the community!" 
                      : "This artist hasn't posted anything yet."}
                  </p>
                  {isOwnProfile && (
                    <Button 
                      onClick={() => navigate("/upload")}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl"
                    >
                      <PlusSquare className="w-4 h-4 mr-2" />
                      Upload Your First Track
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">About</h3>
                {profileUser.bio ? (
                  <p className="text-zinc-300 whitespace-pre-line">{profileUser.bio}</p>
                ) : (
                  <p className="text-zinc-500 italic">No bio provided.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-500">{profileUser.totalViews || 0}</p>
                    <p className="text-zinc-500 text-sm">Total Views</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-500">{profileUser.totalEngagements || 0}</p>
                    <p className="text-zinc-500 text-sm">Engagements</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-500">{profileUser.postsCount || 0}</p>
                    <p className="text-zinc-500 text-sm">Tracks</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-500">{profileUser.followers || 0}</p>
                    <p className="text-zinc-500 text-sm">Followers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
