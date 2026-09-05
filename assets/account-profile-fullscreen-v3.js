(() => {
  'use strict';

  let observer = null;
  let raf = 0;
  let activePortal = null;
  let wasProfile = false;
  let userScrolling = false;
  let scrollIdle = 0;
  let lastScrollTop = 0;

  function portalScrollTop(portal) {
    return Math.max(0, Number(portal?.scrollTop || 0));
  }

  function markScrolling() {
    userScrolling = true;
    clearTimeout(scrollIdle);
    scrollIdle = setTimeout(() => { userScrolling = false; }, 180);
  }

  function bindPortal(portal) {
    if (!portal || portal === activePortal) return;
    if (activePortal) {
      activePortal.removeEventListener('scroll', markScrolling);
      activePortal.removeEventListener('touchmove', markScrolling);
    }
    activePortal = portal;
    lastScrollTop = portalScrollTop(portal);
    portal.addEventListener('scroll', () => {
      lastScrollTop = portalScrollTop(portal);
      markScrolling();
    }, { passive: true });
    portal.addEventListener('touchmove', markScrolling, { passive: true });
  }

  function enhance() {
    const portal = document.getElementById('dl-account-portal');
    if (!portal?.isConnected) {
      activePortal = null;
      wasProfile = false;
      return;
    }

    bindPortal(portal);

    const isProfile = !!portal.querySelector('.dl-account-profile');
    const enteringProfile = isProfile && !wasProfile;
    const before = portalScrollTop(portal);

    portal.classList.toggle('dl-account-profile-fullscreen-v3', isProfile);
    const card = portal.querySelector('.dl-account-card');
    card?.classList.toggle('dl-account-profile-page-v3', isProfile);

    if (isProfile) {
      portal.querySelector('.dl-account-close')?.setAttribute('data-dl-no-icon', 'true');

      // Reset only once when the account profile is first opened. Older code reset
      // scrollTop on every DOM mutation, which caused Safari/iOS to jump to the top
      // whenever the Collector Card, icon pass, XP, or profile metadata rerendered.
      if (enteringProfile && !userScrolling) {
        portal.scrollTop = 0;
        lastScrollTop = 0;
      } else if (!enteringProfile && before > 0) {
        // Preserve the user's position across React / Collector Card rerenders.
        requestAnimationFrame(() => {
          if (!portal.isConnected || !portal.classList.contains('dl-account-profile-fullscreen-v3')) return;
          const current = portalScrollTop(portal);
          if (!userScrolling && Math.abs(current - before) > 20) portal.scrollTop = before;
        });
      }
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
    observer?.disconnect();
    observer = new MutationObserver(records => {
      const relevant = records.some(record => {
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        if (!target) return true;
        // Ignore mutations inside animated/profile presentation layers; they should
        // never alter the profile's scroll position.
        if (target.closest?.('.dl-collector-card,.dl-community-avatar-slot-v3,.dl-canon-icon-v9,.dl-role-badge')) return false;
        return true;
      });
      if (relevant) schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
  }

  window.addEventListener('pageshow', schedule);
  window.addEventListener('popstate', schedule);
  window.addEventListener('dlavie-auth-session', () => setTimeout(schedule, 40));
  document.addEventListener('dlavie:collector-profile-changed', schedule);
  document.addEventListener('dlavie:collector-ready', schedule);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();