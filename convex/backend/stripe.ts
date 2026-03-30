import { httpAction, mutation } from "../_generated/server";
import Stripe from "stripe";
import { Id } from "convex/values";
import { v } from "convex/values";

const stripeApiKey = process.env.STRIPE_SECRET_KEY;
if (!stripeApiKey) {
  console.warn("STRIPE_SECRET_KEY not configured. Stripe features will not work.");
}

const stripe = stripeApiKey 
  ? new Stripe(stripeApiKey, { apiVersion: "2025-02-24.acacia" })
  : null;

const TIERS_CONFIG = {
  growth: {
    name: "Growth Plan",
    description: "Upload up to 50 tracks, basic analytics, featured badge, 15% promo discount",
    priceInCents: 1000,
    interval: "month" as const,
  },
  elite: {
    name: "Elite Plan",
    description: "Upload up to 500 tracks, full analytics, verified badge, 25% promo discount",
    priceInCents: 2500,
    interval: "month" as const,
  },
};

export const createCheckoutSession = httpAction(async (ctx, request: Request) => {
  if (!stripe) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { tier, userId, userEmail, successUrl, cancelUrl } = body;

    if (!tier || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tierConfig = TIERS_CONFIG[tier as keyof typeof TIERS_CONFIG];
    if (!tierConfig) {
      return new Response(JSON.stringify({ error: "Invalid tier" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const baseUrl = successUrl || process.env.APP_URL || "http://localhost:5173";
    const cancelBaseUrl = cancelUrl || baseUrl;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tierConfig.name,
              description: tierConfig.description,
            },
            unit_amount: tierConfig.priceInCents,
            recurring: {
              interval: tierConfig.interval,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        tier,
      },
      success_url: `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancelBaseUrl}/subscriptions?cancelled=true`,
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return new Response(JSON.stringify({ error: error.message || "Checkout failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const verifyCheckoutSession = httpAction(async (ctx, request: Request) => {
  if (!stripe) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return new Response(
      JSON.stringify({
        status: session.payment_status,
        customerEmail: session.customer_email,
        subscriptionStatus: session.subscription as string | undefined,
        metadata: session.metadata,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Stripe verification error:", error);
    return new Response(JSON.stringify({ error: error.message || "Verification failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const createCustomerPortalSession = httpAction(async (ctx, request: Request) => {
  if (!stripe) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return new Response(JSON.stringify({ error: "Missing customer ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const baseUrl = process.env.APP_URL || "http://localhost:8080";

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/subscriptions`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Stripe portal error:", error);
    return new Response(JSON.stringify({ error: error.message || "Portal creation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const handleWebhook = httpAction(async (ctx, request: Request) => {
  if (!stripe) {
    return new Response("Stripe not configured", { status: 500 });
  }

  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Payment successful for session:", session.id);
      
      const { userId, tier } = session.metadata || {};
      
      if (userId && tier) {
        const user = await ctx.db.get(userId as Id<"users">);
        
        if (user) {
          const now = Date.now();
          const monthInMs = 30 * 24 * 60 * 60 * 1000;
          const endDate = now + monthInMs;
          
          let maxContent = 10;
          let isVerified = false;
          
          if (tier === "growth") {
            maxContent = 50;
          } else if (tier === "elite") {
            maxContent = 500;
            isVerified = true;
          }
          
          await ctx.db.patch(userId as Id<"users">, {
            tier,
            subscriptionStatus: "active",
            subscriptionStartDate: now,
            subscriptionEndDate: endDate,
            maxContentAllowed: maxContent,
            isVerified,
            updatedAt: now,
          });
          
          console.log(`User ${userId} upgraded to ${tier} tier`);
        } else {
          console.error(`User not found: ${userId}`);
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("Subscription cancelled:", subscription.id);
      
      const customerId = subscription.customer as string;
      const customers = await stripe.customers.list({ email: undefined, limit: 100 });
      const customer = customers.data.find(c => c.id === customerId);
      
      if (customer?.email) {
        const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", customer.email.toLowerCase())).first();
        
        if (user) {
          await ctx.db.patch(user._id, {
            tier: "standard",
            subscriptionStatus: "cancelled",
            subscriptionStartDate: undefined,
            subscriptionEndDate: undefined,
            maxContentAllowed: 10,
            isVerified: false,
            updatedAt: Date.now(),
          });
          
          console.log(`User ${user.email} downgraded to standard tier`);
        }
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("Payment failed for invoice:", invoice.id);
      
      const customerId = invoice.customer as string;
      if (customerId) {
        const customers = await stripe.customers.list({ limit: 100 });
        const customer = customers.data.find(c => c.id === customerId);
        
        if (customer?.email) {
          const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", customer.email.toLowerCase())).first();
          
          if (user) {
            await ctx.db.patch(user._id, {
              tier: user.tier,
              subscriptionStatus: "past_due",
              subscriptionStartDate: user.subscriptionStartDate,
              subscriptionEndDate: user.subscriptionEndDate,
              maxContentAllowed: user.maxContentAllowed,
              isVerified: user.isVerified,
              updatedAt: Date.now(),
            });
            
            console.log(`User ${user.email} subscription marked as past_due`);
          }
        }
      }
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

export const confirmSubscription = mutation({
  args: { 
    sessionId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { sessionId, userId }) => {
    if (!stripe) {
      throw new Error("Stripe not configured. Please contact support.");
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== "paid") {
        throw new Error("Payment not completed");
      }
      
      const { tier } = session.metadata || {};
      if (!tier) {
        throw new Error("No tier in session metadata");
      }
      
      const now = Date.now();
      const monthInMs = 30 * 24 * 60 * 60 * 1000;
      const endDate = now + monthInMs;
      
      let maxContent = 10;
      let isVerified = false;
      
      if (tier === "growth") {
        maxContent = 50;
      } else if (tier === "elite") {
        maxContent = 500;
        isVerified = true;
      }
      
      await ctx.db.patch(userId, {
        tier,
        subscriptionStatus: "active",
        subscriptionStartDate: now,
        subscriptionEndDate: endDate,
        maxContentAllowed: maxContent,
        isVerified,
        updatedAt: now,
      });
      
      return { success: true, tier, message: `${tier} plan activated` };
    } catch (error: any) {
      console.error("confirmSubscription error:", error);
      throw new Error(error.message || "Failed to confirm subscription");
    }
  },
});
