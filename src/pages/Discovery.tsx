"use client";

import { useState } from "react";
import { 
  Search,
  Music,
  Users,
  TrendingUp,
  MapPin,
  Filter,
  Radio,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentCard from "@/components/ContentCard";
import FreshFaceCard from "@/components/FreshFaceCard";
import { useFeed } from "@/hooks/api";
import { Id } from "convex/_generated/dataModel";

const GENRES = ["All", "Hip Hop", "R&B", "Trap", "Pop", "Rock", "Indie", "Jazz", "Soul", "Electronic", "Country", "Folk", "Metal", "Other"];
const REGIONS = ["All", "Dauphin County", "Lancaster County", "York County", "Cumberland County", "Lebanon County", "Adams County", "Franklin County", "Other"];

export default function Discovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [activeTab, setActiveTab] = useState("all");
  
  const { getSpotlightFeed, getFreshFaceFeed, getTrendingContent } = useFeed();
  
  const spotlightFeed = getSpotlightFeed(50);
  const freshFaceFeed = getFreshFaceFeed(20);
  const trendingContent = getTrendingContent(20, "week");

  const filterContent = (content: any) => {
    if (selectedGenre !== "All" && content.genre !== selectedGenre) return false;
    if (selectedRegion !== "All" && content.region !== selectedRegion) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        content.title.toLowerCase().includes(query) ||
        content.artistName.toLowerCase().includes(query) ||
        content.description.toLowerCase().includes(query) ||
        content.genre.toLowerCase().includes(query)
      );
    }
    return true;
  };

  const filteredFeed = spotlightFeed?.filter(filterContent) || [];
  const filteredTrending = trendingContent?.filter(filterContent) || [];

  const freshFaceUsers = freshFaceFeed?.reduce((acc: any[], content: any) => {
    if (!acc.find((u: any) => u._id === content.owner._id)) {
      acc.push(content.owner);
    }
    return acc;
  }, []) || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-amber-500 w-5 h-5" />
            <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">Discover</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight italic uppercase">
            Discover Artists
          </h2>
          <p className="text-zinc-400 mt-4 max-w-2xl text-lg leading-relaxed">
            Find the newest and most promising talents from across Central Pennsylvania.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-12 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              placeholder="Search artists, tracks, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-zinc-900/50 border-zinc-800 text-white rounded-2xl h-14 text-lg focus-visible:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-800 text-white rounded-xl">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {GENRES.map((genre) => (
                  <SelectItem key={genre} value={genre} className="text-white">
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-800 text-white rounded-xl">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {REGIONS.map((region) => (
                  <SelectItem key={region} value={region} className="text-white">
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(selectedGenre !== "All" || selectedRegion !== "All" || searchQuery) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedGenre("All");
                  setSelectedRegion("All");
                  setSearchQuery("");
                }}
                className="text-zinc-400 hover:text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900/50 rounded-2xl p-1 mb-12">
            <TabsTrigger
              value="all"
              className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold"
            >
              <Music className="w-4 h-4 mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="fresh"
              className="rounded-xl data-[state=active]:bg-purple-500 data-[state=active]:text-white font-bold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Fresh Faces
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-12">
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-zinc-400">
                {filteredFeed.length} {filteredFeed.length === 1 ? "result" : "results"} found
              </p>
            </div>

            {/* Feed Grid */}
            {filteredFeed && filteredFeed.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFeed.map((content: any) => (
                  <ContentCard key={content._id} content={content} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
                <Search className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Results Found</h3>
                <p className="text-zinc-500 max-w-md mx-auto">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-12">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400">
                {filteredTrending.length} trending {filteredTrending.length === 1 ? "track" : "tracks"}
              </p>
            </div>

            {filteredTrending && filteredTrending.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrending.map((content: any) => (
                  <ContentCard key={content._id} content={content} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
                <TrendingUp className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Trending Content</h3>
                <p className="text-zinc-500">Check back soon for trending tracks!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fresh" className="space-y-12">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400">
                {freshFaceUsers.length} fresh {freshFaceUsers.length === 1 ? "artist" : "artists"}
              </p>
            </div>

            {freshFaceUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {freshFaceUsers.map((user: any, idx: number) => (
                  <FreshFaceCard key={user._id} user={user} rank={idx + 1} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
                <Radio className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Fresh Faces Yet</h3>
                <p className="text-zinc-500">New artists will appear here as they start their journey.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
