"use client";

import { useEffect } from "react";
import { Radio, TrendingUp } from "lucide-react";
import { useFreshFaceFeed } from "../../hooks/api/useFeed";
import { FreshFaceCard } from "../../components/FreshFaceCard";

export default function FreshFaces() {
  const freshFaceFeed = useFreshFaceFeed(20);
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="text-purple-500 w-5 h-5" />
            <span className="text-purple-500 font-bold tracking-widest uppercase text-xs">Up & Coming</span>
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tight mb-2">
            Fresh Faces
          </h1>
          <p className="text-zinc-500">Discover the rising stars of Central PA</p>
        </div>
        
        {freshFaceFeed && freshFaceFeed.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {freshFaceFeed.map((content: any, index: number) => (
              <FreshFaceCard
                key={content._id}
                user={content.owner || {
                  _id: content.ownerId,
                  name: content.artistName,
                }}
                content={{
                  _id: content._id,
                  title: content.title,
                  thumbnailUrl: content.thumbnailUrl,
                  genre: content.genre,
                  views: content.views,
                  likes: content.likes,
                }}
                delay={index * 100}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Radio size={64} className="mx-auto text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Fresh Faces Yet</h3>
            <p className="text-zinc-500 max-w-md mx-auto">
              New artists will appear here as they start their journey. Check back soon!
            </p>
          </div>
        )}
        
        <div className="mt-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-purple-400" size={24} />
            <h2 className="text-2xl font-bold text-white">What is Fresh Face?</h2>
          </div>
          <p className="text-zinc-400 mb-4">
            Fresh Face highlights up-and-coming artists who are making their mark in Central Pennsylvania's music scene. 
            We look at engagement growth, consistency, and community impact to surface the next big names.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 rounded-xl p-4">
              <h3 className="font-bold text-white mb-2">Rising Engagement</h3>
              <p className="text-zinc-500 text-sm">Artists showing consistent growth in likes, comments, and shares</p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4">
              <h3 className="font-bold text-white mb-2">Fresh Content</h3>
              <p className="text-zinc-500 text-sm">Regular uploaders who've been active in the past two weeks</p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4">
              <h3 className="font-bold text-white mb-2">Community Impact</h3>
              <p className="text-zinc-500 text-sm">Artists building genuine connections with their audience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
