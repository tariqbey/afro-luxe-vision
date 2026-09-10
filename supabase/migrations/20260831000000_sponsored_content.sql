-- Sponsored / shoppable content: brand a series, attach products to episodes.
alter table public.series add column sponsor_name text;          -- null = unsponsored
alter table public.series add column sponsor_logo_url text;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series on delete cascade,
  episode_id uuid references public.episodes on delete cascade,   -- null = whole series
  name text not null,
  brand text,
  price text,                       -- display string; brand site is source of truth
  image_url text,
  product_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index products_episode_idx on public.products (episode_id, sort_order);
create index products_series_idx on public.products (series_id, sort_order);

alter table public.products enable row level security;
create policy "products are public" on public.products for select using (true);
create policy "admins manage products" on public.products for all using (public.is_content_admin());

-- Click tracking so sponsors can be shown real numbers
create table public.product_clicks (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products on delete cascade,
  user_id uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
create index product_clicks_idx on public.product_clicks (product_id, created_at desc);

alter table public.product_clicks enable row level security;
create policy "anyone can log a click" on public.product_clicks for insert with check (true);
create policy "admins read clicks" on public.product_clicks for select using (public.is_content_admin());
