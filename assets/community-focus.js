(() => {
  'use strict';

  const FOCUS_KEY = 'dlavie-community-focus-mode';
  const SEEN_KEY = 'dlavie-community-seen-counts';
  const DRAFT_PREFIX = 'dlavie-community-chat-draft:';
  const PAGE_SELECTOR = '.community-page.community-v2';

  let pageObserver = null;
  let observedPage = null;
  let raf = 0;
  let lastActiveRoom = '';
  let toolbarNewCount = 0;
  const runtimeCounts = new Map();

  const readJson = (key, fallback = {}) => {
    try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; }
  };

  const writeJson = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  const slugify = (value = '') => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'room';

  function getPage() {
    return document.querySelector(PAGE_SELECTOR);
  }

  function getForumType(page) {
    if (page.querySelector('.quick-chat-composer, .feed-chat')) return 'chat';
    if (page.querySelector('.composer-showcase, .feed-showcase')) return 'showcase';
    if (page.querySelector('.composer-support, .feed-support')) return 'support';
    if (page.querySelector('.composer-feedback, .feed-feedback')) return 'feedback';
    if (page.querySelector('.composer-announcements, .feed-announcements')) return 'announcements';
    if (page.querySelector('.levels-forum')) return 'levels';
    return 'room';
  }

  function activeForumButton(page) {
    return page.querySelector('.forum-sidebar nav button.active');
  }

  function roomKey(page) {
    const button = activeForumButton(page);
    const name = button?.querySelector('strong')?.textContent || page.querySelector('.active-forum-head h2')?.textContent || 'room';
    return slugify(name);
  }

  function roomCount(button) {
    const value = Number((button?.querySelector('b')?.textContent || '').replace(/[^0-9]/g, ''));
    return Number.isFinite(value) ? value : 0;
  }

  function setControlledValue(element, value) {
    const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function setFocus(page, enabled) {
    page.classList.toggle('dl-community-focus', enabled);
    try { localStorage.setItem(FOCUS_KEY, enabled ? '1' : '0'); } catch {}
    const button = page.querySelector('[data-dl-community-action="focus"]');
    if (button) {
      button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      button.textContent = enabled ? 'Ringkas aktif' : 'Ringkas';
    }
  }

  function setInfo(page, open) {
    page.classList.toggle('dl-community-info-open', open);
    const button = page.querySelector('[data-dl-community-action="info"]');
    if (button) button.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function ensureInfoShell(page) {
    const rail = page.querySelector('.community-profile-rail');
    if (!rail) return;

    if (!rail.querySelector('.dl-community-info-head')) {
      const head = document.createElement('div');
      head.className = 'dl-community-info-head';
      head.innerHTML = '<strong>Info komunitas</strong><button type="button" aria-label="Tutup info">Tutup</button>';
      head.querySelector('button').addEventListener('click', () => setInfo(page, false));
      rail.prepend(head);
    }

    if (!page.querySelector('#dl-community-info-scrim')) {
      const scrim = document.createElement('button');
      scrim.id = 'dl-community-info-scrim';
      scrim.type = 'button';
      scrim.tabIndex = -1;
      scrim.setAttribute('aria-label', 'Tutup panel info');
      scrim.addEventListener('click', () => setInfo(page, false));
      page.appendChild(scrim);
    }
  }

  function ensureToolbar(page) {
    const head = page.querySelector('.active-forum-head');
    if (!head) return null;

    let toolbar = page.querySelector('#dl-community-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('section');
      toolbar.id = 'dl-community-toolbar';
      toolbar.className = 'dl-community-toolbar';
      toolbar.setAttribute('aria-label', 'Alat komunitas');
      toolbar.innerHTML = `
        <div class="dl-community-toolbar-main">
          <label class="dl-community-room-search">
            <span>Cari</span>
            <input type="search" inputmode="search" autocomplete="off" placeholder="Cari di ruang ini…" aria-label="Cari di ruang aktif">
          </label>
          <div class="dl-community-toolbar-actions">
            <button type="button" data-dl-community-action="latest">Terbaru <b class="dl-community-new-badge" hidden>0</b></button>
            <button type="button" data-dl-community-action="focus" aria-pressed="true">Ringkas aktif</button>
            <button type="button" data-dl-community-action="info" aria-expanded="false">Info</button>
          </div>
        </div>
        <div class="dl-community-toolbar-status">
          <span data-dl-community-status>Ruang siap.</span>
          <span class="dl-community-shortcut">Enter kirim · Shift+Enter baris baru</span>
        </div>`;

      head.insertAdjacentElement('afterend', toolbar);

      const input = toolbar.querySelector('input');
      input.addEventListener('input', () => applySearch(page, input.value));

      toolbar.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-dl-community-action]');
        if (!button) return;
        const action = button.dataset.dlCommunityAction;

        if (action === 'info') {
          setInfo(page, !page.classList.contains('dl-community-info-open'));
        } else if (action === 'focus') {
          setFocus(page, !page.classList.contains('dl-community-focus'));
        } else if (action === 'latest') {
          const first = page.querySelector('.typed-feed .community-entry');
          first?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          toolbarNewCount = 0;
          updateNewBadge(page);
          markCurrentRoomSeen(page);
        }
      });
    }

    return toolbar;
  }

  function applySearch(page, query) {
    const needle = query.trim().toLowerCase();
    const entries = Array.from(page.querySelectorAll('.typed-feed .community-entry'));
    let visible = 0;

    entries.forEach((entry) => {
      const match = !needle || (entry.textContent || '').toLowerCase().includes(needle);
      entry.hidden = !match;
      if (match) visible += 1;
    });

    const status = page.querySelector('[data-dl-community-status]');
    if (status) status.textContent = needle ? `${visible} hasil dari ${entries.length} posting` : `${entries.length} posting di ruang ini`;
  }

  function updateNewBadge(page) {
    const badge = page.querySelector('.dl-community-new-badge');
    if (!badge) return;
    badge.hidden = toolbarNewCount <= 0;
    badge.textContent = String(Math.min(99, toolbarNewCount));
  }

  function updateForumBadges(page) {
    const buttons = Array.from(page.querySelectorAll('.forum-sidebar nav button'));
    if (!buttons.length) return;

    const seen = readJson(SEEN_KEY, {});
    const firstRun = !Object.keys(seen).length;
    const active = activeForumButton(page);

    buttons.forEach((button) => {
      const key = slugify(button.querySelector('strong')?.textContent || 'room');
      const count = roomCount(button);
      button.dataset.dlRoomKey = key;

      const previousRuntime = runtimeCounts.get(key);
      if (previousRuntime != null && count > previousRuntime && button === active) {
        toolbarNewCount += count - previousRuntime;
      }
      runtimeCounts.set(key, count);

      if (firstRun) seen[key] = count;
      const hasNew = !firstRun && button !== active && count > Number(seen[key] || 0);
      button.classList.toggle('dl-room-has-new', hasNew);
      if (hasNew) button.setAttribute('aria-label', `${button.querySelector('strong')?.textContent || 'Forum'} memiliki posting baru`);
      else button.removeAttribute('aria-label');
    });

    if (firstRun) writeJson(SEEN_KEY, seen);
    updateNewBadge(page);
  }

  function markCurrentRoomSeen(page) {
    const button = activeForumButton(page);
    if (!button) return;
    const key = button.dataset.dlRoomKey || slugify(button.querySelector('strong')?.textContent || 'room');
    const seen = readJson(SEEN_KEY, {});
    seen[key] = roomCount(button);
    writeJson(SEEN_KEY, seen);
    button.classList.remove('dl-room-has-new');
  }

  function ensureChatEnhancements(page) {
    const form = page.querySelector('.quick-chat-composer');
    const textarea = form?.querySelector('textarea');
    if (!form || !textarea) return;

    const key = roomKey(page);
    const draftKey = DRAFT_PREFIX + key;

    if (textarea.dataset.dlChatEnhanced !== 'true') {
      textarea.dataset.dlChatEnhanced = 'true';

      let draft = '';
      try { draft = localStorage.getItem(draftKey) || ''; } catch {}
      if (!textarea.value && draft) requestAnimationFrame(() => setControlledValue(textarea, draft));

      textarea.addEventListener('input', () => {
        try {
          if (textarea.value) localStorage.setItem(draftKey, textarea.value);
          else localStorage.removeItem(draftKey);
        } catch {}
        updateChatCounter(form, textarea);
      });

      textarea.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
        event.preventDefault();
        if (textarea.value.trim().length >= 3) form.requestSubmit();
      });

      form.addEventListener('submit', () => {
        window.setTimeout(() => {
          if (!textarea.value.trim()) {
            try { localStorage.removeItem(draftKey); } catch {}
          }
          updateChatCounter(form, textarea);
        }, 900);
      });
    }

    updateChatCounter(form, textarea);
  }

  function updateChatCounter(form, textarea) {
    const actionArea = form.lastElementChild;
    if (!actionArea) return;
    let counter = actionArea.querySelector('.dl-chat-counter');
    if (!counter) {
      counter = document.createElement('small');
      counter.className = 'dl-chat-counter';
      actionArea.insertBefore(counter, actionArea.lastElementChild || null);
    }
    counter.textContent = `${textarea.value.length}/8000`;
    counter.classList.toggle('near-limit', textarea.value.length > 7200);
  }

  function updateRoomContext(page) {
    const type = getForumType(page);
    page.dataset.dlCommunityForumType = type;
    const key = roomKey(page);

    if (lastActiveRoom && lastActiveRoom !== key) {
      toolbarNewCount = 0;
      const input = page.querySelector('.dl-community-room-search input');
      if (input?.value) {
        input.value = '';
        applySearch(page, '');
      }
    }
    lastActiveRoom = key;

    const shortcut = page.querySelector('.dl-community-shortcut');
    if (shortcut) shortcut.hidden = type !== 'chat';

    const status = page.querySelector('[data-dl-community-status]');
    if (status && !page.querySelector('.dl-community-room-search input')?.value) {
      const count = page.querySelectorAll('.typed-feed .community-entry').length;
      status.textContent = type === 'levels' ? 'Peringkat dan progres komunitas' : `${count} posting di ruang ini`;
    }
  }

  function refresh(page = getPage()) {
    if (!page || !document.documentElement.contains(page)) return;
    ensureToolbar(page);
    ensureInfoShell(page);
    updateRoomContext(page);
    updateForumBadges(page);
    ensureChatEnhancements(page);

    const storedFocus = (() => {
      try {
        const value = localStorage.getItem(FOCUS_KEY);
        return value == null ? true : value === '1';
      } catch { return true; }
    })();
    setFocus(page, storedFocus);
  }

  function schedule(page = getPage()) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      refresh(page);
    });
  }

  function attachPage(page) {
    if (!page || observedPage === page) {
      if (page) schedule(page);
      return;
    }

    pageObserver?.disconnect();
    observedPage = page;
    refresh(page);

    page.addEventListener('click', (event) => {
      const forumButton = event.target.closest('.forum-sidebar nav button');
      if (forumButton) {
        const seen = readJson(SEEN_KEY, {});
        const key = forumButton.dataset.dlRoomKey || slugify(forumButton.querySelector('strong')?.textContent || 'room');
        seen[key] = roomCount(forumButton);
        writeJson(SEEN_KEY, seen);
        forumButton.classList.remove('dl-room-has-new');
        window.setTimeout(() => schedule(page), 80);
      }
    });

    pageObserver = new MutationObserver(() => schedule(page));
    pageObserver.observe(page, { childList: true, subtree: true });
  }

  function waitForPage(attempt = 0) {
    const page = getPage();
    if (page) return attachPage(page);
    if (attempt < 24 && /#\/community(?:$|[/?])/.test(location.hash)) {
      window.setTimeout(() => waitForPage(attempt + 1), 80 + attempt * 12);
    }
  }

  function routeChanged() {
    if (!/#\/community(?:$|[/?])/.test(location.hash)) {
      pageObserver?.disconnect();
      pageObserver = null;
      observedPage = null;
      return;
    }
    waitForPage();
  }

  window.addEventListener('hashchange', routeChanged);
  window.addEventListener('popstate', routeChanged);
  window.addEventListener('pageshow', routeChanged);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', routeChanged, { once: true });
  else routeChanged();
})();