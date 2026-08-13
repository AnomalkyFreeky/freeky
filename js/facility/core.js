/* Facility Control core: access gate, navigation, users, analytics, flags and terminal. */
window.FREEKY = window.FREEKY || {};

FREEKY.facility = {
  activeModule: 'command', usersCache: [], ordersCache: [], productsCache: [], dropsCache: [],
  colorsCache: [], sizesCache: [], discountsCache: [], homepageCache: [], settingsCache: [],
  currentLevel(){ const p = FREEKY.account.currentProfile; const role = p && FREEKY.data.roles[p.role]; return role ? role.level : 0; },
  hasAccess(){ return FREEKY.facility.currentLevel() >= 20; },
  archiveError(error){
    const detail = String((error && error.message) || 'Unknown database error.')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<p class="pf-empty">DATABASE RESPONSE: ${detail}</p><p class="pf-empty" style="margin-top:10px;">Check your Facility role and run database/007_facility_staff_policies.sql.</p>`;
  },
  logAction(action){
    const p = FREEKY.account.currentProfile, log = FREEKY.storage.get('freeky_facility_logs', []);
    log.unshift({ timestamp:new Date().toISOString(), operator:p ? p.callsign : 'UNKNOWN', action, module:FREEKY.facility.activeModule });
    FREEKY.storage.set('freeky_facility_logs', log.slice(0,50));
  },
  deniedHtml(reason){ return `<div class="fc-denied"><div class="stamp glitch" data-text="ACCESS DENIED" style="margin-bottom:18px;">ACCESS DENIED</div><p class="pf-obs">${reason}</p></div>`; },
  async render(){
    const box = document.getElementById('facilityBody'); if(!box) return;
    if(!FREEKY.state.account || !FREEKY.account.currentProfile){ box.innerHTML = FREEKY.facility.deniedHtml('NO ACTIVE FILE. ACCESS YOUR FILE FIRST.'); return; }
    if(!FREEKY.facility.hasAccess()){ box.innerHTML = FREEKY.facility.deniedHtml('INSUFFICIENT ARCHIVE CLEARANCE.'); return; }
    const role = FREEKY.data.roles[FREEKY.account.currentProfile.role] || FREEKY.data.roles.user;
    box.innerHTML = `<div class="fc-header"><div class="fc-verified glitch" data-text="ACCESS LEVEL ${role.level} VERIFIED">ACCESS LEVEL ${role.level} VERIFIED</div><h2 class="headline" style="font-size:clamp(24px,4vw,34px); margin-bottom:6px;">Facility Control.</h2><p class="sub" style="margin-bottom:6px;">Operator detected.</p><p class="pf-obs">${role.greeting}</p></div><div class="fc-layout"><div class="fc-nav" id="fcNav"></div><div class="fc-content" id="fcContent"></div></div>`;
    FREEKY.facility.renderNav();
    if(FREEKY.facility.activeModule === 'logs') FREEKY.facility.activeModule = 'command';
    FREEKY.facility.openModule(FREEKY.facility.activeModule);
    FREEKY.ui.scheduleGlitchScan();
  },
  renderNav(){
    const nav = document.getElementById('fcNav'), level = FREEKY.facility.currentLevel(); if(!nav) return;
    nav.innerHTML = FREEKY.data.facilityModules.map(m => { const locked = level < m.minLevel; return `<button class="fc-nav-item ${m.id===FREEKY.facility.activeModule?'on':''} ${locked?'locked':''}" onclick="${locked ? '' : `FREEKY.facility.openModule('${m.id}')`}" ${locked?'disabled':''}><span class="fc-nav-no">${m.no}</span><span>${m.name}</span>${m.status==='scaffold'?'<span class="fc-nav-tag">SEALED</span>':''}${locked?'<span class="fc-nav-tag lock">LVL '+m.minLevel+'</span>':''}</button>`; }).join('');
  },
  openModule(id){
    const mod = FREEKY.data.facilityModules.find(m => m.id === id); if(!mod || FREEKY.facility.currentLevel() < mod.minLevel) return;
    FREEKY.facility.activeModule = id; FREEKY.facility.renderNav(); FREEKY.facility.logAction('Opened module: ' + mod.name);
    const renderers = { command:FREEKY.facility.moduleCommand, users:FREEKY.facility.moduleUsers, products:FREEKY.facility.moduleProducts, inventory:FREEKY.facility.moduleInventory, deployments:FREEKY.facility.moduleDeployments, drops:FREEKY.facility.moduleDrops, analytics:FREEKY.facility.moduleAnalytics, discounts:FREEKY.facility.moduleDiscounts, homepage:FREEKY.facility.moduleHomepage, manifestctl:FREEKY.facility.moduleManifestctl, dossierctl:FREEKY.facility.moduleDossierctl, quizctl:FREEKY.facility.moduleQuizctl, anomalkyctl:FREEKY.facility.moduleAnomalkyctl, randomctl:FREEKY.facility.moduleRandomctl, database:FREEKY.facility.moduleDatabase, media:FREEKY.facility.moduleMedia, settings:FREEKY.facility.moduleSettings, flags:FREEKY.facility.moduleFlags, logs:FREEKY.facility.moduleLogs, terminal:FREEKY.facility.moduleTerminal };
    const content = document.getElementById('fcContent'); if(renderers[id]) renderers[id](content,mod); else content.innerHTML = FREEKY.facility.scaffoldHtml(mod); FREEKY.ui.scheduleGlitchScan();
  },
  scaffoldHtml(mod){ return `<div class="fc-module"><div class="fc-module-tag">${mod.no} // ${mod.name.toUpperCase()}</div><div class="sealed-notice"><div class="sealed-tag glitch" data-text="MODULE SEALED">MODULE SEALED</div><p>This module's structure exists and is ready for future connection.</p></div></div>`; },
  async moduleCommand(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">01 // COMMAND CENTER</div><p class="pf-empty">Reading archive...</p></div>`;
    let users='—', deployments='—', pending='—', revenue='—', recent=[];
    if(FREEKY.account.hasSupabase()) try { const [{count},{data:orders}] = await Promise.all([supabaseClient.from('profiles').select('*',{count:'exact',head:true}),supabaseClient.from('orders').select('*').order('created_at',{ascending:false})]); users=count ?? '—'; if(orders){ deployments=orders.length; pending=orders.filter(o=>o.status==='pending').length; revenue=orders.reduce((n,o)=>n+(Number(o.total)||0),0).toFixed(2); recent=orders.slice(0,5); } } catch(e) {}
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">01 // COMMAND CENTER</div><div class="pf-grid" style="margin-bottom:20px;"><div class="pf-cell"><span>USERS</span><strong>${users}</strong></div><div class="pf-cell"><span>DEPLOYMENTS</span><strong>${deployments}</strong></div><div class="pf-cell"><span>PENDING ORDERS</span><strong>${pending}</strong></div><div class="pf-cell"><span>REVENUE</span><strong>£${revenue}</strong></div><div class="pf-cell"><span>ARCHIVE HEALTH</span><strong>NOMINAL</strong></div></div><div class="fc-module-tag">RECENT ACTIVITY</div>${recent.length ? recent.map(o=>`<div class="pf-incident"><span>${o.order_number}</span><span>${new Date(o.created_at).toLocaleDateString('en-GB')}</span></div>`).join('') : '<p class="pf-empty">No recent deployments.</p>'}</div>`;
  },
  async moduleUsers(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">02 // USER DATABASE</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">02 // USER DATABASE</div><p class="pf-empty">Database not configured.</p></div>`; return; }
    try { const {data,error} = await supabaseClient.from('profiles').select('*').order('created_at',{ascending:false}); if(error) throw error; FREEKY.facility.usersCache=data||[]; FREEKY.facility.renderUsersList(content,''); } catch(e) { content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">02 // USER DATABASE</div>${FREEKY.facility.archiveError(e)}</div>`; }
  },
  renderUsersList(content,filter){
    const rows = FREEKY.facility.usersCache.filter(u=>!filter||(u.username||'').toLowerCase().includes(filter.toLowerCase())||(u.callsign||'').toLowerCase().includes(filter.toLowerCase()));
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">02 // USER DATABASE</div><input type="text" class="fc-search" placeholder="Search callsign or username..." value="${filter.replace(/"/g,'&quot;')}" oninput="FREEKY.facility.renderUsersList(document.getElementById('fcContent'),this.value)">${rows.length?rows.map(u=>`<div class="fc-user-row"><div><div class="fc-user-name">${u.callsign||u.username}</div><div class="pf-empty">ROLE: ${(u.role||'user').toUpperCase()} · CLEARANCE ${u.clearance_level}</div></div><button class="btn ghost" onclick="FREEKY.facility.openUserFile('${u.user_id}')">Open File</button></div>`).join(''):'<p class="pf-empty">No matching records.</p>'}</div>`;
  },
  openUserFile(userId){
    const u=FREEKY.facility.usersCache.find(x=>x.user_id===userId); if(!u)return; const safe=v=>String(v||'').replace(/"/g,'&quot;');
    document.getElementById('fcContent').innerHTML=`<div class="fc-module"><button class="back-btn" onclick="FREEKY.facility.renderUsersList(document.getElementById('fcContent'),'')">← Back to User Database</button><div class="fc-module-tag">FILE // ${u.callsign||u.username}</div><div class="acct-field"><label>USERNAME</label><input type="text" id="fcUEditUsername" value="${safe(u.username)}"></div><div class="acct-field"><label>ROLE</label><select id="fcUEditRole" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;">${Object.keys(FREEKY.data.roles).map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${r.toUpperCase()}</option>`).join('')}</select></div><div class="acct-field"><label>CLEARANCE LEVEL</label><input type="number" id="fcUEditClearance" value="${u.clearance_level}"></div><div id="fcUEditMsg" class="acct-msg"></div><div class="btn-row"><button class="btn" onclick="FREEKY.facility.saveUserFile('${u.user_id}')">Save Changes</button></div><p class="pf-empty" style="margin-top:14px;">Password resets and account deletion require a server-side function and remain intentionally unavailable here.</p></div>`;
  },
  async saveUserFile(userId){
    const msg=document.getElementById('fcUEditMsg'),username=document.getElementById('fcUEditUsername').value.trim(),role=document.getElementById('fcUEditRole').value,clearance=parseInt(document.getElementById('fcUEditClearance').value,10)||1;
    try { const {error}=await supabaseClient.from('profiles').update({username,role,clearance_level:clearance}).eq('user_id',userId); if(error) throw error; msg.textContent='FILE UPDATED.';msg.className='acct-msg ok'; const u=FREEKY.facility.usersCache.find(x=>x.user_id===userId);if(u)Object.assign(u,{username,role,clearance_level:clearance});FREEKY.facility.logAction('Edited user file: '+username); } catch(e) { msg.textContent=(e.message||'COULD NOT REACH ARCHIVE.').toUpperCase();msg.className='acct-msg err'; }
  },
  async moduleAnalytics(content){
    content.innerHTML=`<div class="fc-module"><div class="fc-module-tag">16 // ANALYTICS</div><p class="pf-empty">Reading archive...</p></div>`; if(!FREEKY.account.hasSupabase()){content.innerHTML=`<div class="fc-module"><div class="fc-module-tag">16 // ANALYTICS</div><p class="pf-empty">Database not configured.</p></div>`;return;}
    try { const {data:orders,error}=await supabaseClient.from('orders').select('total,status,created_at').order('created_at',{ascending:true});if(error)throw error;FREEKY.facility.renderAnalytics(content,orders||[]);}catch(e){content.innerHTML=`<div class="fc-module"><div class="fc-module-tag">16 // ANALYTICS</div>${FREEKY.facility.archiveError(e)}</div>`;}
  },
  renderAnalytics(content,orders){
    const revenue=orders.reduce((n,o)=>n+(Number(o.total)||0),0), count=orders.length, statuses={};orders.forEach(o=>statuses[o.status]=(statuses[o.status]||0)+1);
    content.innerHTML=`<div class="fc-module"><div class="fc-module-tag">16 // ANALYTICS</div><div class="pf-grid" style="margin-bottom:22px;"><div class="pf-cell"><span>TOTAL REVENUE</span><strong>£${revenue.toFixed(2)}</strong></div><div class="pf-cell"><span>TOTAL DEPLOYMENTS</span><strong>${count}</strong></div><div class="pf-cell"><span>AVERAGE ORDER VALUE</span><strong>£${count?(revenue/count).toFixed(2):'0.00'}</strong></div></div><div class="fc-module-tag">DEPLOYMENTS BY STATUS</div><div class="pf-grid">${Object.keys(statuses).length?Object.entries(statuses).map(([s,n])=>`<div class="pf-cell"><span>${s.toUpperCase()}</span><strong>${n}</strong></div>`).join(''):'<p class="pf-empty">No deployments on record.</p>'}</div></div>`;
  },
  moduleFlags(content){ const flags=FREEKY.storage.get('freeky_feature_flags',{glitch:true,paradox:true,archiveEvents:true,experimental:false,hiddenDocuments:true,seasonal:false,emergencyMode:false});const toggle=(key,label)=>`<label class="pf-toggle"><input type="checkbox" ${flags[key]?'checked':''} onchange="FREEKY.facility.setFlag('${key}',this.checked)"><span>${label}</span></label>`;content.innerHTML=`<div class="fc-module"><div class="fc-module-tag">19 // FEATURE FLAGS</div>${toggle('glitch','Glitch Effects')}${toggle('paradox','Paradox')}${toggle('archiveEvents','Archive Events')}${toggle('experimental','Experimental Features')}${toggle('hiddenDocuments','Hidden Documents')}${toggle('seasonal','Seasonal Events')}${toggle('emergencyMode','Emergency Mode')}</div>`; },
  setFlag(key,value){const flags=FREEKY.storage.get('freeky_feature_flags',{});flags[key]=value;FREEKY.storage.set('freeky_feature_flags',flags);FREEKY.facility.logAction('Set feature flag: '+key+' = '+value);},
  flagEnabled(key){const flags=FREEKY.storage.get('freeky_feature_flags',{});return key in flags?flags[key]:true;},
  moduleTerminal(content){content.innerHTML=`<div class="fc-module"><div class="fc-module-tag">22 // COMMAND TERMINAL</div><div id="fcTermOutput" class="fc-term-output"></div><input type="text" id="fcTermInput" class="fc-term-input" placeholder="/system status" onkeydown="if(event.key==='Enter') FREEKY.facility.runCommand()"></div>`;FREEKY.facility.termPrint('FREÆŽ-KY // COMMAND TERMINAL — type /system status to begin.');},
  termPrint(line){const out=document.getElementById('fcTermOutput');if(!out)return;const div=document.createElement('div');div.textContent=line;out.appendChild(div);out.scrollTop=out.scrollHeight;},
  runCommand(){const input=document.getElementById('fcTermInput'),cmd=input.value.trim();if(!cmd)return;FREEKY.facility.termPrint('> '+cmd);input.value='';FREEKY.facility.logAction('Terminal command: '+cmd);const [base,...args]=cmd.split(' ');if(base==='/users'){FREEKY.facility.openModule('users');}else if(base==='/deployments'){FREEKY.facility.openModule('deployments');}else if(base==='/logs'){FREEKY.facility.openLogs();}else if(base==='/archive'){setTimeout(()=>FREEKY.navigation.navTo('dossier'),400);}else if(base==='/event'&&args[0]==='anomaly'){FREEKY.ui.runAmbientGlitch();}else if(base==='/system'&&args[0]==='status'){FREEKY.facility.termPrint('DATABASE: '+(FREEKY.account.hasSupabase()?'CONNECTED':'NOT CONFIGURED'));FREEKY.facility.termPrint('CLEARANCE: LEVEL '+FREEKY.facility.currentLevel());}else{FREEKY.facility.termPrint('UNRECOGNIZED COMMAND.');}}
};
