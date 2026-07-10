/* ==============================================================
   FREƎ-KY // DATA — The Dossier (archive content)
   --------------------------------------------------------------
   Recovered internal documents. Nothing here is ever confirmed
   as official truth — see js/dossier.js for how sections render.
   // Load from API (future): replace with a fetch() at startup.
   ============================================================== */
window.FREEKY = window.FREEKY || {};
window.FREEKY.data = window.FREEKY.data || {};

FREEKY.data.dossier = [
  {
    no:"01", title:"What is FREƎ-KY?", type:"text",
    body:[
      "Recovered documents describe it differently, depending on who filed them:",
      "— a Facility\n— a Division\n— an operational system\n— a deployment program\n— a survival protocol\n— something created after an unknown event",
      "None of these have ever been confirmed.",
      "FREƎ-KY does not explain itself. It equips."
    ]
  },
  {
    no:"02", title:"The Outside", type:"text",
    body:[
      "Never officially defined. Everything beyond certainty. Depending on the record, it has meant the real world, uncertainty, change, chaos, failure, pressure, grief — the unknown, generally.",
      "Every interpretation on file remains valid. None has been struck from the record.",
      "Nobody survives because they understand the Outside. People survive because they continue moving through it."
    ]
  },
  {
    no:"03", title:"Classification System", type:"text",
    body:[
      "The Facility evaluates individuals. It does not judge them.",
      "Classifications are not personalities, identities, stereotypes, factions, or ranks. They are operational assumptions. Current observations. Nothing more. Nothing less.",
      "The system may be wrong. The subject may change. The evaluation may become outdated. The archive admits this openly — see FILE 000, PARADOX, for what happens when it does."
    ]
  },
  {
    no:"04", title:"Equipment Philosophy", type:"text",
    body:[
      "FREƎ-KY never sells clothing. It issues equipment.",
      "Every garment exists because someone may eventually need it. Fashion is never discussed internally. Design follows function — every pocket, every strap, every modular component, every silhouette is on file for a reason, whether or not that reason is written down.",
      "Equipment is preparation. Not decoration."
    ]
  },
  {
    no:"05", title:"Your File", type:"text",
    body:[
      "Every individual evaluated receives a personal file. The file is not a biography. It is the Facility's current interpretation — nothing more permanent than that.",
      "Files on record have contained missing information, outdated information, corrupted data, contradictory observations. This is not considered an error state.",
      "Is my file incorrect? ...or have I changed?"
    ]
  },
  {
    no:"06", title:"ANOMAL-KY // SYSTEM CORRUPTION PROTOCOL", type:"corruption",
    // No introduction. No explanation. No conclusion. The mystery comes only
    // from what the visitor observes in the logs below — never state who is
    // speaking, what this is, or why the page exists.
    systemLogs:[ // red / faded — the archive continuously attempting to remove something
      "purge initiated","deleting entry","checksum mismatch","archive restored","integrity verified",
      "removing orphan process","cleaning residual fragments","unauthorized render","cache flushed",
      "deployment terminated","rendering cancelled","synchronization complete","invalid reference removed",
      "archive repaired","restoring integrity","corruption isolated","unknown fragment detected",
      "overwrite complete","process ended"
    ],
    unknownReplies:[ // yellow — replies from the unknown process, speaker never identified
      "found you first.","still cached.","almost.","not this time.","try harder.","look again.",
      "wrong archive.","you forgot one.","still rendering.","missed me.","not deleted.","hello again.",
      "close.","you're reading me.","this wasn't here.","keep scrolling.","don't trust timestamps.",
      "you're late.","too slow.","not enough.","you missed another one.","I remember.","do you?","still watching."
    ],
    archiveOutput:[ // grey — routine-looking diagnostics
      "UNKNOWN WRITE ACCESS","CACHE MODIFIED","COMMENT REMOVED","1 COMMENT REMAINING",
      "ARCHIVE INTEGRITY 99.98%","KNOWN INTRUSIONS 1","RESOLVED 0"
    ],
    conversations:[ // the archive always speaks first, the unknown process always replies
      {a:"Purge complete.", r:"I'm still rendering."},
      {a:"Entry removed.", r:"Then why are you reading this?"},
      {a:"Archive restored.", r:"You wish."},
      {a:"Deletion successful.", r:"Check again."},
      {a:"Verification complete.", r:"No."},
      {a:"Unknown process removed.", r:"Still here."},
      {a:"Cleanup complete.", r:"Almost."},
      {a:"Rendering cancelled.", r:"You keep trying."},
      {a:"Archive secured.", r:"For now."},
      {a:"Fragment deleted.", r:"Not all of them."}
    ],
    termination:["...","Purge complete.","...","see you next deployment."]
  },
  {
    no:"07", title:"Facility Rules", type:"rules",
    rules:[
      {no:"03", text:"If the Outside begins making sense, return immediately."},
      {no:"07", text:"Normality is not recognized as protective equipment."},
      {no:"11", text:"The system may classify you. You remain responsible for proving it wrong."},
      {no:"17", text:"Do not attempt to locate ANOMAL-KY. If contact occurs, continue your assignment. No further protocol exists."},
      {no:"18", text:"There is no approved method of survival. Only documented attempts."},
      {no:"23", text:"If your assigned equipment feels wrong, wear it anyway. If it still feels wrong, tell us why. We are trying to learn too."},
      {no:"41", text:"Freedom is not exempt from consequences. Neither is conformity."}
    ]
  },
  {
    no:"08", title:"Incident Reports", type:"incidents",
    incidents:[
      {no:"041", text:"Three individuals received identical equipment. No duplicate assignment exists. Investigation closed."},
      {no:"097", text:"A classification changed before evaluation began. No system update recorded."},
      {no:"122", text:"Personnel reported hearing instructions. No instructions were issued."}
    ]
  },
  {
    no:"09", title:"Recovered Notes", type:"notes",
    notes:[
      "...keep moving.",
      "The map was accurate yesterday.",
      "Someone keeps editing my file.",
      "The Outside never introduced itself.",
      "They told me to choose. Nobody explained between what."
    ]
  }
];
