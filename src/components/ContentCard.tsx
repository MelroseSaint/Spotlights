"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, Play, MapPin, BadgeCheck, Zap, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUser, useLikeContent, useUnlikeContent, useShareContent, useFileUrl } from "@/hooks/api";
import { toast } from "sonner";
import { Id } from "convex/_generated/dataModel";
import { formatTimestamp, formatDuration, isExpired } from "@/lib/utils";

interface ContentCardProps {
  content: {
    _id: Id<"artistContent">;
    title: string;
    artistName: string;
    description: string;
    genre: string;
    region: string;
    contentType: string;
    mediaUrl: string;
    thumbnailUrl?: string;
    duration?: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    isPromoted?: boolean;
    promotionEndDate?: number;
    tags: string[];
    createdAt: number;
    owner: {
      _id: Id<"users">;
      name: string;
      username?: string;
      avatarUrl?: string;
      isVerified?: boolean;
      tier?: string;
    };
    weight?: number;
    isFreshFace?: boolean;
  };
  showPromotionBadge?: boolean;
}

export default function ContentCard({ content, showPromotionBadge = true }: ContentCardProps) {
  if (!content.owner?._id) {
    return null;
  }

  const { user } = useUser();
  const likeContent = useLikeContent();
  const unlikeContent = useUnlikeContent();
  const shareContent = useShareContent();
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [localLikes, setLocalLikes] = useState(content.likes);
  const [localShares, setLocalShares] = useState(content.shares);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaUrl = useFileUrl(content.mediaUrl);
  const thumbnailUrl = useFileUrl(content.thumbnailUrl);

  const isPromoted = content.isPromoted || (content.promotionEndDate && !isExpired(content.promotionEndDate));

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to like content");
      return;
    }
    try {
      if (isLiked) {
        await unlikeContent({ userId: user._id, contentId: content._id });
        setLocalLikes((prev) => prev - 1);
      } else {
        await likeContent({ userId: user._id, contentId: content._id });
        setLocalLikes((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error: any) {
      toast.error(error.message || "Failed to like content");
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to share content");
      return;
    }
    try {
      if (!isShared) {
        await shareContent({ userId: user._id, contentId: content._id, platform: "in-app" });
        setLocalShares((prev) => prev + 1);
        setIsShared(true);
        toast.success("Shared successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to share content");
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  return (
    <Link to={`/profile/${content.owner._id}`} className="block">
      <Card className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all duration-500 group">
        {isPromoted && showPromotionBadge && (
          <div className="bg-amber-500/10 px-4 py-2 flex items-center gap-2 border-b border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">Promoted</span>
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="w-12 h-12 rounded-full overflow-hidden">
              <AvatarImage src={content.owner.avatarUrl || ""} alt={content.owner.name} />
              <AvatarFallback className="bg-zinc-800 text-zinc-400">
                {content.owner.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white truncate">{content.owner.name}</h3>
                {content.owner.isVerified && <BadgeCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                {content.isFreshFace && (
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-[10px] rounded-full">
                    Fresh Face
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span>{content.region}</span>
                        <span>•</span>
                        <span>{formatTimestamp(content.createdAt)}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>

          <div className="relative rounded-xl overflow-hidden mb-4 bg-zinc-800 aspect-video flex items-center justify-center group/play">
            {content.contentType === "video" && mediaUrl ? (
              <video
                src={mediaUrl}
                muted
                autoPlay
                loop
                playsInline
                className={`w-full h-full object-cover transition-all ${isPlaying ? "scale-105" : ""}`}
                onClick={() => setIsPlaying(!isPlaying)}
              />
            ) : thumbnailUrl || mediaUrl ? (
              <img
                src={thumbnailUrl || mediaUrl || ""}
                alt={content.title}
                className={`w-full h-full object-cover transition-all ${isPlaying ? "scale-105" : ""}`}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                {content.contentType === "audio" ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                      <Play className="w-8 h-8 text-amber-500" />
                    </div>
                    {content.duration && (
                      <span className="text-zinc-500 text-sm">{formatDuration(content.duration)}</span>
                    )}
                  </div>
                ) : (
                  <Play className="w-12 h-12 text-zinc-600" />
                )}
              </div>
            )}
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/play:opacity-100 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
              </div>
            </button>
          </div>

          <div className="mb-3">
            <h3 className="text-lg font-bold text-white mb-1">{content.title}</h3>
            <p className="text-zinc-400 text-sm line-clamp-2">{content.description}</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-xs rounded-full">
              {content.genre}
            </Badge>
            {content.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  isLiked ? "text-red-500" : "text-zinc-400 hover:text-red-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span>{localLikes}</span>
              </button>
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <MessageCircle className="w-5 h-5" />
                <span>{content.comments}</span>
              </div>
              <button
                onClick={handleShare}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  isShared ? "text-amber-500" : "text-zinc-400 hover:text-amber-500"
                }`}
              >
                <Share2 className={`w-5 h-5 ${isShared ? "fill-current" : ""}`} />
                <span>{localShares}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
              <Play className="w-4 h-4" />
              <span>{content.views}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
