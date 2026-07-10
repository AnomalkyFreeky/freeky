/* ==============================================================
   FREƎ-KY // DATA — Divisions (classification categories)
   --------------------------------------------------------------
   // Load from API (future): replace with a fetch() at startup.
   ============================================================== */
window.FREEKY = window.FREEKY || {};
window.FREEKY.data = window.FREEKY.data || {};

FREEKY.data.categories = [
  {key:"offduty", group:"offduty", no:"FK-OD", emoji:"🗂️", name:"Off-Duty", tagline:"\u201cBefore classification. The point of entry.\u201d",
    style:["Clean, wearable daily","Streetwear-focused","Minimal, recognizable archive marks"]},
  {key:"operative", group:"assigned", no:"O", emoji:"🥷", name:"Operative", tagline:"\u201cThose sent into situations where failure is not an option.\u201d",
    style:["Oversized fit","Heavy fabric","Structured hood","Subtle archive markings"]},
  {key:"navigator", group:"assigned", no:"N", emoji:"🌌", name:"Navigator", tagline:"\u201cThose who move beyond known limits.\u201d",
    style:["Embroidered details","Simple recognizable branding","Dark colourways","Everyday wearability"]},
  {key:"engineer", group:"assigned", no:"E", emoji:"⚙️", name:"Engineer", tagline:"\u201cThose who create solutions when systems fail.\u201d",
    style:["Cargo silhouette","Functional pockets","Durable construction"]},
  {key:"researcher", group:"assigned", no:"R", emoji:"🧬", name:"Researcher", tagline:"\u201cThose who investigate what others ignore.\u201d",
    style:["Coat-based silhouette","Layering","Archive-grade detailing"]},
  {key:"anomaly", group:"unclassified", no:"P", emoji:"∅", name:"The Paradox", tagline:"\u201cContradiction. Undefined identity. System failure.\u201d",
    style:["Asymmetrical cuts","Impossible combinations","Collector pieces"]}
];
