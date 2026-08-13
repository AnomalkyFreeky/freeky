-- FREÆŽ-KY // managed public content for Facility Control.
-- Run this once in Supabase SQL Editor after the earlier database scripts.
-- The client always retains its bundled content as a fallback until a row is saved.

create table if not exists public.managed_content (
  content_key text primary key check (content_key in ('dossier', 'quiz', 'random')),
  content_value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.managed_content enable row level security;

drop policy if exists "Managed content is public" on public.managed_content;
create policy "Managed content is public"
on public.managed_content for select using (true);

drop policy if exists "Staff can manage content" on public.managed_content;
create policy "Staff can manage content"
on public.managed_content for all
using (public.is_staff())
with check (public.is_staff());
