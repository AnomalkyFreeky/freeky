/* ==============================================================
   FREƎ-KY // APP — bootstrap
   --------------------------------------------------------------
   Loaded last, after every data file and every module. Wires up
   the clock, restores persisted UI state (loadout badge, account
   badge), and starts the ambient glitch scheduler.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

(function init(){
  setInterval(FREEKY.ui.tick, 1000);
  FREEKY.ui.tick();

  FREEKY.navigation.updateNavState();
  FREEKY.loadout.updateBadge(); // reflect any loadout persisted from a previous session

  if(FREEKY.state.account){
    document.getElementById('accountBadge').textContent = '✓'; // reflect persisted login state
  }
  FREEKY.account.init(); // restore a real Supabase session, if one exists — no-op until credentials are set

  FREEKY.ui.scheduleGlitchScan();
  setTimeout(FREEKY.ui.runAmbientGlitch, 3000);
})();
