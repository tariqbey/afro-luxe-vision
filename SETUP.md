# Dopamine — Going Live

The app runs in **demo mode** out of the box (sample videos, device-local Bread wallet).
Follow these steps to switch on real accounts, uploads, and payments.

## 1. Supabase (accounts, catalog, Bread wallet)

```bash
supabase login                       # opens browser
supabase projects create dopamine    # or use an existing project
supabase link --project-ref <PROJECT_REF>
supabase db push                     # applies supabase/migrations/*
```

Then copy `.env.example` to `.env` and fill in from the Supabase dashboard
(Project Settings → API):

```
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Restart the dev server. Demo mode turns off automatically.

What the migration sets up:
- `profiles`, `wallets`, `bread_transactions` (ledger — the only way Bread moves)
- `series` / `episodes` (per-series `free_episodes`, default 5, and `episode_price` in Bread)
- `unlocks` (who owns which episode) and `watch_progress`
- `unlock_episode()` — atomic spend, no double-charging, race-safe
- New signups get **100 Bread** welcome bonus automatically
- Storage buckets `videos` and `covers` for creator uploads

## 2. Stripe (real Bread purchases)

```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

In the Stripe dashboard, add a webhook endpoint:

```
https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook
```

listening to `checkout.session.completed`, then:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

Bread packages/prices are defined in `supabase/functions/create-checkout/index.ts`
(server-side, so clients can't tamper). The display list lives in
`src/components/BreadPurchaseModal.tsx` — keep the two in sync.

## 3. Deploy (Vercel)

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel project env,
then deploy as usual.

## Notes for scale

- Uploads currently go straight to Supabase Storage and play as-is. When traffic
  grows, move playback to Mux or Cloudflare Stream (transcoding + signed URLs so
  paid episodes can't be hotlinked). The `episodes.video_url` column doesn't care
  who hosts the file.
- `free_episodes` defaults to 5 per your spec. ReelShort/DramaBox typically free
  8–12 episodes — worth A/B testing once you have viewers.
