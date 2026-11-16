(function () {
  const KEY = "finora_wealth_v1";
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(window.FINORA_DEFAULTS);
      const saved = JSON.parse(raw);
      if (!saved || !Array.isArray(saved.accounts) || !Array.isArray(saved.transactions)) throw new Error("Invalid store");
      return Object.assign(clone(window.FINORA_DEFAULTS), saved, {
        settings: Object.assign({}, window.FINORA_DEFAULTS.settings, saved.settings || {})
      });
    } catch (error) {
      console.warn("Finora storage could not be loaded; starting with demo data.", error);
      return clone(window.FINORA_DEFAULTS);
    }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (error) { console.error("Finora could not save data.", error); return false; }
  }
  function reset() { localStorage.removeItem(KEY); return load(); }
  window.FinoraStorage = { load, save, reset, key: KEY };
})();