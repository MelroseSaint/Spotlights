"use client";

import { Link } from "react-router-dom";
import { Crown, MapPin, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useHottestArtists } from "@/hooks/api";

export default function HottestSection() {
  const hottestArtists = useHottestArtists(10);

  if (!hottestArtists || hottestArtists.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-b from-zinc-900 to-zinc-950">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Crown className="w-6 h-6 text-amber-500" />
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">
            Hottest in the <span className="text-amber-500">City</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {hottestArtists.map((item: any, index: number) => {
            if (!item?.artist?._id) return null;
            return (
              <Link key={item.artist._id} to={`/profile/${item.artist._id}`}>
                <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 hover:scale-105 group">
                  <div className="relative">
                    <div className="absolute top-2 left-2 z-10 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-black text-sm">#{index + 1}</span>
                    </div>
                    <div className="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center overflow-hidden">
                      <Avatar className="w-full h-full rounded-none">
                        <AvatarImage
                          src={item.artist?.avatarUrl}
                          alt={item.artist?.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-4xl font-bold flex items-center justify-center">
                          {item.artist?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <h3 className="font-bold text-white truncate text-sm">
                        {item.artist?.name}
                      </h3>
                      {item.artist?.isVerified && (
                        <BadgeCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    {item.artist?.location && (
                      <div className="flex items-center gap-1 text-zinc-500 text-xs">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{item.artist?.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-zinc-400 text-xs">
                        {item.artist?.followers || 0} followers
                      </span>
                      {item.artist?.tier === "elite" && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded-full uppercase">
                          Elite
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
