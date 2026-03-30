"use client";

import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Radio, TrendingUp } from "lucide-react";
import { Id } from "convex/_generated/dataModel";

interface FreshFaceCardProps {
  user: {
    _id: Id<"users">;
    name: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
    freshFaceScore?: number;
    followers?: number;
    postsCount?: number;
  };
  featuredContent?: {
    title: string;
    genre: string;
    thumbnailUrl?: string;
    mediaUrl?: string;
  };
  rank?: number;
}

export default function FreshFaceCard({ user, featuredContent, rank }: FreshFaceCardProps) {
  return (
    <Link to={`/profile/${user._id}`} className="block">
      <Card className="bg-zinc-900/50 border border-purple-500/20 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all group">
        {rank && rank <= 3 && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 flex items-center gap-2 border-b border-purple-500/20">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">
              #{rank} Rising Artist
            </span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <Avatar className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-purple-500/30">
                <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
                  {user.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <Radio className="w-3 h-3 text-white animate-pulse" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                {user.name}
              </h3>
              {user.username && (
                <p className="text-zinc-500 text-sm">@{user.username}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-[10px] rounded-full">
                  Fresh Face
                </Badge>
                {user.freshFaceScore && (
                  <span className="text-xs text-zinc-500">
                    Score: {user.freshFaceScore}
                  </span>
                )}
              </div>
            </div>
          </div>

          {user.location && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>{user.location}</span>
            </div>
          )}

          {user.bio && (
            <p className="text-zinc-400 text-sm line-clamp-2 mb-4">{user.bio}</p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-white">{user.followers || 0}</p>
                <p className="text-xs text-zinc-500">Followers</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{user.postsCount || 0}</p>
                <p className="text-xs text-zinc-500">Tracks</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl text-sm font-bold hover:bg-purple-500/30 transition-colors">
              Follow
            </button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
