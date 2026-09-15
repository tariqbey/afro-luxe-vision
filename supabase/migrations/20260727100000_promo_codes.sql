-- Promo codes: grant free Unlimited access without a card.
create table public.promo_codes (
  code text primary key,
  grants_days integer not null default 30 check (grants_days > 0),
  max_redemptions integer, -- null = unlimited
  redeemed_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.promo_redemptions (
  code text not null references public.promo_codes on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (code, user_id)
);

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;

create policy "admins manage codes" on public.promo_codes
  for all using (public.is_content_admin());
create policy "read own redemptions" on public.promo_redemptions
  for select using (auth.uid() = user_id);

-- One redemption per user per code; extends any existing access.
create or replace function public.redeem_promo(p_code text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row promo_codes%rowtype;
  v_new_end timestamptz;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into v_row from promo_codes
  where upper(code) = upper(trim(p_code)) and active
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if v_row.max_redemptions is not null and v_row.redeemed_count >= v_row.max_redemptions then
    return jsonb_build_object('ok', false, 'error', 'code_exhausted');
  end if;

  if exists (select 1 from promo_redemptions where code = v_row.code and user_id = v_user) then
    return jsonb_build_object('ok', false, 'error', 'already_redeemed');
  end if;

  insert into promo_redemptions (code, user_id) values (v_row.code, v_user);
  update promo_codes set redeemed_count = redeemed_count + 1 where code = v_row.code;

  v_new_end := greatest(
    now(),
    coalesce((select current_period_end from subscriptions where user_id = v_user), now())
  ) + make_interval(days => v_row.grants_days);

  insert into subscriptions (user_id, status, current_period_end, updated_at)
  values (v_user, 'active', v_new_end, now())
  on conflict (user_id) do update
    set status = 'active', current_period_end = excluded.current_period_end, updated_at = now();

  return jsonb_build_object('ok', true, 'until', v_new_end, 'days', v_row.grants_days);
end;
$$;

-- Launch code: 30 days free, unlimited redemptions.
insert into public.promo_codes (code, grants_days, max_redemptions)
values ('UPSCALE', 30, null);
