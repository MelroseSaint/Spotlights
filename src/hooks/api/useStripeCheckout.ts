import { useState } from "react";
import { Id } from "convex/_generated/dataModel";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

interface CheckoutResult {
  url?: string;
  sessionId?: string;
  error?: string;
}

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = async (
    tier: "growth" | "elite",
    userId: Id<"users">,
    userEmail: string
  ): Promise<CheckoutResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CONVEX_URL}/api/stripe/createCheckoutSession`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          userId,
          userEmail,
          successUrl: window.location.origin,
          cancelUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to create checkout session" };
      }

      return { url: data.url, sessionId: data.sessionId };
    } catch (err: any) {
      console.error("Checkout error:", err);
      return { error: err.message || "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  const verifySession = async (sessionId: string) => {
    try {
      const response = await fetch(`${CONVEX_URL}/api/stripe/verifyCheckoutSession`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to verify session" };
      }

      return data;
    } catch (err: any) {
      console.error("Verification error:", err);
      return { error: err.message || "Network error" };
    }
  };

  const redirectToCheckout = async (
    tier: "growth" | "elite",
    userId: Id<"users">,
    userEmail: string
  ) => {
    const result = await createCheckoutSession(tier, userId, userEmail);

    if (result.error) {
      setError(result.error);
      return false;
    }

    if (result.url) {
      window.location.href = result.url;
      return true;
    }

    return false;
  };

  return {
    createCheckoutSession,
    verifySession,
    redirectToCheckout,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}