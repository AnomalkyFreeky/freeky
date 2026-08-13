-- FREÆŽ-KY — product image uploads for Facility Control
-- Run once in Supabase SQL Editor. The bucket is public only for viewing;
-- only staff (as defined by public.is_staff()) can upload or change files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff can upload product images" on storage.objects;
drop policy if exists "Staff can update product images" on storage.objects;
drop policy if exists "Staff can delete product images" on storage.objects;

create policy "Staff can upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_staff());

create policy "Staff can update product images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.is_staff())
with check (bucket_id = 'product-images' and public.is_staff());

create policy "Staff can delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_staff());
