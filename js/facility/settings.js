/* Facility Control — Site Settings UI. Data access lives in admin-content-service.js. */
window.FREEKY = window.FREEKY || {};
FREEKY.facility = FREEKY.facility || {};

Object.assign(FREEKY.facility, {
  async moduleSettings(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">21 // SITE SETTINGS</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">21 // SITE SETTINGS</div><p class="pf-empty">Database not configured.</p></div>`;
      return;
    }
    try{
      FREEKY.facility.settingsCache = await FREEKY.adminContent.listSettings();
      FREEKY.facility.renderSettingsList(content);
    }catch(e){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">21 // SITE SETTINGS</div>${FREEKY.facility.archiveError(e)}</div>`;
    }
  },

  renderSettingsList(content){
    const recommended = [
      ['gate_eyebrow', 'Access Gate — eyebrow'], ['gate_headline', 'Access Gate — headline'],
      ['gate_subtext_before', 'Access Gate — copy before redaction'], ['gate_subtext_after', 'Access Gate — copy after redaction'],
      ['gate_network_label', 'Access Gate — network label'], ['gate_begin_button', 'Access Gate — primary button'],
      ['gate_decline_button', 'Access Gate — secondary button'], ['footer_tagline_default', 'Footer — checkout / confirmation'],
      ['footer_tagline_dossier', 'Footer — manifest / dossier'], ['footer_tagline_account', 'Footer — account']
    ];
    const existing = new Map(FREEKY.facility.settingsCache.map(s => [s.key, s.value || '']));
    const safeValue = value => String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const fields = recommended.map(([key, label]) => `<div class="acct-field"><label>${label} <span style="color:var(--dim);">// ${key}</span></label><input type="text" class="fc-setting-input" data-key="${key}" value="${safeValue(existing.get(key))}"></div>`).join('');
    const custom = FREEKY.facility.settingsCache
      .filter(s => !recommended.some(([key]) => key === s.key))
      .map(s => `<div class="acct-field"><label>${s.key}</label><input type="text" class="fc-setting-input" data-key="${s.key}" value="${safeValue(s.value)}"></div>`).join('');
    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">21 // SITE SETTINGS</div>
        <p class="pf-empty" style="margin-bottom:18px;">Access Gate and footer text. Saving creates any missing recommended setting.</p>
        ${fields}${custom}
        <div class="btn-row" style="margin:18px 0;">
          <input type="text" id="fcNewSettingKey" class="fc-search" placeholder="new_setting_key" style="flex:1;">
          <button class="btn ghost" onclick="FREEKY.facility.addSetting()">+ Add Setting</button>
        </div>
        <div id="fcSetMsg" class="acct-msg"></div>
        <div class="btn-row"><button class="btn" onclick="FREEKY.facility.saveAllSettings()">Save All</button></div>
      </div>
    `;
  },

  async saveAllSettings(){
    const msg = document.getElementById('fcSetMsg');
    const inputs = Array.from(document.querySelectorAll('.fc-setting-input'));
    msg.textContent = 'SAVING...'; msg.className = 'acct-msg';
    try{
      const rows = inputs.map(inp => ({ key: inp.dataset.key, value: inp.value, updated_at: new Date().toISOString() }));
      FREEKY.facility.settingsCache = await FREEKY.adminContent.saveSettings(rows);
      msg.textContent = 'SETTINGS SAVED.'; msg.className = 'acct-msg ok';
      FREEKY.facility.logAction('Updated site settings');
    }catch(e){
      msg.textContent = 'COULD NOT SAVE ALL SETTINGS.'; msg.className = 'acct-msg err';
    }
  },

  async addSetting(){
    const keyInput = document.getElementById('fcNewSettingKey');
    const key = keyInput.value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
    if(!key) return;
    try{
      const data = await FREEKY.adminContent.addSetting(key);
      FREEKY.facility.settingsCache.push(data);
      FREEKY.facility.logAction('Added site setting: ' + key);
      FREEKY.facility.renderSettingsList(document.getElementById('fcContent'));
    }catch(e){
      const msg = document.getElementById('fcSetMsg');
      if(msg){ msg.textContent = 'SETTING KEY ALREADY EXISTS OR COULD NOT BE SAVED.'; msg.className = 'acct-msg err'; }
    }
  }
});
