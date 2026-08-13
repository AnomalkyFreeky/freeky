/* Public managed-content loader. Bundled data remains the safe fallback. */
window.FREEKY = window.FREEKY || {};

FREEKY.siteContent = {
  async init(){
    if(!FREEKY.account || !FREEKY.account.hasSupabase || !FREEKY.account.hasSupabase()) return;
    try{
      const { data, error } = await supabaseClient.from('managed_content').select('content_key, content_value');
      if(error) return;
      (data || []).forEach(row => FREEKY.siteContent.apply(row.content_key, row.content_value));
    }catch(e){ /* keep bundled content when the CMS is not installed yet */ }
  },
  apply(key, value){
    if(key === 'dossier' && Array.isArray(value)) FREEKY.data.dossier = value;
    if(key === 'quiz' && Array.isArray(value)) FREEKY.data.questions = value;
    if(key === 'random' && value && typeof value === 'object'){
      if(Array.isArray(value.adminStatusPool)) FREEKY.data.adminStatusPool = value.adminStatusPool;
      if(Array.isArray(value.interferenceLogs)) FREEKY.data.interferenceLogs = value.interferenceLogs;
    }
  }
};
