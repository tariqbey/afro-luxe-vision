-- ============================================================
-- Dopamine platform core: profiles, Bread wallet, series,
-- episodes, unlocks, watch progress.
-- ============================================================

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  bio text,
  avatar_url text,
  is_creator boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Bread wallet ----------
-- Balance is derived state; every change MUST go through a ledger row.
create table public.wallets (
  user_id uuid primary key references auth.users on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table public.bread_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  amount integer not null, -- positive = credit, negative = debit
  kind text not null check (kind in ('purchase', 'unlock', 'signup_bonus', 'daily_bonus', 'refund', 'admin_adjustment')),
  ref_id text, -- stripe checkout session id, episode id, etc.
  note text,
  created_at timestamptz not null default now()
);
create index bread_transactions_user_idx on public.bread_transactions (user_id, created_at desc);
-- One credit per Stripe session, ever (webhook retries / replays are no-ops)
create unique index bread_transactions_purchase_ref_idx
  on public.bread_transactions (kind, ref_id) where kind = 'purchase';

-- ---------- series & episodes ----------
create table public.series (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users on delete set null,
  title text not null,
  description text,
  cover_url text,
  channel text check (channel in ('afropunk', 'codeblack', 'lol', 'essence')),
  free_episodes integer not null default 5 check (free_episodes >= 0),
  episode_price integer not null default 30 check (episode_price >= 0), -- Bread per episode
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series on delete cascade,
  episode_number integer not null check (episode_number > 0),
  title text,
  video_url text,
  thumbnail_url text,
  duration_seconds integer,
  status text not null default 'ready' check (status in ('processing', 'ready', 'blocked')),
  created_at timestamptz not null default now(),
  unique (series_id, episode_number)
);
create index episodes_series_idx on public.episodes (series_id, episode_number);

-- ---------- unlocks & progress ----------
create table public.unlocks (
  user_id uuid not null references auth.users on delete cascade,
  episode_id uuid not null references public.episodes on delete cascade,
  bread_spent integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

create table public.watch_progress (
  user_id uuid not null references auth.users on delete cascade,
  episode_id uuid not null references public.episodes on delete cascade,
  seconds numeric not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

-- ---------- new-user bootstrap ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  -- 100 Bread welcome bonus
  insert into public.wallets (user_id, balance) values (new.id, 100);
  insert into public.bread_transactions (user_id, amount, kind, note)
  values (new.id, 100, 'signup_bonus', 'Welcome to Dopamine');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- atomic unlock ----------
-- The ONLY way Bread leaves a wallet. Row-locks the wallet so
-- concurrent unlocks can't double-spend.
create or replace function public.unlock_episode(p_episode_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_price integer;
  v_free integer;
  v_ep_number integer;
  v_series uuid;
  v_balance integer;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select e.episode_number, e.series_id, s.episode_price, s.free_episodes
    into v_ep_number, v_series, v_price, v_free
  from public.episodes e
  join public.series s on s.id = e.series_id
  where e.id = p_episode_id and s.status = 'published';

  if not found then
    return jsonb_build_object('ok', false, 'error', 'episode_not_found');
  end if;

  if v_ep_number <= v_free then
    return jsonb_build_object('ok', true, 'already_free', true);
  end if;

  if exists (select 1 from public.unlocks where user_id = v_user and episode_id = p_episode_id) then
    return jsonb_build_object('ok', true, 'already_unlocked', true);
  end if;

  select balance into v_balance from public.wallets where user_id = v_user for update;

  if v_balance is null or v_balance < v_price then
    return jsonb_build_object('ok', false, 'error', 'insufficient_bread',
                              'balance', coalesce(v_balance, 0), 'price', v_price);
  end if;

  update public.wallets set balance = balance - v_price, updated_at = now()
  where user_id = v_user;

  insert into public.unlocks (user_id, episode_id, bread_spent)
  values (v_user, p_episode_id, v_price);

  insert into public.bread_transactions (user_id, amount, kind, ref_id)
  values (v_user, -v_price, 'unlock', p_episode_id::text);

  return jsonb_build_object('ok', true, 'new_balance', v_balance - v_price);
end;
$$;

-- ---------- credit Bread (service-role only, called by Stripe webhook) ----------
create or replace function public.credit_bread(p_user_id uuid, p_amount integer, p_kind text, p_ref_id text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  insert into public.bread_transactions (user_id, amount, kind, ref_id)
  values (p_user_id, p_amount, p_kind, p_ref_id);

  insert into public.wallets (user_id, balance)
  values (p_user_id, p_amount)
  on conflict (user_id) do update
    set balance = wallets.balance + p_amount, updated_at = now();

  select balance into v_balance from public.wallets where user_id = p_user_id;
  return jsonb_build_object('ok', true, 'new_balance', v_balance);
exception when unique_violation then
  -- purchase ref already credited (webhook retry) — safe no-op
  return jsonb_build_object('ok', true, 'duplicate', true);
end;
$$;

-- credit_bread must never be callable from the browser
revoke execute on function public.credit_bread(uuid, integer, text, text) from anon, authenticated;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.bread_transactions enable row level security;
alter table public.series enable row level security;
alter table public.episodes enable row level security;
alter table public.unlocks enable row level security;
alter table public.watch_progress enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

create policy "read own wallet" on public.wallets for select using (auth.uid() = user_id);
create policy "read own transactions" on public.bread_transactions for select using (auth.uid() = user_id);

create policy "published series are public" on public.series
  for select using (status = 'published' or creator_id = auth.uid());
create policy "creators insert series" on public.series
  for insert with check (creator_id = auth.uid());
create policy "creators update own series" on public.series
  for update using (creator_id = auth.uid());

create policy "episodes of visible series are public" on public.episodes
  for select using (exists (
    select 1 from public.series s
    where s.id = series_id and (s.status = 'published' or s.creator_id = auth.uid())
  ));
create policy "creators insert episodes" on public.episodes
  for insert with check (exists (
    select 1 from public.series s where s.id = series_id and s.creator_id = auth.uid()
  ));
create policy "creators update own episodes" on public.episodes
  for update using (exists (
    select 1 from public.series s where s.id = series_id and s.creator_id = auth.uid()
  ));

create policy "read own unlocks" on public.unlocks for select using (auth.uid() = user_id);

create policy "read own progress" on public.watch_progress for select using (auth.uid() = user_id);
create policy "upsert own progress" on public.watch_progress for insert with check (auth.uid() = user_id);
create policy "update own progress" on public.watch_progress for update using (auth.uid() = user_id);

-- ---------- storage buckets ----------
insert into storage.buckets (id, name, public) values ('videos', 'videos', true);
insert into storage.buckets (id, name, public) values ('covers', 'covers', true);

create policy "authenticated upload videos" on storage.objects
  for insert with check (bucket_id in ('videos', 'covers') and auth.role() = 'authenticated');
create policy "public read media" on storage.objects
  for select using (bucket_id in ('videos', 'covers'));
