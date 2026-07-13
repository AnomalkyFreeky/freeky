/* ==============================================================
   FREƎ-KY // LOADOUT — equipment assignment, not shopping
   --------------------------------------------------------------
   Cart state persists through FREEKY.storage so it survives a
   page refresh. Deployment Authorization (checkout) also lives
   here since it operates directly on the same cart.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.loadout = {

  add(){
    const s = FREEKY.state;
    if(!s.currentItem) return;
    if(!s.selectedSize){ s.cartMsg = 'SELECT A SIZE FIRST'; FREEKY.products.render(); return; }
    const colorObj = FREEKY.data.colorOptions.find(c=>c.hex===s.selectedColor) || FREEKY.data.colorOptions[0];
    s.cart.push({file:s.currentItem.file, name:s.currentItem.name, color:colorObj.name, size:s.selectedSize, req:s.currentItem.req});
    FREEKY.storage.set('freeky_loadout', s.cart);
    s.cartMsg = 'FILE ADDED TO LOADOUT — STATUS UPDATED';
    FREEKY.products.render();
    FREEKY.loadout.updateBadge();
  },

  remove(i){
    const s = FREEKY.state;
    s.cart.splice(i,1);
    FREEKY.storage.set('freeky_loadout', s.cart);
    FREEKY.loadout.renderCart();
    FREEKY.loadout.updateBadge();
  },

  renderCart(){
    const s = FREEKY.state;
    const box = document.getElementById('cartSection');
    if(!box) return;
    if(s.cart.length === 0){
      box.innerHTML = `
        <div class="loadout-empty">
          <div class="le-tag glitch" data-text="NO EQUIPMENT ASSIGNED">NO EQUIPMENT ASSIGNED</div>
          <p>You currently have no equipment awaiting deployment. Return to the Manifest to continue assembling your loadout.</p>
          <button class="btn ghost" style="margin-top:16px;" onclick="FREEKY.navigation.navTo('manifest')">Return to Manifest</button>
        </div>
      `;
      return;
    }
    box.innerHTML = s.cart.map((c,i) => `
      <div class="cart-row">
        <div class="cr-info">
          <div class="cr-name">${c.name}</div>
          <div class="cr-meta">FILE ${c.file} · ${c.color} · SIZE ${c.size} · ${c.req}</div>
          <div class="cr-status">STATUS <span>READY</span></div>
        </div>
        <button class="cr-remove" onclick="FREEKY.loadout.remove(${i})">✕</button>
      </div>
    `).join('') + `
      <div class="cart-total"><span>ALLOCATED EQUIPMENT</span><span>${s.cart.length} UNIT${s.cart.length===1?'':'S'}</span></div>
      <div class="cart-total"><span>DEPLOYMENT ROUTE</span><span>STANDARD — DIVISION TRANSPORT</span></div>
      <div class="cart-total"><span>DEPLOYMENT PACKAGE</span><span>READY FOR AUTHORIZATION</span></div>
      <button class="btn" style="width:100%; justify-content:center; margin-top:20px;" onclick="FREEKY.navigation.navTo('deploy')">Authorize Deployment →</button>
    `;
  },

  updateBadge(){
    const el = document.getElementById('nav-result');
    if(!el) return;
    const badge = el.querySelector('.no');
    if(badge) badge.textContent = FREEKY.state.cart.length > 0 ? String(FREEKY.state.cart.length) : '—';
  },

  /* ===== DEPLOYMENT AUTHORIZATION (checkout) =====
     STEP 2 of the gradual Supabase migration: if the visitor is logged in
     (real Your File / profiles row) and Supabase is configured, this now
     writes a real row to `orders` + `order_items`. Otherwise it behaves
     exactly as before — local-only, nothing breaks.

     ASSUMPTIONS TO CONFIRM (guessed, since the enum values weren't in the
     schema export — easy to change here if wrong):
       - orders.status default guessed as 'pending'
       - orders.payment_status default guessed as 'pending'
     Product matching: cart items are keyed by our local product code
     (e.g. "O-001"), matched against products.code in Supabase.
  */
  async deploy(){
    const s = FREEKY.state;
    const msg = document.getElementById('deployMsg');
    const agent = (document.getElementById('dAgent').value || '').trim();
    const address = (document.getElementById('dAddress').value || '').trim();
    const city = (document.getElementById('dCity').value || '').trim();
    const postal = (document.getElementById('dPostal').value || '').trim();
    const country = (document.getElementById('dCountry').value || '').trim();
    const phone = (document.getElementById('dPhone').value || '').trim();
    const email = (document.getElementById('dEmail').value || '').trim();
    const card = (document.getElementById('dCard').value || '').trim();

    if(!agent || !address || !email){
      msg.textContent = 'AGENT NAME, DEPLOYMENT COORDINATES AND TRANSMISSION ADDRESS ARE REQUIRED.';
      msg.className = 'acct-msg err';
      return;
    }
    if(!card){
      msg.textContent = 'AUTHORIZATION CREDENTIALS REQUIRED.';
      msg.className = 'acct-msg err';
      return;
    }

    msg.textContent = 'AUTHORIZING...';
    msg.className = 'acct-msg';

    if(FREEKY.account.hasSupabase() && FREEKY.account.currentProfile){
      try{
        await FREEKY.loadout.writeOrderToSupabase({agent, address, city, postal, country, phone});
      }catch(e){
        // Real backend hiccup — deployment still proceeds locally rather than
        // blocking the visitor. Logged for whoever's debugging the migration.
        console.error('FREƎ-KY: order write failed, deployment proceeded locally only.', e);
      }
    }

    s.cart = [];
    FREEKY.storage.set('freeky_loadout', s.cart);
    s.deploymentsCount += 1; // Deployment history — full record now lives in `orders` when logged in
    FREEKY.storage.set('freeky_deployments', s.deploymentsCount);
    FREEKY.loadout.updateBadge();
    if(FREEKY.personnel) FREEKY.personnel.logIncident('Recovered Equipment');
    FREEKY.navigation.showScreen('deployed');
    FREEKY.ui.scheduleGlitchScan();
  },

  async writeOrderToSupabase(dest){
    const s = FREEKY.state;
    const profile = FREEKY.account.currentProfile;

    const resolved = [];
    for(const c of s.cart){
      const variant = await FREEKY.loadout.findVariant(c);
      resolved.push({ cartItem: c, variant });
    }

    const subtotal = resolved.reduce((sum, r) => sum + (r.variant && r.variant.price ? Number(r.variant.price) : 0), 0);

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: profile.user_id,
        order_number: 'FK-' + Date.now(),
        status: 'pending',          // guessed enum value — confirm and adjust if needed
        payment_status: 'pending',  // guessed enum value — confirm and adjust if needed
        shipping_name: dest.agent,
        shipping_phone: dest.phone || null,
        shipping_country: dest.country || null,
        shipping_city: dest.city || null,
        shipping_postcode: dest.postal || null,
        shipping_address_line_1: dest.address,
        subtotal: subtotal,
        shipping_cost: 0,
        discount: 0,
        tax: 0,
        total: subtotal
      })
      .select()
      .single();

    if(orderError || !order) return false;

    const rows = resolved
      .filter(r => r.variant && r.variant.id)
      .map(r => ({
        order_id: order.id,
        product_variant_id: r.variant.id,
        quantity: 1,
        unit_price: r.variant.price || 0,
        line_total: r.variant.price || 0
      }));

    if(rows.length){
      await supabaseClient.from('order_items').insert(rows);
    }
    return true;
  },

  // Cart items only carry our local product code (e.g. "O-001"), never a
  // real Supabase id — resolve it here via products.code. Returns null if
  // unmatched (e.g. the product hasn't been added to Supabase yet), and the
  // order still gets created either way, just without that line item linked.
  async findVariant(cartItem){
    try{
      const { data: product } = await supabaseClient
        .from('products').select('id').eq('code', cartItem.file).single();
      if(!product) return null;
      const { data: variant } = await supabaseClient
        .from('product_variants').select('id, price').eq('product_id', product.id).limit(1).single();
      return variant || null;
    }catch(e){ return null; }
  }
};
