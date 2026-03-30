import { Link } from "react-router-dom";
import { BadgeCheck, Radio, TrendingUp } from "lucide-react";

interface FreshFaceCardProps {
  user: {
    _id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    freshFaceScore?: number;
  };
  content?: {
    _id: string;
    title: string;
    thumbnailUrl?: string;
    genre: string;
    views?: number;
    likes?: number;
  };
  delay?: number;
}

export function FreshFaceCard({ user, content, delay = 0 }: FreshFaceCardProps) {
  const formatScore = (score: number) => {
    if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
    return score.toString();
  };
  
  return (
    <Link 
      to={`/profile/${user._id}`}
      className="group block bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all hover:scale-[1.02]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {content?.thumbnailUrl ? (
          <img 
            src={content.thumbnailUrl} 
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center">
            <Radio size={48} className="text-amber-500/50" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/90 text-white rounded-full text-xs font-bold">
            <Radio size={12} />
            FRESH FACE
          </div>
        </div>
        
        {user.freshFaceScore !== undefined && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm text-white rounded-full text-xs font-bold">
            <TrendingUp size={12} className="text-green-400" />
            {formatScore(user.freshFaceScore)} pts
          </div>
        )}
        
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-amber-500 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-amber-500 font-bold text-lg">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white">{user.name}</span>
                <BadgeCheck size={14} className="text-amber-500" />
              </div>
              {content && (
                <p className="text-zinc-400 text-xs">{content.title}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {content && (
        <div className="p-4">
          <h3 className="font-bold text-white mb-2 truncate">{content.title}</h3>
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">{content.genre}</span>
            <span>{content.views?.toLocaleString() || 0} views</span>
            <span>{content.likes?.toLocaleString() || 0} likes</span>
          </div>
        </div>
      )}
      
      {user.bio && (
        <div className="px-4 pb-4">
          <p className="text-zinc-500 text-sm line-clamp-2">{user.bio}</p>
        </div>
      )}
    </Link>
  );
}
