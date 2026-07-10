/* ==============================================================
   FREƎ-KY // DATA — Personnel files per division
   --------------------------------------------------------------
   Used by js/classification.js to render the Loadout Terminal
   result (FILE NUMBER, CLASSIFICATION, STATUS, ACCESS LEVEL,
   INCIDENT REPORT, RECOVERED EQUIPMENT).
   // Load from API (future): replace with a fetch() at startup.
   ============================================================== */
window.FREEKY = window.FREEKY || {};
window.FREEKY.data = window.FREEKY.data || {};

FREEKY.data.files = {
  researcher:{no:"R-001", name:"Researcher", role:"ASSIGNMENT: OBSERVATION // INVESTIGATION // RECOVERY OF INFORMATION",
    status:"ACTIVE", accessLevel:"II",
    inc:"INCIDENT REPORT // 014", story:"The subject remained at the observation post after the recall order. Contact was lost for eleven hours. The notes were recovered intact. The reason for staying was not.", item:"R-001 // RESEARCH COAT"},
  engineer:{no:"E-001", name:"Engineer", role:"ASSIGNMENT: CONSTRUCTION // REPAIR // ADAPTATION",
    status:"ACTIVE", accessLevel:"III",
    inc:"INCIDENT REPORT // 004", story:"The external door failed during evacuation. The subject remained to restore power to the locking mechanism. The door was repaired. The subject was already gone.", item:"E-001 // UTILITY CARGO"},
  operative:{no:"O-001", name:"Operative", role:"ASSIGNMENT: MOVEMENT // ADAPTATION // DAILY SURVIVAL",
    status:"ACTIVE", accessLevel:"IV",
    inc:"INCIDENT REPORT // 011", story:"Communications went dark at 03:00. No order was given to hold position, because no one remained to give one. The subject did not wait for confirmation.", item:"O-001 // MISSION HOODIE"},
  navigator:{no:"N-001", name:"Navigator", role:"ASSIGNMENT: MOVEMENT // EXPLORATION // ADAPTATION TO CONDITIONS",
    status:"ACTIVE", accessLevel:"II",
    inc:"INCIDENT REPORT // 009", story:"The mapped route ended three kilometers from the objective. The subject continued on unmapped terrain. Equipment logs continued transmitting for four more days.", item:"N-001 // FIELD CAP / NAVIGATION BEANIE"},
  anomaly:{no:"P-001", name:"Paradox", role:"ASSIGNMENT: UNRESOLVED // DOES NOT MATCH KNOWN PARAMETERS",
    status:"ANOMALOUS", accessLevel:"RESTRICTED",
    inc:"INCIDENT REPORT // 000", story:"No record exists of the subject prior to this evaluation. Classification was attempted against all four divisions. None returned a match. The file was generated regardless.", item:"P-001 // PARADOX JACKET"}
};

/* ===== SPECIAL VISITOR STATES — not divisions, not Paradox =====
   OUTSIDER: the visitor never started the Classification Protocol.
   UNCLASSIFIED: the visitor started it and declined mid-way.
   Neither of these is an error state, and neither is Paradox — see
   js/classification.js renderResult() for how they render differently
   from a normal file (no incident report, no recovered equipment).
*/
FREEKY.data.files.outsider = {
  no:"Unavailable", name:"Outsider",
  status:"Outside archive.", deployment:"Denied.",
  sysNote:"No behavioural archive exists. Begin the Classification Protocol to generate a personnel file."
};

FREEKY.data.files.unclassified = {
  no:"Pending", name:"Unclassified",
  deployment:"Withheld.",
  sysNote:"Classification protocol voluntarily interrupted. Evaluation may be resumed at any time."
};

// Small corporate jokes — the dossier stays serious, the administration does not.
FREEKY.data.adminStatusPool = [
  "Awaiting paperwork","Administrative inconvenience","Uncooperative","Please return later",
  "Lost clipboard","Paperwork missing","Equipment withheld","Visitor refused evaluation",
  "Good luck out there","Not my problem","Pending approval","Processing indefinitely",
  "Coffee break","Somebody forgot to sign here","Please inconvenience another department"
];

// Implied interference — never confirmed, never explained. See js/classification.js
// playParadoxReveal() and js/manifest.js for where these surface.
FREEKY.data.interferenceLogs = [
  "UNKNOWN WRITE ACCESS","CACHE MODIFIED","COMMENT REMOVED","1 COMMENT REMAINING",
  "ARCHIVE INTEGRITY 99.98%","KNOWN INTRUSIONS 1","RESOLVED 0"
];
