/* ==============================================================
   FREƎ-KY // UI — small cross-cutting interface helpers
   --------------------------------------------------------------
   Clock, sidebar toggle, the ambient glitch system, and the
   Decline overlay. Nothing here owns data — it only reads
   FREEKY.state and touches the DOM.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.ui = {

  tick(){
    const d = new Date();
    const clock = document.getElementById('clock');
    if(clock) clock.textContent = d.toTimeString().slice(0,8);
  },

  toggleSidebar(){
    document.getElementById('sidebar').classList.toggle('open');
  },

  closeSidebarOnMobile(){
    if(window.innerWidth <= 880){ document.getElementById('sidebar').classList.remove('open'); }
  },

  /* ===== GLITCH SYSTEM — rare, brief, deliberate ===== */
  scheduleGlitchScan(){
    document.querySelectorAll('.glitch').forEach(el=>{
      if(!el.dataset.text){ el.dataset.text = el.textContent.trim(); }
    });
  },

  runAmbientGlitch(){
    const glitchAllowed = FREEKY.storage.get('freeky_feature_flags', {}).glitch !== false; // Facility Control 19 // Feature Flags
    if(glitchAllowed){
      const activeScreen = document.querySelector('.screen.active, .item-overlay.show, .decline-overlay.show') || document;
      const targets = Array.from(activeScreen.querySelectorAll('.glitch'))
        .concat(Array.from(document.querySelectorAll('#nav-dossier .glitch, .topbar .glitch')));
      if(targets.length){
        const el = targets[Math.floor(Math.random()*targets.length)];
        el.classList.add('glitching');
        setTimeout(()=>el.classList.remove('glitching'), 160 + Math.random()*120);
      }
    }
    setTimeout(FREEKY.ui.runAmbientGlitch, 4000 + Math.random()*5000);
  },

  /* ===== DECLINE FLOW =====
     STATE 2 — UNCLASSIFIED. Declining the evaluation is a common, non-error
     interruption of the Classification Protocol. It must never generate
     PARADOX — Paradox is reserved for a completed evaluation that fails
     internally (see classification.js finish()).
  */
  declineFlow(){
    FREEKY.state.finalKey = 'unclassified';
    document.getElementById('declineOverlay').classList.add('show');
  },

  acknowledgeDecline(){
    FREEKY.storage.set('freeky_classification', FREEKY.state.finalKey);
    document.getElementById('declineOverlay').classList.remove('show');
    FREEKY.manifest.renderIndex();
    FREEKY.navigation.showScreen('manifest');
  }
};
