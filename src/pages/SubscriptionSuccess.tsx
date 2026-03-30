"use client";

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Loader2, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

const SESSION_KEY = "spotlight_session_token";

export default function SubscriptionSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useQuery(api.backend.users.getCurrentUser, { sessionToken: sessionToken || undefined });
  const confirmSubscription = useMutation(api.backend.stripe.confirmSubscription);

  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY);
    setSessionToken(token);
  }, []);

  useEffect(() => {
    const verifyAndActivate = async () => {
      if (!sessionId || !currentUser) {
        if (!currentUser && !sessionToken) {
          setError("Please log in to continue");
        }
        setIsVerifying(false);
        return;
      }

      try {
        const result = await confirmSubscription({
          sessionId,
          userId: currentUser._id as Id<"users">,
        });
        
        setVerificationResult({
          metadata: { tier: result.tier },
          customerEmail: currentUser.email,
          ...result,
        });
      } catch (err: any) {
        setError(err.message || "Failed to activate subscription");
      } finally {
        setIsVerifying(false);
      }
    };

    if (currentUser) {
      verifyAndActivate();
    }
  }, [sessionId, currentUser, sessionToken]);

  if (isVerifying || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">Activating Subscription...</h2>
            <p className="text-zinc-400">Please wait while we activate your new tier.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="bg-zinc-900/50 border-red-500/30 rounded-3xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Please Sign In</h2>
            <p className="text-red-400 mb-6">{error || "You need to be logged in to activate your subscription."}</p>
            <Link to="/sign-up">
              <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl">
                Sign In / Sign Up
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="bg-zinc-900/50 border-red-500/30 rounded-3xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Activation Failed</h2>
            <p className="text-red-400 mb-6">{error}</p>
            <Link to="/subscriptions">
              <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl">
                Return to Subscriptions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Card className="bg-zinc-900/50 border-green-500/30 rounded-3xl max-w-md w-full mx-4">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <h2 className="text-3xl font-black text-white mb-2">Payment Successful!</h2>
          <p className="text-zinc-400 mb-6">
            Thank you for subscribing to InThaSpotlight. Your new tier has been activated.
          </p>

          {verificationResult?.metadata?.tier && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-amber-500 font-bold text-lg capitalize">
                {verificationResult.metadata.tier} Plan Activated
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link to="/subscriptions">
              <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl">
                <Zap className="w-4 h-4 mr-2" />
                View Your Subscription
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full rounded-xl border-zinc-700 text-white hover:bg-zinc-800">
                Return Home
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="text-zinc-500 text-sm mt-6">
            A confirmation email has been sent to {verificationResult?.customerEmail || "your email"}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
