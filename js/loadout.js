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
    const selectedVariant = FREEKY.products.selectedVariant();
    // A Supabase-backed item must always resolve to its exact in-stock variant.
    if(s.currentItem.catalog && !selectedVariant){
      s.cartMsg = 'THIS SIZE / COLOR IS NO LONGER AVAILABLE'; FREEKY.products.render(); return;
    }
    const colors = FREEKY.products.colorOptions(s.currentItem);
    const colorObj = colors.find(c=>c.hex===s.selectedColor) || colors[0];
    s.cart.push({
      file:s.currentItem.file,
      name:s.currentItem.catalog && s.currentItem.catalog.name || s.currentItem.name,
      color:colorObj.name,
      size:s.selectedSize,
      req:s.currentItem.req,
      variantId:selectedVariant ? selectedVariant.id : null,
      unitPrice:selectedVariant && selectedVariant.price != null ? Number(selectedVariant.price) : FREEKY.data.productPrices[s.currentItem.file]
    });
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
          <div class="cr-status">STATUS <span>READY</span> <strong class="cart-item-price" data-cart-price="${i}">${c.unitPrice != null ? `£${Number(c.unitPrice).toFixed(2)}` : 'PRICE PENDING'}</strong></div>
        </div>
        <button class="cr-remove" onclick="FREEKY.loadout.remove(${i})">✕</button>
      </div>
    `).join('') + `
      <div class="cart-total"><span>ALLOCATED EQUIPMENT</span><span>${s.cart.length} UNIT${s.cart.length===1?'':'S'}</span></div>
      <div id="cartPricing"><div class="cart-total"><span>SUBTOTAL</span><span>CALCULATING…</span></div></div>
      <div class="cart-total"><span>DEPLOYMENT ROUTE</span><span>STANDARD — DIVISION TRANSPORT</span></div>
      <div class="cart-total"><span>DEPLOYMENT PACKAGE</span><span>READY FOR AUTHORIZATION</span></div>
      <button class="btn" style="width:100%; justify-content:center; margin-top:20px;" onclick="FREEKY.navigation.navTo('deploy')">Authorize Deployment →</button>
    `;
    FREEKY.loadout.refreshCartPricing();
  },

  async refreshCartPricing(){
    const s = FREEKY.state;
    const pricing = document.getElementById('cartPricing');
    if(!pricing || !s.cart.length) return;
    try{
      const variants = await Promise.all(s.cart.map(c => FREEKY.loadout.findVariant(c)));
      if(pricing !== document.getElementById('cartPricing')) return;
      const subtotal = variants.reduce((sum, variant, index) => {
        const price = variant && variant.price != null ? Number(variant.price) : Number(s.cart[index].unitPrice || 0);
        const label = document.querySelector(`[data-cart-price="${index}"]`);
        if(label) label.textContent = `£${price.toFixed(2)}`;
        if(variant && variant.price != null) s.cart[index].unitPrice = price;
        return sum + price;
      }, 0);
      FREEKY.storage.set('freeky_loadout', s.cart);
      const discount = s.appliedDiscount ? Math.min(s.appliedDiscount.type === 'percentage' ? subtotal * (Number(s.appliedDiscount.value)/100) : Number(s.appliedDiscount.value), subtotal) : 0;
      pricing.innerHTML = `<div class="cart-total"><span>SUBTOTAL</span><span>£${subtotal.toFixed(2)}</span></div>${discount ? `<div class="cart-total"><span>DISCOUNT (${s.appliedDiscount.code})</span><span>-£${discount.toFixed(2)}</span></div><div class="cart-total"><span>TOTAL</span><span>£${(subtotal-discount).toFixed(2)}</span></div>` : ''}`;
    }catch(e){
      if(pricing === document.getElementById('cartPricing')) pricing.innerHTML = '<div class="cart-total"><span>SUBTOTAL</span><span>UNAVAILABLE</span></div>';
    }
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

    if(!agent || !address || !email){
      msg.textContent = 'AGENT NAME, DEPLOYMENT COORDINATES AND TRANSMISSION ADDRESS ARE REQUIRED.';
      msg.className = 'acct-msg err';
      return;
    }
    if(!FREEKY.account.hasSupabase() || !FREEKY.account.currentProfile){
      msg.textContent = 'SIGN IN TO SUBMIT AN ORDER REQUEST.';
      msg.className = 'acct-msg err';
      return;
    }
    msg.textContent = 'SUBMITTING ORDER REQUEST...';
    msg.className = 'acct-msg';

    if(FREEKY.account.hasSupabase() && FREEKY.account.currentProfile){
      try{
        const order = await FREEKY.loadout.atomicCheckout({agent, address, city, postal, country, phone});
        if(!order) throw new Error('ORDER COULD NOT BE CREATED');
      }catch(e){
        msg.textContent = (e.message || 'AUTHORIZATION COULD NOT BE COMPLETED.').toUpperCase();
        msg.className = 'acct-msg err';
        return;
        // Real backend hiccup — deployment still proceeds locally rather than
        // blocking the visitor. Logged for whoever's debugging the migration.
        console.error('FREƎ-KY: order write failed, deployment proceeded locally only.', e);
      }
    }

    s.cart = [];
    FREEKY.storage.set('freeky_loadout', s.cart);
    s.appliedDiscount = null;
    s.deploymentsCount += 1; // Deployment history — full record now lives in `orders` when logged in
    FREEKY.storage.set('freeky_deployments', s.deploymentsCount);
    FREEKY.loadout.updateBadge();
    if(FREEKY.personnel) FREEKY.personnel.logIncident('Recovered Equipment');
    FREEKY.navigation.showScreen('deployed');
    FREEKY.ui.scheduleGlitchScan();
  },

  async atomicCheckout(dest){
    const s = FREEKY.state;
    const variants = await Promise.all(s.cart.map(c => FREEKY.loadout.findVariant(c)));
    if(variants.some(v => !v || !v.id)) throw new Error('ONE OR MORE SELECTED ITEMS ARE NO LONGER AVAILABLE');
    const { data, error } = await supabaseClient.rpc('checkout_loadout', {
      p_items: variants.map(v => ({ variant_id: v.id, quantity: 1 })),
      p_shipping: { name:dest.agent, address_line_1:dest.address, city:dest.city, postcode:dest.postal, country:dest.country, phone:dest.phone },
      p_discount_code: s.appliedDiscount ? s.appliedDiscount.code : null
    });
    if(error) throw error;
    s.appliedDiscount = null;
    return data;
  },

  async writeOrderToSupabase(dest){
    const s = FREEKY.state;
    const profile = FREEKY.account.currentProfile;

    const { resolved, subtotal } = await FREEKY.loadout.resolveCartPricing();

    let discountAmount = 0;
    const applied = s.appliedDiscount;
    if(applied){
      discountAmount = applied.type === 'percentage'
        ? subtotal * (Number(applied.value) / 100)
        : Number(applied.value);
      discountAmount = Math.min(discountAmount, subtotal);
    }
    const total = subtotal - discountAmount;

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
        discount: discountAmount,
        tax: 0,
        total: total
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

    // Discount code applied — record the use. Not perfectly race-safe under
    // concurrent checkouts, but fine at this store's scale; a Postgres RPC
    // with an atomic increment would be the next step if that ever matters.
    if(applied){
      try{
        const { data: current } = await supabaseClient.from('discounts').select('usage_count').eq('id', applied.id).single();
        await supabaseClient.from('discounts').update({ usage_count: (current ? current.usage_count : 0) + 1 }).eq('id', applied.id);
      }catch(e){ /* non-critical — order already went through */ }
      s.appliedDiscount = null;
    }

    return true;
  },

  // Resolves every cart item to its Supabase product_variant + price, and
  // sums the total. Shared by the discount preview and the real checkout
  // write, so both always agree on the subtotal.
  async resolveCartPricing(){
    const s = FREEKY.state;
    const resolved = [];
    for(const c of s.cart){
      const variant = await FREEKY.loadout.findVariant(c);
      resolved.push({ cartItem: c, variant });
    }
    const subtotal = resolved.reduce((sum, r) => sum + (r.variant && r.variant.price ? Number(r.variant.price) : 0), 0);
    return { resolved, subtotal };
  },

  async applyDiscount(){
    const s = FREEKY.state;
    const input = document.getElementById('dDiscountCode');
    const msg = document.getElementById('discountMsg');
    const preview = document.getElementById('discountPreview');
    const code = (input.value || '').trim().toUpperCase();
    preview.innerHTML = '';

    if(!code){
      s.appliedDiscount = null;
      msg.textContent = ''; msg.className = 'acct-msg';
      return;
    }
    if(!FREEKY.account.hasSupabase()){
      msg.textContent = 'DISCOUNT CODES REQUIRE AN ACTIVE CONNECTION.'; msg.className = 'acct-msg err';
      return;
    }

    msg.textContent = 'VERIFYING CODE...'; msg.className = 'acct-msg';

    try{
      const { data: discount } = await supabaseClient
        .from('discounts').select('*').eq('code', code).eq('active', true).single();

      if(!discount){
        s.appliedDiscount = null;
        msg.textContent = 'CODE NOT RECOGNIZED OR INACTIVE.'; msg.className = 'acct-msg err';
        return;
      }
      if(discount.expires_at && new Date(discount.expires_at) < new Date()){
        s.appliedDiscount = null;
        msg.textContent = 'CODE HAS EXPIRED.'; msg.className = 'acct-msg err';
        return;
      }
      if(discount.usage_limit && discount.usage_count >= discount.usage_limit){
        s.appliedDiscount = null;
        msg.textContent = 'CODE HAS REACHED ITS USE LIMIT.'; msg.className = 'acct-msg err';
        return;
      }

      const { subtotal } = await FREEKY.loadout.resolveCartPricing();

      if(discount.min_order_total && subtotal < discount.min_order_total){
        s.appliedDiscount = null;
        msg.textContent = `REQUIRES A MINIMUM LOADOUT OF £${Number(discount.min_order_total).toFixed(2)}.`; msg.className = 'acct-msg err';
        return;
      }

      s.appliedDiscount = { id: discount.id, code: discount.code, type: discount.type, value: discount.value };
      const discountAmount = Math.min(
        discount.type === 'percentage' ? subtotal * (Number(discount.value)/100) : Number(discount.value),
        subtotal
      );
      msg.textContent = 'CODE ACCEPTED.'; msg.className = 'acct-msg ok';
      preview.innerHTML = `
        <div class="cart-total"><span>SUBTOTAL</span><span>£${subtotal.toFixed(2)}</span></div>
        <div class="cart-total"><span>DISCOUNT (${discount.code})</span><span>-£${discountAmount.toFixed(2)}</span></div>
        <div class="cart-total"><span>TOTAL</span><span>£${(subtotal-discountAmount).toFixed(2)}</span></div>
      `;
    }catch(e){
      s.appliedDiscount = null;
      msg.textContent = 'COULD NOT VERIFY CODE.'; msg.className = 'acct-msg err';
    }
  },

  // Cart items only carry our local product code (e.g. "O-001"), never a
  // real Supabase id — resolve it here via products.code. Returns null if
  // unmatched (e.g. the product hasn't been added to Supabase yet), and the
  // order still gets created either way, just without that line item linked.
  async findVariant(cartItem){
    try{
      if(cartItem.variantId){
        const { data: exactVariant } = await supabaseClient
          .from('product_variants').select('id, price, stock, active').eq('id', cartItem.variantId).single();
        return exactVariant && exactVariant.active && Number(exactVariant.stock) > 0 ? exactVariant : null;
      }
      const { data: product } = await supabaseClient
        .from('products').select('id').eq('code', cartItem.file).single();
      if(!product) return null;
      const { data: variant } = await supabaseClient
        .from('product_variants').select('id, price, stock, active, sizes!inner(name), colors!inner(name)')
        .eq('product_id', product.id).eq('sizes.name', cartItem.size).eq('colors.name', cartItem.color).limit(1).single();
      if(variant && (!variant.active || Number(variant.stock) < 1)) return null;
      return variant || null;
    }catch(e){ return null; }
  }
};
