/* ==============================================================
   FREƎ-KY // QUIZ — the Classification Protocol evaluation
   --------------------------------------------------------------
   Renders questions and records answers into FREEKY.state.
   Scoring/tie-break/Paradox logic itself lives in classification.js
   — this file only runs the question-by-question flow.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.quiz = {

  start(){
    const s = FREEKY.state;
    s.scores = {researcher:0, engineer:0, operative:0, navigator:0};
    s.qIndex = 0;
    s.history = [];
    // Note: finalKey/finalScore are intentionally NOT reset here. The previous
    // classification (if any) stays valid — in the Loadout Terminal, in Your
    // File, everywhere — until this new attempt is actually completed in
    // classification.finish(). Simply opening the evaluation screen must never
    // wipe an existing result; only finishing a new one may replace it.
    FREEKY.navigation.showScreen('quiz');
    FREEKY.quiz.renderQuestion();
  },

  shuffle(arr){
    const a = arr.slice();
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  renderQuestion(){
    const s = FREEKY.state;
    const questions = FREEKY.data.questions;
    const q = questions[s.qIndex];
    const total = String(questions.length).padStart(3,'0');
    document.getElementById('qLabel').textContent = q.tag + " / " + total;
    document.getElementById('qProgress').style.width = ((s.qIndex)/questions.length*100 + 8) + "%";
    const body = document.getElementById('qBody');
    const letters = ['A','B','C','D'];
    const opts = FREEKY.quiz.shuffle(q.opts); // display order randomized — scoring uses each answer's own key
    body.innerHTML = `
      <div class="q-tag">${q.tag}</div>
      <div class="q-title">${q.title}</div>
      <div class="options">
        ${opts.map((o,i)=> `<button class="opt" onclick="FREEKY.quiz.answer('${o.k}')"><span class="tag">${letters[i]}</span><span>${o.t}</span></button>`).join('')}
      </div>
    `;
  },

  answer(key){
    const s = FREEKY.state;
    s.scores[key] = (s.scores[key]||0) + 1;
    s.history.push({idx:s.qIndex, key:key, scored:true});
    s.qIndex++;
    if(s.qIndex >= FREEKY.data.questions.length){
      FREEKY.classification.finish();
    } else {
      FREEKY.quiz.renderQuestion();
    }
  },

  // Note: the Loadout Terminal's back button intentionally returns to the Access
  // Gate, not into the evaluation — re-running the test is only available from
  // the Gate itself (see navigation.js / the #result screen's back button).
  back(){
    const s = FREEKY.state;
    if(s.history.length === 0){ FREEKY.navigation.showScreen('gate'); return; }
    const last = s.history.pop();
    if(last.scored){ s.scores[last.key] = Math.max(0, s.scores[last.key]-1); }
    s.qIndex = last.idx;
    FREEKY.navigation.showScreen('quiz');
    FREEKY.quiz.renderQuestion();
  }
};
