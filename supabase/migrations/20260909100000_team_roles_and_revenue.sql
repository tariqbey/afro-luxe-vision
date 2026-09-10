-- Team access levels, revenue attribution, and the fields the dashboard needs
-- for geography and (opt-in) demographics.

-- ---------------------------------------------------------------- access levels
-- is_admin was a single boolean, which can't express "this person may read the
-- numbers but must not touch the catalog". access_level replaces it; is_admin
-- is kept in sync so nothing that still reads it breaks.
do $$ begin
  create type public.access_level as enum ('owner', 'admin', 'editor', 'analyst', 'viewer');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists access_level public.access_level not null default 'viewer';

-- Existing admins keep their access; the founding account owns the workspace.
update public.profiles set access_level = 'admin' where is_admin and access_level = 'viewer';
update public.profiles set access_level = 'editor' where is_creator and not is_admin and access_level = 'viewer';
update public.profiles set access_level = 'owner'  where id = '1e211735-064c-4989-a217-df7d7cb157b7';

-- May publish, edit and delete content.
create or replace function public.is_content_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid()
       and (p.access_level in ('owner', 'admin', 'editor') or p.is_admin)
  );
$$;

-- May read the numbers. An analyst can do this without touching the catalog.
create or replace function public.is_analytics_viewer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid()
       and (p.access_level in ('owner', 'admin', 'analyst') or p.is_admin)
  );
$$;

-- Only the owner hands out access.
create or replace function public.is_workspace_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.access_level = 'owner'
  );
$$;

-- Invites: the owner names an email and a level now; the level lands when that
-- person signs up. No service-role key has to live in the browser for this.
create table if not exists public.team_invites (
  email        text primary key,
  access_level public.access_level not null default 'analyst',
  invited_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz
);

alter table public.team_invites enable row level security;

drop policy if exists team_invites_owner_all on public.team_invites;
create policy team_invites_owner_all on public.team_invites
  for all to authenticated
  using (public.is_workspace_owner()) with check (public.is_workspace_owner());

-- Apply a pending invite the moment that email creates an account.
create or replace function public.apply_team_invite()
returns trigger language plpgsql security definer set search_path = public as $$
declare lvl public.access_level;
begin
  select ti.access_level into lvl
    from public.team_invites ti
   where lower(ti.email) = lower(new.email) and ti.accepted_at is null;

  if lvl is not null then
    update public.profiles
       set access_level = lvl,
           is_admin   = (lvl in ('owner', 'admin')),
           is_creator = (lvl in ('owner', 'admin', 'editor'))
     where id = new.id;
    update public.team_invites set accepted_at = now() where lower(email) = lower(new.email);
  end if;
  return new;
end;
$$;

drop trigger if exists apply_team_invite_on_signup on auth.users;
create trigger apply_team_invite_on_signup
  after insert on auth.users
  for each row execute function public.apply_team_invite();

