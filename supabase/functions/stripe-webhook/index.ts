// Stripe webhook: credits Bread and maintains subscription state.
// Bread crediting is idempotent via a unique ledger index on
// (kind='purchase', ref_id); subscription rows are keyed by user_id.
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

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

    if (session.mode === "subscription" && userId) {
      // Activate immediately; the subscription.updated event refines period end.
      const { error } = await admin().from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: String(session.customer ?? ""),
        stripe_subscription_id: String(session.subscription ?? ""),
        status: "active",
        current_period_end: new Date(Date.now() + 35 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error("subscription upsert failed", error);
        return new Response("subscription upsert failed", { status: 500 });
      }
    } else if (userId) {
      const bread = parseInt(session.metadata?.bread ?? "0", 10);
      if (bread > 0) {
        const { error } = await admin().rpc("credit_bread", {
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
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.user_id;
    if (userId) {
      const status =
        event.type === "customer.subscription.deleted" ? "canceled"
        : sub.status === "active" || sub.status === "trialing" ? "active"
        : sub.status === "past_due" ? "past_due"
        : "canceled";
      const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
      const { error } = await admin().from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: String(sub.customer ?? ""),
        stripe_subscription_id: sub.id,
        status,
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error("subscription state update failed", error);
        return new Response("subscription update failed", { status: 500 });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
