/* ==============================================================
   FREÆŽ-KY // CATALOG SERVICE
   --------------------------------------------------------------
   The single boundary for public product/variant reads. UI modules render
   data; this service owns Supabase queries and a small in-memory cache.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.catalog = {
  products: {},

  configured(){ return FREEKY.account && FREEKY.account.hasSupabase(); },

  async getProduct(code){
    const cached = FREEKY.catalog.products[code];
    if(cached && Array.isArray(cached.product_variants)) return cached;
    if(!FREEKY.catalog.configured()) return null;
    try{
      const { data, error } = await supabaseClient
        .from('products')
        .select('id, code, name, description, short_description, price, active, status, product_images(image_url, alt_text, sort_order, is_primary), product_variants(id, price, stock, active, sizes(name, sort_order), colors(name, hex))')
        .eq('code', code)
        .single();
      if(error || !data) return null;
      data.product_images = (data.product_images || []).sort((a,b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order || 0) - (b.sort_order || 0));
      FREEKY.catalog.products[code] = data;
      return data;
    }catch(e){ return null; }
  },

  async getProductCards(codes){
    const missing = codes.filter(code => !FREEKY.catalog.products[code]);
    if(!missing.length || !FREEKY.catalog.configured()) return codes.map(code => FREEKY.catalog.products[code]).filter(Boolean);
    try{
      const { data, error } = await supabaseClient
        .from('products')
        .select('id, code, name, price, active, status, product_images(image_url, alt_text, sort_order, is_primary)')
        .in('code', missing);
      if(error || !data) return [];
      data.forEach(product => {
        product.product_images = (product.product_images || []).sort((a,b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order || 0) - (b.sort_order || 0));
        FREEKY.catalog.products[product.code] = Object.assign(FREEKY.catalog.products[product.code] || {}, product);
      });
      return codes.map(code => FREEKY.catalog.products[code]).filter(Boolean);
    }catch(e){ return []; }
  }
};
