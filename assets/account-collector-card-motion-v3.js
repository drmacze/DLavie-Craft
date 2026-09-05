(() => {
  'use strict';

  const CARD = '.dl-collector-card';
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let observer = null;
  let mutation = null;
  const bound = new WeakSet();

  function setVisible(card, visible) {
    card.classList.toggle('is-card-visible', visible);
  }

  function bind(card) {
    if (!(card instanceof HTMLElement) || bound.has(card)) return;
    bound.add(card);

    if (finePointer.matches && !reduceMotion.matches) {
      let raf = 0;
      let latest = null;

      const apply = () => {
        raf = 0;
        if (!latest || !card.isConnected) return;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const px = Math.max(0, Math.min(1, (latest.clientX - rect.left) / rect.width));
        const py = Math.max(0, Math.min(1, (latest.clientY - rect.top) / rect.height));
        const ry = (px - .5) * 8;
        const rx = (.5 - py) * 7;
        card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        card.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        card.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      };

      card.addEventListener('pointerenter', event => {
        card.classList.add('is-card-hovered');
        latest = event;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });

      card.addEventListener('pointermove', event => {
        latest = event;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });

      card.addEventListener('pointerleave', () => {
        latest = null;
        card.classList.remove('is-card-hovered');
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '38%');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      }, { passive: true });
    }

    observer?.observe(card);
  }

  function scan(root = document) {
    if (!root?.querySelectorAll) return;
    if (root.matches?.(CARD)) bind(root);
    root.querySelectorAll(CARD).forEach(bind);
  }

  function boot() {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) setVisible(entry.target, entry.isIntersecting && entry.intersectionRatio > .08);
    }, { root: null, threshold: [0, .08, .35] });

    scan(document);

    mutation = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === 1) scan(node);
        }
      }
    });
    mutation.observe(document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener('dlavie:collector-profile-changed', () => setTimeout(() => scan(document), 40));
  document.addEventListener('dlavie:collector-ready', () => setTimeout(() => scan(document), 40));
  window.addEventListener('pageshow', () => setTimeout(() => scan(document), 60));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();