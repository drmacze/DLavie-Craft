(() => {
  'use strict';

  const MASTER = '.dl-master-icon';
  const OLD = '.dl-mc-icon,.dl-mc-sweep-icon,.dl-mc-forge-icon';
  const CONTROL_SELECTORS = [
    '.main-nav a', '.header-actions button', '.header-actions a', '.site-header button',
    '.site-footer button', '.site-footer a', '.dl-shell-account', '.dl-shell-legal-links button',
    '.dl-account-tabs button', '.dl-account-btn', '.dl-account-link', '.dl-account-row button',
    '.community-toolbar button', '.forum-sidebar nav button', '.forum-tabs button',
    '.community-page button:not(.dl-v10-chip):not(.dl-v10-add):not(.dl-v10-reply):not(.dl-v10-vote):not(.dl-v10-emoji)',
    '.console-sidebar nav button', '.console-app button', '.download-card button', '.download-card a',
    '.project-card button', '.project-card a', '.news-card button', '.news-card a'
  ].join(',');

  function directMaster(host) {
    return [...host.children].find(child => child.matches?.(MASTER)) || null;
  }

  function cleanControl(host) {
    if (!host?.isConnected) return;
    const master = directMaster(host);
    if (!master) return;

    // A master-iconized control owns exactly one icon. Remove older icon passes
    // from all descendants, not only direct children. This fixes mobile controls
    // that previously rendered e.g. cube + chat or cube + account together.
    host.querySelectorAll(OLD).forEach(node => node.remove());
    host.querySelectorAll(MASTER).forEach(node => {
      if (node !== master) node.remove();
    });

    host.querySelectorAll(':scope > svg').forEach(svg => {
      if (!master.contains(svg)) {
        svg.style.setProperty('display', 'none', 'important');
        svg.setAttribute('aria-hidden', 'true');
      }
    });

    // Legacy visual icon wrappers are redundant when the button already owns a
    // canonical master icon. Keep their text/count siblings intact.
    [...host.children].forEach(child => {
      if (child === master || !(child instanceof HTMLElement)) return;
      if (child.matches('.forum-nav-icon,.active-forum-icon,.forum-symbol,.discussion-icon,.news-icon,.announcement-icon,.project-glyph,.ticket-marker')) {
        child.style.setProperty('display', 'none', 'important');
        child.setAttribute('aria-hidden', 'true');
      }
    });

    host.classList.add('dl-icon-clean-v6');
  }

  function cleanSectionIcons(root) {
    root.querySelectorAll?.('.forum-nav-icon,.active-forum-icon,.forum-symbol,.discussion-icon,.news-icon,.announcement-icon,.project-glyph,.ticket-marker').forEach(host => {
      if (host.parentElement?.classList?.contains('dl-master-iconized')) return;
      const masters = [...host.querySelectorAll(MASTER)];
      const olds = [...host.querySelectorAll(OLD)];
      if (masters.length) {
        masters.slice(1).forEach(node => node.remove());
        olds.forEach(node => node.remove());
      }
    });
  }

  function installReactionIcon(root) {
    root.querySelectorAll?.('.dl-v10-add').forEach(button => {
      if (button.querySelector('.dl-react-crystal-v6')) return;
      button.replaceChildren();
      const icon = document.createElement('span');
      icon.className = 'dl-react-crystal-v6';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<i class="core"></i><i class="facet f1"></i><i class="facet f2"></i><i class="spark s1"></i><i class="spark s2"></i><i class="plus p1"></i><i class="plus p2"></i>';
      button.append(icon);
      button.setAttribute('aria-label', 'Tambah reaction');
      button.dataset.dlNoIcon = 'true';
    });
  }

  function scan(root = document) {
    if (!root?.querySelectorAll) return;
    if (root.matches?.(CONTROL_SELECTORS)) cleanControl(root);
    root.querySelectorAll(CONTROL_SELECTORS).forEach(cleanControl);
    cleanSectionIcons(root);
    installReactionIcon(root);
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
    document.documentElement.classList.add('dl-icon-cleanup-v6');
    scan(document);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.closest?.('.dl-react-crystal-v6,.dl-v10-picker')) continue;
          queue(node);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.addEventListener('hashchange', () => setTimeout(() => queue(document.body), 80));
  window.addEventListener('pageshow', () => setTimeout(() => queue(document.body), 80));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();