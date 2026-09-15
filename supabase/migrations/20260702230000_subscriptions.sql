-- Dopamine Unlimited: $5.99/mo all-access subscription.
-- Rows are written only by the Stripe webhook (service role).
create table public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'inactive'
    check (status in ('active', 'past_due', 'canceled', 'inactive')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
create policy "read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);
