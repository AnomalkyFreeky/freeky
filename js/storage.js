/* ==============================================================
   FREƎ-KY // STORAGE LAYER — future backend swap point
   --------------------------------------------------------------
   Every persisted value in this app goes through FREEKY.storage.
   get/set/remove. Today it's backed by localStorage, with a
   silent in-memory fallback if the browser sandbox blocks storage.

   // Future database connection:
   // When a real backend exists, replace the bodies of get/set/
   // remove with fetch() calls to your API. Nothing elsewhere in
   // the app needs to change — every module already goes through
   // this single file.
   ============================================================== */
window.FREEKY = window.FREEKY || {};

FREEKY.storage = (function(){
  const memoryFallback = {};
  let useMemory = false;

  try {
    const testKey = '__freeky_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
  } catch(e){
    useMemory = true; // storage blocked in this environment — degrade gracefully
  }

  return {
    get(key, fallback){
      try{
        if(useMemory) return key in memoryFallback ? memoryFallback[key] : fallback;
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      }catch(e){ return fallback; }
    },
    set(key, value){
      try{
        if(useMemory){ memoryFallback[key] = value; return true; }
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      }catch(e){
        memoryFallback[key] = value; // e.g. quota exceeded — keep working for this session
        useMemory = true;
        return false;
      }
    },
    remove(key){
      try{
        if(useMemory){ delete memoryFallback[key]; return; }
        localStorage.removeItem(key);
      }catch(e){ delete memoryFallback[key]; }
    }
  };
})();
