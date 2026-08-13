/* Facility Control — Drop Management UI. */
window.FREEKY = window.FREEKY || {};
FREEKY.facility = FREEKY.facility || {};

Object.assign(FREEKY.facility, {
  async moduleDrops(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">06 // DROP MANAGEMENT</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">06 // DROP MANAGEMENT</div><p class="pf-empty">Database not configured.</p></div>`;
      return;
    }
    try{
      const { drops, counts } = await FREEKY.adminContent.listDropsWithCounts();
      FREEKY.facility.dropsCache = drops;
      FREEKY.facility._dropProductCounts = counts;
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
        <div class="btn-row" style="margin-bottom:14px;"><button class="btn ghost" onclick="FREEKY.facility.openDropFile(null)">+ New Drop</button></div>
        ${FREEKY.facility.dropsCache.length ? FREEKY.facility.dropsCache.map(d => `
          <div class="fc-user-row"><div><div class="fc-user-name">${d.name}</div>
            <div class="pf-empty">DROP ${d.drop_number} · ${counts[d.id] || 0} product(s) · ${d.active ? 'ACTIVE' : 'INACTIVE'}${d.launch_date ? ' · LAUNCH ' + new Date(d.launch_date).toLocaleDateString('en-GB') : ''}</div>
          </div><button class="btn ghost" onclick="FREEKY.facility.openDropFile('${d.id}')">Open File</button></div>
        `).join('') : '<p class="pf-empty">No drops on record.</p>'}
      </div>`;
  },

  openDropFile(id){
    const d = id ? FREEKY.facility.dropsCache.find(x => x.id === id) : null;
    const safe = value => String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    document.getElementById('fcContent').innerHTML = `
      <div class="fc-module">
        <button class="back-btn" onclick="FREEKY.facility.renderDropsList(document.getElementById('fcContent'))">← Back to Drop Management</button>
        <div class="fc-module-tag">${d ? 'FILE // ' + d.name : 'NEW DROP FILE'}</div>
        <div class="acct-field"><label>NAME</label><input type="text" id="fcDName" value="${safe(d && d.name)}" placeholder="FILE 004 — ..."></div>
        <div class="acct-field"><label>DROP NUMBER</label><input type="number" id="fcDNumber" value="${d ? d.drop_number : ''}"></div>
        <div class="acct-field"><label>LAUNCH DATE</label><input type="date" id="fcDLaunch" value="${d && d.launch_date ? d.launch_date.slice(0,10) : ''}"></div>
        <div class="acct-field"><label>DESCRIPTION</label><textarea id="fcDDesc" rows="4" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;">${safe(d && d.description)}</textarea></div>
        <label class="pf-toggle"><input type="checkbox" id="fcDActive" ${!d || d.active ? 'checked' : ''}><span>Active</span></label>
        <div id="fcDMsg" class="acct-msg"></div><div class="btn-row"><button class="btn" onclick="FREEKY.facility.saveDropFile(${d ? `'${d.id}'` : 'null'})">Save Changes</button></div>
      </div>`;
  },

  async saveDropFile(id){
    const msg = document.getElementById('fcDMsg');
    const payload = { name: document.getElementById('fcDName').value.trim(), drop_number: parseInt(document.getElementById('fcDNumber').value, 10) || 0, launch_date: document.getElementById('fcDLaunch').value || null, description: document.getElementById('fcDDesc').value.trim(), active: document.getElementById('fcDActive').checked };
    if(!payload.name){ msg.textContent = 'NAME IS REQUIRED.'; msg.className = 'acct-msg err'; return; }
    try{
      if(id){
        const saved = await FREEKY.adminContent.saveDrop(id, payload);
        const drop = FREEKY.facility.dropsCache.find(x => x.id === id);
        if(drop) Object.assign(drop, saved);
        FREEKY.facility.logAction('Edited drop: ' + payload.name);
      } else {
        payload.slug = payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        FREEKY.facility.dropsCache.push(await FREEKY.adminContent.saveDrop(null, payload));
        FREEKY.facility.logAction('Created drop: ' + payload.name);
      }
      msg.textContent = 'FILE SAVED.'; msg.className = 'acct-msg ok';
      setTimeout(() => FREEKY.facility.renderDropsList(document.getElementById('fcContent')), 500);
    }catch(e){ msg.textContent = (e.message || 'COULD NOT REACH ARCHIVE').toUpperCase(); msg.className = 'acct-msg err'; }
  }
});
