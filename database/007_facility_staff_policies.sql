-- FREÆŽ-KY // actual Facility Control permissions.
-- Run once in Supabase SQL Editor. These permissions are separate from the
-- visual role gate: they allow authorised operators to see other customers' records.

create or replace function public.facility_role_in(allowed_roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = any(allowed_roles));
$$;

revoke all on function public.facility_role_in(text[]) from public;
grant execute on function public.facility_role_in(text[]) to authenticated;

drop policy if exists "Facility staff can view all profiles" on public.profiles;
create policy "Facility staff can view all profiles" on public.profiles for select to authenticated
using (public.facility_role_in(array['admin','director','staff','moderator']));

drop policy if exists "Facility directors can update profiles" on public.profiles;
create policy "Facility directors can update profiles" on public.profiles for update to authenticated
using (public.facility_role_in(array['admin','director']))
with check (public.facility_role_in(array['admin','director']));

drop policy if exists "Facility staff can view all orders" on public.orders;
create policy "Facility staff can view all orders" on public.orders for select to authenticated
using (public.facility_role_in(array['admin','director','staff']));

drop policy if exists "Facility staff can update orders" on public.orders;
create policy "Facility staff can update orders" on public.orders for update to authenticated
using (public.facility_role_in(array['admin','director','staff']))
with check (public.facility_role_in(array['admin','director','staff']));

drop policy if exists "Facility staff can view all order items" on public.order_items;
create policy "Facility staff can view all order items" on public.order_items for select to authenticated
using (public.facility_role_in(array['admin','director','staff']));
