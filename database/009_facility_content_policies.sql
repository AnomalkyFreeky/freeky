-- FREÆŽ-KY // Facility access to discounts and managed site content.
-- Requires database/007_facility_staff_policies.sql first.

grant select, insert, update, delete on public.discounts to authenticated;
grant select, insert, update, delete on public.homepage_content to authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select, insert, update, delete on public.managed_content to authenticated;

drop policy if exists "Facility directors can manage discounts" on public.discounts;
create policy "Facility directors can manage discounts" on public.discounts for all to authenticated
using (public.facility_role_in(array['admin','director']))
with check (public.facility_role_in(array['admin','director']));

drop policy if exists "Facility directors can manage homepage content" on public.homepage_content;
create policy "Facility directors can manage homepage content" on public.homepage_content for all to authenticated
using (public.facility_role_in(array['admin','director']))
with check (public.facility_role_in(array['admin','director']));

drop policy if exists "Facility admins can manage site settings" on public.site_settings;
create policy "Facility admins can manage site settings" on public.site_settings for all to authenticated
using (public.facility_role_in(array['admin']))
with check (public.facility_role_in(array['admin']));

drop policy if exists "Facility directors can manage managed content" on public.managed_content;
create policy "Facility directors can manage managed content" on public.managed_content for all to authenticated
using (public.facility_role_in(array['admin','director']))
with check (public.facility_role_in(array['admin','director']));
