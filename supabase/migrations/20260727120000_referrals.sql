-- Referral tree: every user gets a short code; invites carry it so we can
-- attribute the growth chain (Tariq → Mike → Sarah → …).
alter table public.profiles add column referral_code text unique;

create or replace function public.gen_referral_code()
returns text language sql stable as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

-- Backfill + default for new profiles
update public.profiles set referral_code = public.gen_referral_code() where referral_code is null;
alter table public.profiles alter column referral_code set default public.gen_referral_code();

create table public.referral_visits (
  id bigint generated always as identity primary key,
  referrer_id uuid references public.profiles on delete set null,
  series_id uuid references public.series on delete set null,
  visitor_id uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
create index referral_visits_referrer_idx on public.referral_visits (referrer_id, created_at desc);

alter table public.referral_visits enable row level security;
create policy "read own referral visits" on public.referral_visits
  for select using (auth.uid() = referrer_id or public.is_content_admin());
create policy "anyone can log a visit" on public.referral_visits
  for insert with check (true);

-- Public lookup: who sent this invite? (name only, for the welcome banner)
create or replace function public.referrer_name(p_code text)
returns text language sql stable security definer set search_path = public as $$
  select username from public.profiles where referral_code = upper(trim(p_code));
$$;

-- Log a visit from a referral link (works for signed-out visitors too)
create or replace function public.log_referral_visit(p_code text, p_series_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_ref uuid;
begin
  select id into v_ref from profiles where referral_code = upper(trim(p_code));
  if v_ref is null then return; end if;
  insert into referral_visits (referrer_id, series_id, visitor_id)
  values (v_ref, p_series_id, auth.uid());
end;
$$;
