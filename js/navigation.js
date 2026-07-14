/* ==============================================================
   FREƎ-KY // NAVIGATION — screen switching and sidebar state
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.navigation = {

  showScreen(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    FREEKY.state.currentScreen = id;
    window.scrollTo(0,0);
    FREEKY.ui.closeSidebarOnMobile();
    FREEKY.navigation.updateNavState();
  },

  updateNavState(){
    document.querySelectorAll('.sb-link').forEach(l=>l.classList.remove('on'));
    const map = {
      gate:'nav-gate', quiz:'nav-quiz', result:'nav-result', dossier:'nav-dossier',
      manifest:'nav-manifest', category:'nav-manifest', account:'nav-account',
      deploy:'nav-result', deployed:'nav-result', facility:'nav-facility'
    };
    const active = document.getElementById(map[FREEKY.state.currentScreen]);
    if(active) active.classList.add('on');
  },

  navTo(id){
    if(id === 'result'){
      // STATE 1 — OUTSIDER. A visitor who never completed the Classification
      // Protocol is not classified — and is never defaulted into PARADOX.
      if(!FREEKY.state.finalKey) FREEKY.state.finalKey = 'outsider';
      FREEKY.classification.renderResult(FREEKY.state.finalKey);
      FREEKY.navigation.showScreen('result');
      return;
    }
    if(id === 'quiz'){
      const s = FREEKY.state;
      if(s.history.length === 0 || s.qIndex >= FREEKY.data.questions.length){
        FREEKY.quiz.start();
      } else {
        FREEKY.quiz.renderQuestion();
        FREEKY.navigation.showScreen('quiz');
      }
      return;
    }
    if(id === 'manifest'){
      FREEKY.manifest.renderIndex();
      FREEKY.navigation.showScreen('manifest');
      return;
    }
    if(id === 'dossier'){
      FREEKY.dossier.render();
      FREEKY.navigation.showScreen('dossier');
      return;
    }
    if(id === 'facility'){
      FREEKY.facility.render();
      FREEKY.navigation.showScreen('facility');
      return;
    }
    if(id === 'account'){
      FREEKY.account.render();
      FREEKY.navigation.showScreen('account');
      return;
    }
    FREEKY.navigation.showScreen(id);
  }
};
