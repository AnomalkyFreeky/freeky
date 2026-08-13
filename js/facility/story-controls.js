/* Facility Control — Dossier, quiz and randomized-copy controls. */
window.FREEKY = window.FREEKY || {};
FREEKY.facility = FREEKY.facility || {};

Object.assign(FREEKY.facility, {
  async loadManagedEditor(content, key, title, fallback){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">${title}</div><p class="pf-empty">Reading managed content...</p></div>`;
    if(!FREEKY.account.hasSupabase()){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">${title}</div><p class="pf-empty">Database not configured.</p></div>`; return; }
    try{
      const saved = await FREEKY.adminContent.getManagedContent(key);
      FREEKY.facility.renderManagedEditor(content, key, title, saved === null ? fallback : saved, saved !== null);
    }catch(e){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">${title}</div><p class="pf-empty">CMS unavailable. Run database/006_managed_content.sql in Supabase SQL Editor first.</p></div>`; }
  },

  renderManagedEditor(content, key, title, value, isPublished){
    const json = JSON.stringify(value, null, 2).replace(/</g, '&lt;');
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">${title}</div><p class="pf-empty" style="margin-bottom:14px;">${isPublished ? 'Published Supabase content is active on the site.' : 'Currently using the bundled fallback. Save once to activate Supabase-managed content.'}</p><div class="acct-field"><label>CONTENT RECORD (JSON)</label><textarea id="fcManagedContent" rows="20" spellcheck="false" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:12px; padding:12px 14px;">${json}</textarea></div><div id="fcManagedMsg" class="acct-msg"></div><div class="btn-row"><button class="btn" onclick="FREEKY.facility.saveManagedEditor('${key}')">Publish Changes</button><button class="btn ghost" onclick="FREEKY.facility.resetManagedEditor('${key}')">Restore Current Site Content</button></div></div>`;
  },

  async saveManagedEditor(key){
    const msg = document.getElementById('fcManagedMsg'); let value;
    try{ value = JSON.parse(document.getElementById('fcManagedContent').value); }catch(e){ msg.textContent='INVALID JSON — CHECK COMMAS, QUOTES AND BRACKETS.'; msg.className='acct-msg err'; return; }
    const valid = (key === 'dossier' || key === 'quiz') ? Array.isArray(value) : value && typeof value === 'object';
    if(!valid){ msg.textContent='THIS CONTENT RECORD HAS THE WRONG FORMAT.'; msg.className='acct-msg err'; return; }
    try{
      const saved = await FREEKY.adminContent.saveManagedContent(key, value);
      FREEKY.siteContent.apply(key, saved);
      if(key === 'dossier' && FREEKY.dossier) FREEKY.dossier.render();
      msg.textContent='CONTENT PUBLISHED.'; msg.className='acct-msg ok'; FREEKY.facility.logAction('Published managed content: ' + key);
    }catch(e){ msg.textContent=(e.message || 'COULD NOT SAVE CONTENT').toUpperCase(); msg.className='acct-msg err'; }
  },

  resetManagedEditor(key){
    const fallback = key === 'dossier' ? FREEKY.data.dossier : key === 'quiz' ? FREEKY.data.questions : {adminStatusPool:FREEKY.data.adminStatusPool, interferenceLogs:FREEKY.data.interferenceLogs};
    document.getElementById('fcManagedContent').value = JSON.stringify(fallback, null, 2);
  },

  moduleDossierctl(content){ return FREEKY.facility.loadManagedEditor(content, 'dossier', '10 // DOSSIER CONTROL', FREEKY.data.dossier); },
  moduleQuizctl(content){ return FREEKY.facility.loadManagedEditor(content, 'quiz', '11 // QUIZ CONTROL', FREEKY.data.questions); },
  moduleRandomctl(content){ return FREEKY.facility.loadManagedEditor(content, 'random', '13 // RANDOM CONTENT', {adminStatusPool:FREEKY.data.adminStatusPool, interferenceLogs:FREEKY.data.interferenceLogs}); }
});
