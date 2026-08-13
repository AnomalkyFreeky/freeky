/* Facility Control — global ANOMAL-KY controls and read-only database health. */
window.FREEKY = window.FREEKY || {};
FREEKY.facility = FREEKY.facility || {};

Object.assign(FREEKY.facility, {
  async moduleAnomalkyctl(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">12 // ANOMAL-KY CONTROL</div><p class="pf-empty">Reading protocol settings...</p></div>`;
    if(!FREEKY.account.hasSupabase()){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">12 // ANOMAL-KY CONTROL</div><p class="pf-empty">Database not configured.</p></div>`; return; }
    try{
      const rows = await FREEKY.adminContent.listSettings(), settings = Object.fromEntries(rows.map(row => [row.key,row.value]));
      const enabled = settings.anomaly_enabled !== 'false', rate = Math.min(100, Math.max(0, Number(settings.anomaly_rate || 4)));
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">12 // ANOMAL-KY CONTROL</div><p class="pf-empty" style="margin-bottom:16px;">Controls the rare Paradox classification globally after save.</p><label class="pf-toggle"><input type="checkbox" id="fcAnomalyEnabled" ${enabled ? 'checked' : ''}><span>Enable ANOMAL-KY protocol</span></label><div class="acct-field"><label>RANDOM ANOMALY RATE (%)</label><input type="number" id="fcAnomalyRate" min="0" max="100" step="0.1" value="${rate}"></div><div id="fcAnomalyMsg" class="acct-msg"></div><div class="btn-row"><button class="btn" onclick="FREEKY.facility.saveAnomalyControl()">Save Protocol</button></div></div>`;
    }catch(e){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">12 // ANOMAL-KY CONTROL</div><p class="pf-empty">Archive unreachable.</p></div>`; }
  },
  async saveAnomalyControl(){
    const msg = document.getElementById('fcAnomalyMsg'), enabled = document.getElementById('fcAnomalyEnabled').checked, rate = Math.min(100, Math.max(0, Number(document.getElementById('fcAnomalyRate').value)));
    if(!Number.isFinite(rate)){ msg.textContent='ENTER A VALID RATE.'; msg.className='acct-msg err'; return; }
    try{ const rows = await FREEKY.adminContent.saveSettings([{key:'anomaly_enabled',value:String(enabled),updated_at:new Date().toISOString()},{key:'anomaly_rate',value:String(rate),updated_at:new Date().toISOString()}]); FREEKY.siteSettings.apply(Object.fromEntries(rows.map(row => [row.key,row.value]))); msg.textContent='PROTOCOL UPDATED.'; msg.className='acct-msg ok'; FREEKY.facility.logAction('Updated ANOMAL-KY protocol'); }catch(e){ msg.textContent=(e.message || 'COULD NOT SAVE PROTOCOL').toUpperCase(); msg.className='acct-msg err'; }
  },
  async moduleDatabase(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">17 // DATABASE</div><p class="pf-empty">Checking archive health...</p></div>`;
    if(!FREEKY.account.hasSupabase()){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">17 // DATABASE</div><p class="pf-empty">Database not configured.</p></div>`; return; }
    const tables = ['profiles','products','product_variants','orders','order_items','drops','product_images','discounts','site_settings','managed_content'];
    const results = await Promise.all(tables.map(async table => { try{ const {count,error}=await supabaseClient.from(table).select('*',{count:'exact',head:true}); return {table,count,error}; }catch(error){return {table,error};} }));
    const available = results.filter(row => !row.error).length;
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">17 // DATABASE</div><p class="pf-empty" style="margin-bottom:16px;">Read-only health check. Record edits stay in their dedicated Facility modules.</p><div class="pf-grid" style="margin-bottom:18px;"><div class="pf-cell"><span>REACHABLE TABLES</span><strong>${available}/${tables.length}</strong></div><div class="pf-cell"><span>CONNECTION</span><strong>${available ? 'NOMINAL' : 'RESTRICTED'}</strong></div></div>${results.map(row => `<div class="fc-user-row"><div><div class="fc-user-name">${row.table}</div><div class="pf-empty">${row.error ? 'UNAVAILABLE OR RLS RESTRICTED' : (row.count || 0) + ' RECORD(S)'}</div></div><span class="pf-empty">${row.error ? 'RESTRICTED' : 'ONLINE'}</span></div>`).join('')}</div>`;
  }
});
