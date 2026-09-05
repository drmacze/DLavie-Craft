(() => {
  'use strict';

  const PAGE_SELECTOR = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  let page = null;
  let observer = null;
  let rememberedScrollY = null;
  let restoreRaf = 0;

  function isMobile() {
    return window.matchMedia('(max-width: 1050px)').matches;
  }

  function rememberScroll() {
    rememberedScrollY = window.scrollY;
  }

  function restoreScrollSoon() {
    if (rememberedScrollY == null || restoreRaf) return;
    const targetY = rememberedScrollY;
    restoreRaf = requestAnimationFrame(() => {
      restoreRaf = 0;
      requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - targetY) > 2) window.scrollTo(0, targetY);
        rememberedScrollY = null;
      });
    });
  }

  function syncState() {
    if (!page?.isConnected) return;
    const infoOpen = page.classList.contains('dl-community-info-open');
    document.body.classList.toggle('dl-community-info-body-open', infoOpen && isMobile());

    const rail = page.querySelector('.community-profile-rail');
    if (rail) {
      rail.setAttribute('aria-hidden', infoOpen ? 'false' : 'true');
      if (infoOpen) rail.setAttribute('role', 'dialog');
      else rail.removeAttribute('role');
      if (infoOpen) rail.setAttribute('aria-modal', isMobile() ? 'true' : 'false');
      else rail.removeAttribute('aria-modal');
    }

    const focusOn = page.classList.contains('dl-community-focus');
    page.dataset.dlCompactState = focusOn ? 'on' : 'off';
    restoreScrollSoon();
  }

  function bindToolbar() {
    const toolbar = page?.querySelector('#dl-community-toolbar');
    if (!toolbar || toolbar.dataset.dlV25Bound === '1') return;
    toolbar.dataset.dlV25Bound = '1';

    toolbar.addEventListener('pointerdown', event => {
      const button = event.target.closest('button[data-dl-community-action]');
      if (!button) return;
      const action = button.dataset.dlCommunityAction;
      if (action === 'info' || action === 'focus') rememberScroll();
    }, { passive: true, capture: true });

    toolbar.addEventListener('click', event => {
      const button = event.target.closest('button[data-dl-community-action]');
      if (!button) return;
      const action = button.dataset.dlCommunityAction;
      if (action === 'info' || action === 'focus') {
        requestAnimationFrame(syncState);
        setTimeout(syncState, 80);
      }
    }, true);
  }

  function bindInfoClose() {
    page?.querySelectorAll('.dl-community-info-head button,#dl-community-info-scrim').forEach(button => {
      if (button.dataset.dlV25Bound === '1') return;
      button.dataset.dlV25Bound = '1';
      button.addEventListener('pointerdown', rememberScroll, { passive: true, capture: true });
      button.addEventListener('click', () => {
        requestAnimationFrame(syncState);
        setTimeout(syncState, 80);
      }, true);
    });
  }

  function decorate() {
    if (!page?.isConnected) return;
    page.classList.add('dl-community-v25');
    bindToolbar();
    bindInfoClose();
    syncState();
  }

  function attach(next) {
    if (!next) return;
    if (next === page) return decorate();
    observer?.disconnect();
    page = next;
    decorate();

    observer = new MutationObserver(records => {
      const classChanged = records.some(record => record.type === 'attributes' && record.target === page && record.attributeName === 'class');
      const childChanged = records.some(record => record.type === 'childList');
      if (classChanged || childChanged) decorate();
    });
    observer.observe(page, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
      observer?.disconnect();
      observer = null;
      page = null;
      document.body.classList.remove('dl-community-info-body-open');
      return;
    }

    const found = document.querySelector(PAGE_SELECTOR);
    if (found) return attach(found);

    let tries = 0;
    const wait = () => {
      const next = document.querySelector(PAGE_SELECTOR);
      if (next) return attach(next);
      if (tries++ < 50) setTimeout(wait, 80);
    };
    wait();
  }

  window.addEventListener('resize', syncState, { passive: true });
  window.addEventListener('hashchange', route);
  window.addEventListener('pageshow', route);
  document.addEventListener('dlavie:community-hydrate', () => requestAnimationFrame(decorate));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();
