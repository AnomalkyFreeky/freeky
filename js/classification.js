/* ==============================================================
   FREƎ-KY // CLASSIFICATION — scoring, Paradox protocol, result file
   --------------------------------------------------------------
   The Classification Protocol never surfaces Paradox as a choice.
   It is only ever assigned when the protocol itself fails to
   resolve a confident match — internal logic only, never explained
   in the interface.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.classification = {

  finish(){
    const s = FREEKY.state;
    const entries = Object.entries(s.scores).sort((a,b)=>b[1]-a[1]);
    const top = entries[0][1];
    const topKeys = entries.filter(e=>e[1]===top).map(e=>e[0]);

    let winner = null;
    if(topKeys.length === 1){
      winner = topKeys[0]; // single dominant division
    } else if(topKeys.length === 2){
      // Two-way tie: the protocol attempts classification again — resolved here
      // by which of the tied divisions first showed a consistent lead.
      winner = FREEKY.classification.resolveTieByFirstOccurrence(topKeys);
    }
    // 3 or 4-way tie: winner stays null — no dominant behavioural pattern, classification fails.

    const rareAnomaly = Math.random() < 0.04; // protocol instability — very small hidden probability
    const paradoxAllowed = FREEKY.storage.get('freeky_feature_flags', {}).paradox !== false; // Facility Control 19 // Feature Flags

    if(paradoxAllowed && (!winner || rareAnomaly)){
      s.finalKey = 'anomaly';
      s.finalScore = null;
    } else {
      // Paradox disabled from Facility Control: even a 3/4-way tie falls back
      // to the single highest-scoring division rather than failing.
      s.finalKey = winner || topKeys[0];
      s.finalScore = top; // 1–5, used only to derive a confidence tier — never shown directly
    }

    FREEKY.storage.set('freeky_classification', s.finalKey); // Future database connection: persist result server-side
    FREEKY.storage.set('freeky_classification_date', new Date().toISOString());
    if(FREEKY.personnel) FREEKY.personnel.logIncident('Completed Classification');

    if(s.finalKey === 'anomaly'){
      FREEKY.classification.playParadoxReveal();
    } else {
      FREEKY.classification.renderResult(s.finalKey);
      FREEKY.navigation.showScreen('result');
    }
  },

  resolveTieByFirstOccurrence(keys){
    for(const h of FREEKY.state.history){
      if(h.scored && keys.includes(h.key)) return h.key;
    }
    return keys[0];
  },

  confidenceTier(score){
    if(score >= 5) return {label:"EXCEPTIONAL MATCH", note:"Classification certainty is extremely high. Equipment authorization granted without reservation."};
    if(score === 4) return {label:"CONFIRMED MATCH", note:"Classification certainty is high. Equipment authorization granted."};
    if(score === 3) return {label:"ACCEPTABLE MATCH", note:"Classification certainty is sufficient. Equipment authorization granted under standard review."};
    if(score === 2) return {label:"UNSTABLE MATCH", note:"Classification confidence is low. Authorization pending secondary review."};
    return {label:"WEAK MATCH", note:"Classification confidence is critical. Authorization issued provisionally; pattern re-evaluation recommended."};
  },

  /* ===== PARADOX REVEAL — the protocol visibly failing ===== */
  playParadoxReveal(){
    FREEKY.navigation.showScreen('paradoxReveal');
    const box = document.getElementById('paradoxLines');
    const continueBtn = document.getElementById('paradoxContinue');
    box.innerHTML = '';
    continueBtn.style.display = 'none';

    const interferenceLine = FREEKY.data.interferenceLogs[Math.floor(Math.random()*FREEKY.data.interferenceLogs.length)];

    const sequence = [
      {text:"SCANNING...", cls:"system"},
      {text:"MATCH FOUND", cls:"found"},
      {text:"RESEARCHER", cls:"candidate"},
      {text:"...", cls:"pause"},
      {text:"MATCH REJECTED", cls:"rejected"},
      {text:"ENGINEER", cls:"candidate"},
      {text:"...", cls:"pause"},
      {text:"MATCH REJECTED", cls:"rejected"},
      {text:"OPERATIVE", cls:"candidate"},
      {text:"...", cls:"pause"},
      {text:"MATCH REJECTED", cls:"rejected"},
      {text:"NAVIGATOR", cls:"candidate"},
      {text:"...", cls:"pause"},
      {text:"MATCH REJECTED", cls:"rejected"},
      {text:"RECALIBRATING...", cls:"system"},
      {text:"UNKNOWN PROCESS DETECTED", cls:"alert"},
      {text:interferenceLine, cls:"system"}, // implied interference — never confirmed, never explained
      {text:"PURGING CACHE...", cls:"system"},
      {text:"FAILED", cls:"alert"},
      {text:"GENERATING EMERGENCY FILE...", cls:"system"},
      {text:"FILE 000", cls:"file"},
      {text:"PARADOX", cls:"tag"}
    ];

    let delay = 250;
    sequence.forEach((line) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'pr-line ' + line.cls;
        div.textContent = line.text;
        box.appendChild(div);
      }, delay);
      delay += (line.cls === 'pause') ? 220 : (line.cls === 'candidate' || line.cls === 'rejected') ? 320 : 550;
    });

    setTimeout(() => { continueBtn.style.display = 'inline-flex'; }, delay + 300);
  },

  finishParadoxReveal(){
    FREEKY.classification.renderResult('anomaly');
    FREEKY.navigation.showScreen('result');
  },

  /* ===== RESULT FILE (Loadout Terminal top card) ===== */
  renderResult(key){
    if(key === 'outsider' || key === 'unclassified'){
      FREEKY.classification.renderSpecialFile(key);
      return;
    }

    const f = FREEKY.data.files[key];
    const cat = FREEKY.data.categories.find(c=>c.key===key);
    const stampVal = key === 'anomaly' ? "UNCLASSIFIABLE" : "CLASSIFIED";
    const stampEl = document.getElementById('stampText');
    stampEl.textContent = stampVal; stampEl.dataset.text = stampVal;
    const tagVal = "FILE // " + f.no;
    const tagEl = document.getElementById('fileTagNo');
    tagEl.textContent = tagVal; tagEl.dataset.text = tagVal;
    const nameEl = document.getElementById('fileName');
    nameEl.textContent = f.name; nameEl.dataset.text = f.name;
    document.getElementById('fileRole').textContent = f.role;
    document.getElementById('fileStatus').textContent = f.status;
    document.getElementById('fileAccessLabel').textContent = "ACCESS LEVEL";
    document.getElementById('fileAccess').textContent = f.accessLevel;
    document.getElementById('incidentBlock').style.display = '';
    document.getElementById('equipmentBlock').style.display = '';
    document.getElementById('incTag').textContent = f.inc;
    document.getElementById('incText').textContent = f.story;
    document.getElementById('itemVal').textContent = f.item;

    const sysNoteEl = document.getElementById('sysNotesText');
    if(key === 'anomaly'){
      sysNoteEl.textContent = "Protocol instability detected during evaluation. No confidence value could be assigned.";
    } else {
      const tier = FREEKY.classification.confidenceTier(FREEKY.state.finalScore);
      sysNoteEl.textContent = tier.label + ". " + tier.note;
    }

    document.getElementById('visitorStatus').textContent = "CLASSIFIED — " + f.name.toUpperCase();
    document.getElementById('resultBtnRow').innerHTML = `
      <button class="btn" onclick="FREEKY.manifest.openCategory('${key}')">View ${cat.name} Equipment →</button>
      <button class="btn ghost" onclick="FREEKY.navigation.navTo('manifest')">Return to Manifest</button>
    `;
    FREEKY.loadout.renderCart();
  },

  /* ===== STATE 1 (OUTSIDER) / STATE 2 (UNCLASSIFIED) ===== //
     Deliberately minimal — no incident report, no recovered equipment,
     because none exists yet. Neither state is Paradox and neither is
     an error; see data/files.js for the source text. */
  renderSpecialFile(key){
    const f = FREEKY.data.files[key];
    const stampVal = key === 'outsider' ? "NO RECORD" : "UNCLASSIFIED";
    const stampEl = document.getElementById('stampText');
    stampEl.textContent = stampVal; stampEl.dataset.text = stampVal;

    const tagVal = "FILE // " + f.no;
    const tagEl = document.getElementById('fileTagNo');
    tagEl.textContent = tagVal; tagEl.dataset.text = tagVal;

    const nameEl = document.getElementById('fileName');
    nameEl.textContent = f.name; nameEl.dataset.text = f.name;

    document.getElementById('fileRole').textContent = "CLASSIFICATION: " + f.name.toUpperCase();

    const statusText = key === 'unclassified'
      ? FREEKY.data.adminStatusPool[Math.floor(Math.random()*FREEKY.data.adminStatusPool.length)]
      : f.status;
    document.getElementById('fileStatus').textContent = statusText;

    document.getElementById('fileAccessLabel').textContent = "DEPLOYMENT";
    document.getElementById('fileAccess').textContent = f.deployment;

    document.getElementById('incidentBlock').style.display = 'none';
    document.getElementById('equipmentBlock').style.display = 'none';
    document.getElementById('sysNotesText').textContent = f.sysNote;

    document.getElementById('visitorStatus').textContent = f.name.toUpperCase();
    document.getElementById('resultBtnRow').innerHTML = `
      <button class="btn" onclick="FREEKY.quiz.start()">Begin Evaluation →</button>
      <button class="btn ghost" onclick="FREEKY.navigation.navTo('manifest')">Return to Manifest</button>
    `;
    FREEKY.loadout.renderCart();
  }
};
