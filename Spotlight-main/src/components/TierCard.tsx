import { Check, X, Sparkles, Crown, Zap } from "lucide-react";

interface TierCardProps {
  tier: {
    id: string;
    name: string;
    price: number;
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
  isCurrentTier?: boolean;
  onSelect?: () => void;
  isLoading?: boolean;
}

export function TierCard({ tier, isCurrentTier, onSelect, isLoading }: TierCardProps) {
  const icons = {
    standard: <Sparkles size={24} />,
    growth: <Zap size={24} />,
    elite: <Crown size={24} />,
  };
  
  const colors = {
    standard: "from-zinc-700 to-zinc-800",
    growth: "from-amber-600/20 to-amber-700/20",
    elite: "from-purple-600/20 to-purple-700/20",
  };
  
  return (
    <div className={`relative bg-gradient-to-br ${colors[tier.id as keyof typeof colors]} border border-white/10 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] ${tier.popular ? "ring-2 ring-amber-500" : ""}`}>
      {tier.popular && (
        <div className="absolute top-0 left-0 right-0 bg-amber-500 text-black text-center py-2 text-sm font-bold">
          MOST POPULAR
        </div>
      )}
      
      {isCurrentTier && (
        <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          CURRENT PLAN
        </div>
      )}
      
      <div className={`p-8 ${tier.popular ? "pt-14" : ""}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            tier.id === "elite" ? "bg-purple-500/20 text-purple-400" :
            tier.id === "growth" ? "bg-amber-500/20 text-amber-500" :
            "bg-zinc-600/20 text-zinc-400"
          }`}>
            {icons[tier.id as keyof typeof icons]}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
            <p className="text-zinc-500 text-sm">{tier.period}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <span className="text-5xl font-black text-white">{tier.priceDisplay}</span>
          {tier.price > 0 && <span className="text-zinc-500 ml-2">/month</span>}
        </div>
        
        <p className="text-zinc-400 mb-6">{tier.description}</p>
        
        <ul className="space-y-3 mb-8">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">{feature}</span>
            </li>
          ))}
          
          <li className="flex items-start gap-3">
            <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-zinc-300">Upload up to {tier.maxContent} content items</span>
          </li>
          
          {tier.promotionDiscount > 0 && (
            <li className="flex items-start gap-3">
              <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">{tier.promotionDiscount}% off all promotions</span>
            </li>
          )}
          
          {!tier.hasAnalytics && (
            <li className="flex items-start gap-3 opacity-50">
              <X size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-500">No analytics dashboard</span>
            </li>
          )}
        </ul>
        
        <button
          onClick={onSelect}
          disabled={isCurrentTier || isLoading}
          className={`w-full py-4 rounded-xl font-bold transition-all ${
            isCurrentTier
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : tier.popular
                ? "bg-amber-500 hover:bg-amber-400 text-black"
                : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {isLoading ? "Processing..." : isCurrentTier ? "Current Plan" : `Choose ${tier.name}`}
        </button>
      </div>
    </div>
  );
}
