import { useState } from "react";
import { Play, Pause, Heart, MessageCircle, Share2, MoreHorizontal, Zap, BadgeCheck, TrendingUp } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ContentCardProps {
  content: {
    _id: string;
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
    engagementScore?: number;
    createdAt: Date;
  };
  owner?: {
    _id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    isVerified?: boolean;
    tier?: string;
  };
  currentUserId?: string;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  showActions?: boolean;
  showOwner?: boolean;
}

export function ContentCard({
  content,
  owner,
  currentUserId,
  onLike,
  onComment,
  onShare,
  showActions = true,
  showOwner = true,
}: ContentCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const likeContent = useMutation(api.backend.content.likeContent);
  const unlikeContent = useMutation(api.backend.content.unlikeContent);
  
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;
    
    try {
      if (isLiked) {
        await unlikeContent({ userId: currentUserId as any, contentId: content._id as any });
        setIsLiked(false);
      } else {
        await likeContent({ userId: currentUserId as any, contentId: content._id as any });
        setIsLiked(true);
      }
      onLike?.();
    } catch (error) {
      console.error("Error liking content:", error);
    }
  };
  
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };
  
  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all group">
      <div className="relative aspect-square bg-zinc-800">
        {content.thumbnailUrl ? (
          <img 
            src={content.thumbnailUrl} 
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
              {content.contentType === "audio" ? (
                <TrendingUp className="w-10 h-10 text-amber-500" />
              ) : (
                <Play className="w-10 h-10 text-amber-500" />
              )}
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
        
        {content.isPromoted && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold">
            <Zap size={12} />
            PROMOTED
          </div>
        )}
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center transition-all shadow-lg hover:scale-105"
        >
          {isPlaying ? (
            <Pause size={24} className="text-black" fill="black" />
          ) : (
            <Play size={24} className="text-black ml-1" fill="black" />
          )}
        </button>
        
        {content.duration && (
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono">
            {formatDuration(content.duration)}
          </div>
        )}
      </div>
      
      <div className="p-4">
        {showOwner && owner && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
              {owner.avatarUrl ? (
                <img src={owner.avatarUrl} alt={owner.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">
                  {owner.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white truncate">{owner.name}</span>
                {owner.isVerified && <BadgeCheck size={14} className="text-amber-500 flex-shrink-0" />}
              </div>
              <span className="text-zinc-500 text-xs">{owner.tier || "Standard"} Artist</span>
            </div>
          </div>
        )}
        
        <h3 className="text-lg font-bold text-white mb-1 truncate">{content.title}</h3>
        
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
          <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">{content.genre}</span>
          <span>{content.region}</span>
        </div>
        
        <p className="text-zinc-500 text-sm line-clamp-2 mb-4">{content.description}</p>
        
        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${isLiked ? "text-red-500" : ""}`}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              <span className="text-sm">{formatViews(content.likes)}</span>
            </button>
            
            <button 
              onClick={onComment}
              className="flex items-center gap-1.5 hover:text-amber-500 transition-colors"
            >
              <MessageCircle size={18} />
              <span className="text-sm">{formatViews(content.comments)}</span>
            </button>
            
            <button 
              onClick={onShare}
              className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"
            >
              <Share2 size={18} />
              <span className="text-sm">{formatViews(content.shares)}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{formatViews(content.views)} views</span>
            <button className="p-1 hover:bg-zinc-800 rounded transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
