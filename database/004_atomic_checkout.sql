-- Run once in Supabase SQL Editor. Atomic checkout: the transaction locks
-- variants, checks stock/prices, calculates discounts, creates the order and
-- decrements stock together. Any failure rolls back every change.
create or replace function public.checkout_loadout(p_items jsonb, p_shipping jsonb, p_discount_code text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid(); v_item record; v_variant record; v_discount public.discounts%rowtype;
  v_lines jsonb := '[]'::jsonb; v_subtotal numeric := 0; v_discount_amount numeric := 0;
  v_order_id uuid; v_order_number text;
begin
  if v_user_id is null then raise exception 'Sign in is required.' using errcode = '42501'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your loadout is empty.' using errcode = '22023'; end if;
  if coalesce(trim(p_shipping->>'name'), '') = '' or coalesce(trim(p_shipping->>'address_line_1'), '') = '' or coalesce(trim(p_shipping->>'city'), '') = '' or coalesce(trim(p_shipping->>'postcode'), '') = '' or coalesce(trim(p_shipping->>'country'), '') = '' then raise exception 'Complete shipping details are required.' using errcode = '22023'; end if;

  for v_item in select (entry->>'variant_id')::uuid as variant_id, sum((entry->>'quantity')::integer)::integer as quantity from jsonb_array_elements(p_items) as entry group by (entry->>'variant_id')::uuid loop
    if v_item.quantity is null or v_item.quantity < 1 then raise exception 'Invalid quantity.' using errcode = '22023'; end if;
    select pv.id, pv.price, pv.stock, pv.active, p.active as product_active, p.status as product_status into v_variant from public.product_variants pv join public.products p on p.id = pv.product_id where pv.id = v_item.variant_id for update of pv;
    if not found or not v_variant.active or not v_variant.product_active or v_variant.product_status <> 'available' then raise exception 'One selected item is no longer available.' using errcode = 'P0001'; end if;
    if v_variant.stock < v_item.quantity then raise exception 'Insufficient stock for a selected size or colour.' using errcode = 'P0001'; end if;
    if v_variant.price is null or v_variant.price < 0 then raise exception 'A selected item has no valid price.' using errcode = 'P0001'; end if;
    v_subtotal := v_subtotal + (v_variant.price * v_item.quantity);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('variant_id', v_variant.id, 'quantity', v_item.quantity, 'unit_price', v_variant.price));
  end loop;

  if nullif(trim(coalesce(p_discount_code, '')), '') is not null then
    select * into v_discount from public.discounts where upper(code) = upper(trim(p_discount_code)) for update;
    if not found or not v_discount.active or (v_discount.starts_at is not null and v_discount.starts_at > now()) or (v_discount.expires_at is not null and v_discount.expires_at <= now()) or (v_discount.usage_limit is not null and v_discount.usage_count >= v_discount.usage_limit) or (v_discount.min_order_total is not null and v_subtotal < v_discount.min_order_total) then raise exception 'This discount code is no longer valid.' using errcode = 'P0001'; end if;
    v_discount_amount := case when v_discount.type = 'percentage' then v_subtotal * (v_discount.value / 100) else v_discount.value end;
    v_discount_amount := least(v_discount_amount, v_subtotal);
    update public.discounts set usage_count = usage_count + 1, updated_at = now() where id = v_discount.id;
  end if;

  v_order_number := 'FK-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  insert into public.orders (user_id, order_number, status, payment_status, currency, subtotal, shipping_cost, discount, tax, total, shipping_name, shipping_company, shipping_phone, shipping_country, shipping_county, shipping_city, shipping_postcode, shipping_address_line_1, shipping_address_line_2) values (v_user_id, v_order_number, 'pending', 'pending', 'GBP', v_subtotal, 0, v_discount_amount, 0, v_subtotal-v_discount_amount, trim(p_shipping->>'name'), nullif(trim(p_shipping->>'company'), ''), nullif(trim(p_shipping->>'phone'), ''), trim(p_shipping->>'country'), nullif(trim(p_shipping->>'county'), ''), trim(p_shipping->>'city'), trim(p_shipping->>'postcode'), trim(p_shipping->>'address_line_1'), nullif(trim(p_shipping->>'address_line_2'), '')) returning id into v_order_id;
  for v_item in select * from jsonb_to_recordset(v_lines) as x(variant_id uuid, quantity integer, unit_price numeric) loop
    update public.product_variants set stock = stock - v_item.quantity, updated_at = now() where id = v_item.variant_id;
    insert into public.order_items (order_id, product_variant_id, quantity, unit_price, line_total) values (v_order_id, v_item.variant_id, v_item.quantity, v_item.unit_price, v_item.unit_price*v_item.quantity);
  end loop;
  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'total', v_subtotal-v_discount_amount);
end; $$;

revoke all on function public.checkout_loadout(jsonb, jsonb, text) from public;
grant execute on function public.checkout_loadout(jsonb, jsonb, text) to authenticated;
drop policy if exists "Users can insert their own orders" on public.orders;
drop policy if exists "Users can insert items on their own orders" on public.order_items;
