(() => {
  'use strict';

  const CONSOLE_HASH_RE = /^#\/?console(?:\/|$)/i;
  let syncing = false;
  let raf = 0;

  const onConsole = () => CONSOLE_HASH_RE.test(location.hash || '');

  function helperAccountButton() {
    return document.getElementById('dl-account-entry');
  }

  function helperLegalFooter() {
    return document.getElementById('dl-legal-footer');
  }

  function accountLabel() {
    const helper = helperAccountButton();
    const raw = (helper?.textContent || '').trim();
    return raw || 'Masuk';
  }

  function openAccount() {
    const helper = helperAccountButton();
    if (helper) {
      helper.click();
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set('dlavie', 'login');
    history.pushState({ dlaviePortal: 'login' }, '', url.pathname + url.search + url.hash);
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
  }

  function openLegal(type) {
    const helper = helperLegalFooter();
    const button = helper?.querySelector(`[data-mode="${type}"]`);
    if (button) {
      button.click();
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set('dlavie', type);
    history.pushState({ dlaviePortal: type }, '', url.pathname + url.search + url.hash);
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
  }

  function makeAccountButton(id, mobile = false) {
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.className = mobile ? 'dl-shell-account dl-shell-account-mobile' : 'dl-shell-account';
    button.setAttribute('aria-label', 'Buka akun DLavie ID');
    button.innerHTML = '<span class="dl-shell-account-mark" aria-hidden="true"></span><span data-dl-shell-label></span>';
    button.addEventListener('click', openAccount);
    return button;
  }

  function syncAccountEntries() {
    const label = accountLabel();
    const actions = document.querySelector('.site-header .header-actions');
    const nav = document.querySelector('.site-header .main-nav');

    if (actions) {
      let button = document.getElementById('dl-shell-account-entry');
      if (!button) {
        button = makeAccountButton('dl-shell-account-entry', false);
        actions.appendChild(button);
      }
      button.querySelector('[data-dl-shell-label]').textContent = label;
    }

    if (nav) {
      let button = document.getElementById('dl-shell-account-entry-mobile');
      if (!button) {
        button = makeAccountButton('dl-shell-account-entry-mobile', true);
        nav.appendChild(button);
      }
      button.querySelector('[data-dl-shell-label]').textContent = label;
    }
  }

  function syncLegalLinks() {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    let links = footer.querySelector('.dl-shell-legal-links');
    if (!links) {
      links = document.createElement('div');
      links.className = 'dl-shell-legal-links';
      links.setAttribute('aria-label', 'Dokumen dan kebijakan DLavie Craft');
      links.innerHTML = `
        <button type="button" data-dl-shell-legal="terms">Syarat & Ketentuan</button>
        <span aria-hidden="true">·</span>
        <button type="button" data-dl-shell-legal="privacy">Privasi</button>
        <span aria-hidden="true">·</span>
        <button type="button" data-dl-shell-legal="rules">Peraturan Komunitas</button>`;
      links.querySelectorAll('[data-dl-shell-legal]').forEach((button) => {
        button.addEventListener('click', () => openLegal(button.dataset.dlShellLegal));
      });
      footer.appendChild(links);
    }
  }

  function cleanDetachedUi() {
    // The original account/legal system still owns state and click handlers.
    // We keep its helper nodes in the DOM, but CSS hides them so they no longer
    // create a second footer or a floating account pill on public pages.
    helperAccountButton()?.setAttribute('aria-hidden', 'true');
    helperLegalFooter()?.setAttribute('aria-hidden', 'true');
  }

  function sync() {
    if (syncing) return;
    syncing = true;
    try {
      if (onConsole()) {
        document.getElementById('dl-shell-account-entry')?.remove();
        document.getElementById('dl-shell-account-entry-mobile')?.remove();
        document.querySelector('.dl-shell-legal-links')?.remove();
        return;
      }
      cleanDetachedUi();
      syncAccountEntries();
      syncLegalLinks();
    } finally {
      syncing = false;
    }
  }

  function scheduleSync() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      sync();
    });
  }

  document.addEventListener('DOMContentLoaded', scheduleSync, { once: true });
  window.addEventListener('hashchange', scheduleSync);
  window.addEventListener('popstate', scheduleSync);

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  scheduleSync();
})();
