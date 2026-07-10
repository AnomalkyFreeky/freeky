/* ==============================================================
   FREƎ-KY // ACCOUNT — YOUR FILE (registration / access)
   --------------------------------------------------------------
   Client-side only, no real backend yet. getDemoFileRecord()
   returns data shaped exactly like a future database record —
   everything except LOADOUT/DEPLOYMENTS is a placeholder.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.account = {

  // Future database connection: replace this whole function with the response
  // of e.g. GET /api/user/file
  getDemoFileRecord(){
    const s = FREEKY.state;
    const files = FREEKY.data.files;
    return {
      fileId: "DIV17-483921",          // Future database connection: unique user/record id
      status: "ACTIVE",                // User data: account status
      classification: s.finalKey ? (files[s.finalKey] ? files[s.finalKey].name.toUpperCase() : "UNCLASSIFIED") : "UNCLASSIFIED",
      registrationDate: "--/--/----",  // placeholder only — real value would come from the backend
      loadout: s.cart.length,          // live value — already wired to real state
      deployments: s.deploymentsCount, // Deployment history — future DB: full history, not just a count
      clearanceLevel: "I"              // placeholder only
    };
  },

  setMode(mode){
    FREEKY.state.accountMode = mode;
    document.getElementById('tabCreate').classList.toggle('on', mode==='create');
    document.getElementById('tabAccess').classList.toggle('on', mode==='access');
    document.getElementById('acctSubmit').textContent = mode==='create' ? 'Submit →' : 'Access →';
    document.getElementById('acctMsg').textContent = '';
    FREEKY.account.render();
  },

  render(){
    const s = FREEKY.state;
    const form = document.getElementById('acctForm');
    const msg = document.getElementById('acctMsg');
    if(msg) { msg.textContent=''; msg.className='acct-msg'; }

    if(s.accountMode === 'create'){
      form.innerHTML = `
        <div class="acct-field"><label>CALLSIGN</label><input type="text" id="fCallsign" placeholder="e.g. VESPER-9" maxlength="24"></div>
        <div class="acct-field"><label>ACCESS CODE</label><input type="password" id="fCode" placeholder="••••••••"></div>
        <div class="acct-field"><label>CONFIRM ACCESS CODE</label><input type="password" id="fCode2" placeholder="••••••••"></div>
      `;
    } else {
      form.innerHTML = `
        <div class="acct-field"><label>CALLSIGN</label><input type="text" id="fCallsign" placeholder="Your existing callsign" maxlength="24"></div>
        <div class="acct-field"><label>ACCESS CODE</label><input type="password" id="fCode" placeholder="••••••••"></div>
      `;
    }

    const status = document.getElementById('acctStatus');
    if(s.account){
      const rec = FREEKY.account.getDemoFileRecord(); // User data — placeholder until a backend is connected
      status.style.display = 'block';
      status.innerHTML = `
        <span class="as-tag">FILE ACTIVE</span>
        Logged in as <strong style="color:var(--amber);">${s.account.callsign}</strong>.
        <div class="file-record">
          <div class="fr-row"><span>FILE ID</span><span>${rec.fileId}</span></div>
          <div class="fr-row"><span>STATUS</span><span>${rec.status}</span></div>
          <div class="fr-row"><span>CLASSIFICATION</span><span>${rec.classification}</span></div>
          <div class="fr-row"><span>REGISTRATION DATE</span><span>${rec.registrationDate}</span></div>
          <div class="fr-row"><span>LOADOUT</span><span>${rec.loadout} EQUIPMENT ASSIGNED</span></div>
          <div class="fr-row"><span>DEPLOYMENTS</span><span>${rec.deployments}</span></div>
          <div class="fr-row"><span>CLEARANCE LEVEL</span><span>${rec.clearanceLevel} (placeholder only)</span></div>
        </div>
        <div style="margin-top:14px;"><button class="btn ghost" onclick="FREEKY.account.logout()">Log Out</button></div>`;
    } else {
      status.style.display = 'none';
    }
  },

  // Authentication endpoint (future): this whole function becomes an API call
  // (POST /api/register or /api/login). The simulated logic below only checks
  // that fields are filled in — replace the body, keep the call sites.
  submit(){
    const s = FREEKY.state;
    const callsign = (document.getElementById('fCallsign').value || '').trim();
    const code = (document.getElementById('fCode').value || '').trim();
    const msg = document.getElementById('acctMsg');

    if(!callsign || !code){
      msg.textContent = 'CALLSIGN AND ACCESS CODE REQUIRED.';
      msg.className = 'acct-msg err';
      return;
    }
    if(s.accountMode === 'create'){
      const code2 = (document.getElementById('fCode2').value || '').trim();
      if(code !== code2){
        msg.textContent = 'ACCESS CODES DO NOT MATCH.';
        msg.className = 'acct-msg err';
        return;
      }
      s.account = {callsign};
      msg.textContent = 'FILE REGISTERED.';
      msg.className = 'acct-msg ok';
    } else {
      s.account = {callsign};
      msg.textContent = 'ACCESS GRANTED.';
      msg.className = 'acct-msg ok';
    }
    FREEKY.storage.set('freeky_account', s.account); // Future database connection: persist real user record instead
    document.getElementById('acctCornerTag').textContent = 'FILE // ' + callsign.toUpperCase();
    document.getElementById('accountBadge').textContent = '✓';
    FREEKY.account.render();
    FREEKY.ui.scheduleGlitchScan();
  },

  logout(){
    FREEKY.state.account = null;
    FREEKY.storage.remove('freeky_account');
    document.getElementById('acctCornerTag').textContent = 'FILE // NEW';
    document.getElementById('accountBadge').textContent = '—';
    FREEKY.account.render();
  }
};
