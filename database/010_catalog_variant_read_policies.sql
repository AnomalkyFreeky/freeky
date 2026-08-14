-- FREÆŽ-KY // public catalog reads plus Facility variant reference data.
-- Variants, sizes and colours must be readable by the storefront so it can
-- show a buyable size/colour selection and stock availability.

grant select on public.product_variants to anon, authenticated;
grant select on public.sizes to anon, authenticated;
grant select on public.colors to anon, authenticated;
grant select on public.product_images to anon, authenticated;

drop policy if exists "Public can view active product variants" on public.product_variants;
create policy "Public can view active product variants" on public.product_variants for select
using (active = true);

drop policy if exists "Public can view sizes" on public.sizes;
create policy "Public can view sizes" on public.sizes for select using (true);

drop policy if exists "Public can view colors" on public.colors;
create policy "Public can view colors" on public.colors for select using (true);

drop policy if exists "Public can view product images" on public.product_images;
create policy "Public can view product images" on public.product_images for select using (true);
