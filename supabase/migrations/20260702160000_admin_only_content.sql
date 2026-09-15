-- Curated platform: only admins/creators may write content or upload media.
create or replace function public.is_content_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (is_admin or is_creator)
  );
$$;

drop policy "creators insert series" on public.series;
drop policy "creators update own series" on public.series;
create policy "admins insert series" on public.series
  for insert with check (public.is_content_admin() and creator_id = auth.uid());
create policy "admins update series" on public.series
  for update using (public.is_content_admin());

drop policy "creators insert episodes" on public.episodes;
drop policy "creators update own episodes" on public.episodes;
create policy "admins insert episodes" on public.episodes
  for insert with check (public.is_content_admin());
create policy "admins update episodes" on public.episodes
  for update using (public.is_content_admin());

drop policy "authenticated upload videos" on storage.objects;
create policy "admins upload media" on storage.objects
  for insert with check (bucket_id in ('videos', 'covers') and public.is_content_admin());
