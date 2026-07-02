// Stripe webhook: credits Bread after a successful checkout.
// Idempotent — the ledger has a unique index on (kind='purchase', ref_id),
// so webhook retries can never double-credit.
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
    );
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const bread = parseInt(session.metadata?.bread ?? "0", 10);

    if (userId && bread > 0) {
      // Service role client — credit_bread is not callable by browser roles
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { error } = await admin.rpc("credit_bread", {
        p_user_id: userId,
        p_amount: bread,
        p_kind: "purchase",
        p_ref_id: session.id,
      });
      if (error) {
        console.error("credit_bread failed", error);
        return new Response("credit failed", { status: 500 });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
