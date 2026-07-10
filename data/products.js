/* ==============================================================
   FREƎ-KY // DATA — Equipment manifest
   --------------------------------------------------------------
   Never hardcode equipment into HTML or into UI logic — every
   product lives here. js/manifest.js and js/products.js only
   read from this file.
   // Load from API (future): replace with a fetch() at startup.
   // Future folders: /database will eventually seed this table.
   ============================================================== */
window.FREEKY = window.FREEKY || {};
window.FREEKY.data = window.FREEKY.data || {};

FREEKY.data.colorOptions = [
  {name:"Void Black", hex:"#0a0a0b"},
  {name:"Charcoal", hex:"#2c2c2e"},
  {name:"Off-White", hex:"#cfcac0"},
  {name:"Olive Drab", hex:"#4b4f3a"}
];

FREEKY.data.sizeOptions = ["S","M","L","XL","XXL"];

FREEKY.data.imageSlides = ["FRONT","BACK","DETAIL"];

FREEKY.data.manifest = [
  {file:"FK-OD-001",name:"Archive Tee",desc:"The basic point of entry into FREƎ-KY. A person before classification. Clean, wearable, streetwear-focused.",warn:"HANDLE: STANDARD",req:"RQ-OD-001",key:"offduty",status:"available",drop:"FILE 001 — FIRST ACCESS"},
  {file:"O-001",name:"Mission Hoodie",desc:"The main streetwear piece. Oversized fit, heavy fabric, structured hood, subtle archive markings.",warn:"HANDLE: STANDARD",req:"RQ-O-001",key:"operative",status:"available",drop:"FILE 001 — FIRST ACCESS"},
  {file:"N-001",name:"Field Cap / Navigation Beanie",desc:"Headwear considered field equipment. Embroidered details, simple recognizable branding, dark colourways.",warn:"HANDLE: STANDARD",req:"RQ-N-001",key:"navigator",status:"available",drop:"FILE 001 — FIRST ACCESS"},
  {file:"E-001",name:"Utility Cargo",desc:"Cargo silhouette with functional pockets, built for construction, repair and adaptation.",warn:"HANDLE: PENDING",req:"RQ-E-001",key:"engineer",status:"sealed",drop:"FILE 002 — FIELD EQUIPMENT"},
  {file:"R-001",name:"Research Coat",desc:"A future iconic piece. Coat-based silhouette for observation, investigation, recovery of information.",warn:"HANDLE: PENDING",req:"RQ-R-001",key:"researcher",status:"sealed",drop:"FILE 002 — FIELD EQUIPMENT"},
  {file:"P-001",name:"Paradox Jacket",desc:"A future collector piece. Asymmetrical, contradictory by design. Not introduced immediately.",warn:"HANDLE: UNKNOWN",req:"RQ-P-001",key:"anomaly",status:"sealed",drop:"FILE 003 — UNKNOWN CONDITIONS"}
];
