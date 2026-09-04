(() => {
  'use strict';

  let observer = null;
  let current = null;
  let resetTimer = 0;

  function resetToTop(root, immediate = false) {
    if (!root?.isConnected) return;
    const main = root.querySelector('.dl-onboarding-shell main');
    const shell = root.querySelector('.dl-onboarding-shell');
    const run = () => {
      try { root.scrollTop = 0; } catch {}
      try { main && (main.scrollTop = 0); } catch {}
      try { shell && (shell.scrollTop = 0); } catch {}
      try { root.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch {}
      try { main?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' }); } catch {}
    };
    if (immediate) run();
    clearTimeout(resetTimer);
    requestAnimationFrame(() => {
      run();
      resetTimer = setTimeout(run, 70);
    });
  }

  function stepSignature(root) {
    const main = root?.querySelector('.dl-onboarding-shell main');
    if (!main) return '';
    return [
      main.querySelector('.dl-gender-grid') ? 'gender' : '',
      main.querySelector('.dl-role-pick-grid') ? 'role' : '',
      main.querySelector('.dl-onboarding-card-stage') ? 'card' : '',
      main.querySelector('.dl-onboarding-copy > span')?.textContent?.trim() || ''
    ].join('|');
  }

  function attach(root) {
    if (!root || root === current) return;
    observer?.disconnect();
    current = root;
    let signature = stepSignature(root);
    root.dataset.dlScrollFix = '1';
    resetToTop(root, true);

    observer = new MutationObserver(() => {
      const next = stepSignature(root);
      if (next && next !== signature) {
        signature = next;
        resetToTop(root, true);
      }
    });
    observer.observe(root.querySelector('.dl-onboarding-shell main') || root, { childList: true, subtree: true });
  }

  document.addEventListener('click', event => {
    const control = event.target.closest?.('.dl-identity-onboarding [data-next], .dl-identity-onboarding [data-back]');
    if (!control) return;
    const root = control.closest('.dl-identity-onboarding');
    setTimeout(() => resetToTop(root, true), 0);
    setTimeout(() => resetToTop(root, true), 90);
  }, true);

  function scan() {
    const root = document.querySelector('.dl-identity-onboarding');
    if (root) attach(root);
    else if (current && !current.isConnected) {
      observer?.disconnect();
      observer = null;
      current = null;
    }
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (current?.isConnected && current.scrollTop < 4) resetToTop(current);
    }, { passive: true });
  }

  window.addEventListener('pageshow', scan);
  window.addEventListener('hashchange', scan);
  window.addEventListener('dlavie-auth-session', () => setTimeout(scan, 150));
  document.addEventListener('dlavie:collector-ready', scan);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan, { once: true });
  else scan();

  setInterval(scan, 700);
})();