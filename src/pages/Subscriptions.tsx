"use client";

import { useState } from "react";
import { 
  Star, 
  Zap, 
  Check, 
  ArrowRight,
  AlertCircle,
  CreditCard,
  TrendingUp,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import TierCard from "@/components/TierCard";
import { useUser, useSubscriptions, useStripeCheckout } from "@/hooks/api";
import { toast } from "sonner";

export default function Subscriptions() {
  const { user } = useUser();
  const { getSubscriptionTiers, getUserSubscription } = useSubscriptions();
  const { redirectToCheckout, isLoading: isCheckingOut } = useStripeCheckout();
  
  const tiers = getSubscriptionTiers();
  const subscription = getUserSubscription(user?._id || null);
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);

  const handleSelectPlan = async (tierId: string) => {
    if (!user) {
      toast.error("Please sign in to upgrade your subscription");
      return;
    }
    
    if (tierId === user.tier) {
      toast.info("You're already on this plan");
      return;
    }

    if (tierId === "standard") {
      toast.info("Standard plan is free! No checkout needed.");
      return;
    }

    setCheckoutTier(tierId);
    const success = await redirectToCheckout(tierId as "growth" | "elite", user._id, user.email);
    
    if (!success) {
      setCheckoutTier(null);
      toast.error("Failed to start checkout. Please try again.");
    }
  };

  const currentTier = tiers?.find(t => t.id === user?.tier);
  const usagePercent = subscription?.maxContentAllowed 
    ? ((subscription.activeContentCount / subscription.maxContentAllowed) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Zap className="text-amber-500 w-5 h-5" />
          <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">Premium</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight italic uppercase">
          Subscription Tiers
        </h1>
        <p className="text-zinc-400 mt-4 max-w-2xl text-lg leading-relaxed">
          Elevate your artistry with premium features designed for growth
        </p>
      </div>

      {/* Current Subscription */}
      {user && subscription && (
        <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/20 rounded-full">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100">
                    Current Plan: {currentTier?.name || "Standard"}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className={`rounded-full ${
                      subscription.isActive 
                        ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                        : "bg-zinc-700/50 text-zinc-300 border border-zinc-600"
                    }`}
                  >
                    {subscription.isActive ? "Active" : subscription.status}
                  </Badge>
                </div>
                {subscription.endDate && (
                  <p className="text-zinc-500">
                    {subscription.status === "active" 
                      ? `Next billing date: ${new Date(subscription.endDate).toLocaleDateString()}`
                      : `Subscription ended: ${new Date(subscription.endDate).toLocaleDateString()}`
                    }
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {subscription.canUpgrade && (
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-amber-500/50 text-amber-500 hover:bg-amber-500/20 bg-transparent"
                    onClick={() => handleSelectPlan("elite")}
                  >
                    Upgrade
                  </Button>
                )}
                {subscription.canDowngrade && user.tier !== "standard" && (
                  <Button variant="outline" className="rounded-xl border-zinc-600 text-zinc-300 bg-transparent">
                    Downgrade
                  </Button>
                )}
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="flex justify-between mb-2">
                <span className="text-zinc-400">Content uploads used</span>
                <span className="font-bold text-zinc-100">
                  {subscription.activeContentCount}{subscription.isAdmin ? "/Unlimited" : `/${subscription.maxContentAllowed}`}
                </span>
              </div>
              {!subscription.isAdmin && (
                <Progress 
                  value={usagePercent} 
                  className="h-2 bg-zinc-800 [&>div]:bg-amber-500"
                />
              )}
              {usagePercent >= 80 && !subscription.isAdmin && (
                <p className="text-amber-400 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Approaching upload limit. Consider upgrading for more uploads.
                </p>
              )}
            </div>

            {currentTier && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-zinc-400 text-sm mb-2">Your benefits:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-amber-500/50 text-amber-400 rounded-full bg-amber-500/10">
                    {subscription.isAdmin ? "Unlimited uploads" : `${currentTier.maxContent} uploads`}
                  </Badge>
                  {currentTier.hasAnalytics && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-400 rounded-full bg-amber-500/10">
                      Analytics
                    </Badge>
                  )}
                  {currentTier.hasFeaturedBadge && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-400 rounded-full bg-amber-500/10">
                      Featured Badge
                    </Badge>
                  )}
                  {currentTier.hasVerifiedBadge && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-400 rounded-full bg-amber-500/10">
                      Verified Badge
                    </Badge>
                  )}
                  {currentTier.promotionDiscount > 0 && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-400 rounded-full bg-amber-500/10">
                      {currentTier.promotionDiscount}% off promotions
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tier Cards */}
      {tiers && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              isCurrentTier={user?.tier === tier.id}
              onSelect={handleSelectPlan}
              isLoading={checkoutTier === tier.id && isCheckingOut}
            />
          ))}
        </div>
      )}

      {/* FAQ Section */}
      <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-white mb-2">Can I change my subscription tier?</h3>
              <p className="text-zinc-400">
                Yes, you can upgrade or downgrade your subscription at any time. Changes take effect immediately and billing will be prorated.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-zinc-400">
                We accept all major credit cards including Visa, Mastercard, American Express, and Discover. Payment processing is handled securely.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">How does the promotion discount work?</h3>
              <p className="text-zinc-400">
                Growth tier members get 15% off all promotions, and Elite tier members get 25% off. Discounts are automatically applied when promoting content.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">What are LightCredz?</h3>
              <p className="text-zinc-400">
                LightCredz are earned by engaging with the community (comments, shares, likes, event check-ins) and can be spent to promote your content or create events.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">How do I create events?</h3>
              <p className="text-zinc-400">
                <strong>Growth tier:</strong> Create events using LightCredz (minimum 50 credits). <br />
                <strong>Elite tier:</strong> Create up to 100 events. <br />
                <strong>Standard tier:</strong> Event creation is not available.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">How does feed visibility work?</h3>
              <p className="text-zinc-400">
                Content visibility is based on engagement, freshness, and tier. We enforce fairness controls so higher tiers don't dominate lower tiers' visibility. Everyone gets a fair shot at being seen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA for non-signed-in users */}
      {!user && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 rounded-3xl">
          <CardContent className="p-8 text-center">
            <Star className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Ready to Get Started?</h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Create your free account today and start sharing your music with Central Pennsylvania.
            </p>
            <Button className="bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl">
              Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
