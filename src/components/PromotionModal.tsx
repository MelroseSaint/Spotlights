"use client";

import { useState } from "react";
import { Zap, CreditCard, Clock, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, usePromoteWithCredits, usePromoteWithPayment, usePromotions } from "@/hooks/api";
import { toast } from "sonner";
import { Id } from "convex/_generated/dataModel";

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: Id<"artistContent">;
  contentTitle: string;
}

export default function PromotionModal({ isOpen, onClose, contentId, contentTitle }: PromotionModalProps) {
  const { user, lightCredz } = useUser();
  const { getAllPromotionOptions } = usePromotions();
  const promoteWithCredits = usePromoteWithCredits();
  const promoteWithPayment = usePromoteWithPayment();
  const [selectedCreditsOption, setSelectedCreditsOption] = useState<string | null>(null);
  const [selectedPaidOption, setSelectedPaidOption] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  const promotions = getAllPromotionOptions(user?.tier);
  const creditBalance = lightCredz?.balance ?? 0;

  const handlePromoteWithCredits = async () => {
    if (!user || !selectedCreditsOption) return;
    if (creditBalance < (promotions?.creditOptions.find(o => o.key === selectedCreditsOption)?.discountedCredits ?? 0)) {
      toast.error("Insufficient LightCredz balance");
      return;
    }
    setIsPromoting(true);
    try {
      await promoteWithCredits({ contentId, userId: user._id, promotionKey: selectedCreditsOption });
      toast.success("Content promoted successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to promote content");
    } finally {
      setIsPromoting(false);
    }
  };

  const handlePromoteWithPayment = async () => {
    if (!user || !selectedPaidOption) return;
    setIsPromoting(true);
    try {
      await promoteWithPayment({ contentId, userId: user._id, promotionKey: selectedPaidOption });
      toast.success("Content promoted successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to promote content");
    } finally {
      setIsPromoting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 rounded-3xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            Promote Content
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Boost "{contentTitle}" to reach more listeners in the 717
          </DialogDescription>
        </DialogHeader>

        <div className="bg-zinc-800/50 rounded-2xl p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-zinc-300">LightCredz Balance</span>
          </div>
          <span className="text-2xl font-black text-amber-500">{creditBalance}</span>
        </div>

        {promotions && promotions.discount > 0 && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 rounded-full mb-4">
            {promotions.discount}% Promotion Discount Applied
          </Badge>
        )}

        <Tabs defaultValue="credits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800 rounded-xl p-1">
            <TabsTrigger value="credits" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <Zap className="w-4 h-4 mr-2" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="paid" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credits" className="mt-4 space-y-3">
            {promotions?.creditOptions.map((option) => {
              const canAfford = creditBalance >= option.discountedCredits;
              return (
                <Card
                  key={option.key}
                  className={`cursor-pointer transition-all ${
                    selectedCreditsOption === option.key
                      ? "border-amber-500 ring-2 ring-amber-500/20"
                      : "border-zinc-700 hover:border-zinc-600"
                  } ${!canAfford ? "opacity-50" : ""}`}
                  onClick={() => canAfford && setSelectedCreditsOption(option.key)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="font-bold text-white">{option.label}</p>
                        <p className="text-sm text-zinc-400">{option.hours} hours of boosted visibility</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-amber-500">{option.discountedCredits}</p>
                      {promotions.discount > 0 && (
                        <p className="text-xs text-zinc-500 line-through">{option.credits}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Button
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl mt-4"
              disabled={!selectedCreditsOption || isPromoting}
              onClick={handlePromoteWithCredits}
            >
              {isPromoting ? "Promoting..." : `Promote with ${promotions?.creditOptions.find(o => o.key === selectedCreditsOption)?.discountedCredits ?? 0} LightCredz`}
            </Button>
          </TabsContent>

          <TabsContent value="paid" className="mt-4 space-y-3">
            {promotions?.paidOptions.map((option) => {
              const isSelected = selectedPaidOption === option.key;
              return (
                <Card
                  key={option.key}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "border-amber-500 ring-2 ring-amber-500/20"
                      : "border-zinc-700 hover:border-zinc-600"
                  }`}
                  onClick={() => setSelectedPaidOption(option.key)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="font-bold text-white">{option.label}</p>
                        <p className="text-sm text-zinc-400">{option.hours / 24} days of boosted visibility</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-amber-500">${option.discountedPrice.toFixed(2)}</p>
                      {promotions.discount > 0 && (
                        <p className="text-xs text-zinc-500 line-through">${option.price.toFixed(2)}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Button
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl mt-4"
              disabled={!selectedPaidOption || isPromoting}
              onClick={handlePromoteWithPayment}
            >
              {isPromoting ? "Processing..." : `Pay $${promotions?.paidOptions.find(o => o.key === selectedPaidOption)?.discountedPrice.toFixed(2) ?? "0.00"}`}
            </Button>
          </TabsContent>
        </Tabs>

        <Button variant="ghost" onClick={onClose} className="mt-4 text-zinc-400 hover:text-white">
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
