-- Admin-curated featured verticals for the home hero.
-- Most recently featured shows first; null = not featured.
alter table public.series add column featured_at timestamptz;
