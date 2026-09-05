(() => {
  'use strict';

  const PAGE_SELECTOR = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  const LEGACY_FOCUS_KEY = 'dlavie-community-focus-mode';

  let page = null;
  let pageObserver = null;
  let rootObserver = null;
  let raf = 0;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const onCommunityRoute = () => ROUTE.test(location.hash);
  const getPage = () => document.querySelector(PAGE_SELECTOR);

  function topChild(root, node) {
    if (!root || !node || !root.contains(node)) return null;
    let current = node;
    while (current.parentElement && current.parentElement !== root) current = current.parentElement;
    return current.parentElement === root ? current : null;
  }

  function removeLegacyCompactMode(target) {
    target?.classList.remove('dl-community-focus');
    try { localStorage.removeItem(LEGACY_FOCUS_KEY); } catch {}
    target?.querySelectorAll('[data-dl-community-action="focus"]').forEach(node => node.remove());
  }

  function markComposer(composer) {
    if (!(composer instanceof HTMLElement)) return;
    const textarea = composer.querySelector('textarea');
    if (!textarea) return;

    composer.classList.add('dl-v26-composer');
    topChild(composer, textarea)?.classList.add('dl-v26-field-cell');

    const sticker = composer.querySelector('.dl-sticker-compose,button[aria-label*="sticker" i],button[class*="sticker" i]');
    const send = composer.querySelector('button[type="submit"]') || [...composer.querySelectorAll('button')].find(btn => /^kirim$/i.test(clean(btn.textContent)));
    const stickerCell = topChild(composer, sticker);
    const sendCell = topChild(composer, send);

    if (stickerCell && sendCell && stickerCell === sendCell) {
      stickerCell.classList.add('dl-v26-actions-cell');
    } else {
      stickerCell?.classList.add('dl-v26-sticker-cell');
      sendCell?.classList.add('dl-v26-send-cell');
    }

    const counter = [...composer.querySelectorAll('span,small,div')].find(node => /^\s*\d+\s*\/\s*\d+\s*$/.test(node.textContent || ''));
    if (counter instanceof HTMLElement) counter.classList.add('dl-v26-counter');
  }

  function markFeedActions(target) {
    target.querySelectorAll('.typed-feed > .community-entry').forEach(entry => {
      entry.querySelectorAll('button').forEach(button => {
        const label = clean(button.textContent);
        const aria = button.getAttribute('aria-label') || '';
        if (label === '+' || /tambah reaction/i.test(aria)) button.classList.add('dl-v26-plus');
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

  function ensureInfoShell(target) {
    const rail = target.querySelector('.community-profile-rail');
    if (!rail) return;

    let head = rail.querySelector('.dl-community-info-head');
    if (!head) {
      head = document.createElement('div');
      head.className = 'dl-community-info-head';
      rail.prepend(head);
    }

    if (head.dataset.dlV28Ready !== '1') {
      head.dataset.dlV28Ready = '1';
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

  function applySearch(target, query) {
    const needle = String(query || '').trim().toLowerCase();
    target.querySelectorAll('.typed-feed .community-entry').forEach(entry => {
      entry.hidden = !!needle && !(entry.textContent || '').toLowerCase().includes(needle);
    });
  }

  function ensureToolbar(target) {
    const activeHead = target.querySelector('.active-forum-head');
    if (!activeHead) return;

    let toolbar = target.querySelector('#dl-community-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('section');
      toolbar.id = 'dl-community-toolbar';
      toolbar.className = 'dl-community-toolbar dl-v27-toolbar';
      toolbar.setAttribute('aria-label', 'Alat obrolan');
      activeHead.insertAdjacentElement('afterend', toolbar);
    }

    if (toolbar.dataset.dlToolbarVersion !== '28') {
      toolbar.dataset.dlToolbarVersion = '28';
      toolbar.classList.add('dl-v27-toolbar');
      toolbar.innerHTML = toolbarMarkup();
    }

    const input = toolbar.querySelector('input[type="search"]');
    if (input && input.dataset.dlV28Bound !== '1') {
      input.dataset.dlV28Bound = '1';
      input.addEventListener('input', () => applySearch(target, input.value));
    }

    if (toolbar.dataset.dlV28Bound !== '1') {
      toolbar.dataset.dlV28Bound = '1';
      toolbar.addEventListener('click', event => {
        const button = event.target.closest('button[data-dl-community-action]');
        if (!button) return;
        const action = button.dataset.dlCommunityAction;
        if (action === 'info') {
          setInfo(target, !target.classList.contains('dl-community-info-open'));
        } else if (action === 'latest') {
          target.querySelector('.typed-feed .community-entry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    if (textarea.dataset.dlV28Counter !== '1') {
      textarea.dataset.dlV28Counter = '1';
      textarea.addEventListener('input', update);
    }
  }

  function decorate(target) {
    if (!target?.isConnected) return;
    target.classList.add('dl-community-v26', 'dl-community-v28');
    removeLegacyCompactMode(target);
    target.querySelectorAll('.quick-chat-composer').forEach(markComposer);
    markFeedActions(target);
    ensureToolbar(target);
    ensureInfoShell(target);
    ensureCounter(target);
  }

  function attach(target) {
    if (!target?.isConnected) return;
    if (target === page) {
      decorate(target);
      return;
    }

    pageObserver?.disconnect();
    page = target;
    decorate(target);

    if (target.dataset.dlV28PageBound !== '1') {
      target.dataset.dlV28PageBound = '1';
      target.addEventListener('click', event => {
        if (event.target.closest('.forum-sidebar nav button')) {
          setTimeout(() => schedule(true), 40);
        }
      });
    }

    pageObserver = new MutationObserver(records => {
      const meaningful = records.some(record => {
        const host = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !host?.closest?.('#dl-community-toolbar,.dl-community-info-head,#dl-community-info-scrim,.dl-chat-counter,.dl-v26-composer');
      });
      if (meaningful) schedule(false);
    });
    pageObserver.observe(target, { childList: true, subtree: true });
  }

  function schedule(forceDiscover = false) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!onCommunityRoute()) return;
      const current = forceDiscover || !page?.isConnected ? getPage() : page;
      if (current && current !== page) attach(current);
      else if (current) decorate(current);
      else {
        const discovered = getPage();
        if (discovered) attach(discovered);
      }
    });
  }

  function watchRoot() {
    const root = document.getElementById('root');
    if (!root || rootObserver) return;

    rootObserver = new MutationObserver(records => {
      if (!onCommunityRoute()) return;
      const pageWasReplaced = !page?.isConnected || records.some(record => {
        return [...record.addedNodes, ...record.removedNodes].some(node => {
          if (!(node instanceof Element)) return false;
          return node.matches?.(PAGE_SELECTOR) || !!node.querySelector?.(PAGE_SELECTOR);
        });
      });
      if (pageWasReplaced) schedule(true);
    });
    rootObserver.observe(root, { childList: true, subtree: true });
  }

  function route() {
    if (!onCommunityRoute()) {
      pageObserver?.disconnect();
      pageObserver = null;
      page = null;
      document.body.classList.remove('dl-v27-info-open');
      return;
    }

    watchRoot();
    schedule(true);
    [40, 140, 360, 800].forEach(delay => setTimeout(() => schedule(true), delay));
  }

  document.addEventListener('dlavie:community-hydrate', () => schedule(true));
  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  window.addEventListener('pageshow', route);
  window.addEventListener('resize', () => {
    if (page?.classList.contains('dl-community-info-open')) setInfo(page, true);
  }, { passive: true });

  watchRoot();
  route();
})();
