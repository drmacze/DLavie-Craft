(() => {
  'use strict';

  const CONSOLE_HASH_RE = /^#\/?console(?:\/|$)/i;
  const MANAGER_TEXT_RE = /masuk\s+(?:ke\s+)?pengelola|masuk\s+(?:ke\s+)?console|developer\s+console|owner\s+console/i;

  function isConsolePage() {
    return CONSOLE_HASH_RE.test(window.location.hash || '');
  }

  function removePublicConsoleEntries() {
    if (isConsolePage()) return;

    document.querySelectorAll('a, button').forEach((el) => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const href = el.tagName === 'A' ? (el.getAttribute('href') || '') : '';
      const pointsToConsole = /(?:^|#)\/?console(?:\/login)?(?:$|[/?#])/i.test(href);
      const looksLikeManagerEntry = MANAGER_TEXT_RE.test(text);

      if (pointsToConsole || looksLikeManagerEntry) {
        // Only strip console entry points from the public shell. Console pages
        // themselves remain functional for authenticated developer/owner accounts.
        el.remove();
      }
    });
  }

  let scheduled = false;
  function scheduleCleanup() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      removePublicConsoleEntries();
    });
  }

  document.addEventListener('DOMContentLoaded', scheduleCleanup, { once: true });
  window.addEventListener('hashchange', scheduleCleanup);

  const observer = new MutationObserver(scheduleCleanup);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  scheduleCleanup();
})();
