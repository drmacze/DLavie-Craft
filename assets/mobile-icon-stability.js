(() => {
  'use strict';

  const ACCOUNT_CONTROL = [
    '#dl-account-portal .dl-account-tabs button',
    '#dl-account-portal .dl-account-btn',
    '#dl-account-portal .dl-account-link',
    '#dl-account-portal .dl-account-field',
    '#dl-account-portal .dl-download-login-notice'
  ].join(',');

  const ICON_SELECTOR = '.dl-mc-icon,.dl-mc-sweep-icon,.dl-mc-forge-icon';

  function chooseKeeper(control, icons) {
    if (!icons.length) return null;
    // Account-specific icon system has the best semantics for login/register/forms.
    const accountIcon = icons.find((icon) => icon.classList.contains('dl-mc-icon'));
    if (accountIcon) return accountIcon;
    const sweepIcon = icons.find((icon) => icon.classList.contains('dl-mc-sweep-icon'));
    return sweepIcon || icons[0];
  }

  function dedupeAccountIcons(root = document) {
    root.querySelectorAll?.(ACCOUNT_CONTROL).forEach((control) => {
      const icons = Array.from(control.querySelectorAll(`:scope > ${ICON_SELECTOR}, :scope > .dl-download-lock > ${ICON_SELECTOR}`));
      if (icons.length < 2) return;
      const keeper = chooseKeeper(control, icons);
      icons.forEach((icon) => {
        if (icon !== keeper) icon.remove();
      });
    });
  }

  function normalizeFieldIcons(root = document) {
    root.querySelectorAll?.('#dl-account-portal .dl-account-field.dl-mc-field-iconized').forEach((field) => {
      const icons = Array.from(field.children).filter((el) => el.matches?.(ICON_SELECTOR));
      if (icons.length > 1) {
        const keeper = icons.find((icon) => icon.classList.contains('dl-mc-icon')) || icons[0];
        icons.forEach((icon) => { if (icon !== keeper) icon.remove(); });
      }
    });
  }

  function applyDeviceProfile() {
    const coarse = matchMedia('(pointer:coarse)').matches;
    const narrow = matchMedia('(max-width:820px)').matches;
    document.documentElement.classList.toggle('dl-mobile-lite', coarse || narrow);
  }

  function scan(root = document) {
    dedupeAccountIcons(root);
    normalizeFieldIcons(root);
  }

  let raf = 0;
  function schedule(root = document) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      scan(root?.querySelectorAll ? root : document);
    });
  }

  function boot() {
    applyDeviceProfile();
    scan(document);

    document.addEventListener('click', () => schedule(document), true);
    window.addEventListener('hashchange', () => schedule(document));
    window.addEventListener('popstate', () => schedule(document));
    window.addEventListener('pageshow', () => schedule(document));
    window.addEventListener('resize', applyDeviceProfile, { passive: true });

    document.addEventListener('visibilitychange', () => {
      document.documentElement.classList.toggle('dl-page-hidden', document.hidden);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
