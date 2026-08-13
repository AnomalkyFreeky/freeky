/* Facility Control — Product Control and image-management UI. */
window.FREEKY = window.FREEKY || {};
FREEKY.facility = FREEKY.facility || {};

Object.assign(FREEKY.facility, {
  async moduleProducts(content){
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">03 // PRODUCT CONTROL</div><p class="pf-empty">Reading archive...</p></div>`;
    if(!FREEKY.account.hasSupabase()){
      content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">03 // PRODUCT CONTROL</div><p class="pf-empty">Database not configured.</p></div>`;
      return;
    }
    try{
      const { products, drops } = await FREEKY.adminCatalog.listProductsAndDrops();
      FREEKY.facility.productsCache = products;
      FREEKY.facility.dropsCache = drops;
      FREEKY.facility.renderProductsList(content, '');
    }catch(e){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">03 // PRODUCT CONTROL</div><p class="pf-empty">Archive unreachable.</p></div>`; }
  },

  renderProductsList(content, filter){
    const drops = FREEKY.facility.dropsCache || [];
    const dropName = id => (drops.find(d => d.id === id) || {}).name || '—';
    const rows = FREEKY.facility.productsCache.filter(p => !filter || (p.name || '').toLowerCase().includes(filter.toLowerCase()) || (p.code || '').toLowerCase().includes(filter.toLowerCase()));
    content.innerHTML = `
      <div class="fc-module"><div class="fc-module-tag">03 // PRODUCT CONTROL</div>
        <div class="btn-row" style="margin-bottom:14px;"><input type="text" class="fc-search" style="flex:1;" placeholder="Search name or code..." value="${filter.replace(/"/g,'&quot;')}" oninput="FREEKY.facility.renderProductsList(document.getElementById('fcContent'), this.value)"><button class="btn ghost" onclick="FREEKY.facility.openProductFile(null)">+ New Product</button></div>
        ${rows.length ? rows.map(p => `<div class="fc-user-row"><div><div class="fc-user-name">${p.name}</div><div class="pf-empty">${p.code} · ${(p.category || '').toUpperCase()} · £${Number(p.price || 0).toFixed(2)} · ${p.status === 'available' ? 'AVAILABLE' : 'SEALED'} · ${p.active ? 'ACTIVE' : 'INACTIVE'} · ${dropName(p.drop_id)}</div></div><button class="btn ghost" onclick="FREEKY.facility.openProductFile('${p.id}')">Open File</button></div>`).join('') : '<p class="pf-empty">No matching records.</p>'}
      </div>`;
  },

  openProductFile(id){
    const p = id ? FREEKY.facility.productsCache.find(x => x.id === id) : null;
    const safe = value => String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const drops = FREEKY.facility.dropsCache || [];
    const cats = FREEKY.data.categories || [];
    document.getElementById('fcContent').innerHTML = `
      <div class="fc-module"><button class="back-btn" onclick="FREEKY.facility.renderProductsList(document.getElementById('fcContent'), '')">← Back to Product Control</button><div class="fc-module-tag">${p ? 'FILE // ' + p.name : 'NEW PRODUCT FILE'}</div>
        <div class="acct-field"><label>NAME</label><input type="text" id="fcPName" value="${safe(p && p.name)}"></div>
        <div class="acct-field"><label>CODE (must match the manifest file code — used to link the loadout to this record)</label><input type="text" id="fcPCode" value="${safe(p && p.code)}" placeholder="e.g. O-002"></div>
        <div class="acct-field"><label>CATEGORY / DIVISION</label><select id="fcPCategory" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;">${cats.map(c => `<option value="${c.key}" ${p && p.category === c.key ? 'selected' : ''}>${c.name.toUpperCase()}</option>`).join('')}</select></div>
        <div class="acct-field"><label>PRICE (£)</label><input type="number" step="0.01" id="fcPPrice" value="${p ? p.price : ''}"></div>
        <div class="acct-field"><label>STATUS</label><select id="fcPStatus" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;"><option value="available" ${p && p.status === 'available' ? 'selected' : ''}>AVAILABLE</option><option value="sealed" ${!p || p.status === 'sealed' ? 'selected' : ''}>SEALED</option></select></div>
        <div class="acct-field"><label>DROP</label><select id="fcPDrop" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;"><option value="">— NONE —</option>${drops.map(d => `<option value="${d.id}" ${p && p.drop_id === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select></div>
        <div class="acct-field"><label>SHORT DESCRIPTION</label><input type="text" id="fcPShort" value="${safe(p && p.short_description)}"></div>
        <div class="acct-field"><label>DESCRIPTION</label><textarea id="fcPDesc" rows="4" style="width:100%; background:var(--void); border:1px solid var(--line); color:var(--off); font-family:var(--mono); font-size:13px; padding:12px 14px;">${safe(p && p.description)}</textarea></div>
        <label class="pf-toggle"><input type="checkbox" id="fcPActive" ${!p || p.active ? 'checked' : ''}><span>Active (visible on site)</span></label><label class="pf-toggle"><input type="checkbox" id="fcPFeatured" ${p && p.featured ? 'checked' : ''}><span>Featured</span></label>
        <div id="fcPMsg" class="acct-msg"></div><div class="btn-row"><button class="btn" onclick="FREEKY.facility.saveProductFile(${p ? `'${p.id}'` : 'null'})">Save Changes</button>${p ? `<button class="btn ghost" onclick="FREEKY.facility.openProductImages('${p.id}')">Manage Images</button>` : ''}</div>
      </div>`;
  },

  async saveProductFile(id){
    const msg = document.getElementById('fcPMsg');
    const payload = { name: document.getElementById('fcPName').value.trim(), code: document.getElementById('fcPCode').value.trim(), category: document.getElementById('fcPCategory').value, price: parseFloat(document.getElementById('fcPPrice').value) || 0, status: document.getElementById('fcPStatus').value, drop_id: document.getElementById('fcPDrop').value || null, short_description: document.getElementById('fcPShort').value.trim(), description: document.getElementById('fcPDesc').value.trim(), active: document.getElementById('fcPActive').checked, featured: document.getElementById('fcPFeatured').checked };
    if(!payload.name || !payload.code){ msg.textContent = 'NAME AND CODE ARE REQUIRED.'; msg.className = 'acct-msg err'; return; }
    try{
      if(id){
        const saved = await FREEKY.adminCatalog.saveProduct(id, payload);
        const product = FREEKY.facility.productsCache.find(x => x.id === id);
        if(product) Object.assign(product, saved);
        FREEKY.facility.logAction('Edited product: ' + payload.name);
      } else {
        payload.slug = payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        FREEKY.facility.productsCache.unshift(await FREEKY.adminCatalog.saveProduct(null, payload));
        FREEKY.facility.logAction('Created product: ' + payload.name);
      }
      msg.textContent = 'FILE SAVED.'; msg.className = 'acct-msg ok';
      setTimeout(() => FREEKY.facility.renderProductsList(document.getElementById('fcContent'), ''), 500);
    }catch(e){ msg.textContent = (e.message || 'COULD NOT REACH ARCHIVE').toUpperCase(); msg.className = 'acct-msg err'; }
  },

  async openProductImages(productId){
    const content = document.getElementById('fcContent');
    const product = FREEKY.facility.productsCache.find(p => p.id === productId);
    content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">PRODUCT IMAGES</div><p class="pf-empty">Reading image records...</p></div>`;
    try{
      FREEKY.facility.imageCache = await FREEKY.adminCatalog.getImages(productId);
      FREEKY.facility.renderProductImages(productId, product, content);
    }catch(e){ content.innerHTML = `<div class="fc-module"><div class="fc-module-tag">PRODUCT IMAGES</div><p class="pf-empty">Could not load image records.</p></div>`; }
  },

  renderProductImages(productId, product, content){
    const safe = value => String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const rows = FREEKY.facility.imageCache.map(image => `<div class="fc-image-row" data-image-id="${image.id}"><img src="${safe(image.image_url)}" alt="" onerror="this.style.display='none'"><div class="fc-image-fields"><input class="fc-image-url" type="url" value="${safe(image.image_url)}" placeholder="Image URL"><input class="fc-image-alt" type="text" value="${safe(image.alt_text)}" placeholder="Alt text (optional)"><div class="btn-row"><input class="fc-image-order" type="number" min="0" value="${image.sort_order || 0}" style="width:82px;"><label class="pf-toggle" style="margin:0;"><input class="fc-image-primary" type="radio" name="primaryImage" ${image.is_primary ? 'checked' : ''}><span>Primary</span></label><button class="btn ghost" onclick="FREEKY.facility.deleteProductImage('${productId}','${image.id}')">Remove</button></div></div></div>`).join('');
    content.innerHTML = `<div class="fc-module"><button class="back-btn" onclick="FREEKY.facility.openProductFile('${productId}')">← Back to Product File</button><div class="fc-module-tag">IMAGES // ${product ? product.name : 'PRODUCT'}</div><p class="pf-empty" style="margin-bottom:16px;">Upload a photo directly to Supabase Storage or paste a public image URL. The primary image is shown first.</p><div id="fcImageRows">${rows || '<p class="pf-empty">No images assigned yet.</p>'}</div><div class="acct-field" style="margin-top:20px;"><label>UPLOAD IMAGE (JPG, PNG, WEBP OR AVIF — MAX 10 MB)</label><input id="fcUploadImageFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif"></div><div class="acct-field"><label>ALT TEXT (OPTIONAL)</label><input id="fcNewImageAlt" type="text" placeholder="Archive Tee — front"></div><div class="btn-row" style="margin-bottom:16px;"><button class="btn ghost" onclick="FREEKY.facility.uploadProductImage('${productId}')">Upload to Supabase</button></div><div class="acct-field"><label>OR PASTE A PUBLIC IMAGE URL</label><input id="fcNewImageUrl" type="url" placeholder="https://…"></div><div id="fcImageMsg" class="acct-msg"></div><div class="btn-row"><button class="btn" onclick="FREEKY.facility.saveProductImages('${productId}')">Save Image Changes</button><button class="btn ghost" onclick="FREEKY.facility.addProductImage('${productId}')">+ Add URL</button></div></div>`;
  },

  async saveProductImages(productId){
    const msg = document.getElementById('fcImageMsg');
    const updates = Array.from(document.querySelectorAll('[data-image-id]')).map(row => ({ id: row.dataset.imageId, image_url: row.querySelector('.fc-image-url').value.trim(), alt_text: row.querySelector('.fc-image-alt').value.trim() || null, sort_order: parseInt(row.querySelector('.fc-image-order').value, 10) || 0, is_primary: row.querySelector('.fc-image-primary').checked, updated_at: new Date().toISOString() }));
    if(updates.some(row => !row.image_url)){ msg.textContent = 'EVERY IMAGE NEEDS A URL.'; msg.className = 'acct-msg err'; return; }
    try{ await FREEKY.adminCatalog.saveImages(updates); FREEKY.facility.logAction('Updated product images'); await FREEKY.facility.openProductImages(productId); document.getElementById('fcImageMsg').textContent = 'IMAGE RECORDS SAVED.'; document.getElementById('fcImageMsg').className = 'acct-msg ok'; }catch(e){ msg.textContent = (e.message || 'COULD NOT SAVE IMAGES').toUpperCase(); msg.className = 'acct-msg err'; }
  },

  async addProductImage(productId){
    const url = document.getElementById('fcNewImageUrl').value.trim(); const alt = document.getElementById('fcNewImageAlt').value.trim(); const msg = document.getElementById('fcImageMsg');
    if(!url){ msg.textContent = 'ADD AN IMAGE URL FIRST.'; msg.className = 'acct-msg err'; return; }
    try{ await FREEKY.adminCatalog.addImage(productId, url, alt, FREEKY.facility.imageCache.length, FREEKY.facility.imageCache.length === 0); FREEKY.facility.logAction('Added product image'); await FREEKY.facility.openProductImages(productId); }catch(e){ msg.textContent = (e.message || 'COULD NOT ADD IMAGE').toUpperCase(); msg.className = 'acct-msg err'; }
  },

  async uploadProductImage(productId){
    const file = document.getElementById('fcUploadImageFile').files[0]; const alt = document.getElementById('fcNewImageAlt').value.trim(); const msg = document.getElementById('fcImageMsg'); const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if(!file){ msg.textContent = 'SELECT AN IMAGE FILE FIRST.'; msg.className = 'acct-msg err'; return; }
    if(!allowed.includes(file.type) || file.size > 10485760){ msg.textContent = 'USE JPG, PNG, WEBP OR AVIF UNDER 10 MB.'; msg.className = 'acct-msg err'; return; }
    msg.textContent = 'UPLOADING IMAGE...'; msg.className = 'acct-msg';
    try{ await FREEKY.adminCatalog.uploadImage(productId, file, alt, FREEKY.facility.imageCache.length, FREEKY.facility.imageCache.length === 0); FREEKY.facility.logAction('Uploaded product image'); await FREEKY.facility.openProductImages(productId); }catch(e){ msg.textContent = (e.message || 'COULD NOT UPLOAD IMAGE').toUpperCase(); msg.className = 'acct-msg err'; }
  },

  async deleteProductImage(productId, imageId){
    try{ await FREEKY.adminCatalog.deleteImage(imageId); FREEKY.facility.logAction('Removed product image'); await FREEKY.facility.openProductImages(productId); }catch(e){ const msg = document.getElementById('fcImageMsg'); if(msg){ msg.textContent = 'COULD NOT REMOVE IMAGE.'; msg.className = 'acct-msg err'; } }
  }
});
