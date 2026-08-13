/* ==============================================================
   FREÆŽ-KY // ADMIN CONTENT SERVICE
   --------------------------------------------------------------
   CMS-style data operations: drops, discounts, homepage blocks and
   global text settings. Facility Control only renders the forms.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.adminContent = {
  async listDropsWithCounts(){
    const [{ data:drops, error }, { data:products, error:productsError }] = await Promise.all([
      supabaseClient.from('drops').select('*').order('drop_number', {ascending:true}),
      supabaseClient.from('products').select('id, drop_id')
    ]);
    if(error || productsError) throw (error || productsError);
    const counts = (products || []).reduce((result, product) => {
      if(product.drop_id) result[product.drop_id] = (result[product.drop_id] || 0) + 1;
      return result;
    }, {});
    return { drops:drops || [], counts };
  },

  async saveDrop(id, payload){ return FREEKY.adminContent.saveRecord('drops', id, payload); },
  async listDiscounts(){ return FREEKY.adminContent.listRecords('discounts', 'created_at', false); },
  async saveDiscount(id, payload){ return FREEKY.adminContent.saveRecord('discounts', id, payload); },
  async listHomepageBlocks(){ return FREEKY.adminContent.listRecords('homepage_content', 'sort_order', true); },
  async saveHomepageBlock(id, payload){ return FREEKY.adminContent.saveRecord('homepage_content', id, payload); },
  async listSettings(){ return FREEKY.adminContent.listRecords('site_settings', 'key', true); },

  async saveSettings(rows){
    const { error } = await supabaseClient.from('site_settings').upsert(rows, { onConflict:'key' });
    if(error) throw error;
    return rows;
  },

  async addSetting(key){
    const { data, error } = await supabaseClient.from('site_settings').insert({ key, value:'' }).select().single();
    if(error) throw error;
    return data;
  },

  async getManagedContent(key){
    const { data, error } = await supabaseClient.from('managed_content').select('content_value').eq('content_key', key).maybeSingle();
    if(error) throw error;
    return data ? data.content_value : null;
  },

  async saveManagedContent(key, value){
    const { data, error } = await supabaseClient.from('managed_content')
      .upsert({ content_key:key, content_value:value, updated_at:new Date().toISOString() }, {onConflict:'content_key'})
      .select('content_value').single();
    if(error) throw error;
    return data.content_value;
  },

  async listRecords(table, column, ascending){
    const { data, error } = await supabaseClient.from(table).select('*').order(column, {ascending});
    if(error) throw error;
    return data || [];
  },

  async saveRecord(table, id, payload){
    if(id){
      const { data, error } = await supabaseClient.from(table).update(payload).eq('id', id).select().single();
      if(error) throw error;
      return data;
    }
    const { data, error } = await supabaseClient.from(table).insert(payload).select().single();
    if(error) throw error;
    return data;
  }
};
