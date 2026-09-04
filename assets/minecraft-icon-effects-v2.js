(() => {
  'use strict';

  const LANTERN = `<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg dl-mc-lantern-svg" aria-hidden="true">
    <path class="lantern-hook p-dark" d="M9 1h6v3h2v3H7V4h2Z"/>
    <path class="lantern-cap p-main iron" d="M6 6h12v3H6Z"/>
    <path class="lantern-frame p-dark" d="M5 8h3v10H5Zm11 0h3v10h-3ZM7 18h10v3H7Z"/>
    <path class="lantern-glass" d="M8 9h8v9H8Z"/>
    <path class="lantern-core" d="M10 10h4v7h-4Z"/>
    <path class="lantern-hi" d="M10 9h2v3h-2Z"/>
  </svg>`;

  const ACTIVE_SELECTOR = [
    '.dl-mc-sweep-icon',
    '.dl-mc-icon'
  ].join(',');

  function combined(el) {
    const owner = el?.closest?.('button,a,[role="button"],.icon-button,.theme-toggle') || el?.parentElement;
    return [owner?.textContent, owner?.getAttribute?.('aria-label'), owner?.getAttribute?.('title'), owner?.className]
      .filter(Boolean).join(' ').replace(/\s+/g, ' ').toLowerCase();
  }

  function maybeLantern(icon) {
    if (!icon?.classList?.contains('dl-mc-sweep--torch')) return;
    if (!/(theme|tema|dark|light|mode|appearance|tampilan)/i.test(combined(icon))) return;
    icon.classList.remove('dl-mc-sweep--torch');
    icon.classList.add('dl-mc-sweep--lantern');
    icon.innerHTML = LANTERN;
  }

  function enhance(icon, index = 0) {
    if (!icon || icon.dataset.dlIconFxV2 === 'true') return;
    maybeLantern(icon);
    icon.dataset.dlIconFxV2 = 'true';
    const seed = (index * 173 + 97) % 1600;
    icon.style.setProperty('--dl-icon-phase', `${-seed}ms`);
    icon.style.setProperty('--dl-icon-sway', `${((index % 5) - 2) * 0.35}deg`);
  }

  function scan(root = document) {
    const list = [];
    if (root.matches?.(ACTIVE_SELECTOR)) list.push(root);
    root.querySelectorAll?.(ACTIVE_SELECTOR).forEach((el) => list.push(el));
    list.forEach(enhance);
  }

  function burstFromEvent(event) {
    const icon = event.target?.closest?.('button,a,[role="button"],.icon-button,.theme-toggle')?.querySelector?.(ACTIVE_SELECTOR);
    if (!icon) return;
    icon.classList.remove('dl-mc-fx-burst');
    // Reflow is limited to one tiny icon and gives repeatable tap feedback.
    void icon.offsetWidth;
    icon.classList.add('dl-mc-fx-burst');
    setTimeout(() => icon.classList.remove('dl-mc-fx-burst'), 720);
  }

  let queued = false;
  function queue(root) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      scan(root || document);
    });
  }

  function boot() {
    scan(document);
    document.addEventListener('pointerdown', burstFromEvent, { passive: true });
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === 1) queue(node);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
