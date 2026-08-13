/* ==============================================================
   FREÆŽ-KY // ADMIN CATALOG SERVICE
   --------------------------------------------------------------
   Product, image and Storage writes used only by Facility Control.
   RLS remains the actual security boundary; this file just keeps database
   work out of the admin interface module.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.adminCatalog = {
  async listProductsAndDrops(){
    const [{ data: products, error }, { data: drops, error: dropsError }] = await Promise.all([
      supabaseClient.from('products').select('*').order('code', {ascending:true}),
      supabaseClient.from('drops').select('*').order('drop_number', {ascending:true})
    ]);
    if(error || dropsError) throw (error || dropsError);
    return { products:products || [], drops:drops || [] };
  },

  async saveProduct(id, payload){
    if(id){
      const { data, error } = await supabaseClient.from('products').update(payload).eq('id', id).select().single();
      if(error) throw error;
      return data;
    }
    const { data, error } = await supabaseClient.from('products').insert(payload).select().single();
    if(error) throw error;
    return data;
  },

  async getImages(productId){
    const { data, error } = await supabaseClient.from('product_images').select('*').eq('product_id', productId).order('sort_order', {ascending:true});
    if(error) throw error;
    return data || [];
  },

  async listAllImages(){
    const { data, error } = await supabaseClient
      .from('product_images')
      .select('id, product_id, image_url, alt_text, sort_order, is_primary, products(name, code)')
      .order('created_at', {ascending:false});
    if(error) throw error;
    return data || [];
  },

  async saveImages(rows){
    if(!rows.length) return;
    const { error } = await supabaseClient.from('product_images').upsert(rows);
    if(error) throw error;
  },

  async addImage(productId, imageUrl, altText, sortOrder, primary){
    const { error } = await supabaseClient.from('product_images').insert({ product_id:productId, image_url:imageUrl, alt_text:altText || null, sort_order:sortOrder, is_primary:primary });
    if(error) throw error;
  },

  async uploadImage(productId, file, altText, sortOrder, primary){
    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${productId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabaseClient.storage.from('product-images').upload(path, file, { contentType:file.type, upsert:false });
    if(uploadError) throw uploadError;
    const { data: urlData } = supabaseClient.storage.from('product-images').getPublicUrl(path);
    try{
      await FREEKY.adminCatalog.addImage(productId, urlData.publicUrl, altText, sortOrder, primary);
    }catch(error){
      await supabaseClient.storage.from('product-images').remove([path]);
      throw error;
    }
  },

  async deleteImage(imageId){
    const { error } = await supabaseClient.from('product_images').delete().eq('id', imageId);
    if(error) throw error;
  }
};
