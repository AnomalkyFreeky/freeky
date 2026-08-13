/* ==============================================================
   FREÆŽ-KY // FACILITY — private operator logs
   ============================================================== */
window.FREEKY = window.FREEKY || {};

Object.assign(FREEKY.facility, {
  openLogs(){
    if(FREEKY.facility.currentLevel() < 80){
      FREEKY.facility.termPrint('ACCESS DENIED: LOGS REQUIRE CLEARANCE LEVEL 80.');
      return;
    }
    FREEKY.facility.activeModule = 'logs';
    FREEKY.facility.moduleLogs(document.getElementById('fcContent'));
  },

  moduleLogs(content){
    const log = FREEKY.storage.get('freeky_facility_logs', []);
    content.innerHTML = `
      <div class="fc-module">
        <div class="fc-module-tag">20 // SYSTEM LOGS</div>
        <p class="pf-empty" style="margin-bottom:14px;">Private to this browser. Logs are opened only through the Command Terminal.</p>
        ${log.length ? log.map(l => `
          <div class="fc-log-row">
            <span>${new Date(l.timestamp).toLocaleString('en-GB')}</span>
            <span>${l.operator}</span>
            <span>${l.action}</span>
          </div>
        `).join('') : '<p class="pf-empty">No actions recorded yet.</p>'}
      </div>
    `;
  }
});
