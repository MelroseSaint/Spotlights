"use client";

import { useState, useEffect } from "react";
import { Crown, Zap, Check, AlertCircle, Sparkles } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TIERS } from "../../../convex/constants";
import { TierCard } from "../../components/TierCard";
import { useSubscriptionTiers, useUserSubscription, useUpgradeTier, useCancelSubscription } from "../../hooks/api/useSubscriptions";

export default function Subscriptions() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);
  
  const tiers = useSubscriptionTiers();
  const userSub = useUserSubscription(userId || "");
  const upgradeTier = useUpgradeTier();
  const cancelSubscription = useCancelSubscription();
  
  const handleUpgrade = async (tierId: string) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await upgradeTier({ userId: userId as any, newTier: tierId, duration: 1 });
    } catch (error) {
      console.error("Upgrade failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await cancelSubscription({ userId: userId as any });
    } catch (error) {
      console.error("Cancel failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!userId) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <AlertCircle size={64} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
        <p className="text-zinc-500">Please sign in to view subscription options</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tight mb-4">
          Choose Your Plan
        </h1>
        <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
          Unlock premium features and take your music career to the next level
        </p>
      </div>
      
      {userSub && (
        <div className="mb-12 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  userSub.tier === "elite" ? "bg-purple-500/20 text-purple-400" :
                  userSub.tier === "growth" ? "bg-amber-500/20 text-amber-500" :
                  "bg-zinc-700/50 text-zinc-400"
                }`}>
                  {userSub.tier === "elite" ? <Crown size={20} /> :
                   userSub.tier === "growth" ? <Zap size={20} /> :
                   <Sparkles size={20} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Current Plan: {TIERS[userSub.tier as keyof typeof TIERS]?.name || "Standard"}
                  </h3>
                  <p className={`text-sm ${userSub.isActive ? "text-green-400" : "text-red-400"}`}>
                    {userSub.isActive ? "Active" : "Inactive"}
                    {userSub.endDate && ` - Expires ${new Date(userSub.endDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-zinc-500">Content Used</p>
                <p className="text-lg font-bold text-white">
                  {userSub.activeContentCount} / {userSub.maxContentAllowed}
                </p>
              </div>
              <button
                onClick={handleCancel}
                disabled={isLoading || userSub.tier === "standard"}
                className="px-4 py-2 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.values(TIERS).map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isCurrentTier={userSub?.tier === tier.id}
            onSelect={() => handleUpgrade(tier.id)}
            isLoading={isLoading}
          />
        ))}
      </div>
      
      <div className="mt-16 bg-zinc-900/50 border border-white/10 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-white mb-2">Can I change my subscription tier?</h3>
            <p className="text-zinc-400">Yes! You can upgrade or downgrade your subscription at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the end of your current billing period.</p>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-2">What happens to my content if I downgrade?</h3>
            <p className="text-zinc-400">Your existing content is never deleted. However, if you're over the upload limit of your new tier, you won't be able to upload new content until you delete some or upgrade again.</p>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-2">What payment methods do you accept?</h3>
            <p className="text-zinc-400">We accept all major credit cards including Visa, Mastercard, American Express, and Discover. Payment processing is handled securely through our platform.</p>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-2">How do promotions work?</h3>
            <p className="text-zinc-400">You can promote your content using LightCredz (earned through engagement) or direct payment. Promotions are temporary boosts that increase visibility in the feed for a set duration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
