/* ==============================================================
   FREƎ-KY // SEARCH — sidebar record lookup
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.search = {

  onSidebarSearch(term){
    const box = document.getElementById('sbResults');
    const q = term.trim().toLowerCase();
    if(!q){ box.innerHTML = ''; return; }
    const matches = FREEKY.data.manifest.filter(m =>
      m.name.toLowerCase().includes(q) || m.file.toLowerCase().includes(q) || m.req.toLowerCase().includes(q)
    );
    if(matches.length === 0){ box.innerHTML = '<div class="sb-empty">NO MATCHING RECORDS.</div>'; return; }
    box.innerHTML = matches.map(m => `
      <div class="sb-result" onclick="FREEKY.search.jumpToItem('${m.file}')">
        <span class="rn">${m.name}</span>
        <span class="rf">FILE ${m.file} · ${m.req}</span>
      </div>
    `).join('');
  },

  jumpToItem(fileNo){
    const item = FREEKY.data.manifest.find(m => m.file === fileNo);
    if(!item) return;
    FREEKY.manifest.openCategory(item.key);
    setTimeout(()=>FREEKY.products.open(fileNo), 120);
  }
};
