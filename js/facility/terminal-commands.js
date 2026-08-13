/* Facility Control — owner command shortcuts. */
window.FREEKY = window.FREEKY || {};
FREEKY.facility = FREEKY.facility || {};

Object.assign(FREEKY.facility, {
  terminalHelp(){
    ['/status — owner overview', '/orders [pending|processing|shipped…]', '/inventory [low]',
      '/product CODE', '/publish CODE  |  /hide CODE', '/discounts  |  /content  |  /media',
      '/anomaly [status|on|off|rate NUMBER]', '/database  |  /users  |  /logs',
      '/archive  |  /event anomaly  |  /clear'].forEach(line => FREEKY.facility.termPrint(line));
  },

  async terminalStatus(){
    FREEKY.facility.termPrint('READING FACILITY STATUS...');
    try{
      const [orders, inventory, catalog] = await Promise.all([FREEKY.adminOperations.listOrders(), FREEKY.adminOperations.listInventory(), FREEKY.adminCatalog.listProductsAndDrops()]);
      const pending = orders.filter(order => order.status === 'pending').length;
      const low = inventory.filter(product => (product.product_variants || []).some(variant => Number(variant.stock) <= 5)).length;
      const hidden = catalog.products.filter(product => !product.active).length;
      FREEKY.facility.termPrint(`ORDERS: ${orders.length} TOTAL / ${pending} PENDING.`);
      FREEKY.facility.termPrint(`INVENTORY: ${low} PRODUCT(S) WITH LOW STOCK.`);
      FREEKY.facility.termPrint(`CATALOG: ${catalog.products.length} RECORD(S) / ${hidden} HIDDEN.`);
      FREEKY.facility.termPrint('DATABASE: CONNECTED.');
    }catch(e){ FREEKY.facility.termPrint('STATUS UNAVAILABLE: ' + ((e && e.message) || 'DATABASE RESTRICTED.').toUpperCase()); }
  },

  async terminalProduct(code, action){
    if(!code){ FREEKY.facility.termPrint(`USAGE: /${action === 'open' ? 'product' : action} PRODUCT-CODE`); return; }
    try{
      const catalog = await FREEKY.adminCatalog.listProductsAndDrops();
      FREEKY.facility.productsCache = catalog.products; FREEKY.facility.dropsCache = catalog.drops;
      const product = catalog.products.find(item => String(item.code).toLowerCase() === code.toLowerCase());
      if(!product){ FREEKY.facility.termPrint('NO PRODUCT FOUND FOR ' + code.toUpperCase() + '.'); return; }
      if(action === 'open'){ FREEKY.facility.openProductFile(product.id); return; }
      const saved = await FREEKY.adminCatalog.saveProduct(product.id, {active:action === 'publish'});
      Object.assign(product, saved); FREEKY.facility.termPrint(`${product.code} ${action === 'publish' ? 'PUBLISHED.' : 'HIDDEN.'}`);
      FREEKY.facility.logAction(`${action === 'publish' ? 'Published' : 'Hid'} product: ${product.code}`);
    }catch(e){ FREEKY.facility.termPrint('PRODUCT COMMAND FAILED: ' + ((e && e.message) || 'DATABASE RESTRICTED.').toUpperCase()); }
  },

  async terminalAnomaly(args){
    const action = (args[0] || 'status').toLowerCase();
    try{
      const rows = await FREEKY.adminContent.listSettings(), settings = Object.fromEntries(rows.map(row => [row.key,row.value]));
      if(action === 'status'){ FREEKY.facility.termPrint(`ANOMAL-KY: ${settings.anomaly_enabled === 'false' ? 'DISABLED' : 'ENABLED'} / RATE ${settings.anomaly_rate || 4}%.`); return; }
      let enabled = settings.anomaly_enabled !== 'false', rate = Number(settings.anomaly_rate || 4);
      if(action === 'on') enabled = true; else if(action === 'off') enabled = false; else if(action === 'rate' && Number.isFinite(Number(args[1]))) rate = Math.min(100,Math.max(0,Number(args[1]))); else { FREEKY.facility.termPrint('USAGE: /anomaly [status|on|off|rate NUMBER]'); return; }
      const saved = await FREEKY.adminContent.saveSettings([{key:'anomaly_enabled',value:String(enabled),updated_at:new Date().toISOString()},{key:'anomaly_rate',value:String(rate),updated_at:new Date().toISOString()}]);
      FREEKY.siteSettings.apply(Object.fromEntries(saved.map(row => [row.key,row.value]))); FREEKY.facility.termPrint(`ANOMAL-KY UPDATED: ${enabled ? 'ENABLED' : 'DISABLED'} / RATE ${rate}%.`);
    }catch(e){ FREEKY.facility.termPrint('ANOMAL-KY COMMAND FAILED: ' + ((e && e.message) || 'DATABASE RESTRICTED.').toUpperCase()); }
  },

  async runCommand(){
    const input = document.getElementById('fcTermInput'), cmd = input && input.value.trim(); if(!cmd) return;
    FREEKY.facility.termPrint('> ' + cmd); input.value = ''; FREEKY.facility.logAction('Terminal command: ' + cmd);
    const [base, ...args] = cmd.toLowerCase().split(/\s+/);
    if(base === '/help') FREEKY.facility.terminalHelp();
    else if(base === '/clear'){ const out=document.getElementById('fcTermOutput'); if(out) out.innerHTML=''; }
    else if(base === '/status' || (base === '/system' && args[0] === 'status')) await FREEKY.facility.terminalStatus();
    else if(base === '/orders'){ FREEKY.facility.deploymentFilter=args[0] || ''; FREEKY.facility.openModule('deployments'); }
    else if(base === '/inventory'){ FREEKY.facility.inventoryFilter=args[0] === 'low' ? 'low' : ''; FREEKY.facility.openModule('inventory'); }
    else if(base === '/product') await FREEKY.facility.terminalProduct(args[0], 'open');
    else if(base === '/publish' || base === '/hide') await FREEKY.facility.terminalProduct(args[0], base.slice(1));
    else if(base === '/discounts') FREEKY.facility.openModule('discounts');
    else if(base === '/content') FREEKY.facility.openModule('homepage');
    else if(base === '/media') FREEKY.facility.openModule('media');
    else if(base === '/database') FREEKY.facility.openModule('database');
    else if(base === '/users') FREEKY.facility.openModule('users');
    else if(base === '/logs') FREEKY.facility.openLogs();
    else if(base === '/anomaly') await FREEKY.facility.terminalAnomaly(args);
    else if(base === '/archive') setTimeout(() => FREEKY.navigation.navTo('dossier'), 400);
    else if(base === '/event' && args[0] === 'anomaly') FREEKY.ui.runAmbientGlitch();
    else FREEKY.facility.termPrint('UNRECOGNIZED COMMAND. TYPE /help.');
  }
});

// Keep the normal module UI intact; terminal filters only narrow the current view.
(() => {
  const renderInventory = FREEKY.facility.renderInventoryList;
  const renderDeployments = FREEKY.facility.renderDeploymentsList;
  FREEKY.facility.renderInventoryList = function(content){
    if(FREEKY.facility.inventoryFilter !== 'low') return renderInventory.call(FREEKY.facility, content);
    const all = FREEKY.facility.productsCache;
    FREEKY.facility.productsCache = all.filter(product => (product.product_variants || []).some(variant => Number(variant.stock) <= 5));
    renderInventory.call(FREEKY.facility, content);
    FREEKY.facility.productsCache = all;
  };
  FREEKY.facility.renderDeploymentsList = function(content){
    const filter = FREEKY.facility.deploymentFilter;
    if(!filter) return renderDeployments.call(FREEKY.facility, content);
    const all = FREEKY.facility.ordersCache;
    FREEKY.facility.ordersCache = all.filter(order => order.status === filter);
    renderDeployments.call(FREEKY.facility, content);
    FREEKY.facility.ordersCache = all;
  };
})();
