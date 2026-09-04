(() => {
  'use strict';

  const SESSION_KEY = 'sb-ydaeukhqwishlrjyfktk-auth-token';
  const PENDING_KEY = 'dlavie-download-login-intent';
  const DOWNLOAD_TEXT_RE = /(?:^|\s)(download|unduh)(?:\s|$|[.:!])/i;
  const FILE_RE = /\.(?:mcpack|mcaddon|mcworld|mctemplate|zip)(?:$|[?#])/i;
  const STORAGE_RE = /\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/)?dlavie-project-files(?:\/|$)/i;
  const CONSOLE_RE = /^#\/?console(?:\/|$)/i;

  const isConsoleRoute = () => CONSOLE_RE.test(location.hash || '');

  function readSession() {
    try {
      const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (!value?.access_token || !value?.refresh_token) return null;
      if (value.expires_at && Number(value.expires_at) <= Math.floor(Date.now() / 1000) + 5) return null;
      return value;
    } catch {
      return null;
    }
  }

  function isSignedIn() {
    return !!readSession();
  }

  function pendingIntent() {
    try {
      const value = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
      if (!value?.createdAt || Date.now() - value.createdAt > 15 * 60 * 1000) {
        sessionStorage.removeItem(PENDING_KEY);
        return null;
      }
      return value;
    } catch {
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
  }

  function rememberIntent(control) {
    const href = control?.tagName === 'A' ? control.getAttribute('href') : null;
    const label = (control?.textContent || control?.getAttribute?.('aria-label') || 'Download')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({
      createdAt: Date.now(),
      page: location.pathname + location.hash,
      href: href || null,
      label: label || 'Download',
    }));
  }

  function isDownloadControl(control) {
    if (!control || isConsoleRoute()) return false;
    if (control.closest?.('#dl-account-portal, .dl-legal-sheet, .console-app')) return false;

    const text = [
      control.textContent || '',
      control.getAttribute?.('aria-label') || '',
      control.getAttribute?.('title') || '',
      control.getAttribute?.('data-action') || '',
      control.getAttribute?.('data-testid') || '',
    ].join(' ').replace(/\s+/g, ' ').trim();

    const href = control.tagName === 'A' ? (control.getAttribute('href') || '') : '';
    const hasNativeDownload = control.tagName === 'A' && control.hasAttribute('download');

    return hasNativeDownload || DOWNLOAD_TEXT_RE.test(text) || FILE_RE.test(href) || STORAGE_RE.test(href);
  }

  function controlFromEventTarget(target) {
    return target?.closest?.('a,button,[role="button"]') || null;
  }

  function cleanLoginParamAfterSuccessfulAuth() {
    const intent = pendingIntent();
    if (!intent || !isSignedIn()) return;
    const url = new URL(location.href);
    if (url.searchParams.get('dlavie') === 'login') {
      url.searchParams.delete('dlavie');
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    }
  }

  // This script is loaded before the account system so a successful login can
  // return to the project page rather than reopening the login portal on reload.
  cleanLoginParamAfterSuccessfulAuth();

  function openLogin() {
    const helper = document.getElementById('dl-account-entry');
    if (helper) {
      helper.click();
      return;
    }

    const url = new URL(location.href);
    url.searchParams.set('dlavie', 'login');
    history.pushState({ dlaviePortal: 'login', downloadRequired: true }, '', url.pathname + url.search + url.hash);
    try {
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    } catch {
      window.dispatchEvent(new Event('popstate'));
    }
  }

  function addLoginNotice() {
    if (!pendingIntent() || isSignedIn()) return;
    const portal = document.getElementById('dl-account-portal');
    if (!portal || document.getElementById('dl-download-login-notice')) return;
    const card = portal.querySelector('[data-dl-card], .dl-account-card');
    if (!card) return;

    const notice = document.createElement('div');
    notice.id = 'dl-download-login-notice';
    notice.className = 'dl-download-login-notice';
    notice.innerHTML = '<span class="dl-download-lock" aria-hidden="true">▣</span><span><strong>Login diperlukan untuk download</strong><small>Masuk atau buat DLavie ID terlebih dahulu. Setelah berhasil, tombol download akan terbuka.</small></span>';

    const tabs = card.querySelector('.dl-account-tabs');
    if (tabs) tabs.before(notice);
    else card.querySelector('form')?.before(notice) || card.prepend(notice);
  }

  function showUnlockedToast() {
    const intent = pendingIntent();
    if (!intent || !isSignedIn() || isConsoleRoute()) return;
    sessionStorage.removeItem(PENDING_KEY);

    const toast = document.createElement('div');
    toast.className = 'dl-download-unlocked-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = '<span aria-hidden="true">◆</span><span><strong>Download terbuka</strong><small>Kamu sudah login. Tekan Download untuk mengambil file project.</small></span>';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 260);
    }, 4200);
  }

  function decorateControl(control) {
    if (!isDownloadControl(control)) return;
    const locked = !isSignedIn();
    if (locked) {
      if (control.dataset.dlDownloadLocked !== 'true') control.dataset.dlDownloadLocked = 'true';
      if (!control.getAttribute('title')) control.setAttribute('title', 'Login diperlukan untuk download');
    } else {
      if (control.dataset.dlDownloadLocked) delete control.dataset.dlDownloadLocked;
      if (control.getAttribute('title') === 'Login diperlukan untuk download') control.removeAttribute('title');
    }
  }

  function decorateDownloads(root = document) {
    if (isConsoleRoute()) return;
    if (root.matches?.('a,button,[role="button"]')) decorateControl(root);
    root.querySelectorAll?.('a,button,[role="button"]').forEach(decorateControl);
  }

  document.addEventListener('click', (event) => {
    if (isConsoleRoute() || isSignedIn()) return;
    const control = controlFromEventTarget(event.target);
    if (!isDownloadControl(control)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    rememberIntent(control);
    openLogin();
    setTimeout(addLoginNotice, 0);
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (isConsoleRoute() || isSignedIn()) return;
    const control = controlFromEventTarget(event.target);
    if (!isDownloadControl(control)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    rememberIntent(control);
    openLogin();
    setTimeout(addLoginNotice, 0);
  }, true);

  let scanQueued = false;
  function queueScan(root) {
    if (root?.nodeType === 1) decorateDownloads(root);
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(() => {
      scanQueued = false;
      decorateDownloads(document);
      addLoginNotice();
    });
  }

  function boot() {
    if (isConsoleRoute()) return;
    decorateDownloads(document);
    addLoginNotice();
    showUnlockedToast();

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === 1) queueScan(node);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.addEventListener('hashchange', () => queueScan(document.body));
  window.addEventListener('popstate', () => queueScan(document.body));
  window.addEventListener('storage', (event) => {
    if (event.key === SESSION_KEY) queueScan(document.body);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
