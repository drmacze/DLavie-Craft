(() => {
  'use strict';

  // account-legal-system.js creates its observer on DOMContentLoaded. The legacy
  // observer updates #dl-account-entry.textContent from inside its own callback,
  // which creates another childList mutation on that same button in WebKit.
  // Safari/iOS can therefore get trapped in a mutation loop and starve React,
  // leaving the page blank. Keep the native observer behavior everywhere else,
  // but ignore records generated only by the helper account entry itself.
  const NativeMutationObserver = window.MutationObserver;
  if (!NativeMutationObserver || NativeMutationObserver.__dlavieGuarded) return;

  class DLavieMutationObserver extends NativeMutationObserver {
    constructor(callback) {
      super((records, observer) => {
        const meaningful = records.some((record) => {
          const rawTarget = record.target;
          const target = rawTarget?.nodeType === 1 ? rawTarget : rawTarget?.parentElement;
          if (!target) return true;
          if (target.id === 'dl-account-entry') return false;
          if (typeof target.closest === 'function' && target.closest('#dl-account-entry')) return false;
          return true;
        });

        if (meaningful) callback(records, observer);
      });
    }
  }

  DLavieMutationObserver.__dlavieGuarded = true;
  window.MutationObserver = DLavieMutationObserver;
})();
