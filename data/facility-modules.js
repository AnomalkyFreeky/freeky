/* ==============================================================
   FREƎ-KY // DATA — Facility Control module registry
   --------------------------------------------------------------
   status:"live"     — fully wired, real data/actions
   status:"scaffold" — screen exists with correct structure per the
                       brief ("every screen should already exist"),
                       shows a sealed/pending state until connected
   ============================================================== */
window.FREEKY = window.FREEKY || {};
window.FREEKY.data = window.FREEKY.data || {};

FREEKY.data.facilityModules = [
  {id:'command',      no:'01', name:'Command Center',    minLevel:50, status:'live'},
  {id:'users',        no:'02', name:'User Database',     minLevel:20, status:'live'},
  {id:'products',     no:'03', name:'Product Control',   minLevel:50, status:'live'},
  {id:'inventory',    no:'04', name:'Inventory',         minLevel:50, status:'live'},
  {id:'deployments',  no:'05', name:'Deployments',       minLevel:50, status:'live'},
  {id:'drops',        no:'06', name:'Drop Management',   minLevel:80, status:'live'},
  {id:'discounts',    no:'07', name:'Discount System',   minLevel:80, status:'live'},
  {id:'homepage',     no:'08', name:'Homepage Control',  minLevel:80, status:'live'},
  {id:'manifestctl',  no:'09', name:'Manifest Control',  minLevel:50, status:'scaffold'},
  {id:'dossierctl',   no:'10', name:'Dossier Control',   minLevel:80, status:'scaffold'},
  {id:'quizctl',      no:'11', name:'Quiz Control',      minLevel:80, status:'scaffold'},
  {id:'anomalkyctl',  no:'12', name:'ANOMAL-KY Control', minLevel:99, status:'scaffold'},
  {id:'randomctl',    no:'13', name:'Random Content',    minLevel:80, status:'scaffold'},
  {id:'email',        no:'14', name:'Email Center',      minLevel:50, status:'scaffold'},
  {id:'shipping',     no:'15', name:'Shipping',          minLevel:50, status:'scaffold'},
  {id:'analytics',    no:'16', name:'Analytics',         minLevel:50, status:'live'},
  {id:'database',     no:'17', name:'Database',          minLevel:99, status:'scaffold'},
  {id:'media',        no:'18', name:'Media Library',     minLevel:50, status:'scaffold'},
  {id:'flags',        no:'19', name:'Feature Flags',     minLevel:99, status:'live'},
  {id:'logs',         no:'20', name:'System Logs',       minLevel:80, status:'live'},
  {id:'settings',     no:'21', name:'Site Settings',     minLevel:99, status:'live'},
  {id:'terminal',     no:'22', name:'Command Terminal',  minLevel:50, status:'live'}
];
