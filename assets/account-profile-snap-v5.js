(() => {
  'use strict';

  const PORTAL_ID = 'dl-account-portal';
  const SNAP_ATTR = 'data-dl-profile-snap-v5';
  const ACTIVE_CLASS = 'dl-account-profile-snap-v5';
  const IGNORE_SELECTOR = [
    'input','textarea','select','button','a','[contenteditable="true"]','[role="dialog"]',
    '.dl-avatar-picker','.dl-legal-sheet','.dl-identity-onboarding','.dl-account-close'
  ].join(',');

  let portal = null;
  let portalObserver = null;
  let rootObserver = null;
  let raf = 0;
  let locked = false;
  let unlockTimer = 0;
  let touch = null;

  const profileOpen = node => !!node?.querySelector('.dl-account-profile');
  const pageFor = node => node?.querySelector('.dl-account-profile-page-v3, .dl-account-card');

  function shouldIgnore(target) {
    return target instanceof Element && !!target.closest(IGNORE_SELECTOR);
  }

  function snapTop(el) {
    if (!portal || !el?.isConnected) return 0;
    const portalRect = portal.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const raw = portal.scrollTop + rect.top - portalRect.top;
    const max = Math.max(0, portal.scrollHeight - portal.clientHeight);
    return Math.max(0, Math.min(max, raw));
  }

  function collectStops() {
    if (!portal?.isConnected) return [];
    const nodes = [...portal.querySelectorAll(`[${SNAP_ATTR}]`)];
    const max = Math.max(0, portal.scrollHeight - portal.clientHeight);
    const values = nodes
      .map(node => ({ node, top: snapTop(node) }))
      .sort((a, b) => a.top - b.top);

    const filtered = [];
    const minGap = Math.max(110, portal.clientHeight * 0.18);
    for (const item of values) {
      const prev = filtered[filtered.length - 1];
      if (!prev || Math.abs(item.top - prev.top) >= minGap) filtered.push(item);
    }

    if (!filtered.length || filtered[0].top > 32) {
      const start = portal.querySelector('.dl-profile-snap-start-v5');
      if (start) filtered.unshift({ node: start, top: 0 });
    } else {
      filtered[0].top = 0;
    }

    const last = filtered[filtered.length - 1];
    if (max > 0 && (!last || max - last.top > minGap)) {
      const end = portal.querySelector('.dl-profile-snap-end-v5');
      if (end) filtered.push({ node: end, top: max });
    }

    return filtered;
  }

  function scrollToStop(top) {
    if (!portal?.isConnected) return;
    clearTimeout(unlockTimer);
    locked = true;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    portal.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    unlockTimer = setTimeout(() => { locked = false; }, reduce ? 120 : 620);
  }

  function step(direction) {
    if (!portal?.isConnected || locked) return;
    const stops = collectStops();
    if (!stops.length) return;

    const current = portal.scrollTop;
    const tolerance = Math.max(34, portal.clientHeight * 0.045);
    let target = null;

    if (direction > 0) {
      target = stops.find(item => item.top > current + tolerance) || stops[stops.length - 1];
    } else {
      for (let i = stops.length - 1; i >= 0; i -= 1) {
        if (stops[i].top < current - tolerance) { target = stops[i]; break; }
      }
      target ||= stops[0];
    }

    scrollToStop(target.top);
  }

  function onWheel(event) {
    if (!portal?.classList.contains(ACTIVE_CLASS) || shouldIgnore(event.target)) return;
    if (Math.abs(event.deltaY) < 10 || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    if (!locked) step(event.deltaY > 0 ? 1 : -1);
  }

  function onTouchStart(event) {
    if (!portal?.classList.contains(ACTIVE_CLASS) || event.touches.length !== 1 || shouldIgnore(event.target)) {
      touch = null;
      return;
    }
    const point = event.touches[0];
    touch = { x: point.clientX, y: point.clientY, at: performance.now(), target: event.target, vertical: false };
  }

  function onTouchMove(event) {
    if (!touch || event.touches.length !== 1 || shouldIgnore(touch.target)) return;
    const point = event.touches[0];
    const dx = point.clientX - touch.x;
    const dy = point.clientY - touch.y;
    if (!touch.vertical && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      touch.vertical = Math.abs(dy) > Math.abs(dx) * 1.05;
    }
    if (touch.vertical) event.preventDefault();
  }

  function onTouchEnd(event) {
    if (!touch) return;
    const point = event.changedTouches?.[0];
    const state = touch;
    touch = null;
    if (!point || !state.vertical || shouldIgnore(state.target)) return;

    const dy = point.clientY - state.y;
    const elapsed = performance.now() - state.at;
    const threshold = Math.max(42, Math.min(76, portal.clientHeight * 0.07));
    if (Math.abs(dy) >= threshold && elapsed < 1200) step(dy < 0 ? 1 : -1);
    else {
      const stops = collectStops();
      if (!stops.length) return;
      const current = portal.scrollTop;
      const nearest = stops.reduce((best, item) => Math.abs(item.top - current) < Math.abs(best.top - current) ? item : best, stops[0]);
      scrollToStop(nearest.top);
    }
  }

  function onKeyDown(event) {
    if (!portal?.classList.contains(ACTIVE_CLASS) || shouldIgnore(event.target)) return;
    const down = ['ArrowDown','PageDown',' '].includes(event.key);
    const up = ['ArrowUp','PageUp'].includes(event.key);
    if (!down && !up) return;
    event.preventDefault();
    step(down ? 1 : -1);
  }

  function markStops() {
    if (!portal?.isConnected || !profileOpen(portal)) return;
    const page = pageFor(portal);
    if (!page) return;

    let start = page.querySelector(':scope > .dl-profile-snap-start-v5');
    if (!start) {
      start = document.createElement('i');
      start.className = 'dl-profile-snap-start-v5';
      start.setAttribute('aria-hidden', 'true');
      page.prepend(start);
    }
    start.setAttribute(SNAP_ATTR, 'start');

    portal.querySelectorAll(`[${SNAP_ATTR}]`).forEach(node => {
      if (!node.classList.contains('dl-profile-snap-start-v5') && !node.classList.contains('dl-profile-snap-end-v5')) {
        node.removeAttribute(SNAP_ATTR);
      }
    });

    const candidates = [
      page.querySelector('.dl-account-profile'),
      page.querySelector('#dl-collector-profile .dl-profile-card-wrap'),
      page.querySelector('#dl-collector-profile .dl-profile-identity-grid'),
      page.querySelector('.dl-avatar-editor'),
      page.querySelector('.dl-account-row')
    ].filter(Boolean);

    candidates.forEach((node, index) => node.setAttribute(SNAP_ATTR, String(index + 1)));

    let end = page.querySelector(':scope > .dl-profile-snap-end-v5');
    if (!end) {
      end = document.createElement('i');
      end.className = 'dl-profile-snap-end-v5';
      end.setAttribute('aria-hidden', 'true');
      page.append(end);
    }
    end.setAttribute(SNAP_ATTR, 'end');
  }

  function apply() {
    const next = document.getElementById(PORTAL_ID);
    if (!next?.isConnected) {
      detachPortal();
      return;
    }
    if (next !== portal) attachPortal(next);

    const active = profileOpen(portal);
    portal.classList.toggle(ACTIVE_CLASS, active);
    if (active) markStops();
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      apply();
    });
  }

  function detachPortal() {
    portalObserver?.disconnect();
    portalObserver = null;
    if (portal) {
      portal.removeEventListener('wheel', onWheel);
      portal.removeEventListener('touchstart', onTouchStart);
      portal.removeEventListener('touchmove', onTouchMove);
      portal.removeEventListener('touchend', onTouchEnd);
      portal.removeEventListener('keydown', onKeyDown);
      portal.classList.remove(ACTIVE_CLASS);
    }
    portal = null;
    touch = null;
    locked = false;
    clearTimeout(unlockTimer);
  }

  function attachPortal(next) {
    detachPortal();
    portal = next;
    portal.addEventListener('wheel', onWheel, { passive: false });
    portal.addEventListener('touchstart', onTouchStart, { passive: true });
    portal.addEventListener('touchmove', onTouchMove, { passive: false });
    portal.addEventListener('touchend', onTouchEnd, { passive: true });
    portal.addEventListener('keydown', onKeyDown);

    portalObserver = new MutationObserver(records => {
      const meaningful = records.some(record => {
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !target?.closest?.('.dl-collector-card,.dl-card-holo,.dl-card-sparks,.dl-mc-face');
      });
      if (meaningful) schedule();
    });
    portalObserver.observe(portal, { childList: true, subtree: true });
  }

  function start() {
    rootObserver?.disconnect();
    rootObserver = new MutationObserver(() => schedule());
    rootObserver.observe(document.body, { childList: true, subtree: true });
    schedule();
  }

  window.addEventListener('pageshow', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  window.addEventListener('dlavie-auth-session', () => setTimeout(schedule, 50));
  document.addEventListener('dlavie:collector-profile-changed', schedule);
  document.addEventListener('dlavie:collector-ready', schedule);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();