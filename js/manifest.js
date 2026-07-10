/* ==============================================================
   FREƎ-KY // MANIFEST — category index + single category screen
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.manifest = {

  renderIndex(){
    const grid = document.getElementById('tileGrid');
    const cats = FREEKY.data.categories;
    const offduty = cats.filter(c=>c.group==='offduty');
    const assigned = cats.filter(c=>c.group==='assigned');
    const unclassified = cats.filter(c=>c.group==='unclassified');
    const finalKey = FREEKY.state.finalKey;

    const tile = cat => {
      const isParadox = cat.key === 'anomaly';
      const flickerMsg = isParadox ? FREEKY.manifest.pickInstabilityMessage() : '';
      return `
        <button class="cat-tile ${cat.key===finalKey ? 'match':''}" onclick="FREEKY.manifest.openCategory('${cat.key}')">
          <div class="ct-top">
            <span class="ct-no glitch" data-text="${cat.no}">${cat.no}</span>
            <span class="ct-emoji">${cat.emoji}</span>
            <span class="ct-name ${isParadox?'glitch':''}" ${isParadox?`data-text="${cat.name}"`:''}>${cat.name}</span>
          </div>
          <div class="ct-tagline">${cat.tagline}</div>
          ${isParadox ? `<div class="ct-instability glitch" data-text="${flickerMsg}">${flickerMsg}</div>` : ''}
          <div class="ct-enter">ENTER FILE →</div>
        </button>
      `;
    };

    grid.innerHTML = `
      <div class="group-block">
        <span class="group-label">OFF-DUTY EQUIPMENT</span>
        <div class="tile-grid">${offduty.map(tile).join('')}</div>
      </div>
      <div class="group-block">
        <span class="group-label">ASSIGNED EQUIPMENT</span>
        <div class="tile-grid">${assigned.map(tile).join('')}</div>
      </div>
      <div class="group-block">
        <span class="group-label">UNCLASSIFIED EQUIPMENT</span>
        <div class="tile-grid">${unclassified.map(tile).join('')}</div>
      </div>
    `;
    FREEKY.ui.scheduleGlitchScan();
  },

  openCategory(key){
    const cat = FREEKY.data.categories.find(c=>c.key===key);
    const items = FREEKY.data.manifest.filter(m => m.key === key);
    const body = document.getElementById('categoryBody');
    body.innerHTML = `
      <div class="cat-head">
        <span class="cat-no glitch" data-text="${cat.no}">${cat.no}</span>
        <span class="cat-emoji">${cat.emoji}</span>
        <h2 class="cat-name glitch" data-text="${cat.name}">${cat.name}</h2>
      </div>
      <p class="cat-tagline">${cat.tagline}</p>
      <ul class="cat-style">${cat.style.map(s=>`<li>${s}</li>`).join('')}</ul>
      <div class="grid">${items.map(item => FREEKY.manifest.cardHtml(item)).join('')}</div>
    `;
    FREEKY.navigation.showScreen('category');
    FREEKY.ui.scheduleGlitchScan();
  },

  cardHtml(item){
    const sealed = item.status === 'sealed';
    const finalKey = FREEKY.state.finalKey;
    return `
      <button class="card ${item.key===finalKey ? 'match':''} ${sealed?'sealed':''}" data-file="${item.file}" onclick="FREEKY.products.open('${item.file}')">
        <div class="thumb">
          <div class="thumb-emoji">${FREEKY.manifest.categoryEmoji(item.key)}</div>
          <div class="thumb-pending">IMG PENDING</div>
          <div class="thumb-file">FILE ${item.file}</div>
          ${sealed ? '<div class="thumb-sealed">SEALED</div>' : ''}
        </div>
        <div class="card-body">
          <div class="file-no"><span class="glitch" data-text="FILE ${item.file}">FILE ${item.file}</span><span>${item.key===finalKey ? 'MATCH':''}</span></div>
          <div class="item-name">${item.name}</div>
          <div class="item-desc">${item.desc}</div>
          <div class="status-tag ${sealed?'is-sealed':'is-available'}">${sealed ? 'SEALED' : 'AVAILABLE'} — ${item.drop}</div>
          <div class="warn">${item.warn}</div>
          <div class="req"><span>REQ CODE</span><span>${item.req}</span></div>
          <div class="view-hint">VIEW FILE →</div>
        </div>
      </button>
    `;
  },

  categoryEmoji(key){
    const cat = FREEKY.data.categories.find(c=>c.key===key);
    return cat ? cat.emoji : '📦';
  },

  // The archive behaves as though it should not exist here. Never explained,
  // never acknowledged — see the DOSSIER's ANOMAL-KY / interference notes.
  pickInstabilityMessage(){
    const pool = ["ENTRY REMOVED","ENTRY RESTORED","Manifest verification... Complete.","1 discrepancy ignored."];
    return pool[Math.floor(Math.random()*pool.length)];
  }
};
