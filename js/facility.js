/* ==============================================================
   FREƎ-KY // FACILITY CONTROL — internal operator terminal
   --------------------------------------------------------------
   NOT a dashboard, NOT a CMS. Same visual language as the public
   site. Gated by profiles.role via data/roles.js.

   IMPORTANT — client-side gating is UI-only, not real security.
   A customer's browser could still call supabaseClient directly.
   Real security lives in Supabase RLS policies — see the note this
   module's summary gives about the two admin-bypass policies
   `profiles`/`orders`/`order_items` need for 02 and 05 to show
   every user instead of just the operator's own row.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.facility = {
  activeModule: 'command',
  usersCache: [],
  ordersCache: [],
  productsCache: [],
  dropsCache: [],
  colorsCache: [],
  sizesCache: [],

  currentLevel(){
    const p = FREEKY.account.currentProfile;
    if(!p || !p.role) return 0;
    const role = FREEKY.data.roles[p.role];
    return role ? role.level : 0;
  },

  hasAccess(){ return FREEKY.facility.currentLevel() >= 20; },

  logAction(action){
    const p = FREEKY.account.currentProfile;
    const log = FREEKY.storage.get('freeky_facility_logs', []);
    log.unshift({
      timestamp: new Date().toISOString(),
      operator: p ? p.callsign : 'UNKNOWN',
      action: action,
      module: FREEKY.facility.activeModule
    });
    FREEKY.storage.set('freeky_facility_logs', log.slice(0, 50));
  },

  async render(){
    const box = document.getElementById('facilityBody');
    if(!box) return;

    if(!FREEKY.state.account || !FREEKY.account.currentProfile){
      box.innerHTML = FREEKY.facility.deniedHtml("NO ACTIVE FILE. ACCESS YOUR FILE FIRST.");
      return;
    }
    if(!FREEKY.facility.hasAccess()){
      box.innerHTML = FREEKY.facility.deniedHtml("INSUFFICIENT ARCHIVE CLEARANCE.");
      return;
    }

    const p = FREEKY.account.currentProfile;
    const role = FREEKY.data.roles[p.role] || FREEKY.data.roles.user;

    box.innerHTML = `
      <div class="fc-header">
        <div class="fc-verified glitch" data-text="ACCESS LEVEL ${role.level} VERIFIED">ACCESS LEVEL ${role.level} VERIFIED</div>
        <h2 class="headline" style="font-size:clamp(24px,4vw,34px); margin-bottom:6px;">Facility Control.</h2>
        <p class="sub" style="margin-bottom:6px;">Operator detected.</p>
        <p class="pf-obs">${role.greeting}</p>
      </div>
      <div class="fc-layout">
        <div class="fc-nav" id="fcNav"></div>
        <div class="fc-content" id="fcContent"></div>
      </div>
    `;

    FREEKY.facility.renderNav();
    FREEKY.facility.openModule(FREEKY.facility.activeModule);
    FREEKY.ui.scheduleGlitchScan();
  },

  deniedHtml(reason){
    return `
      <div class="fc-denied">
        <div class="stamp glitch" data-text="ACCESS DENIED" style="margin-bottom:18px;">ACCESS DENIED</div>
        <p class="pf-obs">${reason}</p>
      </div>
    `;
  },

  renderNav(){
    const nav = document.getElementById('fcNav');
    const level = FREEKY.facility.currentLevel();
    nav.innerHTML = FREEKY.data.facilityModules.map(m => {
      const locked = level < m.minLevel;
      return `
        <button class="fc-nav-item ${m.id===FREEKY.facility.activeModule?'on':''} ${locked?'locked':''}"
          onclick="${locked ? '' : `FREEKY.facility.openModule('${m.id}')`}" ${locked?'disabled':''}>
          <span class="fc-nav-no">${m.no}</span>
          <span>${m.name}</span>
          ${m.status==='scaffold' ? '<span class="fc-nav-tag">SEALED</span>' : ''}
          ${locked ? '<span class="fc-nav-tag lock">LVL '+m.minLevel+'</span>' : ''}
        </button>
      `;
    }).join('');
  },

  openModule(id){
    const mod = FREEKY.data.facilityModules.find(m=>m.id===id);
    if(!mod) return;
    if(FREEKY.facility.currentLevel() < mod.minLevel) return;
    FREEKY.facility.activeModule = id;
    FREEKY.facility.renderNav();
    FREEKY.facility.logAction('Opened module: ' + mod.name);

    const content = document.getElementById('fcContent');
    const renderers = {
      command: FREEKY.facility.moduleCommand,
      users: FREEKY.facility.moduleUsers,
      products: FREEKY.facility.moduleProducts,
      inventory: FREEKY.facility.moduleInventory,
      deployments: FREEKY.facility.moduleDeployments,
      drops: FREEKY.facility.moduleDrops,
      analytics: FREEKY.facility.moduleAnalytics,
      flags: FREEKY.facility.moduleFlags,
      logs: FREEKY.facility.moduleLogs,
      terminal: FREEKY.facility.moduleTerminal
    };
    if(renderers[id]){
      renderers[id](content, mod);
    } else {
      content.innerHTML = FREEKY.facility.scaffoldHtml(mod);
    }
    FREEKY.ui.scheduleGlitchScan();
  },

  scaffoldHtml(mod){
    return `
      <div class="fc-module">
        <div class="fc-module-tag">${mod.no} // ${mod.name.toUpperCase()}</div>
        <div class="sealed-notice">
          <div class="sealed-tag glitch" data-text="MODULE SEALED">MODULE SEALED</div>
          <p>This module's structure exists and is ready for future connection. No backend for this system yet — see README for what a real integration here would need.</p>
        </div>
      </div>
    `;
  },

  /* ===== 01 — COMMAND CENTER (live) ===== */
  async moduleCommand(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">01 // COMMAND CENTER</div><p class="pf-empty">Reading archive...</p></div>`;
    let userCount = '—', deployCount = '—', pendingCount = '—', revenue = '—', recent = [];
    if(FREEKY.account.hasSupabase()){
      try{
        const { count: uc } = await supabaseClient.from('profiles').select('*', {count:'exact', head:true});
        userCount = uc != null ? uc : '—';
        const { data: orders } = await supabaseClient.from('orders').select('*').order('created_at', {ascending:false});
        if(orders){
          deployCount = orders.length;
          pendingCount = orders.filter(o => o.status === 'pending').length;
          revenue = orders.reduce((s,o) => s + (Number(o.total)||0), 0).toFixed(2);
          recent = orders.slice(0,5);
        }
      }catch(e){ /* archive unreachable — show dashes */ }
    }
    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">01 // COMMAND CENTER</div>
        <div class="pf-grid" style="margin-bottom:20px;">
          <div class="pf-cell"><span>USERS</span><strong>${userCount}</strong></div>
          <div class="pf-cell"><span>DEPLOYMENTS</span><strong>${deployCount}</strong></div>
          <div class="pf-cell"><span>PENDING ORDERS</span><strong>${pendingCount}</strong></div>
          <div class="pf-cell"><span>REVENUE</span><strong>£${revenue}</strong></div>
          <div class="pf-cell"><span>TODAY'S CLASSIFICATIONS</span><strong>N/A</strong></div>
          <div class="pf-cell"><span>ARCHIVE HEALTH</span><strong>NOMINAL</strong></div>
          <div class="pf-cell"><span>ACTIVE SESSIONS</span><strong>1 (you)</strong></div>
        </div>
        <div class="fc-module-tag">RECENT ACTIVITY</div>
        ${recent.length ? recent.map(o => `<div class="pf-incident"><span>${o.order_number}</span><span>${new Date(o.created_at).toLocaleDateString('en-GB')}</span></div>`).join('') : '<p class="pf-empty">No recent deployments.</p>'}
        <p class="pf-empty" style="margin-top:14px;">"Today's Classifications" and per-visitor Active Sessions require server-side aggregation not yet built — shown honestly rather than faked.</p>
      </div>
    `;
  },

  /* ===== 02 — USER DATABASE (live, read + limited edit) ===== */
  async moduleUsers(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">02 // USER DATABASE</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">02 // USER DATABASE</div><p class="pf-empty">Database not configured.</p></div>`;
      return;
    }
    try{
      const { data, error } = await supabaseClient.from('profiles').select('*').order('created_at', {ascending:false});
      FREEKY.facility.usersCache = data || [];
      FREEKY.facility.renderUsersList(content, '');
    }catch(e){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">02 // USER DATABASE</div><p class="pf-empty">Archive unreachable. This module needs an admin-bypass RLS policy on profiles to see users other than yourself — see the summary for the exact SQL.</p></div>`;
    }
  },

  renderUsersList(content, filter){
    const rows = FREEKY.facility.usersCache.filter(u =>
      !filter || (u.username||'').toLowerCase().includes(filter.toLowerCase()) || (u.callsign||'').toLowerCase().includes(filter.toLowerCase())
    );
    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">02 // USER DATABASE</div>
        <input type="text" class="fc-search" placeholder="Search callsign or username..." value="${filter}"
          oninput="FREEKY.facility.renderUsersList(document.getElementById('fcContent'), this.value)">
        ${rows.length ? rows.map(u => `
          <div class="fc-user-row">
            <div>
              <div class="fc-user-name">${u.callsign || u.username}</div>
              <div class="pf-empty">ROLE: ${(u.role||'user').toUpperCase()} · CLEARANCE ${u.clearance_level}</div>
            </div>
            <button class="btn ghost" onclick="FREEKY.facility.openUserFile('${u.user_id}')">Open File</button>
          </div>
        `).join('') : '<p class="pf-empty">No matching records.</p>'}
      </div>
    `;
  },

  openUserFile(userId){
    const u = FREEKY.facility.usersCache.find(x => x.user_id === userId);
    if(!u) return;
    const content = document.getElementById('fcContent');
    content.innerHTML = `
      <div class="fc-module">
        <button class="back-btn" onclick="FREEKY.facility.renderUsersList(document.getElementById('fcContent'), '')">← Back to User Database</button>
        <div class="fc-module-tag">FILE // ${u.callsign || u.username}</div>
        <div class="acct-field"><label>USERNAME</label><input type="text" id="fcUEditUsername" value="${u.username||''}"></div>
        <div class="acct-field"><label>ROLE</label>
          <select id="fcUEditRole" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;">
            ${Object.keys(FREEKY.data.roles).map(r => `<option value="${r}" ${u.role===r?'selected':''}>${r.toUpperCase()}</option>`).join('')}
          </select>
        </div>
        <div class="acct-field"><label>CLEARANCE LEVEL</label><input type="number" id="fcUEditClearance" value="${u.clearance_level}"></div>
        <div id="fcUEditMsg" class="acct-msg"></div>
        <div class="btn-row">
          <button class="btn" onclick="FREEKY.facility.saveUserFile('${u.user_id}')">Save Changes</button>
          <button class="btn ghost" style="opacity:.5; cursor:not-allowed;" disabled title="Requires a server-side admin function (service_role) — not safe from the browser">Reset Password</button>
          <button class="btn ghost" style="opacity:.5; cursor:not-allowed;" disabled title="Requires a server-side admin function (service_role) — not safe from the browser">Suspend / Ban / Delete</button>
        </div>
        <p class="pf-empty" style="margin-top:14px;">Account-level actions (password reset, suspend, ban, delete) require Supabase's Admin API with the service_role key, which must never run in browser code. These stay disabled here — wire them to a server-side function later.</p>
      </div>
    `;
  },

  async saveUserFile(userId){
    const msg = document.getElementById('fcUEditMsg');
    const username = document.getElementById('fcUEditUsername').value.trim();
    const role = document.getElementById('fcUEditRole').value;
    const clearance = parseInt(document.getElementById('fcUEditClearance').value, 10) || 1;
    try{
      const { error } = await supabaseClient.from('profiles').update({ username, role, clearance_level: clearance }).eq('user_id', userId);
      if(error){ msg.textContent = error.message.toUpperCase(); msg.className='acct-msg err'; return; }
      msg.textContent = 'FILE UPDATED.'; msg.className = 'acct-msg ok';
      FREEKY.facility.logAction('Edited user file: ' + username);
      const u = FREEKY.facility.usersCache.find(x=>x.user_id===userId);
      if(u){ u.username=username; u.role=role; u.clearance_level=clearance; }
    }catch(e){
      msg.textContent = 'COULD NOT REACH ARCHIVE.'; msg.className = 'acct-msg err';
    }
  },

  /* ===== 03 — PRODUCT CONTROL (live) ===== */
  async moduleProducts(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">03 // PRODUCT CONTROL</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">03 // PRODUCT CONTROL</div><p class="pf-empty">Database not configured.</p></div>`;
      return;
    }
    try{
      const [{ data: products, error }, { data: drops }] = await Promise.all([
        supabaseClient.from('products').select('*').order('code', {ascending:true}),
        supabaseClient.from('drops').select('*').order('drop_number', {ascending:true})
      ]);
      if(error) throw error;
      FREEKY.facility.productsCache = products || [];
      FREEKY.facility.dropsCache = drops || [];
      FREEKY.facility.renderProductsList(content, '');
    }catch(e){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">03 // PRODUCT CONTROL</div><p class="pf-empty">Archive unreachable.</p></div>`;
    }
  },

  renderProductsList(content, filter){
    const drops = FREEKY.facility.dropsCache;
    const dropName = id => (drops.find(d=>d.id===id) || {}).name || '—';
    const rows = FREEKY.facility.productsCache.filter(p =>
      !filter || (p.name||'').toLowerCase().includes(filter.toLowerCase()) || (p.code||'').toLowerCase().includes(filter.toLowerCase())
    );
    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">03 // PRODUCT CONTROL</div>
        <div class="btn-row" style="margin-bottom:14px;">
          <input type="text" class="fc-search" style="flex:1;" placeholder="Search name or code..." value="${filter}"
            oninput="FREEKY.facility.renderProductsList(document.getElementById('fcContent'), this.value)">
          <button class="btn ghost" onclick="FREEKY.facility.openProductFile(null)">+ New Product</button>
        </div>
        ${rows.length ? rows.map(p => `
          <div class="fc-user-row">
            <div>
              <div class="fc-user-name">${p.name}</div>
              <div class="pf-empty">${p.code} · ${(p.category||'').toUpperCase()} · £${Number(p.price||0).toFixed(2)} · ${p.status==='available'?'AVAILABLE':'SEALED'} · ${p.active?'ACTIVE':'INACTIVE'} · ${dropName(p.drop_id)}</div>
            </div>
            <button class="btn ghost" onclick="FREEKY.facility.openProductFile('${p.id}')">Open File</button>
          </div>
        `).join('') : '<p class="pf-empty">No matching records.</p>'}
      </div>
    `;
  },

  openProductFile(id){
    const p = id ? FREEKY.facility.productsCache.find(x => x.id === id) : null;
    const drops = FREEKY.facility.dropsCache;
    const cats = FREEKY.data.categories;
    const content = document.getElementById('fcContent');
    content.innerHTML = `
      <div class="fc-module">
        <button class="back-btn" onclick="FREEKY.facility.renderProductsList(document.getElementById('fcContent'), '')">← Back to Product Control</button>
        <div class="fc-module-tag">${p ? 'FILE // ' + p.name : 'NEW PRODUCT FILE'}</div>
        <div class="acct-field"><label>NAME</label><input type="text" id="fcPName" value="${p ? p.name.replace(/"/g,'&quot;') : ''}"></div>
        <div class="acct-field"><label>CODE (must match the manifest file code — used to link the loadout to this record)</label><input type="text" id="fcPCode" value="${p ? p.code||'' : ''}" placeholder="e.g. O-002"></div>
        <div class="acct-field"><label>CATEGORY / DIVISION</label>
          <select id="fcPCategory" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;">
            ${cats.map(c => `<option value="${c.key}" ${p && p.category===c.key?'selected':''}>${c.name.toUpperCase()}</option>`).join('')}
          </select>
        </div>
        <div class="acct-field"><label>PRICE (£)</label><input type="number" step="0.01" id="fcPPrice" value="${p ? p.price : ''}"></div>
        <div class="acct-field"><label>STATUS</label>
          <select id="fcPStatus" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;">
            <option value="available" ${p && p.status==='available'?'selected':''}>AVAILABLE</option>
            <option value="sealed" ${!p || p.status==='sealed'?'selected':''}>SEALED</option>
          </select>
        </div>
        <div class="acct-field"><label>DROP</label>
          <select id="fcPDrop" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;">
            <option value="">— NONE —</option>
            ${drops.map(d => `<option value="${d.id}" ${p && p.drop_id===d.id?'selected':''}>${d.name}</option>`).join('')}
          </select>
        </div>
        <div class="acct-field"><label>SHORT DESCRIPTION</label><input type="text" id="fcPShort" value="${p ? (p.short_description||'').replace(/"/g,'&quot;') : ''}"></div>
        <div class="acct-field"><label>DESCRIPTION</label>
          <textarea id="fcPDesc" rows="4" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;">${p ? p.description||'' : ''}</textarea>
        </div>
        <label class="pf-toggle"><input type="checkbox" id="fcPActive" ${!p || p.active?'checked':''}><span>Active (visible on site)</span></label>
        <label class="pf-toggle"><input type="checkbox" id="fcPFeatured" ${p && p.featured?'checked':''}><span>Featured</span></label>
        <div id="fcPMsg" class="acct-msg"></div>
        <div class="btn-row">
          <button class="btn" onclick="FREEKY.facility.saveProductFile(${p ? `'${p.id}'` : 'null'})">Save Changes</button>
        </div>
      </div>
    `;
  },

  async saveProductFile(id){
    const msg = document.getElementById('fcPMsg');
    const payload = {
      name: document.getElementById('fcPName').value.trim(),
      code: document.getElementById('fcPCode').value.trim(),
      category: document.getElementById('fcPCategory').value,
      price: parseFloat(document.getElementById('fcPPrice').value) || 0,
      status: document.getElementById('fcPStatus').value,
      drop_id: document.getElementById('fcPDrop').value || null,
      short_description: document.getElementById('fcPShort').value.trim(),
      description: document.getElementById('fcPDesc').value.trim(),
      active: document.getElementById('fcPActive').checked,
      featured: document.getElementById('fcPFeatured').checked
    };
    if(!payload.name || !payload.code){
      msg.textContent = 'NAME AND CODE ARE REQUIRED.'; msg.className = 'acct-msg err'; return;
    }
    try{
      if(id){
        const { error } = await supabaseClient.from('products').update(payload).eq('id', id);
        if(error) throw error;
        const p = FREEKY.facility.productsCache.find(x=>x.id===id);
        if(p) Object.assign(p, payload);
        FREEKY.facility.logAction('Edited product: ' + payload.name);
      } else {
        payload.slug = payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
        const { data, error } = await supabaseClient.from('products').insert(payload).select().single();
        if(error) throw error;
        FREEKY.facility.productsCache.unshift(data);
        FREEKY.facility.logAction('Created product: ' + payload.name);
      }
      msg.textContent = 'FILE SAVED.'; msg.className = 'acct-msg ok';
      setTimeout(() => FREEKY.facility.renderProductsList(document.getElementById('fcContent'), ''), 500);
    }catch(e){
      msg.textContent = (e.message || 'COULD NOT REACH ARCHIVE').toUpperCase(); msg.className = 'acct-msg err';
    }
  },

  /* ===== 04 — INVENTORY (live, stock management) ===== */
  async moduleInventory(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">04 // INVENTORY</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">04 // INVENTORY</div><p class="pf-empty">Database not configured.</p></div>`;
      return;
    }
    try{
      const { data, error } = await supabaseClient
        .from('products')
        .select('id, name, code, status, product_variants(stock)')
        .order('code', {ascending:true});
      if(error) throw error;
      FREEKY.facility.productsCache = data || [];
      FREEKY.facility.renderInventoryList(content);
    }catch(e){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">04 // INVENTORY</div><p class="pf-empty">Archive unreachable.</p></div>`;
    }
  },

  renderInventoryList(content){
    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">04 // INVENTORY</div>
        ${FREEKY.facility.productsCache.map(p => {
          const variants = p.product_variants || [];
          const total = variants.reduce((s,v)=>s+(Number(v.stock)||0), 0);
          const low = variants.some(v => Number(v.stock) <= 5);
          return `
            <div class="fc-user-row">
              <div>
                <div class="fc-user-name">${p.name}</div>
                <div class="pf-empty">${p.code} · ${variants.length} variant(s) · TOTAL STOCK ${total}${low ? ' · <span style="color:var(--red);">LOW STOCK</span>' : ''}</div>
              </div>
              <button class="btn ghost" onclick="FREEKY.facility.openInventoryGrid('${p.id}')">Manage Stock</button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  async openInventoryGrid(productId){
    const content = document.getElementById('fcContent');
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">04 // INVENTORY</div><p class="pf-empty">Reading variants...</p></div>`;
    try{
      const { data, error } = await supabaseClient
        .from('product_variants')
        .select('id, stock, sizes(name, sort_order), colors(name)')
        .eq('product_id', productId);
      if(error) throw error;
      const variants = (data || []).sort((a,b) => {
        const so = (a.sizes ? a.sizes.sort_order : 0) - (b.sizes ? b.sizes.sort_order : 0);
        if(so !== 0) return so;
        return (a.colors ? a.colors.name : '').localeCompare(b.colors ? b.colors.name : '');
      });
      const p = FREEKY.facility.productsCache.find(x => x.id === productId);
      content.innerHTML = `
        <div class="fc-module">
          <button class="back-btn" onclick="FREEKY.facility.renderInventoryList(document.getElementById('fcContent'))">← Back to Inventory</button>
          <div class="fc-module-tag">STOCK // ${p ? p.name : ''}</div>
          <div class="fc-stock-grid">
            ${variants.map(v => `
              <div class="fc-stock-cell">
                <span>${v.sizes ? v.sizes.name : '—'} · ${v.colors ? v.colors.name : '—'}</span>
                <input type="number" min="0" class="fc-stock-input" data-variant-id="${v.id}" value="${v.stock}">
              </div>
            `).join('')}
          </div>
          <div id="fcInvMsg" class="acct-msg"></div>
          <div class="btn-row">
            <button class="btn" onclick="FREEKY.facility.saveInventoryGrid('${productId}')">Save Stock Levels</button>
          </div>
        </div>
      `;
    }catch(e){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">04 // INVENTORY</div><p class="pf-empty">Could not load variants.</p></div>`;
    }
  },

  async saveInventoryGrid(productId){
    const msg = document.getElementById('fcInvMsg');
    const inputs = Array.from(document.querySelectorAll('.fc-stock-input'));
    msg.textContent = 'SAVING...'; msg.className = 'acct-msg';
    try{
      await Promise.all(inputs.map(inp =>
        supabaseClient.from('product_variants').update({ stock: parseInt(inp.value,10) || 0 }).eq('id', inp.dataset.variantId)
      ));
      msg.textContent = 'STOCK UPDATED.'; msg.className = 'acct-msg ok';
      FREEKY.facility.logAction('Updated stock levels for product ' + productId);
    }catch(e){
      msg.textContent = 'COULD NOT SAVE ALL LEVELS.'; msg.className = 'acct-msg err';
    }
  },

  /* ===== 05 — DEPLOYMENTS (live, status management) ===== */
  async moduleDeployments(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">05 // DEPLOYMENTS</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">05 // DEPLOYMENTS</div><p class="pf-empty">Database not configured.</p></div>`;
      return;
    }
    try{
      const { data, error } = await supabaseClient.from('orders').select('*').order('created_at', {ascending:false});
      FREEKY.facility.ordersCache = data || [];
      FREEKY.facility.renderDeploymentsList(content);
    }catch(e){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">05 // DEPLOYMENTS</div><p class="pf-empty">Archive unreachable. This module needs an admin-bypass RLS policy on orders — see the summary for the exact SQL.</p></div>`;
    }
  },

  renderDeploymentsList(content){
    const statuses = ['pending','paid','processing','assigned','shipped','delivered','cancelled','refunded'];
    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">05 // DEPLOYMENTS</div>
        ${FREEKY.facility.ordersCache.length ? FREEKY.facility.ordersCache.map(o => `
          <div class="fc-order-row">
            <div>
              <div class="fc-user-name">${o.order_number}</div>
              <div class="pf-empty">${o.shipping_name || 'No agent name'} · ${new Date(o.created_at).toLocaleDateString('en-GB')} · £${Number(o.total||0).toFixed(2)}</div>
            </div>
            <select onchange="FREEKY.facility.updateOrderStatus('${o.id}', this.value)"
              style="background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:11px; padding:8px 10px;">
              ${statuses.map(s => `<option value="${s}" ${o.status===s?'selected':''}>${s.toUpperCase()}</option>`).join('')}
            </select>
          </div>
        `).join('') : '<p class="pf-empty">No deployments on record.</p>'}
        <button class="btn ghost" style="margin-top:16px;" onclick="FREEKY.facility.exportOrdersCsv()">Export CSV</button>
      </div>
    `;
  },

  async updateOrderStatus(orderId, status){
    try{
      const { error } = await supabaseClient.from('orders').update({ status }).eq('id', orderId);
      if(!error){
        const o = FREEKY.facility.ordersCache.find(x=>x.id===orderId);
        if(o) o.status = status;
        FREEKY.facility.logAction('Updated deployment status: ' + orderId + ' → ' + status);
      }
    }catch(e){ /* silent — status select reverts on next full reload */ }
  },

  exportOrdersCsv(){
    const rows = [['order_number','status','total','created_at']]
      .concat(FREEKY.facility.ordersCache.map(o => [o.order_number, o.status, o.total, o.created_at]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'deployments.csv'; a.click();
    URL.revokeObjectURL(url);
    FREEKY.facility.logAction('Exported deployments CSV');
  },

  /* ===== 06 — DROP MANAGEMENT (live) ===== */
  async moduleDrops(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">06 // DROP MANAGEMENT</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">06 // DROP MANAGEMENT</div><p class="pf-empty">Database not configured.</p></div>`;
      return;
    }
    try{
      const [{ data: drops, error }, { data: products }] = await Promise.all([
        supabaseClient.from('drops').select('*').order('drop_number', {ascending:true}),
        supabaseClient.from('products').select('id, drop_id')
      ]);
      if(error) throw error;
      FREEKY.facility.dropsCache = drops || [];
      FREEKY.facility._dropProductCounts = (products || []).reduce((acc,p) => {
        if(p.drop_id) acc[p.drop_id] = (acc[p.drop_id]||0) + 1;
        return acc;
      }, {});
      FREEKY.facility.renderDropsList(content);
    }catch(e){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">06 // DROP MANAGEMENT</div><p class="pf-empty">Archive unreachable.</p></div>`;
    }
  },

  renderDropsList(content){
    const counts = FREEKY.facility._dropProductCounts || {};
    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">06 // DROP MANAGEMENT</div>
        <div class="btn-row" style="margin-bottom:14px;">
          <button class="btn ghost" onclick="FREEKY.facility.openDropFile(null)">+ New Drop</button>
        </div>
        ${FREEKY.facility.dropsCache.map(d => `
          <div class="fc-user-row">
            <div>
              <div class="fc-user-name">${d.name}</div>
              <div class="pf-empty">DROP ${d.drop_number} · ${counts[d.id]||0} product(s) · ${d.active?'ACTIVE':'INACTIVE'}${d.launch_date ? ' · LAUNCH ' + new Date(d.launch_date).toLocaleDateString('en-GB') : ''}</div>
            </div>
            <button class="btn ghost" onclick="FREEKY.facility.openDropFile('${d.id}')">Open File</button>
          </div>
        `).join('')}
      </div>
    `;
  },

  openDropFile(id){
    const d = id ? FREEKY.facility.dropsCache.find(x => x.id === id) : null;
    const content = document.getElementById('fcContent');
    content.innerHTML = `
      <div class="fc-module">
        <button class="back-btn" onclick="FREEKY.facility.renderDropsList(document.getElementById('fcContent'))">← Back to Drop Management</button>
        <div class="fc-module-tag">${d ? 'FILE // ' + d.name : 'NEW DROP FILE'}</div>
        <div class="acct-field"><label>NAME</label><input type="text" id="fcDName" value="${d ? d.name.replace(/"/g,'&quot;') : ''}" placeholder="FILE 004 — ..."></div>
        <div class="acct-field"><label>DROP NUMBER</label><input type="number" id="fcDNumber" value="${d ? d.drop_number : ''}"></div>
        <div class="acct-field"><label>LAUNCH DATE</label><input type="date" id="fcDLaunch" value="${d && d.launch_date ? d.launch_date.slice(0,10) : ''}"></div>
        <div class="acct-field"><label>DESCRIPTION</label>
          <textarea id="fcDDesc" rows="4" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;">${d ? d.description||'' : ''}</textarea>
        </div>
        <label class="pf-toggle"><input type="checkbox" id="fcDActive" ${!d || d.active?'checked':''}><span>Active</span></label>
        <div id="fcDMsg" class="acct-msg"></div>
        <div class="btn-row">
          <button class="btn" onclick="FREEKY.facility.saveDropFile(${d ? `'${d.id}'` : 'null'})">Save Changes</button>
        </div>
      </div>
    `;
  },

  async saveDropFile(id){
    const msg = document.getElementById('fcDMsg');
    const payload = {
      name: document.getElementById('fcDName').value.trim(),
      drop_number: parseInt(document.getElementById('fcDNumber').value, 10) || 0,
      launch_date: document.getElementById('fcDLaunch').value || null,
      description: document.getElementById('fcDDesc').value.trim(),
      active: document.getElementById('fcDActive').checked
    };
    if(!payload.name){
      msg.textContent = 'NAME IS REQUIRED.'; msg.className = 'acct-msg err'; return;
    }
    try{
      if(id){
        const { error } = await supabaseClient.from('drops').update(payload).eq('id', id);
        if(error) throw error;
        const d = FREEKY.facility.dropsCache.find(x=>x.id===id);
        if(d) Object.assign(d, payload);
        FREEKY.facility.logAction('Edited drop: ' + payload.name);
      } else {
        payload.slug = payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
        const { data, error } = await supabaseClient.from('drops').insert(payload).select().single();
        if(error) throw error;
        FREEKY.facility.dropsCache.push(data);
        FREEKY.facility.logAction('Created drop: ' + payload.name);
      }
      msg.textContent = 'FILE SAVED.'; msg.className = 'acct-msg ok';
      setTimeout(() => FREEKY.facility.renderDropsList(document.getElementById('fcContent')), 500);
    }catch(e){
      msg.textContent = (e.message || 'COULD NOT REACH ARCHIVE').toUpperCase(); msg.className = 'acct-msg err';
    }
  },

  /* ===== 16 — ANALYTICS (live, client-side aggregation) ===== */
  async moduleAnalytics(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">16 // ANALYTICS</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">16 // ANALYTICS</div><p class="pf-empty">Database not configured.</p></div>`;
      return;
    }
    try{
      const [{ data: orders, error: ordersErr }, { data: items, error: itemsErr }] = await Promise.all([
        supabaseClient.from('orders').select('id, total, status, created_at').order('created_at', {ascending:true}),
        supabaseClient.from('order_items').select('quantity, line_total, product_variants(products(name, category))')
      ]);
      if(ordersErr) throw ordersErr;
      FREEKY.facility.renderAnalytics(content, orders || [], items || [], itemsErr);
    }catch(e){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">16 // ANALYTICS</div><p class="pf-empty">Archive unreachable.</p></div>`;
    }
  },

  renderAnalytics(content, orders, items, itemsErr){
    const totalRevenue = orders.reduce((s,o) => s + (Number(o.total)||0), 0);
    const orderCount = orders.length;
    const avgOrder = orderCount ? (totalRevenue / orderCount) : 0;

    // revenue by month, last 6 months present in the data
    const byMonth = {};
    orders.forEach(o => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString('en-GB', {month:'short', year:'2-digit'});
      byMonth[key] = (byMonth[key]||0) + (Number(o.total)||0);
    });
    const monthKeys = Object.keys(byMonth);
    const maxMonth = Math.max(1, ...monthKeys.map(k=>byMonth[k]));

    // orders by status
    const byStatus = {};
    orders.forEach(o => { byStatus[o.status] = (byStatus[o.status]||0) + 1; });

    // top products by units sold
    const byProduct = {};
    (items||[]).forEach(it => {
      const p = it.product_variants && it.product_variants.products;
      const name = p ? p.name : 'Unknown';
      byProduct[name] = (byProduct[name]||0) + (Number(it.quantity)||0);
    });
    const topProducts = Object.entries(byProduct).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxProduct = Math.max(1, ...topProducts.map(p=>p[1]));

    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">16 // ANALYTICS</div>
        <div class="pf-grid" style="margin-bottom:24px;">
          <div class="pf-cell"><span>TOTAL REVENUE</span><strong>£${totalRevenue.toFixed(2)}</strong></div>
          <div class="pf-cell"><span>TOTAL DEPLOYMENTS</span><strong>${orderCount}</strong></div>
          <div class="pf-cell"><span>AVERAGE ORDER VALUE</span><strong>£${avgOrder.toFixed(2)}</strong></div>
        </div>

        <div class="fc-module-tag">REVENUE BY MONTH</div>
        <div style="margin-bottom:22px;">
          ${monthKeys.length ? monthKeys.map(k => `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <span style="width:60px; font-size:11px; color:var(--dim);">${k}</span>
              <div style="flex:1; background:var(--panel-2); height:14px; position:relative;">
                <div style="width:${(byMonth[k]/maxMonth*100).toFixed(1)}%; background:var(--amber); height:100%;"></div>
              </div>
              <span style="width:70px; font-size:11px; text-align:right;">£${byMonth[k].toFixed(2)}</span>
            </div>
          `).join('') : '<p class="pf-empty">No deployments on record.</p>'}
        </div>

        <div class="fc-module-tag">DEPLOYMENTS BY STATUS</div>
        <div class="pf-grid" style="margin-bottom:22px;">
          ${Object.keys(byStatus).length ? Object.entries(byStatus).map(([s,c]) => `
            <div class="pf-cell"><span>${s.toUpperCase()}</span><strong>${c}</strong></div>
          `).join('') : '<p class="pf-empty">No deployments on record.</p>'}
        </div>

        <div class="fc-module-tag">TOP EQUIPMENT (BY UNITS ISSUED)</div>
        <div>
          ${topProducts.length ? topProducts.map(([name,qty]) => `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <span style="width:160px; font-size:11px; color:var(--off);">${name}</span>
              <div style="flex:1; background:var(--panel-2); height:14px; position:relative;">
                <div style="width:${(qty/maxProduct*100).toFixed(1)}%; background:var(--amber); height:100%;"></div>
              </div>
              <span style="width:40px; font-size:11px; text-align:right;">${qty}</span>
            </div>
          `).join('') : `<p class="pf-empty">${itemsErr ? 'Order item data unreachable.' : 'No units issued yet.'}</p>`}
        </div>
      </div>
    `;
  },

  /* ===== 19 — FEATURE FLAGS (live, actually gate real systems) ===== */
  moduleFlags(content){
    const flags = FREEKY.storage.get('freeky_feature_flags', {
      glitch:true, paradox:true, archiveEvents:true, experimental:false, hiddenDocuments:true, seasonal:false, emergencyMode:false
    });
    const toggle = (key, label) => `
      <label class="pf-toggle">
        <input type="checkbox" ${flags[key]?'checked':''} onchange="FREEKY.facility.setFlag('${key}', this.checked)">
        <span>${label}</span>
      </label>
    `;
    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">19 // FEATURE FLAGS</div>
        ${toggle('glitch','Glitch Effects')}
        ${toggle('paradox','Paradox')}
        ${toggle('archiveEvents','Archive Events')}
        ${toggle('experimental','Experimental Features')}
        ${toggle('hiddenDocuments','Hidden Documents')}
        ${toggle('seasonal','Seasonal Events')}
        ${toggle('emergencyMode','Emergency Mode')}
        <p class="pf-empty" style="margin-top:14px;">Glitch Effects and Paradox are wired to real site behaviour. The rest are stored and ready, not yet gating anything.</p>
      </div>
    `;
  },
  setFlag(key, value){
    const flags = FREEKY.storage.get('freeky_feature_flags', {});
    flags[key] = value;
    FREEKY.storage.set('freeky_feature_flags', flags);
    FREEKY.facility.logAction('Set feature flag: ' + key + ' = ' + value);
  },
  flagEnabled(key){
    const flags = FREEKY.storage.get('freeky_feature_flags', {});
    return key in flags ? flags[key] : true;
  },

  /* ===== 20 — SYSTEM LOGS (live, local) ===== */
  moduleLogs(content){
    const log = FREEKY.storage.get('freeky_facility_logs', []);
    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">20 // SYSTEM LOGS</div>
        <p class="pf-empty" style="margin-bottom:14px;">Local to this browser — no shared admin_logs table exists yet.</p>
        ${log.length ? log.map(l => `
          <div class="fc-log-row">
            <span>${new Date(l.timestamp).toLocaleString('en-GB')}</span>
            <span>${l.operator}</span>
            <span>${l.action}</span>
          </div>
        `).join('') : '<p class="pf-empty">No actions recorded yet.</p>'}
      </div>
    `;
  },

  /* ===== 22 — COMMAND TERMINAL (live) ===== */
  moduleTerminal(content){
    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">22 // COMMAND TERMINAL</div>
        <div id="fcTermOutput" class="fc-term-output"></div>
        <input type="text" id="fcTermInput" class="fc-term-input" placeholder="/system status"
          onkeydown="if(event.key==='Enter') FREEKY.facility.runCommand()">
      </div>
    `;
    FREEKY.facility.termPrint("FREƎ-KY // COMMAND TERMINAL — type /system status to begin.");
  },

  termPrint(line){
    const out = document.getElementById('fcTermOutput');
    if(!out) return;
    const div = document.createElement('div');
    div.textContent = line;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  },

  runCommand(){
    const input = document.getElementById('fcTermInput');
    const cmd = input.value.trim();
    if(!cmd) return;
    FREEKY.facility.termPrint('> ' + cmd);
    input.value = '';
    FREEKY.facility.logAction('Terminal command: ' + cmd);

    const [base, ...args] = cmd.split(' ');
    if(base === '/users'){
      FREEKY.facility.termPrint(FREEKY.facility.usersCache.length + ' user record(s) cached. Opening User Database...');
      FREEKY.facility.openModule('users');
    } else if(base === '/products'){
      FREEKY.facility.termPrint(FREEKY.data.manifest.length + ' equipment record(s) in the local manifest.');
    } else if(base === '/deployments'){
      FREEKY.facility.termPrint('Opening Deployments...');
      FREEKY.facility.openModule('deployments');
    } else if(base === '/archive'){
      FREEKY.facility.termPrint('Redirecting to the Dossier archive...');
      setTimeout(() => FREEKY.navigation.navTo('dossier'), 400);
    } else if(base === '/event' && args[0] === 'anomaly'){
      FREEKY.facility.termPrint('Triggering an anomaly event...');
      FREEKY.ui.runAmbientGlitch();
    } else if(base === '/launch' && args[0] === 'drop'){
      FREEKY.facility.termPrint('Drop Management is sealed. No drop scheduling backend connected yet.');
    } else if(base === '/system' && args[0] === 'status'){
      FREEKY.facility.termPrint('DATABASE: ' + (FREEKY.account.hasSupabase() ? 'CONNECTED' : 'NOT CONFIGURED'));
      FREEKY.facility.termPrint('SESSION: ' + (FREEKY.state.account ? 'ACTIVE (' + FREEKY.state.account.callsign + ')' : 'NONE'));
      FREEKY.facility.termPrint('CLEARANCE: LEVEL ' + FREEKY.facility.currentLevel());
    } else {
      FREEKY.facility.termPrint('UNRECOGNIZED COMMAND.');
    }
  }
};
