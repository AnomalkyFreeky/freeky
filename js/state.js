/* ==============================================================
   FREƎ-KY // SHARED APPLICATION STATE
   --------------------------------------------------------------
   A single, explicit place for everything that changes at runtime.
   Every module reads and writes through FREEKY.state instead of
   declaring its own globals — this is what keeps navigation.js,
   quiz.js, loadout.js etc. independent of each other while still
   sharing data safely.

   Persisted fields are seeded from FREEKY.storage on load, so a
   returning visitor's classification/loadout/account survive a
   refresh (see storage.js for the current localStorage-backed
   implementation and its future backend swap point).
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.state = {
  // navigation
  currentScreen: 'gate',

  // quiz / classification
  scores: {researcher:0, engineer:0, operative:0, navigator:0},
  qIndex: 0,
  history: [],
  finalKey: FREEKY.storage.get('freeky_classification', null),
  finalScore: null, // 1–5 winning score, used only for confidence tier — never displayed as a number

  // item detail overlay
  currentItem: null,
  galleryIndex: 0,
  selectedColor: null,
  selectedSize: null,
  cartMsg: '',

  // loadout / deployment
  cart: FREEKY.storage.get('freeky_loadout', []),
  deploymentsCount: FREEKY.storage.get('freeky_deployments', 0),

  // your file (account)
  accountMode: 'create',
  account: FREEKY.storage.get('freeky_account', null)
};
