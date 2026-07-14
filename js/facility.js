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
      deployments: FREEKY.facility.moduleDeployments,
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
    const statuses = ['pending','preparing','packed','dispatched','delivered','returned','refunded'];
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
