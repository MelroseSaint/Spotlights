"use client";

import { useState, useEffect } from "react";
import { Flame, Zap, Clock, RefreshCw } from "lucide-react";
import { useSpotlightFeed, useTrendingContent } from "../../hooks/api/useFeed";
import { ContentCard } from "../../components/ContentCard";

export default function Pulse() {
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);
  
  const spotlightFeed = useSpotlightFeed(50, 0, userId || undefined);
  const trendingContent = useTrendingContent(10, "week");
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Flame className="text-amber-500 w-5 h-5" />
              <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">Live Updates</span>
            </div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tight">
              Spotlight Feed
            </h1>
            <p className="text-zinc-500 mt-2">
              Real-time updates from Central PA's music scene
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <RefreshCw size={20} className="text-zinc-400" />
          </button>
        </div>
        
        {spotlightFeed && spotlightFeed.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {spotlightFeed.map((content: any) => (
              <ContentCard
                key={content._id}
                content={content}
                owner={content.owner}
                currentUserId={userId || undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 mb-12 bg-zinc-900/30 rounded-2xl border border-white/5">
            <Flame size={64} className="mx-auto text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Content Yet</h3>
            <p className="text-zinc-500 max-w-md mx-auto">
              Be the first to upload! Content from Central PA artists will appear here.
            </p>
          </div>
        )}
        
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-amber-500" size={24} />
            <h2 className="text-2xl font-bold text-white">Trending This Week</h2>
          </div>
          
          {trendingContent && trendingContent.length > 0 ? (
            <div className="space-y-4">
              {trendingContent.slice(0, 5).map((content: any, index: number) => (
                <div 
                  key={content._id}
                  className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-amber-500/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="w-16 h-16 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
                    {content.thumbnailUrl ? (
                      <img src={content.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Flame size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white truncate">{content.title}</h4>
                    <p className="text-zinc-500 text-sm truncate">{content.artistName}</p>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-500 text-sm">
                    <span className="flex items-center gap-1">
                      <Zap size={14} />
                      {Math.round(content.trendingScore || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">No trending content yet</p>
          )}
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500 text-sm">
          <Clock size={16} />
          <span>Feed updates automatically. Promoted content appears first.</span>
        </div>
      </div>
    </div>
  );
}
