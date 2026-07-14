/* ==============================================================
   FREƎ-KY // DATA — Facility Control access hierarchy
   --------------------------------------------------------------
   Maps to profiles.role. Only 'user' and 'admin' exist in the real
   database today — 'director'/'staff'/'moderator' are supported in
   code so the permission system already works when those roles get
   used, per the brief: "every module should already support
   permission checks internally, even if only one administrator
   currently exists."
   ============================================================== */
window.FREEKY = window.FREEKY || {};
window.FREEKY.data = window.FREEKY.data || {};

FREEKY.data.roles = {
  admin:     { level:99, label:"Administrator", greeting:"Good morning, ANOMAL-KY." },
  director:  { level:80, label:"Director",      greeting:"Facility operations delegated." },
  staff:     { level:50, label:"Staff",          greeting:"Operational access granted." },
  moderator: { level:20, label:"Moderator",      greeting:"Observation privileges granted." },
  user:      { level:1,  label:"Customer",       greeting:"YOUR FILE loaded successfully." }
};
