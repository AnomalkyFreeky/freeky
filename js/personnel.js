/* ==============================================================
   FREƎ-KY // PERSONNEL FILE — the full "Your File" dossier
   --------------------------------------------------------------
   Renders once a real profile is loaded (see js/account.js). Mixes
   real data (identity, classification, deployments, address,
   account settings) with atmospheric, randomized content that
   never touches real data (irregularities, observation, confidence,
   file status — regenerated every time this screen opens).

   ASSUMPTIONS TO CONFIRM (best-effort guesses, safe to correct):
     - orders.status real enum values unknown — mapOrderStatus()
       below guesses common ones; unmapped values just show as-is.
     - `addresses` columns guessed as: user_id, label, full_name,
       phone, country, postcode, city, address_line_1, address_line_2,
       is_default (from the ER diagram, not the SQL export).
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.personnel = {

  interfacePrefs: FREEKY.storage.get('freeky_interface_prefs', {
    crt: true, glitch: true, animations: true, reducedMotion: false, sound: false
  }),

  mapOrderStatus(status){
    const map = {
      pending:"Preparing", processing:"Preparing", confirmed:"Preparing",
      shipped:"Deployed", in_transit:"Deployed",
      delivered:"Delivered", completed:"Delivered",
      cancelled:"Archived", refunded:"Archived", archived:"Archived"
    };
    return map[status] || (status ? status.charAt(0).toUpperCase()+status.slice(1) : "Unknown");
  },

  /* ===== INCIDENT LOG + ARCHIVE NOTES (real, local, lightweight) ===== */
  logIncident(text){
    const log = FREEKY.storage.get('freeky_incidents', []);
    log.unshift({ text, date: new Date().toISOString() });
    FREEKY.storage.set('freeky_incidents', log.slice(0, 20));
  },
  unlock(flag){
    const notes = FREEKY.storage.get('freeky_notes', {});
    if(!notes[flag]){ notes[flag] = true; FREEKY.storage.set('freeky_notes', notes); }
  },

  /* ===== MASTER RENDER ===== */
  async render(){
    const box = document.getElementById('pfSections');
    if(!box) return;

    FREEKY.personnel.logIncident('Logged In');
    FREEKY.personnel.applyInterfacePrefs();

    // Kick off the two async data fetches, render everything else immediately,
    // then fill in 03/04 when the data arrives — no need to block the page.
    box.innerHTML = [
      FREEKY.personnel.section01Identity(),
      FREEKY.personnel.section02Classification(),
      `<div id="pf-03">${FREEKY.personnel.loadingCard("RECOVERED EQUIPMENT")}</div>`,
      `<div id="pf-04">${FREEKY.personnel.loadingCard("DEPLOYMENT HISTORY")}</div>`,
      `<div id="pf-05">${FREEKY.personnel.loadingCard("DEPLOYMENT ADDRESS")}</div>`,
      FREEKY.personnel.section06Account(),
      FREEKY.personnel.section07Interface(),
      FREEKY.personnel.section08ArchiveNotes(),
      FREEKY.personnel.section09Irregularities(),
      FREEKY.personnel.section10Observation(),
      FREEKY.personnel.section11Confidence(),
      FREEKY.personnel.section12FileStatus(),
      FREEKY.personnel.section13IncidentHistory(),
      FREEKY.personnel.section14Emergency(),
      FREEKY.personnel.section15Permissions(),
      FREEKY.personnel.section16Report()
    ].join('');

    FREEKY.ui.scheduleGlitchScan();
    FREEKY.personnel.loadDeployments();
    FREEKY.personnel.loadAddress();
  },

  loadingCard(title){
    return `<div class="pf-card"><div class="pf-tag">${title}</div><p class="pf-empty">Reading archive...</p></div>`;
  },

  /* ===== 01 — IDENTITY (real) ===== */
  section01Identity(){
    const p = FREEKY.account.currentProfile;
    const created = p && p.created_at ? new Date(p.created_at) : null;
    const createdStr = created ? created.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).toUpperCase() : "--/--/----";
    return `
      <div class="pf-card">
        <div class="pf-tag glitch" data-text="01 // IDENTITY">01 // IDENTITY</div>
        <div class="pf-grid">
          <div class="pf-cell"><span>DEPLOYMENT ID</span><strong>${p ? (p.registration_number || p.id) : '—'}</strong></div>
          <div class="pf-cell"><span>USERNAME</span><strong>${p ? p.username : '—'}</strong></div>
          <div class="pf-cell"><span>CLASSIFICATION</span><strong>${FREEKY.state.finalKey ? FREEKY.state.finalKey.toUpperCase() : 'UNCLASSIFIED'}</strong></div>
          <div class="pf-cell"><span>STATUS</span><strong>ACTIVE</strong></div>
          <div class="pf-cell"><span>ARCHIVE ACCESS</span><strong>LEVEL ${p ? String(p.clearance_level).padStart(2,'0') : '01'}</strong></div>
          <div class="pf-cell"><span>FILE CREATED</span><strong>${createdStr}</strong></div>
        </div>
      </div>
    `;
  },

  /* ===== 02 — CLASSIFICATION (real) ===== */
  section02Classification(){
    const s = FREEKY.state;
    const files = FREEKY.data.files;
    const key = s.finalKey;
    const name = key && files[key] ? files[key].name.toUpperCase() : "UNCLASSIFIED";
    const tier = (key && key !== 'anomaly' && key !== 'outsider' && key !== 'unclassified' && s.finalScore)
      ? FREEKY.classification.confidenceTier(s.finalScore).label
      : "—";
    const lastDate = FREEKY.storage.get('freeky_classification_date', null);
    const lastStr = lastDate ? new Date(lastDate).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).toUpperCase() : "NEVER";
    return `
      <div class="pf-card">
        <div class="pf-tag">02 // CLASSIFICATION</div>
        <div class="pf-grid">
          <div class="pf-cell"><span>CURRENT CLASSIFICATION</span><strong>${name}</strong></div>
          <div class="pf-cell"><span>CLASSIFICATION CONFIDENCE</span><strong>${tier}</strong></div>
          <div class="pf-cell"><span>LAST CLASSIFICATION DATE</span><strong>${lastStr}</strong></div>
        </div>
        <button class="btn ghost" style="margin-top:16px;" onclick="FREEKY.personnel.reclassify()">Reclassify</button>
      </div>
    `;
  },
  reclassify(){ FREEKY.quiz.start(); },

  /* ===== 03/04 — RECOVERED EQUIPMENT + DEPLOYMENT HISTORY (real, async) ===== */
  async loadDeployments(){
    const eqBox = document.getElementById('pf-03');
    const histBox = document.getElementById('pf-04');
    if(!FREEKY.account.hasSupabase() || !FREEKY.account.currentProfile){
      if(eqBox) eqBox.innerHTML = FREEKY.personnel.emptyCard("RECOVERED EQUIPMENT", "No equipment on file yet.");
      if(histBox) histBox.innerHTML = FREEKY.personnel.emptyCard("DEPLOYMENT HISTORY", "No deployments on file yet.");
      return;
    }
    try{
      const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('*, order_items(*, product_variants(price, products(code,name)))')
        .eq('user_id', FREEKY.account.currentProfile.user_id)
        .order('created_at', { ascending:false });

      if(error || !orders){
        if(eqBox) eqBox.innerHTML = FREEKY.personnel.emptyCard("RECOVERED EQUIPMENT", "Archive unreachable.");
        if(histBox) histBox.innerHTML = FREEKY.personnel.emptyCard("DEPLOYMENT HISTORY", "Archive unreachable.");
        return;
      }

      // 03 — flatten every item across every order
      const equipment = [];
      orders.forEach(o => {
        (o.order_items || []).forEach(it => {
          const product = it.product_variants && it.product_variants.products;
          equipment.push({
            code: product ? product.code : '—',
            name: product ? product.name : 'Unknown Equipment',
            status: FREEKY.personnel.mapOrderStatus(o.status),
            date: o.created_at
          });
        });
      });

      if(eqBox){
        eqBox.innerHTML = equipment.length ? `
          <div class="pf-card">
            <div class="pf-tag">03 // RECOVERED EQUIPMENT</div>
            <div class="pf-eq-grid">
              ${equipment.map(e => `
                <div class="pf-eq-item">
                  <div class="pf-eq-code">${e.code}</div>
                  <div class="pf-eq-name">${e.name}</div>
                  <div class="pf-eq-row"><span>STATUS</span><span>${e.status}</span></div>
                  <div class="pf-eq-row"><span>RECOVERED</span><span>${new Date(e.date).toLocaleDateString('en-GB')}</span></div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : FREEKY.personnel.emptyCard("RECOVERED EQUIPMENT", "No equipment on file yet. Visit the Manifest to begin.");
      }

      // 04 — one row per order
      if(histBox){
        histBox.innerHTML = orders.length ? `
          <div class="pf-card">
            <div class="pf-tag">04 // DEPLOYMENT HISTORY</div>
            ${orders.map(o => `
              <div class="pf-hist-row">
                <div class="pf-hist-id">${o.order_number}</div>
                <div class="pf-hist-meta">
                  <span>${new Date(o.created_at).toLocaleDateString('en-GB')}</span>
                  <span>${(o.order_items||[]).length} EQUIPMENT</span>
                  <span class="pf-hist-status">${FREEKY.personnel.mapOrderStatus(o.status)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : FREEKY.personnel.emptyCard("DEPLOYMENT HISTORY", "No deployments on file yet.");
      }
    }catch(e){
      if(eqBox) eqBox.innerHTML = FREEKY.personnel.emptyCard("RECOVERED EQUIPMENT", "Archive unreachable.");
      if(histBox) histBox.innerHTML = FREEKY.personnel.emptyCard("DEPLOYMENT HISTORY", "Archive unreachable.");
    }
  },

  emptyCard(title, msg){
    return `<div class="pf-card"><div class="pf-tag">${title}</div><p class="pf-empty">${msg}</p></div>`;
  },

  /* ===== 05 — DEPLOYMENT ADDRESS (real, editable) ===== */
  async loadAddress(){
    const box = document.getElementById('pf-05');
    if(!box) return;
    let addr = null;
    if(FREEKY.account.hasSupabase() && FREEKY.account.currentProfile){
      try{
        const { data } = await supabaseClient
          .from('addresses').select('*')
          .eq('user_id', FREEKY.account.currentProfile.user_id)
          .eq('is_default', true)
          .maybeSingle();
        addr = data || null;
      }catch(e){ addr = null; }
    }
    FREEKY.personnel._currentAddress = addr;
    box.innerHTML = `
      <div class="pf-card">
        <div class="pf-tag">05 // DEPLOYMENT ADDRESS</div>
        <div class="acct-field"><label>FULL NAME</label><input type="text" id="pfAddrName" value="${addr ? (addr.full_name||'') : ''}"></div>
        <div class="acct-field"><label>ADDRESS LINE 1</label><input type="text" id="pfAddrLine1" value="${addr ? (addr.address_line_1||'') : ''}"></div>
        <div class="acct-field"><label>ADDRESS LINE 2</label><input type="text" id="pfAddrLine2" value="${addr ? (addr.address_line_2||'') : ''}"></div>
        <div style="display:flex; gap:14px;">
          <div class="acct-field" style="flex:1;"><label>CITY</label><input type="text" id="pfAddrCity" value="${addr ? (addr.city||'') : ''}"></div>
          <div class="acct-field" style="flex:1;"><label>POSTCODE</label><input type="text" id="pfAddrPostcode" value="${addr ? (addr.postcode||'') : ''}"></div>
        </div>
        <div style="display:flex; gap:14px;">
          <div class="acct-field" style="flex:1;"><label>COUNTRY</label><input type="text" id="pfAddrCountry" value="${addr ? (addr.country||'') : ''}"></div>
          <div class="acct-field" style="flex:1;"><label>PHONE</label><input type="text" id="pfAddrPhone" value="${addr ? (addr.phone||'') : ''}"></div>
        </div>
        <div id="pfAddrMsg" class="acct-msg"></div>
        <button class="btn ghost" onclick="FREEKY.personnel.saveAddress()">Save Address</button>
      </div>
    `;
  },

  async saveAddress(){
    const msg = document.getElementById('pfAddrMsg');
    if(!FREEKY.account.hasSupabase() || !FREEKY.account.currentProfile){
      msg.textContent = 'DATABASE CONNECTION NOT CONFIGURED.'; msg.className = 'acct-msg err'; return;
    }
    const row = {
      user_id: FREEKY.account.currentProfile.user_id,
      label: 'default',
      is_default: true,
      full_name: document.getElementById('pfAddrName').value.trim(),
      address_line_1: document.getElementById('pfAddrLine1').value.trim(),
      address_line_2: document.getElementById('pfAddrLine2').value.trim(),
      city: document.getElementById('pfAddrCity').value.trim(),
      postcode: document.getElementById('pfAddrPostcode').value.trim(),
      country: document.getElementById('pfAddrCountry').value.trim(),
      phone: document.getElementById('pfAddrPhone').value.trim()
    };
    try{
      let error;
      if(FREEKY.personnel._currentAddress){
        ({ error } = await supabaseClient.from('addresses').update(row).eq('id', FREEKY.personnel._currentAddress.id));
      } else {
        ({ error } = await supabaseClient.from('addresses').insert(row));
      }
      if(error){ msg.textContent = error.message.toUpperCase(); msg.className='acct-msg err'; return; }
      msg.textContent = 'ADDRESS UPDATED.'; msg.className = 'acct-msg ok';
      FREEKY.personnel.logIncident('Updated Address');
      FREEKY.personnel.loadAddress();
    }catch(e){
      msg.textContent = 'COULD NOT REACH ARCHIVE.'; msg.className = 'acct-msg err';
    }
  },

  /* ===== 06 — ACCOUNT (real, editable) ===== */
  section06Account(){
    const p = FREEKY.account.currentProfile;
    const prefs = FREEKY.storage.get('freeky_account_prefs', {language:'EN', newsletter:false});
    return `
      <div class="pf-card">
        <div class="pf-tag">06 // ACCOUNT</div>
        <div class="acct-field"><label>USERNAME</label><input type="text" id="pfUsername" value="${p ? p.username : ''}"></div>
        <div class="acct-field"><label>NEW EMAIL (leave blank to keep current)</label><input type="email" id="pfEmail" placeholder="new@example.com"></div>
        <div class="acct-field"><label>NEW ACCESS CODE (leave blank to keep current)</label><input type="password" id="pfPassword" placeholder="••••••••"></div>
        <div style="display:flex; gap:14px; align-items:flex-end;">
          <div class="acct-field" style="flex:1;"><label>LANGUAGE</label>
            <select id="pfLanguage" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;">
              <option value="EN" ${prefs.language==='EN'?'selected':''}>EN</option>
              <option value="IT" ${prefs.language==='IT'?'selected':''}>IT</option>
            </select>
          </div>
          <div class="acct-field" style="flex:1;">
            <label><input type="checkbox" id="pfNewsletter" ${prefs.newsletter?'checked':''}> NEWSLETTER</label>
          </div>
        </div>
        <div id="pfAccountMsg" class="acct-msg"></div>
        <button class="btn ghost" onclick="FREEKY.personnel.saveAccount()">Save Changes</button>
      </div>
    `;
  },

  async saveAccount(){
    const msg = document.getElementById('pfAccountMsg');
    const username = document.getElementById('pfUsername').value.trim();
    const email = document.getElementById('pfEmail').value.trim();
    const password = document.getElementById('pfPassword').value.trim();
    const language = document.getElementById('pfLanguage').value;
    const newsletter = document.getElementById('pfNewsletter').checked;

    FREEKY.storage.set('freeky_account_prefs', {language, newsletter});

    if(!FREEKY.account.hasSupabase() || !FREEKY.account.currentProfile){
      msg.textContent = 'PREFERENCES SAVED LOCALLY. DATABASE NOT CONFIGURED FOR THE REST.';
      msg.className = 'acct-msg ok';
      return;
    }
    try{
      if(username && username !== FREEKY.account.currentProfile.username){
        const { error } = await supabaseClient.from('profiles').update({ username }).eq('user_id', FREEKY.account.currentProfile.user_id);
        if(error){ msg.textContent = error.message.toUpperCase(); msg.className='acct-msg err'; return; }
        FREEKY.account.currentProfile.username = username;
      }
      if(email || password){
        const payload = {};
        if(email) payload.email = email;
        if(password) payload.password = password;
        const { error } = await supabaseClient.auth.updateUser(payload);
        if(error){ msg.textContent = error.message.toUpperCase(); msg.className='acct-msg err'; return; }
      }
      msg.textContent = 'FILE UPDATED.';
      msg.className = 'acct-msg ok';
    }catch(e){
      msg.textContent = 'COULD NOT REACH ARCHIVE.'; msg.className = 'acct-msg err';
    }
  },

  /* ===== 07 — INTERFACE (real, functional toggles) ===== */
  section07Interface(){
    const p = FREEKY.personnel.interfacePrefs;
    const toggle = (key, label) => `
      <label class="pf-toggle">
        <input type="checkbox" ${p[key] ? 'checked' : ''} onchange="FREEKY.personnel.setInterfacePref('${key}', this.checked)">
        <span>${label}</span>
      </label>
    `;
    return `
      <div class="pf-card">
        <div class="pf-tag">07 // INTERFACE</div>
        ${toggle('crt','CRT Filter')}
        ${toggle('glitch','Glitch Intensity')}
        ${toggle('animations','Animations')}
        ${toggle('reducedMotion','Reduced Motion')}
        ${toggle('sound','Terminal Sounds')}
      </div>
    `;
  },
  setInterfacePref(key, value){
    FREEKY.personnel.interfacePrefs[key] = value;
    FREEKY.storage.set('freeky_interface_prefs', FREEKY.personnel.interfacePrefs);
    FREEKY.personnel.applyInterfacePrefs();
    if(value && key === 'sound') FREEKY.personnel.playTick();
  },
  applyInterfacePrefs(){
    const p = FREEKY.personnel.interfacePrefs;
    document.body.classList.toggle('pf-no-crt', !p.crt);
    document.body.classList.toggle('pf-no-glitch', !p.glitch);
    document.body.classList.toggle('pf-no-animations', !p.animations);
    document.body.classList.toggle('pf-reduced-motion', !!p.reducedMotion);
  },
  playTick(){
    if(!FREEKY.personnel.interfacePrefs.sound) return;
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 720;
      osc.type = 'square';
      gain.gain.value = 0.02;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.045);
    }catch(e){ /* audio unavailable — silent no-op */ }
  },

  /* ===== 08 — ARCHIVE NOTES (real, unlockable) ===== */
  section08ArchiveNotes(){
    const notes = FREEKY.storage.get('freeky_notes', {});
    const defs = [
      {key:'classification', label:'Completed Classification', test: () => !!FREEKY.state.finalKey},
      {key:'manifest', label:'Visited Manifest', test: () => !!notes.manifest},
      {key:'equipment', label:'Recovered First Equipment', test: () => FREEKY.state.deploymentsCount > 0},
      {key:'restricted', label:'Viewed Restricted Record', test: () => !!notes.restricted},
      {key:'hidden', label:'Discovered Hidden File', test: () => !!notes.hidden}
    ];
    return `
      <div class="pf-card">
        <div class="pf-tag">08 // ARCHIVE NOTES</div>
        ${defs.map(d => `<div class="pf-note ${d.test() ? 'unlocked' : ''}">${d.test() ? '✓' : '○'} ${d.label}</div>`).join('')}
      </div>
    `;
  },

  /* ===== 09-12 — atmospheric, randomized every render ===== */
  section09Irregularities(){
    const pool = FREEKY.data.personnelFlavor.irregularities;
    const count = 2 + Math.floor(Math.random()*3);
    const picks = FREEKY.dossier.shuffle(pool).slice(0, count);
    return `
      <div class="pf-card">
        <div class="pf-tag">09 // PERSONAL IRREGULARITIES</div>
        ${picks.map(p => `<div class="pf-irregularity glitch" data-text="${p}">— ${p}</div>`).join('')}
      </div>
    `;
  },
  section10Observation(){
    const pool = FREEKY.data.personnelFlavor.observations;
    const pick = pool[Math.floor(Math.random()*pool.length)];
    return `<div class="pf-card"><div class="pf-tag">10 // OBSERVATION</div><p class="pf-obs glitch" data-text="${pick}">${pick}</p></div>`;
  },
  section11Confidence(){
    const pct = 60 + Math.floor(Math.random()*39);
    const pool = FREEKY.data.personnelFlavor.confidenceEndings;
    const pick = pool[Math.floor(Math.random()*pool.length)];
    return `
      <div class="pf-card">
        <div class="pf-tag">11 // SYSTEM CONFIDENCE</div>
        <div class="pf-confidence">${pct}%</div>
        <p class="pf-obs">${pick}</p>
      </div>
    `;
  },
  section12FileStatus(){
    const pool = FREEKY.data.personnelFlavor.fileStatuses;
    const pick = pool[Math.floor(Math.random()*pool.length)];
    return `<div class="pf-card"><div class="pf-tag">12 // FILE STATUS</div><p class="pf-obs">${pick}</p></div>`;
  },

  /* ===== 13 — INCIDENT HISTORY (real log) ===== */
  section13IncidentHistory(){
    const log = FREEKY.storage.get('freeky_incidents', []);
    return `
      <div class="pf-card">
        <div class="pf-tag">13 // INCIDENT HISTORY</div>
        ${log.length ? log.slice(0,8).map(i => `
          <div class="pf-incident"><span>${i.text}</span><span>${new Date(i.date).toLocaleDateString('en-GB')}</span></div>
        `).join('') : '<p class="pf-empty">No recorded activity yet.</p>'}
      </div>
    `;
  },

  /* ===== 14 — EMERGENCY CONTACT (static) ===== */
  section14Emergency(){
    return `<div class="pf-card"><div class="pf-tag">14 // EMERGENCY CONTACT</div><div class="pf-eq-row"><span>EMERGENCY CONTACT</span><span>OUTSIDE</span></div><div class="pf-eq-row"><span></span><span>UNAVAILABLE.</span></div></div>`;
  },

  /* ===== 15 — PERMISSIONS (static checklist) ===== */
  section15Permissions(){
    const items = [
      {label:'Browse Archive', ok:true}, {label:'Recover Equipment', ok:true},
      {label:'Modify File', ok:true}, {label:'Continue Existing', ok:true},
      {label:'Understand Everything', ok:false}
    ];
    return `
      <div class="pf-card">
        <div class="pf-tag">15 // PERMISSIONS</div>
        ${items.map(i => `<div class="pf-permission ${i.ok?'ok':'no'}">${i.ok?'✓':'✗'} ${i.label}</div>`).join('')}
      </div>
    `;
  },

  /* ===== 16 — REPORT YOURSELF ===== */
  section16Report(){
    return `
      <div class="pf-card">
        <div class="pf-tag">16 // REPORT YOURSELF</div>
        <button class="btn ghost" onclick="FREEKY.personnel.reportYourself()">Report Yourself</button>
        <p class="pf-obs" id="pfReportMsg" style="margin-top:10px;"></p>
      </div>
    `;
  },
  reportYourself(){
    document.getElementById('pfReportMsg').textContent = 'Report received. Thank you for your honesty.';
  }
};
