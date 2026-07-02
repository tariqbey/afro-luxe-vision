// Creates Stripe Checkout sessions (Bread packs + the $5.99/mo subscription)
// and billing-portal sessions. All prices are defined server-side.
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const BREAD_PACKAGES: Record<string, { bread: number; bonus: number; cents: number; label: string }> = {
  starter: { bread: 100, bonus: 0, cents: 199, label: "100 Bread" },
  popular: { bread: 500, bonus: 50, cents: 799, label: "500 + 50 Bread" },
  premium: { bread: 1200, bonus: 200, cents: 1499, label: "1,200 + 200 Bread" },
  ultimate: { bread: 3000, bonus: 750, cents: 2999, label: "3,000 + 750 Bread" },
};

const SUBSCRIPTION = { cents: 599, label: "Dopamine Unlimited — all episodes, every series" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "not_authenticated" }, 401);

    const { packageId, plan, action, returnUrl } = await req.json();
    const origin = returnUrl || req.headers.get("origin") || "http://localhost:8080";

    // --- Billing portal (manage/cancel subscription) ---
    if (action === "portal") {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: sub } = await admin
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();
      if (!sub?.stripe_customer_id) return json({ error: "no_subscription" }, 400);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: origin,
      });
      return json({ url: portal.url });
    }

    // --- $5.99/mo subscription ---
    if (plan === "monthly") {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: SUBSCRIPTION.label },
            unit_amount: SUBSCRIPTION.cents,
            recurring: { interval: "month" },
          },
          quantity: 1,
        }],
        metadata: { user_id: user.id, kind: "subscription" },
        subscription_data: { metadata: { user_id: user.id } },
        success_url: `${origin}/?subscription=success`,
        cancel_url: `${origin}/?subscription=cancelled`,
      });
      return json({ url: session.url });
    }

    // --- One-time Bread pack ---
    const pkg = BREAD_PACKAGES[packageId];
    if (!pkg) return json({ error: "unknown_package" }, 400);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `Dopamine — ${pkg.label}` },
          unit_amount: pkg.cents,
        },
        quantity: 1,
      }],
      metadata: {
        user_id: user.id,
        bread: String(pkg.bread + pkg.bonus),
        package_id: packageId,
      },
      success_url: `${origin}/?bread_purchase=success`,
      cancel_url: `${origin}/?bread_purchase=cancelled`,
    });
    return json({ url: session.url });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
