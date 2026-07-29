-- Share-to-unlock: sharing a series 5 times unlocks the 5 episodes
-- after the free window (then the subscription paywall takes over).
create table public.share_progress (
  user_id uuid not null references public.profiles on delete cascade,
  series_id uuid not null references public.series on delete cascade,
  shares integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, series_id)
);

alter table public.share_progress enable row level security;
create policy "read own share progress" on public.share_progress
  for select using (auth.uid() = user_id);

create or replace function public.record_share(p_series_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_shares integer;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  insert into share_progress (user_id, series_id, shares)
  values (v_user, p_series_id, 1)
  on conflict (user_id, series_id) do update
    set shares = share_progress.shares + 1, updated_at = now()
  returning shares into v_shares;
  return jsonb_build_object('ok', true, 'shares', v_shares);
end;
$$;
