/* ==============================================================
   FREƎ-KY // ACCOUNT — YOUR FILE (registration / access)
   --------------------------------------------------------------
   STEP 1 of the gradual Supabase migration: this file is now wired
   to real Supabase auth + the `profiles` table. Everything else
   (Loadout/cart, classification, deployments count) is still
   localStorage — see js/loadout.js, js/classification.js.

   Falls back gracefully if js/supabase.js still has placeholder
   credentials (SUPABASE_URL/SUPABASE_KEY) — the rest of the site
   keeps working, this screen just can't authenticate yet.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.account = {

  currentProfile: null, // real row from `profiles`, once loaded — null until logged in

  hasSupabase(){
    return typeof supabaseClient !== 'undefined' && supabaseClient !== null;
  },

  // Called once from app.js on boot. Supabase's own client already persists
  // its session in the browser — if one exists, restore the profile view
  // without asking the visitor to log in again.
  async init(){
    if(!FREEKY.account.hasSupabase()) return;
    try{
      const { data } = await supabaseClient.auth.getSession();
      if(data && data.session && data.session.user){
        await FREEKY.account.loadProfile(data.session.user.id);
        FREEKY.state.account = {
          callsign: (FREEKY.account.currentProfile && FREEKY.account.currentProfile.callsign) || data.session.user.email
        };
        FREEKY.storage.set('freeky_account', FREEKY.state.account);
        const badge = document.getElementById('accountBadge');
        if(badge) badge.textContent = '✓';
      }
    }catch(e){ /* not configured yet, or no active session — fine, stay logged out */ }
  },

  async loadProfile(userId){
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if(!error) FREEKY.account.currentProfile = data;
    return data;
  },

  // User data — real, once a profile is loaded. LOADOUT and DEPLOYMENTS are
  // still local state; they migrate to `orders` / `equipment_history` next.
  getFileRecord(){
    const s = FREEKY.state;
    const p = FREEKY.account.currentProfile;
    const files = FREEKY.data.files;
    return {
      fileId: p ? (p.registration_number || p.id) : "—",
      status: "ACTIVE",
      classification: s.finalKey ? (files[s.finalKey] ? files[s.finalKey].name.toUpperCase() : "UNCLASSIFIED") : "UNCLASSIFIED",
      registrationDate: (p && p.created_at) ? p.created_at.slice(0,10) : "--/--/----",
      loadout: s.cart.length,
      deployments: s.deploymentsCount,
      clearanceLevel: p ? p.clearance_level : "I",
      role: p && p.role ? p.role.toUpperCase() : "USER"
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
        <div class="acct-field"><label>TRANSMISSION ADDRESS</label><input type="email" id="fEmail" placeholder="you@example.com"></div>
        <div class="acct-field"><label>ACCESS CODE</label><input type="password" id="fCode" placeholder="•••••••• (min. 6 characters)"></div>
        <div class="acct-field"><label>CONFIRM ACCESS CODE</label><input type="password" id="fCode2" placeholder="••••••••"></div>
      `;
    } else {
      form.innerHTML = `
        <div class="acct-field"><label>TRANSMISSION ADDRESS</label><input type="email" id="fEmail" placeholder="you@example.com"></div>
        <div class="acct-field"><label>ACCESS CODE</label><input type="password" id="fCode" placeholder="••••••••"></div>
      `;
    }

    const status = document.getElementById('acctStatus');
    if(s.account){
      const rec = FREEKY.account.getFileRecord();
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
          <div class="fr-row"><span>CLEARANCE LEVEL</span><span>${rec.clearanceLevel}</span></div>
          <div class="fr-row"><span>ROLE</span><span>${rec.role}</span></div>
        </div>
        <div style="margin-top:14px;"><button class="btn ghost" onclick="FREEKY.account.logout()">Log Out</button></div>`;
    } else {
      status.style.display = 'none';
    }
  },

  // Authentication endpoint: LIVE as of this step. Uses Supabase email/password
  // auth, then reads/writes the `profiles` row for that user.
  async submit(){
    const s = FREEKY.state;
    const callsignInput = document.getElementById('fCallsign');
    const callsign = callsignInput ? (callsignInput.value || '').trim() : (s.account ? s.account.callsign : '');
    const email = (document.getElementById('fEmail').value || '').trim();
    const code = (document.getElementById('fCode').value || '').trim();
    const msg = document.getElementById('acctMsg');

    if(!FREEKY.account.hasSupabase()){
      msg.textContent = 'DATABASE CONNECTION NOT CONFIGURED. SEE js/supabase.js.';
      msg.className = 'acct-msg err';
      return;
    }
    if(!email || !code || (s.accountMode === 'create' && !callsign)){
      msg.textContent = 'ALL FIELDS ARE REQUIRED.';
      msg.className = 'acct-msg err';
      return;
    }

    msg.textContent = 'VERIFYING...';
    msg.className = 'acct-msg';

    if(s.accountMode === 'create'){
      const code2 = (document.getElementById('fCode2').value || '').trim();
      if(code !== code2){
        msg.textContent = 'ACCESS CODES DO NOT MATCH.';
        msg.className = 'acct-msg err';
        return;
      }
      const { data, error } = await supabaseClient.auth.signUp({ email, password: code });
      if(error){
        msg.textContent = error.message.toUpperCase();
        msg.className = 'acct-msg err';
        return;
      }
      // Attach (or create) the profile row for this user. If a database
      // trigger already created a blank row on signup, this just fills it in.
      if(data.user){
        const { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .upsert({ user_id: data.user.id, callsign, username: callsign }, { onConflict: 'user_id' })
          .select()
          .single();
        if(!profileError) FREEKY.account.currentProfile = profileData;
      }
      s.account = { callsign };
      msg.textContent = data.session ? 'FILE REGISTERED.' : 'FILE REGISTERED. CHECK YOUR EMAIL TO CONFIRM.';
      msg.className = 'acct-msg ok';
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: code });
      if(error){
        msg.textContent = error.message.toUpperCase();
        msg.className = 'acct-msg err';
        return;
      }
      await FREEKY.account.loadProfile(data.user.id);
      s.account = { callsign: (FREEKY.account.currentProfile && FREEKY.account.currentProfile.callsign) || email };
      msg.textContent = 'ACCESS GRANTED.';
      msg.className = 'acct-msg ok';
    }

    FREEKY.storage.set('freeky_account', s.account); // local cache for the sidebar badge only — Supabase session is the real source of truth
    document.getElementById('acctCornerTag').textContent = 'FILE // ' + s.account.callsign.toUpperCase();
    document.getElementById('accountBadge').textContent = '✓';
    FREEKY.account.render();
    FREEKY.ui.scheduleGlitchScan();
  },

  async logout(){
    if(FREEKY.account.hasSupabase()){
      try{ await supabaseClient.auth.signOut(); }catch(e){ /* ignore */ }
    }
    FREEKY.account.currentProfile = null;
    FREEKY.state.account = null;
    FREEKY.storage.remove('freeky_account');
    document.getElementById('acctCornerTag').textContent = 'FILE // NEW';
    document.getElementById('accountBadge').textContent = '—';
    FREEKY.account.render();
  }
};
