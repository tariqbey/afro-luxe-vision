// Creates a Stripe Checkout session for a Bread package.
// Packages are defined server-side so the client can never set its own price.
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const BREAD_PACKAGES: Record<string, { bread: number; bonus: number; cents: number; label: string }> = {
  starter: { bread: 100, bonus: 0, cents: 199, label: "100 Bread" },
  popular: { bread: 500, bonus: 50, cents: 799, label: "500 + 50 Bread" },
  premium: { bread: 1200, bonus: 200, cents: 1499, label: "1,200 + 200 Bread" },
  ultimate: { bread: 3000, bonus: 750, cents: 2999, label: "3,000 + 750 Bread" },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    if (!user) {
      return new Response(JSON.stringify({ error: "not_authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { packageId, returnUrl } = await req.json();
    const pkg = BREAD_PACKAGES[packageId];
    if (!pkg) {
      return new Response(JSON.stringify({ error: "unknown_package" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = returnUrl || req.headers.get("origin") || "http://localhost:8080";
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

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
