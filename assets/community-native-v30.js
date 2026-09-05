(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  let page = null;
  let rootObserver = null;
  let raf = 0;

  const onRoute = () => ROUTE.test(location.hash);
  const currentPage = () => document.querySelector(PAGE);

  function setInfo(target, open) {
    if (!target?.isConnected) return;
    target.classList.toggle('dl-community-info-open', open);
    document.body.classList.toggle('dl-community-info-open-body', open && matchMedia('(max-width:1050px)').matches);
    const trigger = target.querySelector('[data-dl-native-action="info"]');
    trigger?.setAttribute('aria-expanded', open ? 'true' : 'false');
    const rail = target.querySelector('.community-profile-rail');
    if (rail) {
      rail.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open && matchMedia('(max-width:1050px)').matches) {
        rail.setAttribute('role', 'dialog');
        rail.setAttribute('aria-modal', 'true');
      } else {
        rail.removeAttribute('role');
        rail.removeAttribute('aria-modal');
      }
    }
  }

  function ensureInfoShell(target) {
    const rail = target.querySelector('.community-profile-rail');
    if (!rail) return;

    let head = rail.querySelector('.dl-native-info-head');
    if (!head) {
      head = document.createElement('div');
      head.className = 'dl-native-info-head';
      head.innerHTML = '<strong>Info komunitas</strong><button type="button" aria-label="Tutup info">×</button>';
      head.querySelector('button')?.addEventListener('click', () => setInfo(target, false));
      rail.prepend(head);
    }

    let scrim = target.querySelector('#dl-native-info-scrim');
    if (!scrim) {
      scrim = document.createElement('button');
      scrim.id = 'dl-native-info-scrim';
      scrim.type = 'button';
      scrim.tabIndex = -1;
      scrim.setAttribute('aria-label', 'Tutup info komunitas');
      scrim.addEventListener('click', () => setInfo(target, false));
      target.appendChild(scrim);
    }
  }

  function applySearch(target, value) {
    const needle = String(value || '').trim().toLowerCase();
    target.querySelectorAll('.typed-feed > .community-entry').forEach(entry => {
      entry.hidden = !!needle && !(entry.textContent || '').toLowerCase().includes(needle);
    });
  }

  function ensureToolbar(target) {
    const head = target.querySelector('.active-forum-head');
    if (!head) return;

    let toolbar = target.querySelector('#dl-native-community-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('section');
      toolbar.id = 'dl-native-community-toolbar';
      toolbar.setAttribute('aria-label', 'Alat obrolan');
      toolbar.innerHTML = `
        <label class="dl-native-search">
          <span aria-hidden="true"></span>
          <input type="search" inputmode="search" autocomplete="off" placeholder="Cari di obrolan…" aria-label="Cari di ruang aktif">
        </label>
        <button type="button" class="dl-native-tool dl-native-latest" data-dl-native-action="latest" aria-label="Ke posting terbaru" title="Terbaru">↑</button>
        <button type="button" class="dl-native-tool dl-native-info" data-dl-native-action="info" aria-label="Buka info komunitas" aria-expanded="false" title="Info">i</button>`;
      head.insertAdjacentElement('afterend', toolbar);

      const search = toolbar.querySelector('input');
      search?.addEventListener('input', () => applySearch(target, search.value));
      toolbar.addEventListener('click', event => {
        const button = event.target.closest('[data-dl-native-action]');
        if (!button) return;
        if (button.dataset.dlNativeAction === 'latest') {
          target.querySelector('.typed-feed > .community-entry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (button.dataset.dlNativeAction === 'info') {
          setInfo(target, !target.classList.contains('dl-community-info-open'));
        }
      });
    }
  }

  function cleanupLegacy(target) {
    target.classList.remove('dl-community-focus', 'dl-community-discord-v4', 'dl-community-v26', 'dl-community-v28', 'dl-community-v29');
    target.querySelectorAll('#dl-community-toolbar,#dl-community-info-scrim,.dl-community-info-head,.dl-v4-reactions,.dl-v4-comment-actions').forEach(node => node.remove());
    target.querySelectorAll('.reaction-area.dl-v4-hide-native-reaction').forEach(node => node.classList.remove('dl-v4-hide-native-reaction'));
    try { localStorage.removeItem('dlavie-community-focus-mode'); } catch {}
  }

  function mount(target) {
    if (!target?.isConnected) return;
    page = target;
    target.classList.add('dl-community-native-v30');
    cleanupLegacy(target);
    ensureToolbar(target);
    ensureInfoShell(target);
  }

  function discover() {
    if (!onRoute()) {
      page = null;
      document.body.classList.remove('dl-community-info-open-body');
      return;
    }
    const found = currentPage();
    if (found) mount(found);
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      discover();
    });
  }

  function startObserver() {
    if (rootObserver) return;
    const root = document.getElementById('root');
    if (!root) return;
    rootObserver = new MutationObserver(() => schedule());
    rootObserver.observe(root, { childList: true, subtree: true });
  }

  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  window.addEventListener('pageshow', schedule);
  window.addEventListener('resize', () => {
    if (page?.classList.contains('dl-community-info-open')) setInfo(page, true);
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { startObserver(); schedule(); }, { once: true });
  } else {
    startObserver();
    schedule();
  }
})();
