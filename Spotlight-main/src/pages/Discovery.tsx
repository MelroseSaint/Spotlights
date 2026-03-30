"use client";

import { useState, useEffect } from "react";
import { Search, Grid, List, Filter } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ContentCard } from "../../components/ContentCard";
import { useSpotlightFeed, useTrendingContent } from "../../hooks/api/useFeed";
import { CONTENT_REQUIREMENTS } from "../../../convex/constants";

export default function Discovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "trending">("all");
  
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);
  
  const spotlightFeed = useSpotlightFeed(50);
  const trendingContent = useTrendingContent(20, "week");
  const searchResults = useQuery(api.backend.content.searchContent, { 
    query: searchQuery, 
    limit: 50 
  });
  
  const filteredContent = (() => {
    let content = activeTab === "trending" ? (trendingContent || []) : (spotlightFeed || []);
    
    if (searchQuery && searchResults) {
      content = searchResults;
    }
    
    if (selectedGenre) {
      content = content.filter((c: any) => c.genre === selectedGenre);
    }
    
    if (selectedRegion) {
      content = content.filter((c: any) => c.region === selectedRegion);
    }
    
    return content;
  })();
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tight mb-2">
            Discover Artists
          </h1>
          <p className="text-zinc-500">Find new music from Central PA's finest artists</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists, tracks, genres..."
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Genres</option>
              {CONTENT_REQUIREMENTS.ALLOWED_GENRES.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
            
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Regions</option>
              {CONTENT_REQUIREMENTS.ALLOWED_REGIONS.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            
            <div className="flex border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 ${viewMode === "grid" ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400"}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 ${viewMode === "list" ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400"}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => { setActiveTab("all"); setSelectedGenre(""); setSelectedRegion(""); }}
            className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
              activeTab === "all" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            All Content
          </button>
          <button
            onClick={() => setActiveTab("trending")}
            className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
              activeTab === "trending" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Trending This Week
          </button>
        </div>
        
        {filteredContent.length === 0 ? (
          <div className="text-center py-20">
            <Search size={64} className="mx-auto text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No content found</h3>
            <p className="text-zinc-500">Try adjusting your filters or search query</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.map((content: any) => (
              <ContentCard
                key={content._id}
                content={content}
                owner={content.owner}
                currentUserId={userId || undefined}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContent.map((content: any) => (
              <div key={content._id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex gap-4">
                <div className="w-24 h-24 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
                  {content.thumbnailUrl ? (
                    <img src={content.thumbnailUrl} alt={content.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <Search size={32} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{content.title}</h3>
                  <p className="text-zinc-500 text-sm">{content.artistName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                    <span className="px-2 py-0.5 bg-zinc-800 rounded">{content.genre}</span>
                    <span>{content.views?.toLocaleString() || 0} views</span>
                    <span>{content.likes?.toLocaleString() || 0} likes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
