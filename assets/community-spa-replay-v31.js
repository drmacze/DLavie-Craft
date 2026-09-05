(() => {
  'use strict';

  const ROUTE = /#\/community(?:$|[/?])/;
  const PAGE = '.community-page.community-v2';
  const ROOT = '#root';

  let rootObserver = null;
  let timers = [];
  let generation = 0;

  const onRoute = () => ROUTE.test(location.hash);
  const getPage = () => document.querySelector(PAGE);

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function signature(page) {
    if (!page) return '';
    return [
      page.querySelectorAll('.forum-sidebar nav button').length,
      page.querySelectorAll('.typed-feed > .community-entry').length,
      page.querySelectorAll('.quick-chat-composer').length,
      page.querySelectorAll('.entry-actions').length,
      page.querySelectorAll('.community-profile-rail').length,
      page.querySelector('.active-forum-head h2')?.textContent?.trim() || ''
    ].join('|');
  }

  function structurallyReady(page) {
    if (!page?.isConnected) return false;
    if (!page.querySelector('.community-workspace')) return false;
    if (!page.querySelector('.active-forum-head')) return false;
    if (!page.querySelector('.forum-main')) return false;
    if (!page.querySelector('.forum-sidebar nav')) return false;
    return !!page.querySelector('.typed-feed, .levels-forum, .empty-state');
  }

  async function replay(page) {
    if (!page?.isConnected || page.dataset.dlSpaReplayV31 === 'done') return;
    page.dataset.dlSpaReplayV31 = 'done';

    // Re-run the same public lifecycle hooks that work correctly on a hard refresh.
    // This script deliberately does not create, remove, move, or style UI elements.
    try {
      const v4 = window.__DLAVIE_COMMUNITY_V4__;
      if (v4?.load) await v4.load(true);
      v4?.scheduleDOM?.(page);
    } catch (error) {
      console.warn('[Community SPA replay] v4 refresh skipped:', error?.message || error);
    }

    try { window.__DLAVIE_COMMUNITY_V29__?.settle?.(); } catch {}
    try { window.__DLAVIE_PUBLIC_STICKERS__?.reload?.(); } catch {}

    document.dispatchEvent(new CustomEvent('dlavie:community-hydrate', {
      detail: { source: 'spa-replay-v31', page }
    }));

    // Legacy community modules already listen to these browser lifecycle events.
    // Dispatching them only after React has mounted mirrors opening /#/community directly.
    try {
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }));
    } catch {
      window.dispatchEvent(new Event('pageshow'));
    }
    try {
      window.dispatchEvent(new HashChangeEvent('hashchange', {
        oldURL: location.href,
        newURL: location.href
      }));
    } catch {
      window.dispatchEvent(new Event('hashchange'));
    }
  }

  function arm() {
    generation += 1;
    const mine = generation;
    clearTimers();

    if (!onRoute()) return;

    let previous = '';
    let stablePasses = 0;
    let attempt = 0;

    const probe = () => {
      if (mine !== generation || !onRoute()) return;
      const page = getPage();

      if (page?.dataset.dlSpaReplayV31 === 'done') return;

      if (structurallyReady(page)) {
        const next = signature(page);
        stablePasses = next === previous ? stablePasses + 1 : 0;
        previous = next;

        // Three identical samples ensure React + async forum data have settled before replay.
        if (stablePasses >= 2) {
          requestAnimationFrame(() => requestAnimationFrame(() => replay(page)));
          return;
        }
      } else {
        stablePasses = 0;
      }

      attempt += 1;
      if (attempt < 60) timers.push(setTimeout(probe, attempt < 12 ? 70 : 120));
    };

    probe();
  }

  function watchRoot() {
    const root = document.querySelector(ROOT);
    if (!root || rootObserver) return;
    let queued = 0;
    rootObserver = new MutationObserver(() => {
      if (!onRoute()) return;
      clearTimeout(queued);
      queued = setTimeout(() => {
        const page = getPage();
        if (!page?.dataset.dlSpaReplayV31) arm();
      }, 45);
    });
    rootObserver.observe(root, { childList: true, subtree: true });
  }

  function route(event) {
    // Synthetic replay events arrive after the page has been marked done, so this is idempotent.
    if (!onRoute()) {
      generation += 1;
      clearTimers();
      return;
    }
    watchRoot();
    const page = getPage();
    if (page?.dataset.dlSpaReplayV31 === 'done') return;
    arm();
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  window.addEventListener('pageshow', route);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && onRoute() && !getPage()?.dataset.dlSpaReplayV31) arm();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      watchRoot();
      route();
    }, { once: true });
  } else {
    watchRoot();
    route();
  }

  window.__DLAVIE_COMMUNITY_SPA_REPLAY_V31__ = { arm, replay: () => replay(getPage()) };
})();