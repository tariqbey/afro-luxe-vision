-- PostgREST can only embed profiles via a direct FK; point creator_id at
-- public.profiles (which itself cascades from auth.users) instead of auth.users.
alter table public.series drop constraint series_creator_id_fkey;
alter table public.series
  add constraint series_creator_id_fkey
  foreign key (creator_id) references public.profiles(id) on delete set null;
