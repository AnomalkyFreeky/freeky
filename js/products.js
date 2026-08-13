/* ==============================================================
   FREÆŽ-KY // PRODUCTS — item detail overlay ("decrypted file")
   --------------------------------------------------------------
   The manifest supplies the narrative presentation. Product, variant,
   stock and image data comes from Supabase whenever it is available.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.products = {
  _catalog: {},

  async open(fileNo){
    const item = FREEKY.data.manifest.find(m => m.file === fileNo);
    if(!item) return;
    const s = FREEKY.state;
    s.currentItem = item;
    s.galleryIndex = 0;
    s.selectedColor = null;
    s.selectedSize = null;
    s.cartMsg = '';
    FREEKY.products.render();
    document.getElementById('itemOverlay').classList.add('show');

    const catalogItem = await FREEKY.products.fetchCatalogItem(fileNo);
    // Do not redraw an overlay that was closed or replaced while the request ran.
    if(FREEKY.state.currentItem !== item) return;
    if(catalogItem){
      item.catalog = catalogItem;
      const colors = FREEKY.products.colorOptions(item);
      s.selectedColor = colors.length ? colors[0].hex : null;
    }
    FREEKY.products.render();
  },

  async fetchCatalogItem(code){
    if(FREEKY.products._catalog[code]) return FREEKY.products._catalog[code];
    if(!FREEKY.account || !FREEKY.account.hasSupabase()) return null;
    try{
      const { data, error } = await supabaseClient
        .from('products')
        .select('id, code, name, description, short_description, price, active, status, product_images(image_url, alt_text, sort_order, is_primary), product_variants(id, price, stock, active, sizes(name, sort_order), colors(name, hex))')
        .eq('code', code)
        .single();
      if(error || !data) return null;
      data.product_images = (data.product_images || []).sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
      FREEKY.products._catalog[code] = data;
      return data;
    }catch(e){
      console.warn('FREÆŽ-KY: catalog record unavailable.', e);
      return null;
    }
  },

  availableVariants(item){
    const catalog = item && item.catalog;
    if(!catalog || !catalog.active || catalog.status !== 'available') return [];
    return (catalog.product_variants || []).filter(v => v.active && Number(v.stock) > 0 && v.sizes && v.colors);
  },

  colorOptions(item){
    const variants = FREEKY.products.availableVariants(item);
    if(item && item.catalog) {
      const colors = [];
      variants.forEach(v => {
        const color = v.colors;
        if(color && !colors.some(c => c.name === color.name)) colors.push(color);
      });
      return colors;
    }
    return FREEKY.data.colorOptions;
  },

  sizeOptions(item, colorHex){
    const variants = FREEKY.products.availableVariants(item);
    if(item && item.catalog) {
      return variants
        .filter(v => v.colors.hex === colorHex)
        .map(v => v.sizes)
        .filter((size, index, list) => size && list.findIndex(s => s.name === size.name) === index)
        .sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
    return FREEKY.data.sizeOptions.map(name => ({name}));
  },

  selectedVariant(){
    const s = FREEKY.state;
    return FREEKY.products.availableVariants(s.currentItem).find(v =>
      v.colors.hex === s.selectedColor && v.sizes.name === s.selectedSize
    ) || null;
  },

  close(){
    document.getElementById('itemOverlay').classList.remove('show');
    FREEKY.state.currentItem = null;
  },

  render(){
    const s = FREEKY.state;
    const item = s.currentItem;
    if(!item) return;
    const catalog = item.catalog;
    const emoji = FREEKY.manifest.categoryEmoji(item.key);
    const variants = FREEKY.products.availableVariants(item);
    const sealed = item.status === 'sealed' || (catalog && (!catalog.active || catalog.status !== 'available' || !variants.length));
    const colors = FREEKY.products.colorOptions(item);
    const colorObj = colors.find(c => c.hex === s.selectedColor) || colors[0] || {name:'UNAVAILABLE', hex:'#2c2c2e'};
    const sizes = FREEKY.products.sizeOptions(item, colorObj.hex);
    const images = catalog && catalog.product_images && catalog.product_images.length ? catalog.product_images : [];
    const image = images[s.galleryIndex % Math.max(images.length, 1)];
    const displayName = catalog && catalog.name ? catalog.name : item.name;
    const description = catalog && (catalog.description || catalog.short_description) ? (catalog.description || catalog.short_description) : item.desc;
    const selectedVariant = FREEKY.products.selectedVariant();
    const price = selectedVariant && selectedVariant.price != null ? selectedVariant.price : (catalog && catalog.price);

    const optionsBlock = sealed ? `
        <div class="sealed-notice">
          <div class="sealed-tag glitch" data-text="ACCESS: SEALED">ACCESS: SEALED</div>
          <p>${catalog && catalog.status === 'available' ? 'This equipment is currently out of stock.' : `This equipment has not yet been issued. Held under ${item.drop} until release.`}</p>
        </div>
        <button class="btn ghost" style="width:100%; justify-content:center; opacity:.5; cursor:not-allowed;" disabled>Deployment Unavailable</button>
    ` : `
        <span class="opt-label">COLOR</span>
        <div class="color-row">
          ${colors.map(c => `<button class="swatch ${c.hex===s.selectedColor?'on':''}" style="background:${c.hex}" onclick="FREEKY.products.selectColor('${c.hex}')" title="${c.name}"></button>`).join('')}
        </div>
        <div class="color-name">${colorObj.name}</div>

        <span class="opt-label">SIZE</span>
        <div class="size-row">
          ${sizes.map(sz => `<button class="size-btn ${sz.name===s.selectedSize?'on':''}" onclick="FREEKY.products.selectSize('${sz.name}')">${sz.name}</button>`).join('')}
        </div>

        <div class="item-meta-row"><span>${item.warn}</span><span>REQ ${item.req}</span></div>
        <button class="btn" style="width:100%; justify-content:center;" onclick="FREEKY.loadout.add()" title="Issue Equipment">Add to Loadout</button>
        ${s.cartMsg ? `<div class="color-name" style="margin-top:10px; color:${s.cartMsg.startsWith('SELECT') ? 'var(--red)' : 'var(--amber)'};">${s.cartMsg}</div>` : ''}
    `;

    document.getElementById('itemContent').innerHTML = `
      <div class="item-gallery">
        <div class="thumb">
          ${image ? `<img class="product-image" src="${image.image_url}" alt="${image.alt_text || displayName}">` : `<div class="thumb-emoji">${emoji}</div><div class="thumb-pending">IMG PENDING</div>`}
          <div class="thumb-file">FILE ${item.file} — ${images.length ? `${s.galleryIndex + 1} / ${images.length}` : FREEKY.data.imageSlides[s.galleryIndex]}</div>
        </div>
        ${images.length > 1 ? `<button class="gallery-nav prev" onclick="FREEKY.products.prevImage()">‹</button><button class="gallery-nav next" onclick="FREEKY.products.nextImage()">›</button><div class="gallery-dots">${images.map((_,i)=>`<button class="gdot ${i===s.galleryIndex?'on':''}" onclick="FREEKY.products.setImage(${i})"></button>`).join('')}</div>` : ''}
      </div>
      <div class="item-info">
        <div class="file-no-lg glitch" data-text="FILE ${item.file} · ${item.req}">FILE ${item.file} · ${item.req}</div>
        <div class="item-title">${displayName}</div>
        <p class="item-full-desc">${description}</p>
        ${price != null ? `<div class="item-price">£${Number(price).toFixed(2)}</div>` : ''}
        ${optionsBlock}
      </div>
    `;
    FREEKY.ui.scheduleGlitchScan();
  },

  prevImage(){
    const images = FREEKY.state.currentItem.catalog && FREEKY.state.currentItem.catalog.product_images || FREEKY.data.imageSlides;
    FREEKY.state.galleryIndex = (FREEKY.state.galleryIndex - 1 + images.length) % images.length;
    FREEKY.products.render();
  },
  nextImage(){
    const images = FREEKY.state.currentItem.catalog && FREEKY.state.currentItem.catalog.product_images || FREEKY.data.imageSlides;
    FREEKY.state.galleryIndex = (FREEKY.state.galleryIndex + 1) % images.length;
    FREEKY.products.render();
  },
  setImage(i){ FREEKY.state.galleryIndex = i; FREEKY.products.render(); },
  selectColor(hex){
    FREEKY.state.selectedColor = hex;
    FREEKY.state.selectedSize = null;
    FREEKY.products.render();
  },
  selectSize(sz){ FREEKY.state.selectedSize = sz; FREEKY.products.render(); }
};
