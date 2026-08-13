/* ==============================================================
   FREÆŽ-KY // FACILITY UI — inventory and deployments
   ============================================================== */
window.FREEKY = window.FREEKY || {};

Object.assign(FREEKY.facility, {
  async moduleInventory(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">04 // INVENTORY</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">04 // INVENTORY</div><p class="pf-empty">Database not configured.</p></div>`;
      return;
    }
    try{
      FREEKY.facility.productsCache = await FREEKY.adminOperations.listInventory();
      FREEKY.facility.renderInventoryList(content);
    }catch(e){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">04 // INVENTORY</div><p class="pf-empty">Archive unreachable.</p></div>`; }
  },

  renderInventoryList(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">04 // INVENTORY</div>${FREEKY.facility.productsCache.map(product => {
      const variants = product.product_variants || [];
      const total = variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
      const low = variants.some(variant => Number(variant.stock) <= 5);
      return `<div class="fc-user-row"><div><div class="fc-user-name">${product.name}</div><div class="pf-empty">${product.code} · ${variants.length} variant(s) · TOTAL STOCK ${total}${low ? ' · <span style="color:var(--red);">LOW STOCK</span>' : ''}</div></div><button class="btn ghost" onclick="FREEKY.facility.openInventoryGrid('${product.id}')">Manage Stock</button></div>`;
    }).join('')}</div>`;
  },

  async openInventoryGrid(productId){
    const content = document.getElementById('fcContent');
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">04 // INVENTORY</div><p class="pf-empty">Reading variants...</p></div>`;
    try{
      const variants = await FREEKY.adminOperations.listVariants(productId);
      const product = FREEKY.facility.productsCache.find(item => item.id === productId);
      content.innerHTML = `<div class="fc-module"><button class="back-btn" onclick="FREEKY.facility.renderInventoryList(document.getElementById('fcContent'))">← Back to Inventory</button><div class="fc-module-tag">STOCK // ${product ? product.name : ''}</div><div class="fc-stock-grid">${variants.map(variant => `<div class="fc-stock-cell"><span>${variant.sizes ? variant.sizes.name : '—'} · ${variant.colors ? variant.colors.name : '—'}</span><input type="number" min="0" class="fc-stock-input" data-variant-id="${variant.id}" value="${variant.stock}"></div>`).join('')}</div><div id="fcInvMsg" class="acct-msg"></div><div class="btn-row"><button class="btn" onclick="FREEKY.facility.saveInventoryGrid('${productId}')">Save Stock Levels</button></div></div>`;
    }catch(e){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">04 // INVENTORY</div><p class="pf-empty">Could not load variants.</p></div>`; }
  },

  async saveInventoryGrid(productId){
    const message = document.getElementById('fcInvMsg');
    const rows = Array.from(document.querySelectorAll('.fc-stock-input')).map(input => ({ id:input.dataset.variantId, stock:parseInt(input.value, 10) || 0 }));
    message.textContent = 'SAVING...'; message.className = 'acct-msg';
    try{
      await FREEKY.adminOperations.saveStock(rows);
      message.textContent = 'STOCK UPDATED.'; message.className = 'acct-msg ok';
      FREEKY.facility.logAction('Updated stock levels for product ' + productId);
    }catch(e){ message.textContent = 'COULD NOT SAVE ALL LEVELS.'; message.className = 'acct-msg err'; }
  },

  async moduleDeployments(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">05 // DEPLOYMENTS</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">05 // DEPLOYMENTS</div><p class="pf-empty">Database not configured.</p></div>`;
      return;
    }
    try{
      FREEKY.facility.ordersCache = await FREEKY.adminOperations.listOrders();
      FREEKY.facility.renderDeploymentsList(content);
    }catch(e){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">05 // DEPLOYMENTS</div><p class="pf-empty">Archive unreachable.</p></div>`; }
  },

  renderDeploymentsList(content){
    const statuses = ['pending','paid','processing','assigned','shipped','delivered','cancelled','refunded'];
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">05 // DEPLOYMENTS</div>${FREEKY.facility.ordersCache.length ? FREEKY.facility.ordersCache.map(order => `<div class="fc-order-row"><div><div class="fc-user-name">${order.order_number}</div><div class="pf-empty">${order.shipping_name || 'No agent name'} · ${new Date(order.created_at).toLocaleDateString('en-GB')} · £${Number(order.total || 0).toFixed(2)}</div></div><select onchange="FREEKY.facility.updateOrderStatus('${order.id}', this.value)" style="background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:11px; padding:8px 10px;">${statuses.map(status => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status.toUpperCase()}</option>`).join('')}</select></div>`).join('') : '<p class="pf-empty">No deployments on record.</p>'}<button class="btn ghost" style="margin-top:16px;" onclick="FREEKY.facility.exportOrdersCsv()">Export CSV</button></div>`;
  },

  async updateOrderStatus(orderId, status){
    try{
      await FREEKY.adminOperations.updateOrderStatus(orderId, status);
      const order = FREEKY.facility.ordersCache.find(item => item.id === orderId);
      if(order) order.status = status;
      FREEKY.facility.logAction('Updated deployment status: ' + orderId + ' → ' + status);
    }catch(e){ /* The current UI refreshes order state on the next visit. */ }
  },

  exportOrdersCsv(){
    const rows = [['order_number','status','total','created_at']].concat(FREEKY.facility.ordersCache.map(order => [order.order_number, order.status, order.total, order.created_at]));
    const csv = rows.map(row => row.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    const link = document.createElement('a'); link.href = url; link.download = 'deployments.csv'; link.click();
    URL.revokeObjectURL(url);
    FREEKY.facility.logAction('Exported deployments CSV');
  }
});