-- The team roster, owner-only.
create or replace function public.admin_team()
returns table (user_id uuid, email text, username text, level text, joined timestamptz, pending boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_workspace_owner() then raise exception 'owner only'; end if;

  return query
  select p.id, u.email::text, p.username, p.access_level::text, p.created_at, false
    from public.profiles p join auth.users u on u.id = p.id
   where p.access_level <> 'viewer'
  union all
  select null::uuid, ti.email, null, ti.access_level::text, ti.created_at, true
    from public.team_invites ti where ti.accepted_at is null
   order by 6, 5;
end;
$$;

-- Grant or change access. Works whether or not that person has signed up yet,
-- and refuses to strip the last owner.
create or replace function public.admin_set_access(p_email text, p_level text)
returns json language plpgsql security definer set search_path = public as $$
declare target uuid; lvl public.access_level := p_level::public.access_level;
begin
  if not public.is_workspace_owner() then raise exception 'owner only'; end if;

  select u.id into target from auth.users u where lower(u.email) = lower(p_email);

  if target is not null then
    if lvl <> 'owner'
       and (select access_level from public.profiles where id = target) = 'owner'
       and (select count(*) from public.profiles where access_level = 'owner') <= 1 then
      raise exception 'cannot remove the last owner';
    end if;
    update public.profiles
       set access_level = lvl,
           is_admin   = (lvl in ('owner', 'admin')),
           is_creator = (lvl in ('owner', 'admin', 'editor'))
     where id = target;
    delete from public.team_invites where lower(email) = lower(p_email);
    return json_build_object('status', 'updated', 'email', p_email, 'level', lvl);
  end if;

  insert into public.team_invites (email, access_level, invited_by)
       values (lower(p_email), lvl, auth.uid())
  on conflict (email) do update set access_level = excluded.access_level, accepted_at = null;
  return json_build_object('status', 'invited', 'email', p_email, 'level', lvl);
end;
$$;

-- ------------------------------------------------------- geography & audience
alter table public.play_events
  add column if not exists country text,
  add column if not exists region  text,
  add column if not exists city    text,
  add column if not exists timezone text;

create index if not exists play_events_country_idx on public.play_events (country);

-- Opt-in only. Nothing here is required to use Dopamine, and it stays null
-- until a viewer chooses to answer.
alter table public.profiles
  add column if not exists birth_year int,
  add column if not exists gender text;

-- ------------------------------------------------------------------- revenue
-- Sponsorship deals are money that arrives outside Stripe, so the admin records
-- them by hand and the dashboard folds them into series revenue.
create table if not exists public.sponsorships (
  id          uuid primary key default gen_random_uuid(),
  series_id   uuid not null references public.series(id) on delete cascade,
  sponsor     text not null,
  amount_usd  numeric(12,2) not null default 0,
  starts_on   date not null default current_date,
  ends_on     date,
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.sponsorships enable row level security;

drop policy if exists sponsorships_admin_all on public.sponsorships;
create policy sponsorships_admin_all on public.sponsorships
  for all to authenticated
  using (public.is_content_admin()) with check (public.is_content_admin());

-- Subscription revenue is one pool for all-you-can-watch access, so no series
-- "earns" it directly. Allocate it the way the streamers do: by each title's
-- share of watch time in the period. Sponsorship money is attributed outright.
create or replace function public.admin_revenue(p_days int default 30, p_price numeric default 5.99)
returns table (
  series_id uuid,
  title text,
  watch_seconds bigint,
  watch_share numeric,
  subscription_revenue numeric,
  sponsorship_revenue numeric,
  total_revenue numeric
)
language plpgsql security definer set search_path = public as $$
declare
  subs int;
  pool numeric;
  total_seconds bigint;
begin
  if not public.is_analytics_viewer() then raise exception 'not permitted'; end if;

  select count(*) into subs from subscriptions
   where status = 'active' and current_period_end > now();
  -- Pool is the monthly take scaled to the window being viewed.
  pool := subs * p_price * (p_days / 30.0);

  select coalesce(sum(pe.seconds_watched), 0) into total_seconds
    from play_events pe where pe.created_at >= now() - make_interval(days => p_days);

  return query
  with per as (
    select s.id, s.title,
           coalesce(sum(pe.seconds_watched), 0)::bigint as secs
      from series s
      left join play_events pe
        on pe.series_id = s.id
       and pe.created_at >= now() - make_interval(days => p_days)
     group by s.id, s.title
  )
  select per.id, per.title, per.secs,
         case when total_seconds > 0 then round(per.secs::numeric / total_seconds, 4) else 0 end,
         case when total_seconds > 0 then round(pool * per.secs / total_seconds, 2) else 0 end,
         coalesce((select sum(sp.amount_usd) from sponsorships sp
                    where sp.series_id = per.id
                      and sp.starts_on <= current_date
                      and (sp.ends_on is null or sp.ends_on >= current_date - p_days)), 0),
         case when total_seconds > 0 then round(pool * per.secs / total_seconds, 2) else 0 end
           + coalesce((select sum(sp.amount_usd) from sponsorships sp
                        where sp.series_id = per.id
                          and sp.starts_on <= current_date
                          and (sp.ends_on is null or sp.ends_on >= current_date - p_days)), 0)
    from per
   order by 7 desc;
end;
$$;

-- Where viewers are watching from.
create or replace function public.admin_geography(p_days int default 30)
returns table (country text, region text, viewers bigint, plays bigint, watch_seconds bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_analytics_viewer() then raise exception 'not permitted'; end if;

  return query
  select coalesce(pe.country, 'Unknown'), coalesce(pe.region, ''),
         count(distinct coalesce(pe.user_id::text, pe.anon_id)),
         count(*), coalesce(sum(pe.seconds_watched), 0)::bigint
    from play_events pe
   where pe.created_at >= now() - make_interval(days => p_days)
   group by 1, 2
   order by 5 desc;
end;
$$;

-- Who the audience is: device mix always, age/gender only from those who told us.
create or replace function public.admin_audience(p_days int default 30)
returns json language plpgsql security definer set search_path = public as $$
declare result json; since timestamptz := now() - make_interval(days => p_days);
begin
  if not public.is_analytics_viewer() then raise exception 'not permitted'; end if;

  select json_build_object(
    'devices', (select coalesce(json_agg(d), '[]'::json) from (
        select coalesce(device, 'unknown') as device,
               count(distinct coalesce(user_id::text, anon_id)) as viewers,
               count(*) as plays
          from play_events where created_at >= since
         group by 1 order by 3 desc) d),
    'members_total',   (select count(*) from profiles),
    'members_with_age',(select count(*) from profiles where birth_year is not null),
    'age_bands', (select coalesce(json_agg(a), '[]'::json) from (
        select case
                 when extract(year from now()) - birth_year < 18 then 'Under 18'
                 when extract(year from now()) - birth_year < 25 then '18-24'
                 when extract(year from now()) - birth_year < 35 then '25-34'
                 when extract(year from now()) - birth_year < 45 then '35-44'
                 when extract(year from now()) - birth_year < 55 then '45-54'
                 else '55+' end as band,
               count(*) as members
          from profiles where birth_year is not null
         group by 1 order by 1) a),
    'gender', (select coalesce(json_agg(g), '[]'::json) from (
        select gender, count(*) as members from profiles
         where gender is not null group by 1 order by 2 desc) g),
    'signed_in_share', (select case when count(*) = 0 then 0
                                 else round(count(*) filter (where user_id is not null)::numeric
                                            / count(*), 3) end
                          from play_events where created_at >= since)
  ) into result;
  return result;
end;
$$;

-- The analytics reads move from "content admin" to "may read the numbers", so
-- an analyst can open the dashboard without any catalog rights.
create or replace function public.admin_overview(p_days int default 30)
returns json language plpgsql security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(days => p_days); result json;
begin
  if not public.is_analytics_viewer() then raise exception 'not permitted'; end if;

  select json_build_object(
    'plays',            (select count(*) from play_events where created_at >= since),
    'plays_prev',       (select count(*) from play_events
                          where created_at >= since - make_interval(days => p_days)
                            and created_at < since),
    'viewers',          (select count(distinct coalesce(user_id::text, anon_id))
                           from play_events where created_at >= since),
    'watch_seconds',    (select coalesce(sum(seconds_watched), 0) from play_events where created_at >= since),
    'completions',      (select count(*) from play_events where completed and created_at >= since),
    'signups',          (select count(*) from profiles where created_at >= since),
    'total_members',    (select count(*) from profiles),
    'active_subs',      (select count(*) from subscriptions
                          where status = 'active' and current_period_end > now()),
    'new_subs',         (select count(*) from subscriptions
                          where status = 'active' and updated_at >= since),
    'product_clicks',   (select count(*) from product_clicks where created_at >= since),
    'product_saves',    (select count(*) from product_favorites where created_at >= since),
    'comments',         (select count(*) from comments where created_at >= since),
    'saves',            (select count(*) from saved_series where created_at >= since)
  ) into result;
  return result;
end;
$$;

grant execute on function public.is_analytics_viewer()            to authenticated;
grant execute on function public.is_workspace_owner()             to authenticated;
grant execute on function public.admin_team()                     to authenticated;
grant execute on function public.admin_set_access(text, text)     to authenticated;
grant execute on function public.admin_revenue(int, numeric)      to authenticated;
grant execute on function public.admin_geography(int)             to authenticated;
grant execute on function public.admin_audience(int)              to authenticated;
