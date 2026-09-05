(() => {
  'use strict';

  const PAGE_SELECTOR = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  const LEGACY_FOCUS_KEY = 'dlavie-community-focus-mode';
  let page = null;
  let observer = null;
  let raf = 0;

  function getPage() {
    return document.querySelector(PAGE_SELECTOR);
  }

  function removeLegacyCompactMode(target) {
    target?.classList.remove('dl-community-focus');
    try { localStorage.removeItem(LEGACY_FOCUS_KEY); } catch {}
    target?.querySelectorAll('[data-dl-community-action="focus"]').forEach(node => node.remove());
  }

  function setInfo(target, open) {
    if (!target) return;
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
    head.innerHTML = '<strong>Info komunitas</strong><button type="button" class="dl-v27-info-close" aria-label="Tutup info">×</button>';
    const close = head.querySelector('.dl-v27-info-close');
    if (close && close.dataset.dlV27Bound !== '1') {
      close.dataset.dlV27Bound = '1';
      close.addEventListener('click', () => setInfo(target, false));
    }

    let scrim = target.querySelector('#dl-community-info-scrim');
    if (!scrim) {
      scrim = document.createElement('button');
      scrim.id = 'dl-community-info-scrim';
      scrim.type = 'button';
      scrim.tabIndex = -1;
      scrim.setAttribute('aria-label', 'Tutup info komunitas');
      target.appendChild(scrim);
    }
    if (scrim.dataset.dlV27Bound !== '1') {
      scrim.dataset.dlV27Bound = '1';
      scrim.addEventListener('click', () => setInfo(target, false));
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

    if (toolbar.dataset.dlToolbarVersion !== '27') {
      toolbar.dataset.dlToolbarVersion = '27';
      toolbar.classList.add('dl-v27-toolbar');
      toolbar.innerHTML = toolbarMarkup();
    }

    const input = toolbar.querySelector('input[type="search"]');
    if (input && input.dataset.dlV27Bound !== '1') {
      input.dataset.dlV27Bound = '1';
      input.addEventListener('input', () => applySearch(target, input.value));
    }

    if (toolbar.dataset.dlV27Bound !== '1') {
      toolbar.dataset.dlV27Bound = '1';
      toolbar.addEventListener('click', event => {
        const button = event.target.closest('button[data-dl-community-action]');
        if (!button) return;
        const action = button.dataset.dlCommunityAction;
        if (action === 'info') {
          setInfo(target, !target.classList.contains('dl-community-info-open'));
        } else if (action === 'latest') {
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
    if (textarea.dataset.dlV27Counter !== '1') {
      textarea.dataset.dlV27Counter = '1';
      textarea.addEventListener('input', update);
    }
  }

  function refresh(target = page || getPage()) {
    if (!target?.isConnected) return;
    page = target;
    removeLegacyCompactMode(target);
    ensureToolbar(target);
    ensureInfoShell(target);
    ensureCounter(target);
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      refresh();
    });
  }

  function attach(target) {
    if (!target) return;
    if (target === page) return schedule();
    observer?.disconnect();
    page = target;
    refresh(target);

    target.addEventListener('click', event => {
      if (event.target.closest('.forum-sidebar nav button')) setTimeout(schedule, 60);
    });

    observer = new MutationObserver(records => {
      const meaningful = records.some(record => {
        const host = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !host?.closest?.('#dl-community-toolbar,.dl-community-info-head,#dl-community-info-scrim,.dl-chat-counter');
      });
      if (meaningful) schedule();
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
      observer?.disconnect();
      observer = null;
      page = null;
      document.body.classList.remove('dl-v27-info-open');
      return;
    }

    const found = getPage();
    if (found) return attach(found);

    let attempts = 0;
    const wait = () => {
      const next = getPage();
      if (next) return attach(next);
      if (attempts++ < 28) setTimeout(wait, 80 + attempts * 6);
    };
    wait();
  }

  document.addEventListener('dlavie:community-hydrate', schedule);
  window.addEventListener('hashchange', route);
  window.addEventListener('pageshow', route);
  window.addEventListener('resize', () => {
    if (page?.classList.contains('dl-community-info-open')) setInfo(page, true);
  }, { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();
