/* Facility Control — Manifest visibility and shared media library. */
window.FREEKY = window.FREEKY || {};
FREEKY.facility = FREEKY.facility || {};

Object.assign(FREEKY.facility, {
  async moduleManifestctl(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">09 // MANIFEST CONTROL</div><p class="pf-empty">Reading catalog...</p></div>`;
    if(!FREEKY.account.hasSupabase()){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">09 // MANIFEST CONTROL</div><p class="pf-empty">Database not configured.</p></div>`; return; }
    try{
      const { products, drops } = await FREEKY.adminCatalog.listProductsAndDrops();
      FREEKY.facility.productsCache = products; FREEKY.facility.dropsCache = drops;
      FREEKY.facility.renderManifestControl(content);
    }catch(e){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">09 // MANIFEST CONTROL</div><p class="pf-empty">Archive unreachable.</p></div>`; }
  },

  renderManifestControl(content){
    const products = FREEKY.facility.productsCache || [];
    const available = products.filter(p => p.active && p.status === 'available').length;
    const sealed = products.filter(p => p.status === 'sealed').length;
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">09 // MANIFEST CONTROL</div><p class="pf-empty" style="margin-bottom:16px;">Controls what appears in the public Manifest. Open a file for full editing.</p><div class="pf-grid" style="margin-bottom:18px;"><div class="pf-cell"><span>PUBLIC</span><strong>${available}</strong></div><div class="pf-cell"><span>SEALED</span><strong>${sealed}</strong></div><div class="pf-cell"><span>TOTAL RECORDS</span><strong>${products.length}</strong></div></div>${products.length ? products.map(p => `<div class="fc-user-row"><div><div class="fc-user-name">${p.name}</div><div class="pf-empty">${p.code} · ${p.active ? 'VISIBLE' : 'HIDDEN'} · ${p.status === 'available' ? 'AVAILABLE' : 'SEALED'}</div></div><div class="btn-row"><button class="btn ghost" onclick="FREEKY.facility.toggleManifestVisibility('${p.id}')">${p.active ? 'Hide' : 'Publish'}</button><button class="btn ghost" onclick="FREEKY.facility.openProductFile('${p.id}')">Edit</button></div></div>`).join('') : '<p class="pf-empty">No product records yet. Create one in Product Control.</p>'}</div>`;
  },

  async toggleManifestVisibility(id){
    const product = (FREEKY.facility.productsCache || []).find(p => p.id === id); if(!product) return;
    try{
      const saved = await FREEKY.adminCatalog.saveProduct(id, { active: !product.active });
      Object.assign(product, saved); FREEKY.facility.logAction((product.active ? 'Published' : 'Hid') + ' product: ' + product.name);
      FREEKY.facility.renderManifestControl(document.getElementById('fcContent'));
    }catch(e){ alert('Could not update manifest visibility.'); }
  },

  async moduleMedia(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">18 // MEDIA LIBRARY</div><p class="pf-empty">Reading image archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">18 // MEDIA LIBRARY</div><p class="pf-empty">Database not configured.</p></div>`; return; }
    try{
      const [images, catalog] = await Promise.all([FREEKY.adminCatalog.listAllImages(), FREEKY.adminCatalog.listProductsAndDrops()]);
      FREEKY.facility.mediaCache = images;
      FREEKY.facility.productsCache = catalog.products;
      FREEKY.facility.dropsCache = catalog.drops;
      FREEKY.facility.renderMediaLibrary(content, '');
    }
    catch(e){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">18 // MEDIA LIBRARY</div><p class="pf-empty">Archive unreachable. Run database/005_product_image_storage.sql before uploading files.</p></div>`; }
  },

  renderMediaLibrary(content, filter){
    const rows = (FREEKY.facility.mediaCache || []).filter(image => {
      const term = filter.toLowerCase(); const product = image.products || {};
      return !term || (product.name || '').toLowerCase().includes(term) || (product.code || '').toLowerCase().includes(term) || (image.alt_text || '').toLowerCase().includes(term);
    });
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">18 // MEDIA LIBRARY</div><input type="text" class="fc-search" placeholder="Search product or image text..." value="${filter.replace(/"/g,'&quot;')}" oninput="FREEKY.facility.renderMediaLibrary(document.getElementById('fcContent'),this.value)"><p class="pf-empty" style="margin:14px 0;">${rows.length} image record(s). Upload and edit images from the corresponding Product File.</p>${rows.length ? rows.map(image => { const product=image.products||{}; return `<div class="fc-image-row"><img src="${image.image_url.replace(/"/g,'&quot;')}" alt="" onerror="this.style.display='none'"><div class="fc-image-fields"><div class="fc-user-name">${product.name || 'Unknown product'}</div><div class="pf-empty">${product.code || '—'} · ${image.is_primary ? 'PRIMARY IMAGE' : 'ADDITIONAL IMAGE'} · ORDER ${image.sort_order || 0}</div><div class="pf-empty">${image.alt_text || 'No alt text'}</div><div class="btn-row"><button class="btn ghost" onclick="FREEKY.facility.openProductImages('${image.product_id}')">Manage</button></div></div></div>`; }).join('') : '<p class="pf-empty">No image records found.</p>'}</div>`;
  }
});
