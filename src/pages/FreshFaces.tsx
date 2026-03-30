"use client";

import { useState } from "react";
import { Radio, TrendingUp, Users, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ContentCard from "@/components/ContentCard";
import FreshFaceCard from "@/components/FreshFaceCard";
import { useFeed } from "@/hooks/api";

const GENRES = ["All", "Hip Hop", "R&B", "Trap", "Pop", "Rock", "Indie", "Jazz", "Soul", "Electronic", "Country", "Folk", "Metal", "Other"];
const REGIONS = ["All", "Dauphin County", "Lancaster County", "York County", "Cumberland County", "Lebanon County", "Adams County", "Franklin County", "Other"];

export default function FreshFaces() {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");
  
  const { getFreshFaceFeed, getSpotlightFeed } = useFeed();
  const freshFaceFeed = getFreshFaceFeed(50);
  const allFeed = getSpotlightFeed(100);

  const filterContent = (content: any) => {
    if (!content.isFreshFace && !content.owner?.isFreshFace) return false;
    if (selectedGenre !== "All" && content.genre !== selectedGenre) return false;
    if (selectedRegion !== "All" && content.region !== selectedRegion) return false;
    return true;
  };

  const filteredFreshFaces = freshFaceFeed?.filter(filterContent) || [];
  
  const freshFaceUsers = freshFaceFeed?.reduce((acc: any[], content: any) => {
    if (content.owner && !acc.find((u: any) => u._id === content.owner._id)) {
      acc.push({
        ...content.owner,
        latestContent: content
      });
    }
    return acc;
  }, []) || [];

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="text-purple-500 w-5 h-5" />
            <span className="text-purple-500 font-bold tracking-widest uppercase text-xs">Up & Coming</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tight mb-2">
            Fresh Faces
          </h1>
          <p className="text-zinc-500 max-w-2xl">
            Discover the rising stars of Central Pennsylvania. Fresh Face highlights up-and-coming artists who are making their mark in the 717.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
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
        </div>

        {/* Fresh Faces Cards */}
        {freshFaceUsers.length > 0 ? (
          <>
            {/* Top Rising Artists */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-purple-400 w-5 h-5" />
                <h2 className="text-2xl font-bold text-white">Top Rising Artists</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {freshFaceUsers.slice(0, 4).map((user: any, idx: number) => (
                  <FreshFaceCard key={user._id} user={user} rank={idx + 1} />
                ))}
              </div>
            </div>

            {/* All Fresh Face Content */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Radio className="text-purple-400 w-5 h-5" />
                <h2 className="text-2xl font-bold text-white">Latest from Fresh Faces</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFreshFaces.map((content: any) => (
                  <ContentCard key={content._id} content={content} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
            <Radio size={64} className="mx-auto text-zinc-700 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Fresh Faces Yet</h3>
            <p className="text-zinc-500 max-w-md mx-auto">
              New artists will appear here as they start their journey and earn their Fresh Face status.
            </p>
          </div>
        )}

        {/* What is Fresh Face */}
        <div className="mt-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-purple-400" size={24} />
            <h2 className="text-2xl font-bold text-white">What is Fresh Face?</h2>
          </div>
          <p className="text-zinc-400 mb-4">
            Fresh Face highlights up-and-coming artists who are making their mark in Central Pennsylvania's music scene. 
            Artists earn Fresh Face status by consistently uploading content, engaging with the community, and receiving positive feedback.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-zinc-900/50 rounded-xl p-4">
              <Users className="w-6 h-6 text-purple-400 mb-2" />
              <h3 className="font-bold text-white mb-1">Build Your Following</h3>
              <p className="text-zinc-500 text-sm">Fresh Faces get featured prominently in the feed</p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4">
              <Radio className="w-6 h-6 text-purple-400 mb-2" />
              <h3 className="font-bold text-white mb-1">Earn Recognition</h3>
              <p className="text-zinc-500 text-sm">Stand out as an emerging artist in the 717</p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4">
              <Sparkles className="w-6 h-6 text-purple-400 mb-2" />
              <h3 className="font-bold text-white mb-1">Grow Your Score</h3>
              <p className="text-zinc-500 text-sm">Higher Fresh Face scores = more visibility</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
