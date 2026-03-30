"use client";

import { useState } from "react";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Play,
  MoreHorizontal,
  Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface PostCardProps {
  id: string;
  artist: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isPlaying?: boolean;
  isLiked?: boolean;
  tags?: string[];
  image?: string;
  category?: string;
}

const PostCard = ({
  id,
  artist,
  username,
  avatar,
  content,
  timestamp,
  likes,
  comments,
  shares,
  isPlaying = false,
  isLiked = false,
  tags = [],
  image,
  category}: PostCardProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);

  // Get current user ID (in real app, get from auth)
  const [userId, setUserId] = useState<string | null>(null);

  useState(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  });

  const handleLike = async () => {
    if (!userId) {
      toast.error("Please sign in to like posts");
      return;
    }

    // TODO: Implement like/unlike with Convex mutations
    try {
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      toast.success(liked ? "Removed like" : "Added like");
    } catch (error: any) {
      toast.error(error.message || "Failed to update like");
    }
  };

  const handleShare = async () => {
    // TODO: Implement share with Convex mutation
    toast.success("Post shared successfully");
  };

  return (
    <div className="group bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all duration-500">
      <div className="p-6">
        {/* Post Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <Avatar className="w-full h-full">
              <AvatarImage src={avatar} alt={artist} />
              <AvatarFallback>{artist.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white">{artist}</h3>
              <span className="text-zinc-500 text-sm">•</span>
              <span className="text-zinc-500 text-sm">{timestamp}</span>
            </div>
            {category && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs mt-1">
                <Radio size={12} className="text-amber-500" />
                <span>{category}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-amber-500">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-white mb-3">{content}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post Media */}
        {image && (
          <div className="relative rounded-xl overflow-hidden mb-4 bg-zinc-800 aspect-video">
            <img 
              src={image} 
              alt="Post media" 
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <button className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-black ml-1" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex gap-4">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-2 ${liked ? 'text-red-500' : 'text-zinc-400 hover:text-amber-500'} transition-colors`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likeCount}</span>
            </button>
            <button className="flex items-center gap-2 text-zinc-400 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{comments}</span>
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 text-zinc-400 hover:text-green-500 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm">{shares}</span>
            </button>
          </div>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-amber-500 transition-colors">
            Resonate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;