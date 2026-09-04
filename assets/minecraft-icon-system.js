(() => {
  'use strict';

  const ICONS = {
    grass: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-top" d="M12 2 21 7 12 12 3 7Z"/><path class="dl-mci-left" d="M3 7 12 12v10L3 17Z"/><path class="dl-mci-right" d="M21 7 12 12v10l9-5Z"/><path class="dl-mci-hi" d="M6 7l6-3.3L18 7l-6 3.3Z"/></svg>`,
    chest: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-shadow" d="M3 8h18v12H3Z"/><path class="dl-mci-main" d="M4 5h16v6H4Z"/><path class="dl-mci-mid" d="M4 12h16v7H4Z"/><path class="dl-mci-dark" d="M3 10h18v3H3Z"/><path class="dl-mci-hi" d="M10 10h4v5h-4Z"/><path class="dl-mci-dark" d="M11 11h2v2h-2Z"/></svg>`,
    download: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-shadow" d="M3 10h18v10H3Z"/><path class="dl-mci-main" d="M4 7h16v5H4Z"/><path class="dl-mci-dark" d="M3 11h18v3H3Z"/><path class="dl-mci-hi" d="M10 11h4v4h-4Z"/><path class="dl-mci-accent" d="M11 2h2v5h3l-4 4-4-4h3Z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-main" d="M3 4h18v13H9l-5 4v-4H3Z"/><path class="dl-mci-dark" d="M6 8h2v2H6Zm5 0h2v2h-2Zm5 0h2v2h-2Z"/><path class="dl-mci-accent" d="m17 13 2 1 2-1-2 4Z"/></svg>`,
    book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-left" d="M3 4h8c2 0 3 1 3 3v13c-1-2-3-3-5-3H3Z"/><path class="dl-mci-right" d="M21 4h-8c-2 0-3 1-3 3v13c1-2 3-3 5-3h6Z"/><path class="dl-mci-hi" d="M5 7h5v2H5Zm0 4h4v2H5Zm9-4h5v2h-5Zm1 4h4v2h-4Z"/></svg>`,
    player: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-main" d="M5 3h14v13H5Z"/><path class="dl-mci-dark" d="M8 8h2v2H8Zm6 0h2v2h-2ZM9 13h6v2H9Z"/><path class="dl-mci-mid" d="M3 17h18v5H3Z"/><path class="dl-mci-hi" d="M7 4h8v2H7Z"/></svg>`,
    door: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-shadow" d="M5 2h14v20H5Z"/><path class="dl-mci-main" d="M7 4h9v16H7Z"/><path class="dl-mci-mid" d="M9 6h5v5H9Z"/><path class="dl-mci-dark" d="M13 13h2v2h-2Z"/><path class="dl-mci-hi" d="M7 4h2v16H7Z"/></svg>`,
    craft: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-shadow" d="M3 3h18v18H3Z"/><path class="dl-mci-main" d="M5 5h14v14H5Z"/><path class="dl-mci-dark" d="M10 5h2v14h-2Zm5 0h2v14h-2ZM5 10h14v2H5Zm0 5h14v2H5Z"/><path class="dl-mci-hi" d="M6 6h3v3H6Z"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-main" d="M3 5h18v14H3Z"/><path class="dl-mci-hi" d="m4 7 8 6 8-6v3l-8 6-8-6Z"/><path class="dl-mci-dark" d="m3 18 6-6 2 2-5 5H3Zm18 0-6-6-2 2 5 5h3Z"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-mid" d="M7 9V6c0-4 10-4 10 0v3h-3V6c0-2-4-2-4 0v3Z"/><path class="dl-mci-main" d="M5 9h14v12H5Z"/><path class="dl-mci-dark" d="M11 13h2v4h-2Z"/><path class="dl-mci-hi" d="M7 11h2v7H7Z"/></svg>`,
    tag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-main" d="M3 8 9 2h8l4 4-11 11Z"/><path class="dl-mci-shadow" d="m10 17 3 3-4 2-7-7 2-4Z"/><path class="dl-mci-hi" d="M14 5h3v3h-3Z"/></svg>`,
    key: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-main" d="M4 5h8v8H9v3H7v3H3v-5l4-4V8H4Z"/><path class="dl-mci-hi" d="M7 7h3v3H7Z"/><path class="dl-mci-dark" d="M12 8h9v3h-3v3h-3v-3h-3Z"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-shadow" d="M4 3h16v11c0 4-4 7-8 8-4-1-8-4-8-8Z"/><path class="dl-mci-main" d="M6 5h12v9c0 3-3 5-6 6-3-1-6-3-6-6Z"/><path class="dl-mci-hi" d="M8 7h3v9H8Z"/><path class="dl-mci-accent" d="m11 13 2 2 4-5 2 2-6 6-4-4Z"/></svg>`,
    sword: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-hi" d="M15 2h6v6L10 19l-4-4Z"/><path class="dl-mci-main" d="m7 13 4 4-2 2-4-4Z"/><path class="dl-mci-dark" d="M3 15h8v3H3Zm5 3h3v4H8Z"/></svg>`,
    emerald: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-shadow" d="m12 2 8 6-3 11H7L4 8Z"/><path class="dl-mci-main" d="m12 4 6 5-2 8H8L6 9Z"/><path class="dl-mci-hi" d="m12 6 3 3-2 5H9l-1-4Z"/></svg>`,
    anvil: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-main" d="M3 4h18v5h-5l-2 3v3h4v3H6v-3h4v-3L8 9H3Z"/><path class="dl-mci-dark" d="M8 18h8v3H8Z"/><path class="dl-mci-hi" d="M5 5h9v2H5Z"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-main" d="M11 4v5h10v6H11v5L3 12Z"/><path class="dl-mci-hi" d="M11 10h8v2h-8Z"/></svg>`,
    search: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-main" d="M4 3h11v3h3v11h-3v3H4v-3H1V6h3Zm2 3v11h7v-2h2V8h-2V6Z"/><path class="dl-mci-dark" d="m16 16 6 6-3 2-6-6Z"/></svg>`,
    hopper: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="dl-mci-main" d="M2 4h20v5l-7 6v5h-6v-5L2 9Z"/><path class="dl-mci-dark" d="M5 6h14v3l-6 5h-2L5 9Z"/><path class="dl-mci-hi" d="M4 5h8v2H4Z"/></svg>`
  };

  const text = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function iconNode(name, extra = '') {
    if (!ICONS[name]) return null;
    const span = document.createElement('span');
    span.className = `dl-mc-icon dl-mc-icon--${name}${extra ? ` ${extra}` : ''}`;
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = ICONS[name];
    return span;
  }

  function prependIcon(el, name, extra = '') {
    if (!el || !ICONS[name]) return;
    const existing = Array.from(el.children || []).find((n) => n.classList?.contains('dl-mc-icon'));
    if (existing) {
      existing.className = `dl-mc-icon dl-mc-icon--${name}${extra ? ` ${extra}` : ''}`;
      existing.innerHTML = ICONS[name];
      return;
    }
    const node = iconNode(name, extra);
    if (!node) return;
    el.prepend(node);
    el.classList.add('dl-mc-iconized');
  }

  function titleIconName(value) {
    if (/masuk ke dlavie|masuk sekarang/.test(value)) return 'door';
    if (/gabung|buat akun|daftar/.test(value)) return 'craft';
    if (/lupa|pemulihan|pulihkan/.test(value)) return 'key';
    if (/sebelum melanjutkan|persetujuan/.test(value)) return 'shield';
    if (/akun kamu|halo/.test(value)) return 'player';
    if (/privasi/.test(value)) return 'shield';
    if (/peraturan|rules/.test(value)) return 'sword';
    if (/syarat|ketentuan|dokumen/.test(value)) return 'book';
    return null;
  }

  function buttonIconName(value, el) {
    if (el?.dataset?.legal === 'terms' || el?.dataset?.dlShellLegal === 'terms') return 'book';
    if (el?.dataset?.legal === 'privacy' || el?.dataset?.dlShellLegal === 'privacy') return 'shield';
    if (el?.dataset?.legal === 'rules' || el?.dataset?.dlShellLegal === 'rules') return 'sword';
    if (/download|unduh/.test(value) || el?.hasAttribute?.('download')) return 'download';
    if (/buat akun|daftar|gabung/.test(value)) return 'craft';
    if (/masuk/.test(value)) return 'door';
    if (/keluar/.test(value)) return 'door';
    if (/kirim instruksi/.test(value)) return 'mail';
    if (/password baru|simpan password|pulihkan/.test(value)) return 'anvil';
    if (/setuju/.test(value)) return 'emerald';
    if (/kembali/.test(value)) return 'arrow';
    if (/lupa password/.test(value)) return 'key';
    return null;
  }

  function decorateNav(root) {
    root.querySelectorAll?.('.main-nav a').forEach((el) => {
      const v = text(el);
      let name = null;
      if (/beranda|home/.test(v)) name = 'grass';
      else if (/project|proyek|download/.test(v)) name = 'chest';
      else if (/komunitas|community/.test(v)) name = 'chat';
      else if (/berita|news/.test(v)) name = 'book';
      if (name) prependIcon(el, name, 'dl-mc-icon-nav');
    });

    root.querySelectorAll?.('.dl-shell-account').forEach((el) => prependIcon(el, 'player', 'dl-mc-icon-nav'));
  }

  function decorateAccount(root) {
    root.querySelectorAll?.('.dl-account-card h2, .dl-account-legal-page h2, .dl-legal-sheet-head h2').forEach((el) => {
      const name = titleIconName(text(el));
      if (name) prependIcon(el, name, 'dl-mc-icon-title');
    });

    root.querySelectorAll?.('.dl-account-tabs button').forEach((el) => {
      const v = text(el);
      prependIcon(el, /daftar/.test(v) ? 'craft' : 'door', 'dl-mc-icon-tab');
    });

    root.querySelectorAll?.('.dl-account-field').forEach((label) => {
      const input = label.querySelector('input');
      if (!input || label.querySelector(':scope > .dl-mc-field-icon')) return;
      const v = text(label);
      let name = 'tag';
      if (/email/.test(v)) name = 'mail';
      else if (/password/.test(v)) name = 'lock';
      else if (/nama/.test(v)) name = 'tag';
      const node = iconNode(name, 'dl-mc-field-icon');
      if (node) input.before(node);
      label.classList.add('dl-mc-field-iconized');
    });

    root.querySelectorAll?.('.dl-account-btn, .dl-account-link[data-forgot], .dl-account-row > .dl-account-link, .dl-shell-legal-links button').forEach((el) => {
      const name = buttonIconName(text(el), el);
      if (name) prependIcon(el, name, 'dl-mc-icon-action');
    });

    root.querySelectorAll?.('[data-legal]').forEach((el) => {
      if (el.closest('.dl-account-check')) return;
      const name = buttonIconName(text(el), el);
      if (name) prependIcon(el, name, 'dl-mc-icon-action');
    });
  }

  function decorateDownload(root) {
    root.querySelectorAll?.('[data-dl-download-locked="true"], a[download], .button, a, button').forEach((el) => {
      const v = text(el);
      const href = el.tagName === 'A' ? (el.getAttribute('href') || '') : '';
      const isFile = /\.(?:mcpack|mcaddon|mcworld|mctemplate|zip)(?:$|[?#])/i.test(href);
      if (!isFile && !/\b(download|unduh)\b/i.test(v) && !el.hasAttribute?.('download') && el.dataset.dlDownloadLocked !== 'true') return;
      prependIcon(el, 'download', 'dl-mc-icon-download');
      const icon = Array.from(el.children || []).find((n) => n.classList?.contains('dl-mc-icon'));
      if (icon) icon.classList.toggle('is-locked', el.dataset.dlDownloadLocked === 'true');
    });

    root.querySelectorAll?.('.dl-download-login-notice .dl-download-lock').forEach((el) => {
      el.textContent = '';
      prependIcon(el, 'chest', 'dl-mc-icon-notice');
      el.classList.add('is-locked');
    });

    root.querySelectorAll?.('.dl-download-unlocked-toast > span:first-child').forEach((el) => {
      el.textContent = '';
      prependIcon(el, 'emerald', 'dl-mc-icon-notice');
    });
  }

  function decorateUtility(root) {
    root.querySelectorAll?.('.search-field').forEach((el) => {
      if (!el.querySelector('.dl-mc-icon')) prependIcon(el, 'search', 'dl-mc-icon-utility');
    });
    root.querySelectorAll?.('.filter-pills').forEach((el) => {
      if (!el.querySelector('.dl-mc-filter-mark')) {
        const node = iconNode('hopper', 'dl-mc-icon-utility dl-mc-filter-mark');
        if (node) el.prepend(node);
      }
    });
  }

  function decorate(root = document) {
    if (!root?.querySelectorAll) return;
    decorateNav(root);
    decorateAccount(root);
    decorateDownload(root);
    decorateUtility(root);
  }

  let queued = false;
  const pendingRoots = new Set();
  function queue(root) {
    if (root?.nodeType === 1 || root === document) pendingRoots.add(root);
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const roots = [...pendingRoots];
      pendingRoots.clear();
      roots.forEach((node) => decorate(node));
    });
  }

  function boot() {
    decorate(document);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes') {
          queue(record.target);
          continue;
        }
        for (const node of record.addedNodes) if (node.nodeType === 1) queue(node);
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-dl-download-locked']
    });
  }

  window.addEventListener('hashchange', () => queue(document));
  window.addEventListener('popstate', () => queue(document));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
