-- Episode chat + saved series (My List)

create table public.comments (
  id bigint generated always as identity primary key,
  episode_id uuid not null references public.episodes on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index comments_episode_idx on public.comments (episode_id, created_at desc);

create table public.saved_series (
  user_id uuid not null references public.profiles(id) on delete cascade,
  series_id uuid not null references public.series on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, series_id)
);

alter table public.comments enable row level security;
alter table public.saved_series enable row level security;

create policy "comments are public" on public.comments for select using (true);
create policy "signed-in users comment as themselves" on public.comments
  for insert with check (auth.uid() = user_id);
create policy "delete own comments or as admin" on public.comments
  for delete using (auth.uid() = user_id or public.is_content_admin());

create policy "read own saves" on public.saved_series for select using (auth.uid() = user_id);
create policy "save as self" on public.saved_series for insert with check (auth.uid() = user_id);
create policy "unsave own" on public.saved_series for delete using (auth.uid() = user_id);
