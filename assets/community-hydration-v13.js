(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  const INTERNAL_SELECTOR = '[data-dl-community-hydration-pulse],.dl-v10-actions,.dl-community-avatar-slot-v3,.dl-community-role-chip,.dl-community-verified';
  let page = null;
  let pageObserver = null;
  let documentObserver = null;
  let pulseRaf = 0;
  let readyTimer = 0;
  let generation = 0;

  function pulse(target = page) {
    if (!target?.isConnected || pulseRaf) return;
    pulseRaf = requestAnimationFrame(() => {
      pulseRaf = 0;
      if (!target?.isConnected) return;
      const marker = document.createElement('i');
      marker.hidden = true;
      marker.setAttribute('data-dl-community-hydration-pulse', '');
      target.append(marker);
      queueMicrotask(() => marker.remove());
      document.dispatchEvent(new CustomEvent('dlavie:community-hydrate'));
    });
  }

  function cleanLegacy(entry) {
    if (!(entry instanceof HTMLElement)) return;
    if (entry.querySelector(':scope > .dl-v10-actions')) {
      entry.classList.add('dl-v13-entry-ready');
      entry.querySelectorAll(
        ':scope > .reaction-area, :scope > .reaction-bar, :scope > .dl-v4-reactions, :scope > .dl-v9-action-row, :scope > .dl-v8-action-row, :scope > .dl-v7-actions'
      ).forEach(node => {
        node.classList.add('dl-v13-legacy');
        node.setAttribute('aria-hidden', 'true');
      });
      [...entry.children].forEach(node => {
        if (!(node instanceof HTMLElement) || node.classList.contains('dl-v10-actions')) return;
        const cls = String(node.className || '');
        if (/reaction-(add|button|bar|area)|dl-v4-react|emoji-host|reaction-host/i.test(cls)) {
          node.classList.add('dl-v13-legacy');
          node.setAttribute('aria-hidden', 'true');
        }
      });
    }
  }

  function decorate(target = page) {
    if (!target?.isConnected) return false;
    const entries = [...target.querySelectorAll('.typed-feed > .community-entry')];
    entries.forEach(cleanLegacy);

    const chatEntries = entries.filter(entry => entry.matches('.entry-chat,[data-dl-post-id]'));
    if (!chatEntries.length) return false;

    const controlsReady = chatEntries.filter(entry => entry.querySelector(':scope > .dl-v10-actions')).length;
    const identified = chatEntries.filter(entry => !entry.dataset.dlAuthorId || entry.querySelector('.dl-community-avatar-slot-v3')).length;
    const enoughControls = controlsReady >= Math.max(1, Math.ceil(chatEntries.length * .7));
    const enoughIdentity = identified >= Math.max(1, Math.ceil(chatEntries.length * .7));

    if (enoughControls && enoughIdentity) {
      target.classList.remove('dl-community-v13-hydrating');
      target.classList.add('dl-community-v13-ready');
      return true;
    }
    return false;
  }

  function isInternalChildMutation(record) {
    const changed = [...record.addedNodes, ...record.removedNodes].filter(node => node.nodeType === 1);
    if (!changed.length) return false;
    return changed.every(node => {
      const element = /** @type {Element} */ (node);
      return element.matches?.(INTERNAL_SELECTOR) || element.querySelector?.(INTERNAL_SELECTOR);
    });
  }

  function scheduleStabilization(target, token) {
    const delays = [0, 70, 160, 320, 620, 1050, 1550];
    delays.forEach(delay => setTimeout(() => {
      if (token !== generation || target !== page || !target?.isConnected) return;
      pulse(target);
      requestAnimationFrame(() => decorate(target));
    }, delay));

    clearTimeout(readyTimer);
    readyTimer = setTimeout(() => {
      if (token !== generation || target !== page || !target?.isConnected) return;
      target.classList.remove('dl-community-v13-hydrating');
      target.classList.add('dl-community-v13-ready');
      target.querySelectorAll('.typed-feed > .community-entry').forEach(cleanLegacy);
    }, 1900);
  }

  function attach(target) {
    if (!target || target === page) {
      if (target) {
        pulse(target);
        decorate(target);
      }
      return;
    }

    generation += 1;
    const token = generation;
    pageObserver?.disconnect();
    clearTimeout(readyTimer);
    page = target;
    target.classList.add('dl-community-v13-hydrating');
    target.classList.remove('dl-community-v13-ready');

    pageObserver = new MutationObserver(records => {
      if (token !== generation || target !== page) return;
      const relevant = records.some(record => {
        if (record.type === 'attributes') {
          return record.attributeName === 'data-dl-author-id' || record.attributeName === 'data-dl-post-id';
        }
        if (isInternalChildMutation(record)) return false;
        const node = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !node?.closest?.(INTERNAL_SELECTOR);
      });
      if (!relevant) return;
      pulse(target);
      requestAnimationFrame(() => decorate(target));
    });
    pageObserver.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-dl-author-id', 'data-dl-post-id']
    });

    scheduleStabilization(target, token);
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
      generation += 1;
      pageObserver?.disconnect();
      pageObserver = null;
      clearTimeout(readyTimer);
      page = null;
      return;
    }
    const found = document.querySelector(PAGE);
    if (found) return attach(found);
  }

  documentObserver = new MutationObserver(() => {
    if (!ROUTE.test(location.hash)) return;
    const found = document.querySelector(PAGE);
    if (found && found !== page) attach(found);
  });
  documentObserver.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('hashchange', route);
  window.addEventListener('pageshow', route);
  document.addEventListener('dlavie:collector-ready', () => page && scheduleStabilization(page, generation));
  document.addEventListener('dlavie:collector-profile-changed', () => page && scheduleStabilization(page, generation));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();