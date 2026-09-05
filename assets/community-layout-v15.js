(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  let observer = null;
  let page = null;
  let raf = 0;
  let generation = 0;

  function topChild(root, node) {
    if (!root || !node || !root.contains(node)) return null;
    let current = node;
    while (current.parentElement && current.parentElement !== root) current = current.parentElement;
    return current.parentElement === root ? current : null;
  }

  function markCounter(composer) {
    const candidates = [...composer.querySelectorAll('span,small,div')];
    const node = candidates.find(el => /^\s*\d+\s*\/\s*\d+\s*$/.test(el.textContent || ''));
    const cell = topChild(composer, node);
    if (cell) cell.classList.add('dl-v15-compose-counter');
  }

  function decorateComposer(scope) {
    scope.querySelectorAll('.quick-chat-composer').forEach(composer => {
      composer.classList.add('dl-v15-composer');
      const textarea = composer.querySelector('textarea');
      const sticker = composer.querySelector('.dl-sticker-compose,button[class*="sticker" i]');
      const send = composer.querySelector('button[type="submit"]');
      const fieldCell = topChild(composer, textarea);
      const stickerCell = topChild(composer, sticker);
      const sendCell = topChild(composer, send);
      if (fieldCell) fieldCell.classList.add('dl-v15-compose-field');
      if (stickerCell && sendCell && stickerCell === sendCell) {
        stickerCell.classList.add('dl-v15-compose-actions');
      } else {
        stickerCell?.classList.add('dl-v15-sticker-cell');
        sendCell?.classList.add('dl-v15-send-cell');
      }
      markCounter(composer);
    });
  }

  function dedupeDirect(owner, selector) {
    const items = [...owner.querySelectorAll(`:scope > ${selector}`)];
    items.slice(1).forEach(node => node.remove());
    return items[0] || null;
  }

  function decorateAuthor(entry) {
    const author = entry.querySelector('.entry-author,.comment-author');
    if (!author) return;
    author.classList.add('dl-v15-author');

    const name = author.querySelector(':scope > strong');
    if (name) name.classList.add('dl-v15-name');

    const verified = dedupeDirect(author, '.dl-community-verified');
    const role = dedupeDirect(author, '.dl-community-role-chip');
    const levels = [...author.querySelectorAll(':scope > .level-chip')];
    levels.slice(1).forEach(node => node.remove());
    const level = levels[0] || null;
    const time = author.querySelector(':scope > time');
    const edited = [...author.children].find(node => /diedit|edited/i.test(node.textContent || '')) || null;

    verified?.classList.add('dl-v15-verified');
    role?.classList.add('dl-v15-role');
    level?.classList.add('dl-v15-level');
    time?.classList.add('dl-v15-time');
    if (edited && edited !== time) edited.classList.add('dl-v15-edited');
  }

  function decorateActions(entry) {
    const row = entry.querySelector(':scope > .dl-v10-actions');
    if (!row) return;
    row.classList.add('dl-v15-actions');
    row.querySelector('.dl-v10-reaction-strip')?.classList.add('dl-v15-reactions');
    row.querySelector('.dl-v10-reply')?.classList.add('dl-v15-reply');
    row.querySelector('.dl-v10-add')?.classList.add('dl-v15-react-add');
    row.querySelectorAll('.dl-v10-chip').forEach(chip => chip.classList.add('dl-v15-react-chip'));
  }

  function decorateEntry(entry) {
    entry.classList.add('dl-v15-entry');
    decorateAuthor(entry);
    decorateActions(entry);
    entry.querySelector('.post-thread')?.classList.add('dl-v15-thread');
    const menu = entry.querySelector('.entry-menu,.message-menu,button[aria-label*="menu" i],button[aria-label*="opsi" i]');
    menu?.classList.add('dl-v15-menu');
  }

  function render(target = page) {
    if (!target?.isConnected) return;
    target.classList.add('dl-community-v15');
    target.querySelectorAll('.typed-feed > .community-entry').forEach(decorateEntry);
    target.querySelectorAll('.post-thread .community-comment').forEach(decorateAuthor);
    decorateComposer(target);
  }

  function schedule(target = page) {
    if (!target?.isConnected || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render(target);
    });
  }

  function attach(target) {
    if (!target || target === page) return schedule(target);
    generation += 1;
    const token = generation;
    observer?.disconnect();
    page = target;
    render(target);
    observer = new MutationObserver(records => {
      if (token !== generation || target !== page) return;
      const meaningful = records.some(record => {
        const host = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !host?.closest?.('.dl-v15-actions,.dl-v15-author,.dl-v15-composer,[data-dl-community-hydration-pulse]');
      });
      if (meaningful) schedule(target);
    });
    observer.observe(target, { childList: true, subtree: true });
    [80, 220, 520, 1100].forEach(delay => setTimeout(() => {
      if (token === generation && target === page) schedule(target);
    }, delay));
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
      generation += 1;
      observer?.disconnect();
      observer = null;
      page = null;
      return;
    }
    const found = document.querySelector(PAGE);
    if (found) return attach(found);
    let tries = 0;
    const wait = () => {
      const next = document.querySelector(PAGE);
      if (next) return attach(next);
      if (tries++ < 40) setTimeout(wait, 75 + tries * 5);
    };
    wait();
  }

  document.addEventListener('dlavie:community-hydrate', () => schedule());
  document.addEventListener('dlavie:collector-ready', () => schedule());
  document.addEventListener('dlavie:collector-profile-changed', () => schedule());
  window.addEventListener('hashchange', route);
  window.addEventListener('pageshow', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();
