(() => {
  'use strict';

  const CUSTOM = '.dl-mc-sweep-icon,.dl-mc-forge-icon,.dl-mc-icon';
  const HOSTS = [
    'button', 'a', '[role="button"]',
    '.forum-nav-icon', '.active-forum-icon', '.forum-symbol',
    '.project-glyph', '.discussion-icon', '.news-icon', '.ticket-marker',
    '.announcement-icon', '.community-avatar'
  ].join(',');
  const EXCLUDE = '.reaction-add,.reaction-button,.emoji-grid button,.emoji-groups button,.dl-emoji-quick-button,.emoji-close,[data-dl-no-icon]';

  function ownerHost(node) {
    return node?.closest?.('button,a,[role="button"],.forum-nav-icon,.active-forum-icon,.forum-symbol,.project-glyph,.discussion-icon,.news-icon,.ticket-marker,.announcement-icon') || null;
  }

  function score(icon) {
    if (icon.classList.contains('dl-mc-sweep-icon')) return 3;
    if (icon.classList.contains('dl-mc-forge-icon')) return 2;
    return 1;
  }

  function cleanHost(host) {
    if (!host || host.matches?.(EXCLUDE) || host.closest?.('.emoji-popover')) return;

    const custom = Array.from(host.querySelectorAll(CUSTOM)).filter(icon => {
      const interactive = icon.closest('button,a,[role="button"]');
      const hostInteractive = host.matches('button,a,[role="button"]') ? host : host.closest('button,a,[role="button"]');
      return !interactive || interactive === hostInteractive;
    });
    if (!custom.length) return;

    // Keep exactly one Minecraft icon for each control. Older icon passes can
    // occasionally leave a sweep + forge icon in the same mobile control.
    const keep = custom.slice().sort((a, b) => score(b) - score(a))[0];
    custom.forEach(icon => {
      if (icon !== keep) icon.remove();
    });

    Array.from(host.querySelectorAll('svg')).forEach(svg => {
      if (svg.closest(CUSTOM)) return;
      if (svg.closest('.brand,.auth-brand,.dl-account-logo,.dl-account-brand')) return;
      const svgHost = ownerHost(svg);
      const expected = host.matches('button,a,[role="button"]') ? host : host;
      if (svgHost && svgHost !== expected && !host.contains(svgHost)) return;
      svg.classList.add('dl-native-icon-hidden');
      svg.setAttribute('aria-hidden', 'true');
    });

    host.classList.add('dl-icon-deduped-v4');
  }

  function scan(root = document) {
    if (!root?.querySelectorAll) return;
    if (root.matches?.(HOSTS)) cleanHost(root);
    root.querySelectorAll(HOSTS).forEach(cleanHost);
  }

  let raf = 0;
  const roots = new Set();
  function queue(root) {
    if (root?.nodeType === 1) roots.add(root);
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const batch = roots.size ? [...roots] : [document];
      roots.clear();
      batch.forEach(scan);
    });
  }

  function boot() {
    scan(document);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === 1 && !node.closest?.('.dl-community-v3-sheet')) queue(node);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.addEventListener('hashchange', () => queue(document.body));
  window.addEventListener('popstate', () => queue(document.body));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();