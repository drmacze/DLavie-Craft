(() => {
  'use strict';

  const PAGE_SELECTOR = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  const LEGACY_FOCUS_KEY = 'dlavie-community-focus-mode';

  let page = null;
  let pageObserver = null;
  let rootObserver = null;
  let raf = 0;
  let settleTimers = [];

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const onRoute = () => ROUTE.test(location.hash);
  const getPage = () => document.querySelector(PAGE_SELECTOR);

  function topChild(root, node) {
    if (!root || !node || !root.contains(node)) return null;
    let current = node;
    while (current.parentElement && current.parentElement !== root) current = current.parentElement;
    return current.parentElement === root ? current : null;
  }

  function removeLegacyFocus(target) {
    if (!target) return;
    target.classList.remove('dl-community-focus');
    target.querySelectorAll('[data-dl-community-action="focus"]').forEach(node => node.remove());
    try { localStorage.removeItem(LEGACY_FOCUS_KEY); } catch {}
  }

  function markComposer(composer) {
    if (!(composer instanceof HTMLElement)) return;
    const textarea = composer.querySelector('textarea');
    if (!textarea) return;

    composer.classList.add('dl-v26-composer', 'dl-v29-composer');
    topChild(composer, textarea)?.classList.add('dl-v26-field-cell', 'dl-v29-field-cell');

    const sticker = composer.querySelector('.dl-sticker-compose,button[aria-label*="sticker" i],button[class*="sticker" i]');
    const send = composer.querySelector('button[type="submit"]') || [...composer.querySelectorAll('button')].find(btn => /^kirim$/i.test(clean(btn.textContent)));
    const stickerCell = topChild(composer, sticker);
    const sendCell = topChild(composer, send);

    if (stickerCell && sendCell && stickerCell === sendCell) {
      stickerCell.classList.add('dl-v26-actions-cell', 'dl-v29-actions-cell');
    } else {
      stickerCell?.classList.add('dl-v26-sticker-cell', 'dl-v29-sticker-cell');
      sendCell?.classList.add('dl-v26-send-cell', 'dl-v29-send-cell');
    }

    const counter = [...composer.querySelectorAll('span,small,div')].find(node => /^\s*\d+\s*\/\s*\d+\s*$/.test(node.textContent || ''));
    if (counter instanceof HTMLElement) counter.classList.add('dl-v26-counter', 'dl-v29-counter');
  }

  function markFeed(target) {
    target.querySelectorAll('.typed-feed > .community-entry').forEach(entry => {
      entry.classList.add('dl-v29-entry');
      entry.querySelectorAll('.entry-actions,.reaction-bar,.dl-v10-actions,.dl-v22-actions').forEach(row => row.classList.add('dl-v29-entry-actions'));
      entry.querySelectorAll('button').forEach(button => {
        const label = clean(button.textContent);
        const aria = button.getAttribute('aria-label') || '';
        if (label === '+' || label === '＋' || /tambah reaction/i.test(aria)) button.classList.add('dl-v26-plus', 'dl-v29-plus');
      });
      entry.querySelectorAll('.reply-composer,.post-thread form:has(textarea)').forEach(markComposer);
    });
  }

  function setInfo(target, open) {
    if (!target?.isConnected) return;
    target.classList.toggle('dl-community-info-open', open);
    document.body.classList.toggle('dl-v27-info-open', open && matchMedia('(max-width:1050px)').matches);
    const button = target.querySelector('[data-dl-community-action="info"]');
    if (button) button.setAttribute('aria-expanded', open ? 'true' : 'false');
    const rail = target.querySelector('.community-profile-rail');
    if (rail) {
      rail.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) {
        rail.setAttribute('role', 'dialog');
        rail.setAttribute('aria-modal', matchMedia('(max-width:1050px)').matches ? 'true' : 'false');
      } else {
        rail.removeAttribute('role');
        rail.removeAttribute('aria-modal');
      }
    }
  }

  function ensureInfo(target) {
    const rail = target.querySelector('.community-profile-rail');
    if (!rail) return;
    let head = rail.querySelector('.dl-community-info-head');
    if (!head) {
      head = document.createElement('div');
      head.className = 'dl-community-info-head';
      rail.prepend(head);
    }
    if (head.dataset.dlV29Ready !== '1') {
      head.dataset.dlV29Ready = '1';
      head.innerHTML = '<strong>Info komunitas</strong><button type="button" class="dl-v27-info-close" aria-label="Tutup info">×</button>';
      head.querySelector('.dl-v27-info-close')?.addEventListener('click', () => setInfo(target, false));
    }

    let scrim = target.querySelector('#dl-community-info-scrim');
    if (!scrim) {
      scrim = document.createElement('button');
      scrim.id = 'dl-community-info-scrim';
      scrim.type = 'button';
      scrim.tabIndex = -1;
      scrim.setAttribute('aria-label', 'Tutup info komunitas');
      scrim.addEventListener('click', () => setInfo(target, false));
      target.appendChild(scrim);
    }
  }

  function toolbarMarkup() {
    return `
      <div class="dl-community-toolbar-main dl-v27-toolbar-main">
        <label class="dl-community-room-search dl-v27-search">
          <span>Cari</span>
          <input type="search" inputmode="search" autocomplete="off" placeholder="Cari di obrolan…" aria-label="Cari di ruang aktif">
        </label>
        <div class="dl-community-toolbar-actions dl-v27-toolbar-actions">
          <button type="button" class="dl-v27-tool dl-v27-latest" data-dl-community-action="latest" aria-label="Ke posting terbaru" title="Terbaru"></button>
          <button type="button" class="dl-v27-tool dl-v27-info" data-dl-community-action="info" aria-label="Buka info komunitas" aria-expanded="false" title="Info"></button>
        </div>
      </div>`;
  }

  function applySearch(target, value) {
    const needle = String(value || '').trim().toLowerCase();
    target.querySelectorAll('.typed-feed .community-entry').forEach(entry => {
      entry.hidden = !!needle && !(entry.textContent || '').toLowerCase().includes(needle);
    });
  }

  function ensureToolbar(target) {
    const head = target.querySelector('.active-forum-head');
    if (!head) return;

    let toolbar = target.querySelector('#dl-community-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('section');
      toolbar.id = 'dl-community-toolbar';
      toolbar.className = 'dl-community-toolbar dl-v27-toolbar';
      toolbar.setAttribute('aria-label', 'Alat obrolan');
      head.insertAdjacentElement('afterend', toolbar);
    }

    if (toolbar.dataset.dlToolbarVersion !== '29') {
      const previousSearch = toolbar.querySelector('input[type="search"]')?.value || '';
      toolbar.dataset.dlToolbarVersion = '29';
      toolbar.classList.add('dl-v27-toolbar');
      toolbar.innerHTML = toolbarMarkup();
      const nextSearch = toolbar.querySelector('input[type="search"]');
      if (nextSearch && previousSearch) nextSearch.value = previousSearch;
    }

    const input = toolbar.querySelector('input[type="search"]');
    if (input && input.dataset.dlV29Bound !== '1') {
      input.dataset.dlV29Bound = '1';
      input.addEventListener('input', () => applySearch(target, input.value));
    }

    if (toolbar.dataset.dlV29Bound !== '1') {
      toolbar.dataset.dlV29Bound = '1';
      toolbar.addEventListener('click', event => {
        const button = event.target.closest('button[data-dl-community-action]');
        if (!button) return;
        const action = button.dataset.dlCommunityAction;
        if (action === 'info') setInfo(target, !target.classList.contains('dl-community-info-open'));
        if (action === 'latest') {
          const first = target.querySelector('.typed-feed .community-entry');
          first?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  function ensureCounter(target) {
    const form = target.querySelector('.quick-chat-composer');
    const textarea = form?.querySelector('textarea');
    if (!form || !textarea) return;
    const actionArea = form.lastElementChild;
    if (!actionArea) return;
    let counter = actionArea.querySelector('.dl-chat-counter');
    if (!counter) {
      counter = document.createElement('small');
      counter.className = 'dl-chat-counter';
      actionArea.insertBefore(counter, actionArea.firstChild || null);
    }
    const update = () => { counter.textContent = `${textarea.value.length}/8000`; };
    update();
    if (textarea.dataset.dlV29Counter !== '1') {
      textarea.dataset.dlV29Counter = '1';
      textarea.addEventListener('input', update);
    }
  }

  function pingLegacyEnhancers(target) {
    try { window.__DLAVIE_COMMUNITY_V4__?.scheduleDOM?.(target); } catch {}
    document.dispatchEvent(new CustomEvent('dlavie:community-v29-pass', { detail: { page: target } }));
  }

  function decorate(target) {
    if (!target?.isConnected) return;
    target.classList.add('dl-community-v26', 'dl-community-v28', 'dl-community-v29');
    removeLegacyFocus(target);
    target.querySelectorAll('.quick-chat-composer').forEach(markComposer);
    markFeed(target);
    ensureToolbar(target);
    ensureInfo(target);
    ensureCounter(target);
    pingLegacyEnhancers(target);
  }

  function attach(target) {
    if (!target?.isConnected) return;
    if (target !== page) {
      pageObserver?.disconnect();
      page = target;

      pageObserver = new MutationObserver(records => {
        const changed = records.some(record => {
          if (record.type === 'childList' && (record.addedNodes.length || record.removedNodes.length)) return true;
          if (record.type === 'attributes' && record.attributeName === 'class') return true;
          return false;
        });
        if (changed) schedule(false);
      });
      pageObserver.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

      if (target.dataset.dlV29PageBound !== '1') {
        target.dataset.dlV29PageBound = '1';
        target.addEventListener('click', event => {
          if (event.target.closest('.forum-sidebar nav button')) settleBurst();
        });
      }
    }
    decorate(target);
  }

  function schedule(rediscover = false) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!onRoute()) return;
      const current = rediscover || !page?.isConnected ? getPage() : page;
      if (current) attach(current);
    });
  }

  function clearSettleTimers() {
    settleTimers.forEach(clearTimeout);
    settleTimers = [];
  }

  function settleBurst() {
    clearSettleTimers();
    [0, 32, 90, 180, 360, 700, 1200, 1900, 3000].forEach(delay => {
      settleTimers.push(setTimeout(() => schedule(true), delay));
    });
  }

  function watchRoot() {
    const root = document.getElementById('root');
    if (!root || rootObserver) return;
    rootObserver = new MutationObserver(() => {
      if (!onRoute()) return;
      schedule(true);
    });
    rootObserver.observe(root, { childList: true, subtree: true });
  }

  function route() {
    if (!onRoute()) {
      clearSettleTimers();
      pageObserver?.disconnect();
      pageObserver = null;
      page = null;
      document.body.classList.remove('dl-v27-info-open');
      return;
    }
    watchRoot();
    settleBurst();
  }

  document.addEventListener('dlavie:community-hydrate', settleBurst);
  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  window.addEventListener('pageshow', route);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && onRoute()) settleBurst();
  });
  window.addEventListener('resize', () => {
    if (page?.classList.contains('dl-community-info-open')) setInfo(page, true);
  }, { passive: true });

  watchRoot();
  route();
  window.__DLAVIE_COMMUNITY_V29__ = { version: '20260906j1', settle: settleBurst, decorate: () => decorate(getPage()) };
})();
