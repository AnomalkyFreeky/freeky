-- FREÆŽ-KY // Facility access to catalog, drops, variants and image records.
-- Requires database/007_facility_staff_policies.sql to have been executed first.

-- RLS policies below control *which* records staff can access. These grants
-- allow the authenticated browser role to reach the tables at all.
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.drops to authenticated;
grant select, insert, update, delete on public.product_variants to authenticated;
grant select, insert, update, delete on public.product_images to authenticated;

drop policy if exists "Facility staff can manage products" on public.products;
create policy "Facility staff can manage products" on public.products for all to authenticated
using (public.facility_role_in(array['admin','director','staff']))
with check (public.facility_role_in(array['admin','director','staff']));

drop policy if exists "Facility directors can manage drops" on public.drops;
create policy "Facility directors can manage drops" on public.drops for all to authenticated
using (public.facility_role_in(array['admin','director']))
with check (public.facility_role_in(array['admin','director']));

drop policy if exists "Facility staff can manage variants" on public.product_variants;
create policy "Facility staff can manage variants" on public.product_variants for all to authenticated
using (public.facility_role_in(array['admin','director','staff']))
with check (public.facility_role_in(array['admin','director','staff']));

drop policy if exists "Facility staff can manage product images" on public.product_images;
create policy "Facility staff can manage product images" on public.product_images for all to authenticated
using (public.facility_role_in(array['admin','director','staff']))
with check (public.facility_role_in(array['admin','director','staff']));
