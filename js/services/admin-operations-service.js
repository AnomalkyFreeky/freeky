/* ==============================================================
   FREÆŽ-KY // ADMIN OPERATIONS SERVICE
   --------------------------------------------------------------
   Inventory and order operations used by Facility Control.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.adminOperations = {
  async listInventory(){
    const { data, error } = await supabaseClient
      .from('products')
      .select('id, name, code, status, product_variants(stock)')
      .order('code', {ascending:true});
    if(error) throw error;
    return data || [];
  },

  async listVariants(productId){
    const { data, error } = await supabaseClient
      .from('product_variants')
      .select('id, stock, sizes(name, sort_order), colors(name)')
      .eq('product_id', productId);
    if(error) throw error;
    return (data || []).sort((a,b) => {
      const sizeOrder = (a.sizes ? a.sizes.sort_order : 0) - (b.sizes ? b.sizes.sort_order : 0);
      return sizeOrder || (a.colors ? a.colors.name : '').localeCompare(b.colors ? b.colors.name : '');
    });
  },

  async saveStock(rows){
    const writes = rows.map(row => supabaseClient.from('product_variants').update({ stock:row.stock }).eq('id', row.id));
    const results = await Promise.all(writes);
    const failed = results.find(result => result.error);
    if(failed) throw failed.error;
  },

  async listOrders(){
    const { data, error } = await supabaseClient.from('orders').select('*').order('created_at', {ascending:false});
    if(error) throw error;
    return data || [];
  },

  async updateOrderStatus(orderId, status){
    const { error } = await supabaseClient.from('orders').update({ status }).eq('id', orderId);
    if(error) throw error;
  }
};
