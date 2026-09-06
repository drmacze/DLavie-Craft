(() => {
  'use strict';

  let activePortal = null;
  let portalObserver = null;
  let hostObserver = null;
  let raf = 0;
  let wasProfile = false;
  let scrollIdle = 0;
  let userScrolling = false;
  let onScroll = null;
  let onTouchMove = null;

  function markScrolling() {
    userScrolling = true;
    clearTimeout(scrollIdle);
    scrollIdle = setTimeout(() => { userScrolling = false; }, 220);
  }

  function disconnectPortal() {
    portalObserver?.disconnect();
    portalObserver = null;
    if (activePortal && onScroll) activePortal.removeEventListener('scroll', onScroll);
    if (activePortal && onTouchMove) activePortal.removeEventListener('touchmove', onTouchMove);
    activePortal = null;
    onScroll = null;
    onTouchMove = null;
    wasProfile = false;
  }

  function relevantMutation(record) {
    const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
    if (!target) return true;
    return !target.closest?.('.dl-collector-card,.dl-card-holo,.dl-card-sparks,.dl-role-badge,.dl-mc-face,.dl-avatar-picker');
  }

  function bindPortal(portal) {
    if (!portal?.isConnected) return;
    if (portal === activePortal) return;

    disconnectPortal();
    activePortal = portal;

    onScroll = markScrolling;
    onTouchMove = markScrolling;
    portal.addEventListener('scroll', onScroll, { passive: true });
    portal.addEventListener('touchmove', onTouchMove, { passive: true });

    portalObserver = new MutationObserver(records => {
      if (records.some(relevantMutation)) schedule();
    });
    portalObserver.observe(portal, { childList: true, subtree: true });
  }

  function enhance() {
    const portal = document.getElementById('dl-account-portal');
    if (!portal?.isConnected) {
      if (activePortal) disconnectPortal();
      return;
    }

    bindPortal(portal);

    const isProfile = !!portal.querySelector('.dl-account-profile');
    const enteringProfile = isProfile && !wasProfile;
    const card = portal.querySelector('.dl-account-card');

    if (portal.classList.contains('dl-account-profile-fullscreen-v3') !== isProfile) {
      portal.classList.toggle('dl-account-profile-fullscreen-v3', isProfile);
    }
    if (portal.classList.contains('dl-account-profile-stable-v4') !== isProfile) {
      portal.classList.toggle('dl-account-profile-stable-v4', isProfile);
    }
    if (card && card.classList.contains('dl-account-profile-page-v3') !== isProfile) {
      card.classList.toggle('dl-account-profile-page-v3', isProfile);
    }

    if (isProfile) {
      const close = portal.querySelector('.dl-account-close');
      if (close && close.getAttribute('data-dl-no-icon') !== 'true') close.setAttribute('data-dl-no-icon', 'true');

      // Only reset once when entering Profile. Do not touch scroll position again on
      // metadata, avatar, XP or Collector Card rerenders; Safari handles it natively.
      if (enteringProfile && !userScrolling) portal.scrollTop = 0;
    }

    wasProfile = isProfile;
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      enhance();
    });
  }

  function start() {
    hostObserver?.disconnect();
    hostObserver = new MutationObserver(records => {
      const portalChanged = records.some(record => {
        const nodes = [...record.addedNodes, ...record.removedNodes];
        return nodes.some(node => node?.nodeType === 1 && (node.id === 'dl-account-portal' || node.querySelector?.('#dl-account-portal')));
      });
      if (portalChanged || !activePortal?.isConnected) schedule();
    });
    hostObserver.observe(document.body, { childList: true, subtree: true });
    schedule();
  }

  window.addEventListener('pageshow', schedule);
  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('dlavie-auth-session', () => setTimeout(schedule, 40));
  document.addEventListener('dlavie:collector-profile-changed', schedule);
  document.addEventListener('dlavie:collector-ready', schedule);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();