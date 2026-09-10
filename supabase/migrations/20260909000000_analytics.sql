-- Analytics: an append-only play log plus admin-only aggregate reads.
--
-- watch_progress already answers "how far did this viewer get", but it is
-- upserted per (user, episode), so it loses history: repeat views, when a play
-- happened, and anything about signed-out sessions. play_events is the raw log
-- the admin dashboard is built on.

create table if not exists public.play_events (
  id           bigserial primary key,
  user_id      uuid references auth.users(id) on delete set null,
  -- Signed-out trailer views still count; a random client id groups them.
  anon_id      text,
  series_id    uuid not null references public.series(id) on delete cascade,
  episode_id   uuid references public.episodes(id) on delete set null,
  episode_number int not null,
  -- Written when the viewer leaves the episode, so partial plays are visible.
  seconds_watched int not null default 0,
  completed    boolean not null default false,
  is_trailer   boolean not null default false,
  device       text,
  created_at   timestamptz not null default now()
);

create index if not exists play_events_series_idx  on public.play_events (series_id, created_at desc);
create index if not exists play_events_created_idx on public.play_events (created_at desc);
create index if not exists play_events_user_idx    on public.play_events (user_id, created_at desc);

alter table public.play_events enable row level security;

-- Anyone may log their own play; nobody but an admin may read the log back.
drop policy if exists play_events_insert_own on public.play_events;
create policy play_events_insert_own on public.play_events
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists play_events_admin_read on public.play_events;
create policy play_events_admin_read on public.play_events
  for select to authenticated
  using (public.is_content_admin());

-- Rolling counters the dashboard opens with. security definer so one call can
-- read across profiles/subscriptions/play_events without granting the admin
-- direct select on each.
create or replace function public.admin_overview(p_days int default 30)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => p_days);
  result json;
begin
  if not public.is_content_admin() then
    raise exception 'admin only';
  end if;

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

-- Per-series performance, ordered by the thing that matters: watch time.
create or replace function public.admin_series_stats(p_days int default 30)
returns table (
  series_id uuid,
  title text,
  plays bigint,
  viewers bigint,
  watch_seconds bigint,
  completions bigint,
  saves bigint,
  -- The episode where the most viewers stopped: the drop-off cliff.
  dropoff_episode int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_content_admin() then
    raise exception 'admin only';
  end if;

  return query
  with ev as (
    select * from play_events
     where created_at >= now() - make_interval(days => p_days)
  ),
  furthest as (
    select coalesce(user_id::text, anon_id) as viewer, ev.series_id, max(episode_number) as last_ep
      from ev group by 1, 2
  ),
  cliff as (
    select f.series_id, f.last_ep,
           row_number() over (partition by f.series_id order by count(*) desc, f.last_ep) as rn
      from furthest f group by f.series_id, f.last_ep
  )
  select s.id,
         s.title,
         count(ev.id),
         count(distinct coalesce(ev.user_id::text, ev.anon_id)),
         coalesce(sum(ev.seconds_watched), 0)::bigint,
         count(*) filter (where ev.completed),
         (select count(*) from saved_series ss where ss.series_id = s.id),
         (select c.last_ep from cliff c where c.series_id = s.id and c.rn = 1)
    from series s
    left join ev on ev.series_id = s.id
   group by s.id, s.title
   order by 5 desc, 3 desc;
end;
$$;

-- Retention curve for one series: how many distinct viewers reached each episode.
create or replace function public.admin_episode_funnel(p_series_id uuid, p_days int default 30)
returns table (episode_number int, viewers bigint, plays bigint, avg_seconds numeric, completions bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_content_admin() then
    raise exception 'admin only';
  end if;

  return query
  select e.episode_number,
         count(distinct coalesce(pe.user_id::text, pe.anon_id)),
         count(pe.id),
         coalesce(round(avg(pe.seconds_watched), 1), 0),
         count(*) filter (where pe.completed)
    from episodes e
    left join play_events pe
      on pe.episode_id = e.id
     and pe.created_at >= now() - make_interval(days => p_days)
   where e.series_id = p_series_id
   group by e.episode_number
   order by e.episode_number;
end;
$$;

-- Daily plays / signups / subs, for the trend chart.
create or replace function public.admin_daily(p_days int default 30)
returns table (day date, plays bigint, viewers bigint, watch_seconds bigint, signups bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_content_admin() then
    raise exception 'admin only';
  end if;

  return query
  with days as (
    select generate_series(
      (now() - make_interval(days => p_days - 1))::date, now()::date, '1 day')::date as day
  )
  select d.day,
         (select count(*) from play_events pe where pe.created_at::date = d.day),
         (select count(distinct coalesce(pe.user_id::text, pe.anon_id))
            from play_events pe where pe.created_at::date = d.day),
         (select coalesce(sum(pe.seconds_watched), 0)::bigint
            from play_events pe where pe.created_at::date = d.day),
         (select count(*) from profiles p where p.created_at::date = d.day)
    from days d order by d.day;
end;
$$;

-- The live feed: who watched what, most recent first.
create or replace function public.admin_recent_activity(p_limit int default 50)
returns table (
  at timestamptz,
  viewer text,
  is_member boolean,
  series_title text,
  episode_number int,
  seconds_watched int,
  completed boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_content_admin() then
    raise exception 'admin only';
  end if;

  return query
  select pe.created_at,
         coalesce(pr.username, 'guest ' || right(coalesce(pe.anon_id, '------'), 6)),
         exists (select 1 from subscriptions sub
                  where sub.user_id = pe.user_id
                    and sub.status = 'active'
                    and sub.current_period_end > now()),
         s.title,
         pe.episode_number,
         pe.seconds_watched,
         pe.completed
    from play_events pe
    join series s on s.id = pe.series_id
    left join profiles pr on pr.id = pe.user_id
   order by pe.created_at desc
   limit greatest(1, least(p_limit, 200));
end;
$$;

-- Sponsor-facing numbers: which products viewers actually reach for.
create or replace function public.admin_product_stats(p_days int default 30)
returns table (
  product_id uuid,
  name text,
  brand text,
  series_title text,
  saves bigint,
  clicks bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_content_admin() then
    raise exception 'admin only';
  end if;

  return query
  select p.id, p.name, p.brand, s.title,
         (select count(*) from product_favorites pf
           where pf.product_id = p.id and pf.created_at >= now() - make_interval(days => p_days)),
         (select count(*) from product_clicks pc
           where pc.product_id = p.id and pc.created_at >= now() - make_interval(days => p_days))
    from products p
    join series s on s.id = p.series_id
   order by 5 desc, 6 desc;
end;
$$;

grant execute on function public.admin_overview(int)              to authenticated;
grant execute on function public.admin_series_stats(int)          to authenticated;
grant execute on function public.admin_episode_funnel(uuid, int)  to authenticated;
grant execute on function public.admin_daily(int)                 to authenticated;
grant execute on function public.admin_recent_activity(int)       to authenticated;
grant execute on function public.admin_product_stats(int)         to authenticated;
