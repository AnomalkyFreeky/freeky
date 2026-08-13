window.FREEKY = window.FREEKY || {};
FREEKY.siteSettings = {
  async init(){
    if(!FREEKY.account || !FREEKY.account.hasSupabase()) return;
    try{
      const { data, error } = await supabaseClient.from('site_settings').select('key, value');
      if(error || !data) return;
      FREEKY.siteSettings.apply(Object.fromEntries(data.map(row => [row.key, row.value])));
    }catch(e){ console.warn('FREÆŽ-KY: site settings unavailable.', e); }
  },
  apply(settings){
    FREEKY.siteSettings.values = Object.assign(FREEKY.siteSettings.values || {}, settings);
    Object.entries(settings).forEach(([key, value]) => {
      if(value === null || value === '') return;
      document.querySelectorAll(`[data-site-setting="${key}"]`).forEach(el => {
        el.textContent = value;
        if(el.classList.contains('glitch')) el.dataset.text = value;
      });
    });
    // A few legacy nodes do not carry a marker yet; address them without using
    // innerHTML so staff-entered copy is never interpreted as markup.
    const network = Array.from(document.querySelectorAll('.meta-row')).find(row => row.firstElementChild && row.firstElementChild.textContent.trim() === 'NETWORK');
    if(network && settings.gate_network_label) network.lastElementChild.textContent = settings.gate_network_label;
    FREEKY.siteSettings.setFooter('SECURE EQUIPMENT ALLOCATION SYSTEM', settings.footer_tagline_default);
    FREEKY.siteSettings.setFooter('EYES ONLY — DO NOT DISTRIBUTE', settings.footer_tagline_dossier);
    FREEKY.siteSettings.setFooter('EYES ONLY — RECORD INCOMPLETE', settings.footer_tagline_account);
    FREEKY.ui.scheduleGlitchScan();
  },
  setFooter(match, value){
    if(!value) return;
    document.querySelectorAll('footer.f').forEach(footer => {
      if(!footer.textContent.includes(match)) return;
      const textNode = Array.from(footer.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if(textNode) textNode.textContent = `\n      ${value}\n    `;
    });
  }
};
