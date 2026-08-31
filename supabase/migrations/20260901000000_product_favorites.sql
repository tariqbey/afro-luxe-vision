-- Viewer shopping list: products saved from sponsored episodes.
create table public.product_favorites (
  user_id uuid not null references public.profiles on delete cascade,
  product_id uuid not null references public.products on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index product_favorites_user_idx on public.product_favorites (user_id, created_at desc);

alter table public.product_favorites enable row level security;
create policy "read own favorites" on public.product_favorites
  for select using (auth.uid() = user_id);
create policy "save own favorites" on public.product_favorites
  for insert with check (auth.uid() = user_id);
create policy "remove own favorites" on public.product_favorites
  for delete using (auth.uid() = user_id);
-- admins can see aggregate demand for sponsor reporting
create policy "admins read favorites" on public.product_favorites
  for select using (public.is_content_admin());
