-- Public signups (incl. Google OAuth) need collision-proof usernames and a
-- trigger that can never block account creation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_base text;
  v_name text;
  i integer := 0;
begin
  -- Prefer the OAuth display name, fall back to the email prefix
  v_base := nullif(trim(coalesce(
    new.raw_user_meta_data->>'preferred_username',
    new.raw_user_meta_data->>'full_name',
    split_part(coalesce(new.email, ''), '@', 1)
  )), '');
  v_base := lower(regexp_replace(coalesce(v_base, 'viewer'), '[^a-zA-Z0-9_]+', '', 'g'));
  if v_base = '' then v_base := 'viewer'; end if;

  v_name := v_base;
  while exists (select 1 from public.profiles where username = v_name) loop
    i := i + 1;
    v_name := v_base || i::text;
    if i > 500 then
      v_name := v_base || substr(md5(random()::text), 1, 6);
      exit;
    end if;
  end loop;

  insert into public.profiles (id, username, avatar_url)
  values (new.id, v_name, new.raw_user_meta_data->>'avatar_url');

  insert into public.wallets (user_id, balance) values (new.id, 100);
  insert into public.bread_transactions (user_id, amount, kind, note)
  values (new.id, 100, 'signup_bonus', 'Welcome to Dopamine');
  return new;
exception when others then
  -- never block signup because of profile bookkeeping
  return new;
end;
$$;
