(() => {
  'use strict';

  const CARD = '.dl-collector-card';
  let observer = null;
  let raf = 0;

  function levelOf(card) {
    const values = [
      card?.dataset?.evolutionLevel,
      card?.dataset?.level,
      card?.getAttribute?.('data-evolution-level'),
      card?.getAttribute?.('data-level')
    ];
    for (const value of values) {
      const n = Number.parseInt(value, 10);
      if (Number.isFinite(n) && n > 0) return Math.min(100, n);
    }
    const match = String(card?.textContent || '').match(/\b(?:LV|LEVEL)\s*([0-9]{1,3})\b/i);
    return match ? Math.min(100, Math.max(1, Number.parseInt(match[1], 10) || 1)) : 1;
  }

  function tierOf(level) {
    if (level >= 100) return 'apex';
    if (level >= 85) return 'mythic';
    if (level >= 60) return 'legendary';
    if (level >= 40) return 'holo';
    if (level >= 15) return 'epic';
    if (level >= 5) return 'rare';
    return 'common';
  }

  function effectMarkup() {
    return '<span class="dl-premium-level-fx" aria-hidden="true"><i class="dl-premium-fx-aura"></i><i class="dl-premium-fx-spectrum"></i><i class="dl-premium-fx-sheen"></i><i class="dl-premium-fx-frame"></i><b class="dl-premium-fx-particle p1"></b><b class="dl-premium-fx-particle p2"></b><b class="dl-premium-fx-particle p3"></b><b class="dl-premium-fx-particle p4"></b><b class="dl-premium-fx-particle p5"></b><b class="dl-premium-fx-particle p6"></b></span>';
  }

  function decorate(card) {
    if (!(card instanceof HTMLElement) || !card.isConnected) return;
    const level = levelOf(card);
    const tier = tierOf(level);
    card.dataset.dlPremiumTier = tier;
    card.dataset.dlPremiumLevel = String(level);
    card.style.setProperty('--dl-premium-level', String(level));
    card.style.setProperty('--dl-premium-factor', (0.18 + level * 0.0062).toFixed(3));
    card.style.setProperty('--dl-premium-speed', `${Math.max(4.8, 10.2 - level * 0.045).toFixed(2)}s`);

    const inner = card.querySelector('.dl-collector-card-inner');
    if (inner && !inner.querySelector(':scope > .dl-premium-level-fx')) {
      inner.insertAdjacentHTML('beforeend', effectMarkup());
    }
  }

  function removeDuplicateInfo(root = document) {
    root.querySelectorAll?.('#dl-collector-profile .dl-profile-identity-grid').forEach(grid => grid.remove());
  }

  function run() {
    raf = 0;
    removeDuplicateInfo(document);
    document.querySelectorAll(CARD).forEach(decorate);
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(run);
  }

  function start() {
    observer?.disconnect();
    observer = new MutationObserver(records => {
      const relevant = records.some(record => {
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        if (!target) return true;
        if (target.closest?.('.dl-premium-level-fx')) return false;
        return true;
      });
      if (relevant) schedule();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-level', 'data-evolution-level', 'class']
    });
    schedule();
  }

  ['pageshow', 'hashchange', 'popstate'].forEach(name => window.addEventListener(name, schedule));
  ['dlavie:collector-ready', 'dlavie:collector-profile-changed', 'dlavie:card-skin-changed'].forEach(name => document.addEventListener(name, schedule));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();