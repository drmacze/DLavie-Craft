(() => {
  'use strict';

  const PAGE_SELECTOR = '.community-page.community-v2';
  const RECENT_KEY = 'dlavie-community-recent-reactions-v2';
  const DEFAULT_QUICK = ['👍', '❤️', '😂', '🔥', '🎉', '💎'];
  const CATEGORY_BY_EMOJI = {
    '👍': 'Gestur',
    '❤️': 'Hati',
    '😂': 'Wajah',
    '🔥': 'Alam',
    '🎉': 'Aktivitas',
    '💎': 'Craft'
  };

  let observer = null;
  let observedPage = null;
  let raf = 0;

  const isCommunityRoute = () => /#\/community(?:$|[/?])/.test(location.hash);
  const isCompact = () => matchMedia('(max-width: 620px), (pointer: coarse)').matches;

  function readRecent() {
    try {
      const value = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      return Array.isArray(value) ? value.filter(Boolean).slice(0, 6) : [];
    } catch {
      return [];
    }
  }

  function rememberEmoji(emoji) {
    if (!emoji) return;
    const next = [emoji, ...readRecent().filter((item) => item !== emoji)].slice(0, 6);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  }

  function setText(node, text) {
    if (node && node.textContent !== text) node.textContent = text;
  }

  function removeInjectedMinecraftIcon(host) {
    if (!host) return;
    host.querySelectorAll(':scope > .dl-mc-sweep-icon, :scope > .dl-mc-forge-icon, :scope > .dl-mc-icon').forEach((icon) => icon.remove());
    host.classList.remove('dl-mc-v2-iconized', 'dl-mc-forged-host', 'dl-mc-iconized');
    host.querySelectorAll(':scope > svg.dl-mc-generic-replaced').forEach((svg) => svg.classList.remove('dl-mc-generic-replaced'));
  }

  function normalizeReactionTriggers(page) {
    page.querySelectorAll('.reaction-add, .emoji-close').forEach(removeInjectedMinecraftIcon);

    page.querySelectorAll('.reaction-add').forEach((button) => {
      button.classList.add('dl-reaction-trigger');
      if (!button.querySelector('.dl-reaction-trigger-emoji')) {
        const emoji = document.createElement('span');
        emoji.className = 'dl-reaction-trigger-emoji';
        emoji.setAttribute('aria-hidden', 'true');
        emoji.textContent = '😊';
        button.prepend(emoji);
      }
      if (!button.querySelector('.dl-reaction-add-label')) {
        const label = document.createElement('span');
        label.className = 'dl-reaction-add-label';
        label.textContent = 'React';
        button.append(label);
      }
      if (button.getAttribute('aria-label') !== 'Tambah reaksi') button.setAttribute('aria-label', 'Tambah reaksi');
    });

    page.querySelectorAll('.reaction-button').forEach((button) => {
      button.classList.add('dl-reaction-chip');
      const count = button.querySelector('b')?.textContent?.trim();
      if (count) button.setAttribute('data-dl-count', count);
    });
  }

  function quickItems() {
    return [...new Set([...readRecent(), ...DEFAULT_QUICK])].slice(0, 6);
  }

  function findEmojiButton(picker, emoji) {
    return Array.from(picker?.querySelectorAll('.emoji-grid button') || [])
      .find((button) => button.getAttribute('aria-label') === `React ${emoji}` || button.textContent.trim() === emoji);
  }

  function chooseEmoji(picker, emoji) {
    if (!picker || !emoji) return;
    const direct = findEmojiButton(picker, emoji);
    if (direct) {
      direct.click();
      return;
    }

    const entry = picker.closest('.community-entry');
    const category = CATEGORY_BY_EMOJI[emoji];
    const categoryButton = Array.from(picker.querySelectorAll('.emoji-groups button'))
      .find((button) => button.getAttribute('aria-label') === category);

    if (!categoryButton || !entry) return;
    categoryButton.click();

    let attempt = 0;
    const trySelect = () => {
      attempt += 1;
      const nextPicker = entry.querySelector('.emoji-popover');
      const button = findEmojiButton(nextPicker, emoji);
      if (button) {
        button.click();
        return;
      }
      if (attempt < 8) window.setTimeout(trySelect, 40);
    };
    window.setTimeout(trySelect, 35);
  }

  function buildQuickRow(picker) {
    let quick = picker.querySelector('.dl-emoji-quick');
    if (!quick) {
      quick = document.createElement('div');
      quick.className = 'dl-emoji-quick';
      const head = picker.querySelector('.emoji-popover-head');
      if (head) head.insertAdjacentElement('afterend', quick);
      else picker.prepend(quick);
    }

    const signature = quickItems().join('');
    if (quick.dataset.signature === signature) return;
    quick.dataset.signature = signature;
    quick.innerHTML = '<span>Reaksi cepat</span><div></div>';
    const row = quick.querySelector('div');

    quickItems().forEach((emoji) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dl-emoji-quick-button';
      button.textContent = emoji;
      button.setAttribute('aria-label', `React cepat ${emoji}`);
      button.addEventListener('click', () => chooseEmoji(picker, emoji));
      row.appendChild(button);
    });
  }

  function labelCategories(picker) {
    picker.querySelectorAll('.emoji-groups button').forEach((button) => {
      const label = button.getAttribute('aria-label') || '';
      if (button.dataset.dlLabel !== label) button.dataset.dlLabel = label;
    });
  }

  function localizePicker(picker) {
    const strong = picker.querySelector('.emoji-popover-head strong');
    const helper = picker.querySelector('.emoji-popover-head span');
    setText(strong, 'Reaksi');
    setText(helper, 'Pilih emoji untuk posting ini');
  }

  function ensureScrim(page) {
    let scrim = page.querySelector('#dl-reaction-scrim');
    if (scrim) return scrim;
    scrim = document.createElement('button');
    scrim.id = 'dl-reaction-scrim';
    scrim.type = 'button';
    scrim.tabIndex = -1;
    scrim.setAttribute('aria-label', 'Tutup pemilih reaksi');
    scrim.addEventListener('click', () => closePicker(page));
    page.appendChild(scrim);
    return scrim;
  }

  function closePicker(page = document.querySelector(PAGE_SELECTOR)) {
    const close = page?.querySelector('.emoji-popover .emoji-close');
    close?.click();
  }

  function enhancePicker(page, picker) {
    picker.classList.add('dl-emoji-picker-v2');
    if (isCompact()) picker.setAttribute('aria-modal', 'true');
    else picker.removeAttribute('aria-modal');

    localizePicker(picker);
    labelCategories(picker);
    buildQuickRow(picker);

    picker.querySelectorAll('.emoji-grid button').forEach((button) => {
      const emoji = button.textContent.trim();
      if (emoji && button.dataset.dlEmoji !== emoji) button.dataset.dlEmoji = emoji;
    });

    const entry = picker.closest('.community-entry');
    if (entry) entry.classList.add('dl-reaction-open');
    page.classList.add('dl-reaction-picker-open');
    ensureScrim(page);
  }

  function syncPicker(page) {
    const picker = page.querySelector('.emoji-popover');
    page.querySelectorAll('.community-entry.dl-reaction-open').forEach((entry) => {
      if (!entry.querySelector('.emoji-popover')) entry.classList.remove('dl-reaction-open');
    });

    if (picker) {
      enhancePicker(page, picker);
    } else {
      page.classList.remove('dl-reaction-picker-open');
    }
  }

  function refresh(page = document.querySelector(PAGE_SELECTOR)) {
    if (!page || !document.documentElement.contains(page)) return;
    normalizeReactionTriggers(page);
    syncPicker(page);
  }

  function schedule(page = document.querySelector(PAGE_SELECTOR)) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      refresh(page);
    });
  }

  function attach(page) {
    if (!page || observedPage === page) {
      if (page) schedule(page);
      return;
    }

    observer?.disconnect();
    observedPage = page;
    refresh(page);

    page.addEventListener('click', (event) => {
      const emojiButton = event.target.closest('.emoji-grid button');
      if (emojiButton) {
        const emoji = emojiButton.textContent.trim();
        rememberEmoji(emoji);
        window.setTimeout(() => closePicker(page), 20);
      }
    }, true);

    observer = new MutationObserver((records) => {
      const meaningful = records.some((record) => {
        if (!record.addedNodes.length && !record.removedNodes.length) return false;
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        if (!target) return true;
        return !target.closest?.('.dl-emoji-quick, #dl-reaction-scrim');
      });
      if (meaningful) schedule(page);
    });
    observer.observe(page, { childList: true, subtree: true });
  }

  function waitForPage(attempt = 0) {
    const page = document.querySelector(PAGE_SELECTOR);
    if (page) return attach(page);
    if (attempt < 28 && isCommunityRoute()) {
      window.setTimeout(() => waitForPage(attempt + 1), 70 + attempt * 10);
    }
  }

  function routeChanged() {
    if (!isCommunityRoute()) {
      observer?.disconnect();
      observer = null;
      observedPage = null;
      return;
    }
    waitForPage();
  }

  document.addEventListener('pointerdown', (event) => {
    if (!isCommunityRoute()) return;
    const page = document.querySelector(PAGE_SELECTOR);
    const picker = page?.querySelector('.emoji-popover');
    if (!picker || isCompact()) return;
    if (event.target.closest('.emoji-popover, .reaction-add')) return;
    closePicker(page);
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.querySelector(`${PAGE_SELECTOR} .emoji-popover`)) {
      closePicker();
    }
  });

  window.addEventListener('resize', () => schedule());
  window.addEventListener('hashchange', routeChanged);
  window.addEventListener('popstate', routeChanged);
  window.addEventListener('pageshow', routeChanged);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', routeChanged, { once: true });
  else routeChanged();
})();