/* ==============================================================
   FREƎ-KY // PRODUCTS — item detail overlay ("decrypted file")
   --------------------------------------------------------------
   Gallery, colour, size. Adding to the loadout itself is handled
   by loadout.js — this module only owns the modal's own view state.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.products = {

  open(fileNo){
    const item = FREEKY.data.manifest.find(m => m.file === fileNo);
    if(!item) return;
    const s = FREEKY.state;
    s.currentItem = item;
    s.galleryIndex = 0;
    s.selectedColor = FREEKY.data.colorOptions[0].hex;
    s.selectedSize = null;
    s.cartMsg = '';
    FREEKY.products.render();
    document.getElementById('itemOverlay').classList.add('show');
  },

  close(){
    document.getElementById('itemOverlay').classList.remove('show');
    FREEKY.state.currentItem = null;
  },

  render(){
    const s = FREEKY.state;
    const item = s.currentItem;
    if(!item) return;
    const emoji = FREEKY.manifest.categoryEmoji(item.key);
    const sealed = item.status === 'sealed';
    const colorObj = FREEKY.data.colorOptions.find(c=>c.hex===s.selectedColor) || FREEKY.data.colorOptions[0];
    const slides = FREEKY.data.imageSlides;

    const optionsBlock = sealed ? `
        <div class="sealed-notice">
          <div class="sealed-tag glitch" data-text="ACCESS: SEALED">ACCESS: SEALED</div>
          <p>This equipment has not yet been issued. Held under ${item.drop} until release.</p>
        </div>
        <button class="btn ghost" style="width:100%; justify-content:center; opacity:.5; cursor:not-allowed;" disabled>Deployment Unavailable</button>
    ` : `
        <span class="opt-label">COLOR</span>
        <div class="color-row">
          ${FREEKY.data.colorOptions.map(c => `<button class="swatch ${c.hex===s.selectedColor?'on':''}" style="background:${c.hex}" onclick="FREEKY.products.selectColor('${c.hex}')" title="${c.name}"></button>`).join('')}
        </div>
        <div class="color-name">${colorObj.name}</div>

        <span class="opt-label">SIZE</span>
        <div class="size-row">
          ${FREEKY.data.sizeOptions.map(sz => `<button class="size-btn ${sz===s.selectedSize?'on':''}" onclick="FREEKY.products.selectSize('${sz}')">${sz}</button>`).join('')}
        </div>

        <div class="item-meta-row"><span>${item.warn}</span><span>REQ ${item.req}</span></div>
        <button class="btn" style="width:100%; justify-content:center;" onclick="FREEKY.loadout.add()" title="Issue Equipment">Add to Loadout</button>
        ${s.cartMsg ? `<div class="color-name" style="margin-top:10px; color:${s.cartMsg.startsWith('SELECT') ? 'var(--red)' : 'var(--amber)'};">${s.cartMsg}</div>` : ''}
    `;

    document.getElementById('itemContent').innerHTML = `
      <div class="item-gallery">
        <div class="thumb">
          <div class="thumb-emoji">${emoji}</div>
          <div class="thumb-pending">IMG PENDING</div>
          <div class="thumb-file">FILE ${item.file} — ${slides[s.galleryIndex]}</div>
        </div>
        <button class="gallery-nav prev" onclick="FREEKY.products.prevImage()">‹</button>
        <button class="gallery-nav next" onclick="FREEKY.products.nextImage()">›</button>
        <div class="gallery-dots">
          ${slides.map((sl,i)=>`<button class="gdot ${i===s.galleryIndex?'on':''}" onclick="FREEKY.products.setImage(${i})"></button>`).join('')}
        </div>
      </div>
      <div class="item-info">
        <div class="file-no-lg glitch" data-text="FILE ${item.file} · ${item.req}">FILE ${item.file} · ${item.req}</div>
        <div class="item-title">${item.name}</div>
        <p class="item-full-desc">${item.desc}</p>
        ${optionsBlock}
      </div>
    `;
    FREEKY.ui.scheduleGlitchScan();
  },

  prevImage(){
    const s = FREEKY.state;
    const len = FREEKY.data.imageSlides.length;
    s.galleryIndex = (s.galleryIndex - 1 + len) % len;
    FREEKY.products.render();
  },
  nextImage(){
    const s = FREEKY.state;
    const len = FREEKY.data.imageSlides.length;
    s.galleryIndex = (s.galleryIndex + 1) % len;
    FREEKY.products.render();
  },
  setImage(i){ FREEKY.state.galleryIndex = i; FREEKY.products.render(); },
  selectColor(hex){ FREEKY.state.selectedColor = hex; FREEKY.products.render(); },
  selectSize(sz){ FREEKY.state.selectedSize = sz; FREEKY.products.render(); }
};
