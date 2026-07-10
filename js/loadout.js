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

  /* ===== DEPLOYMENT AUTHORIZATION (checkout) ===== */
  deploy(){
    const s = FREEKY.state;
    const msg = document.getElementById('deployMsg');
    const agent = (document.getElementById('dAgent').value || '').trim();
    const address = (document.getElementById('dAddress').value || '').trim();
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
    s.cart = [];
    FREEKY.storage.set('freeky_loadout', s.cart);
    s.deploymentsCount += 1; // Deployment history — future DB: append full deployment record, not just a counter
    FREEKY.storage.set('freeky_deployments', s.deploymentsCount);
    FREEKY.loadout.updateBadge();
    FREEKY.navigation.showScreen('deployed');
    FREEKY.ui.scheduleGlitchScan();
  }
};
