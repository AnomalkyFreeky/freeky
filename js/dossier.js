/* ==============================================================
   FREƎ-KY // DOSSIER — the expandable archive
   --------------------------------------------------------------
   Renders FREEKY.data.dossier as independent, individually
   expandable documents. Each section opens/closes on its own —
   nothing here assumes a fixed reading order.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.dossier = {

  openSections: {}, // {sectionNo: true/false} — collapsed by default

  render(){
    const box = document.getElementById('dossierArchive');
    if(!box) return;
    box.innerHTML = FREEKY.data.dossier.map(sec => FREEKY.dossier.sectionHtml(sec)).join('');
    FREEKY.ui.scheduleGlitchScan();
  },

  sectionHtml(sec){
    const isOpen = !!FREEKY.dossier.openSections[sec.no];
    return `
      <div class="ds-section ${isOpen ? 'open' : ''}" id="ds-${sec.no}">
        <button class="ds-head" onclick="FREEKY.dossier.toggle('${sec.no}')">
          <span class="ds-no glitch" data-text="${sec.no}">${sec.no}</span>
          <span class="ds-title">${sec.title}</span>
          <span class="ds-toggle">${isOpen ? '−' : '+'}</span>
        </button>
        <div class="ds-body">
          ${FREEKY.dossier.bodyHtml(sec)}
        </div>
      </div>
    `;
  },

  bodyHtml(sec){
    if(sec.type === 'text'){
      return sec.body.map(p => `<p class="ds-p">${p.replace(/\n/g,'<br>')}</p>`).join('');
    }
    if(sec.type === 'anomalky'){
      return `
        ${sec.intro.map(p => `<p class="ds-p">${p}</p>`).join('')}
        <div class="ds-annotations">
          ${sec.annotations.map(a => `<div class="ds-annotation glitch" data-text="${a}">${a}</div>`).join('')}
        </div>
      `;
    }
    if(sec.type === 'rules'){
      return `<div class="ds-rules">${sec.rules.map(r => `
        <div class="ds-rule">
          <div class="ds-rule-no">RULE ${r.no}</div>
          <p class="ds-p">${r.text}</p>
        </div>
      `).join('')}</div>`;
    }
    if(sec.type === 'incidents'){
      return `<div class="ds-rules">${sec.incidents.map(i => `
        <div class="ds-rule">
          <div class="ds-rule-no">INCIDENT ${i.no}</div>
          <p class="ds-p">${i.text}</p>
        </div>
      `).join('')}</div>`;
    }
    if(sec.type === 'notes'){
      return `<div class="ds-notes">${sec.notes.map(n => `<div class="ds-note">\u201c${n}\u201d</div>`).join('')}</div>`;
    }
    if(sec.type === 'corruption'){
      return `
        <div class="ds-corruption-wrap">
          <button class="ds-refresh" onclick="FREEKY.dossier.refreshCorruption('${sec.no}')" title="Reroll (F5)">↻ REFRESH</button>
          <div class="ds-corruption" id="corruption-${sec.no}"></div>
        </div>
      `;
    }
    return '';
  },

  toggle(no){
    FREEKY.dossier.openSections[no] = !FREEKY.dossier.openSections[no];
    const el = document.getElementById('ds-' + no);
    if(el) el.classList.toggle('open');
    const toggleEl = el ? el.querySelector('.ds-toggle') : null;
    if(toggleEl) toggleEl.textContent = FREEKY.dossier.openSections[no] ? '−' : '+';

    // ANOMAL-KY // SYSTEM CORRUPTION PROTOCOL replays its unstable sequence every time it opens
    if(FREEKY.dossier.openSections[no]){
      const sec = FREEKY.data.dossier.find(s => s.no === no);
      if(sec && sec.type === 'corruption') FREEKY.dossier.renderCorruptionSequence(sec);
    }
  },

  shuffle(arr){
    const a = arr.slice();
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Manual reroll — same effect as the "Every page refresh generates a
  // different combination" rule, without forcing a full browser reload.
  refreshCorruption(no){
    const sec = FREEKY.data.dossier.find(s => s.no === no);
    if(sec && sec.type === 'corruption') FREEKY.dossier.renderCorruptionSequence(sec);
  },

  // The archive keeps trying to erase this section; an unidentified process keeps
  // restoring fragments of it. No introduction, no explanation, no conclusion —
  // the conflict is shown through fragmented logs only. See data/dossier.js.
  // Randomized on every open: quantities and picks change each time, so no two
  // visits look identical.
  renderCorruptionSequence(sec){
    const box = document.getElementById('corruption-' + sec.no);
    if(!box) return;
    box.innerHTML = '';
    box.classList.remove('purged');
    let delay = 150;
    const rand = (min,max) => min + Math.floor(Math.random()*(max-min+1));
    const append = (el, at) => setTimeout(() => box.appendChild(el), at);

    // 1. SYSTEM LOGS — red / faded. The archive continuously attempting to remove something.
    const logCount = rand(1,5); // some visits feel almost empty, some unusually active
    FREEKY.dossier.shuffle(sec.systemLogs).slice(0, logCount).forEach((text) => {
      delay += rand(260,520);
      const l = document.createElement('div');
      l.className = 'ds-syslog';
      l.textContent = '> ' + text;
      append(l, delay);
    });

    // 2. UNKNOWN REPLIES — yellow. Speaker never identified.
    const replyCount = rand(1,4);
    FREEKY.dossier.shuffle(sec.unknownReplies).slice(0, replyCount).forEach((text) => {
      delay += rand(380,650);
      const f = document.createElement('div');
      f.className = 'ds-reply glitch';
      f.dataset.text = text;
      f.textContent = text;
      append(f, delay);
      setTimeout(() => FREEKY.ui.scheduleGlitchScan(), delay + 10);
    });

    // 3. ARCHIVE OUTPUT — grey. Routine-looking diagnostics.
    const outputCount = rand(0,3);
    FREEKY.dossier.shuffle(sec.archiveOutput).slice(0, outputCount).forEach((text) => {
      delay += rand(300,500);
      const o = document.createElement('div');
      o.className = 'ds-output';
      o.textContent = text;
      append(o, delay);
    });

    // 4. occasionally, a very small conversation — the archive speaks first, always
    if(Math.random() < 0.6){
      const convo = sec.conversations[Math.floor(Math.random()*sec.conversations.length)];
      delay += 650;
      const c = document.createElement('div');
      c.className = 'ds-convo';
      c.innerHTML = `<div class="ds-convo-a">> ${convo.a}</div><div class="ds-convo-dots">...</div><div class="ds-convo-r glitch" data-text="${convo.r}">${convo.r}</div>`;
      append(c, delay);
      setTimeout(() => FREEKY.ui.scheduleGlitchScan(), delay + 10);
      delay += 500;
    }

    // 5. termination log — the page never ends cleanly
    delay += 700;
    setTimeout(() => {
      const end = document.createElement('div');
      end.className = 'ds-ending';
      end.innerHTML = sec.termination.map(l => `<div>${l}</div>`).join('');
      box.appendChild(end);
      box.classList.add('purged');
    }, delay);
  }
};

// F5 while the ANOMAL-KY section is open rerolls its content instead of
// reloading the whole page. Any other time, F5 behaves normally.
document.addEventListener('keydown', (e) => {
  if(e.key !== 'F5') return;
  const el = document.getElementById('ds-06');
  if(el && el.classList.contains('open')){
    e.preventDefault();
    FREEKY.dossier.refreshCorruption('06');
  }
});
