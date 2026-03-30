"use client";

import { Check, Star, Music, BarChart3, Crown, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TierCardProps {
  tier: {
    id: string;
    name: string;
    priceDisplay: string;
    period: string;
    maxContent: number;
    feedWeightMultiplier: number;
    hasAnalytics: boolean;
    hasFeaturedBadge: boolean;
    hasVerifiedBadge: boolean;
    promotionDiscount: number;
    description: string;
    features: string[];
    popular: boolean;
  };
  isCurrentTier: boolean;
  onSelect: (tierId: string) => void;
  isLoading?: boolean;
}

const tierIcons: Record<string, any> = {
  standard: Music,
  growth: BarChart3,
  elite: Crown,
};

const tierColors: Record<string, { bg: string; border: string; icon: string }> = {
  standard: { bg: "bg-blue-500", border: "border-blue-500", icon: "text-blue-500" },
  growth: { bg: "bg-purple-500", border: "border-purple-500", icon: "text-purple-500" },
  elite: { bg: "bg-yellow-500", border: "border-yellow-500", icon: "text-yellow-500" },
};

export default function TierCard({ tier, isCurrentTier, onSelect, isLoading }: TierCardProps) {
  const IconComponent = tierIcons[tier.id] || Music;
  const colors = tierColors[tier.id] || tierColors.standard;

  return (
    <Card
      className={`relative border-2 rounded-3xl overflow-hidden transition-all hover:shadow-xl ${
        isCurrentTier
          ? "bg-zinc-900 border-amber-500 ring-2 ring-amber-500/20"
          : "bg-zinc-900/80 border-zinc-700 hover:border-zinc-600"
      } ${tier.popular ? "ring-2 ring-purple-500/30" : ""}`}
    >
      {tier.popular && !isCurrentTier && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <Badge className="bg-purple-600 text-white rounded-full px-4 py-1 text-xs font-bold flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 fill-current" />
            MOST POPULAR
          </Badge>
        </div>
      )}

      {isCurrentTier && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <Badge className="bg-amber-500 text-black rounded-full px-4 py-1 text-xs font-bold">
            CURRENT PLAN
          </Badge>
        </div>
      )}

      <CardHeader className="p-6 pt-8">
        <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center mb-4`}>
          <IconComponent className="w-7 h-7 text-white" />
        </div>

        <CardTitle className="text-2xl font-black text-zinc-100 mb-2">{tier.name}</CardTitle>
        <p className="text-zinc-400 mb-6">{tier.description}</p>

        <div className="mb-6">
          <span className="text-4xl font-black text-zinc-100">{tier.priceDisplay}</span>
          <span className="text-zinc-500 ml-1">{tier.period}</span>
        </div>

        <Button
          className={`w-full rounded-2xl font-bold ${
            isCurrentTier
              ? "bg-zinc-800 text-zinc-400 cursor-default border border-zinc-700"
              : tier.popular
                ? "bg-amber-500 hover:bg-amber-400 text-black"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700"
          }`}
          disabled={isCurrentTier || isLoading}
          onClick={() => onSelect(tier.id)}
        >
          {isCurrentTier ? (
            "Current Plan"
          ) : isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting to Checkout...
            </>
          ) : (
            <>
              Select Plan <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-zinc-300">Upload up to {tier.maxContent} tracks</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-zinc-300">
              {tier.feedWeightMultiplier}x feed weighting
            </span>
          </li>
          {tier.hasAnalytics && (
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-zinc-300">
                {tier.id === "elite" ? "Full analytics dashboard" : "Basic analytics"}
              </span>
            </li>
          )}
          {tier.hasFeaturedBadge && (
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-zinc-300">Featured badge</span>
            </li>
          )}
          {tier.hasVerifiedBadge && (
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-zinc-300">Verified badge</span>
            </li>
          )}
          {tier.promotionDiscount > 0 && (
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-zinc-300">{tier.promotionDiscount}% off promotions</span>
            </li>
          )}
          {tier.id === "growth" && (
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-zinc-300">Create events with LightCredz</span>
            </li>
          )}
          {tier.id === "elite" && (
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-zinc-300">Create up to 100 events</span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
