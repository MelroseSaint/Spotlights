import { useState } from "react";
import { X, Zap, CreditCard, Clock, Check, AlertCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { usePromotionOptions, useContentPromotionStatus } from "../../hooks/api/usePromotions";
import { useUserLightCredz } from "../../hooks/api/useUser";

interface PromotionModalProps {
  contentId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  userTier?: string;
}

export function PromotionModal({ contentId, userId, isOpen, onClose, userTier }: PromotionModalProps) {
  const [selectedType, setSelectedType] = useState<"credits" | "paid">("credits");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const promotionOptions = usePromotionOptions(userTier);
  const promotionStatus = useContentPromotionStatus(contentId);
  const userLightCredz = useUserLightCredz(userId);
  
  const promoteWithCredits = useMutation(api.backend.promotions.promoteWithCredits);
  const promoteWithPayment = useMutation(api.backend.promotions.promoteWithPayment);
  
  if (!isOpen) return null;
  
  const handlePromote = async () => {
    if (!selectedOption) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (selectedType === "credits") {
        await promoteWithCredits({
          contentId: contentId as any,
          userId: userId as any,
          promotionKey: selectedOption,
        });
      } else {
        await promoteWithPayment({
          contentId: contentId as any,
          userId: userId as any,
          promotionKey: selectedOption,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to start promotion");
    } finally {
      setIsLoading(false);
    }
  };
  
  const currentOptions = selectedType === "credits" 
    ? promotionOptions?.creditOptions 
    : promotionOptions?.paidOptions;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="text-amber-500" />
            Promote Your Content
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} className="text-zinc-400" />
          </button>
        </div>
        
        {promotionStatus?.isPromoted && (
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/20">
            <div className="flex items-center gap-3 text-amber-500">
              <Zap size={20} />
              <div>
                <p className="font-bold">Currently Promoted</p>
                <p className="text-sm text-amber-400/80">
                  {promotionStatus.hoursRemaining.toFixed(1)} hours remaining
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6 space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => { setSelectedType("credits"); setSelectedOption(null); }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                selectedType === "credits"
                  ? "bg-amber-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              <Zap size={18} />
              LightCredz
            </button>
            <button
              onClick={() => { setSelectedType("paid"); setSelectedOption(null); }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                selectedType === "paid"
                  ? "bg-amber-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              <CreditCard size={18} />
              Direct Payment
            </button>
          </div>
          
          {selectedType === "credits" && userLightCredz && (
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
              <span className="text-zinc-400">Your Balance</span>
              <span className="text-2xl font-bold text-amber-500 flex items-center gap-2">
                <Zap size={24} />
                {userLightCredz.balance}
              </span>
            </div>
          )}
          
          {promotionOptions?.discount && promotionOptions.discount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
              <Check size={18} />
              <span className="text-sm">
                {promotionOptions.discount}% discount applied ({userTier || "Standard"} tier)
              </span>
            </div>
          )}
          
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Select Duration
            </h3>
            
            {currentOptions?.map((option: any) => {
              const isSelected = selectedOption === option.key;
              const canAfford = selectedType === "credits" 
                ? (userLightCredz?.balance || 0) >= option.discountedCredits
                : true;
              
              return (
                <button
                  key={option.key}
                  onClick={() => setSelectedOption(option.key)}
                  disabled={!canAfford}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10"
                      : canAfford
                        ? "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                        : "border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock size={20} className={isSelected ? "text-amber-500" : "text-zinc-500"} />
                      <div>
                        <p className="font-bold text-white">{option.label}</p>
                        {option.discountedCredits !== option.credits && (
                          <p className="text-xs text-zinc-500 line-through">
                            {option.credits} credits
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {selectedType === "credits" ? (
                        <span className={`text-xl font-bold ${isSelected ? "text-amber-500" : "text-white"}`}>
                          {option.discountedCredits}
                        </span>
                      ) : (
                        <span className={`text-xl font-bold ${isSelected ? "text-amber-500" : "text-white"}`}>
                          ${option.discountedPrice || option.price}
                        </span>
                      )}
                      {selectedType === "credits" && (
                        <span className="text-zinc-500 text-sm ml-1">credits</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
        
        <div className="p-6 bg-zinc-950 border-t border-white/10">
          <button
            onClick={handlePromote}
            disabled={!selectedOption || isLoading || (promotionStatus?.isPromoted && promotionStatus.isActive)}
            className={`w-full py-4 rounded-xl font-bold transition-all ${
              !selectedOption || isLoading
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-400 text-black"
            }`}
          >
            {isLoading ? "Processing..." : selectedOption ? "Start Promotion" : "Select an Option"}
          </button>
          
          <p className="text-center text-zinc-500 text-xs mt-4">
            Promotions are temporary and will expire automatically
          </p>
        </div>
      </div>
    </div>
  );
}
