(() => {
  'use strict';

  const PAGE_SELECTOR = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  let page = null;
  let observer = null;
  let raf = 0;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  function topChild(root, node) {
    if (!root || !node || !root.contains(node)) return null;
    let current = node;
    while (current.parentElement && current.parentElement !== root) current = current.parentElement;
    return current.parentElement === root ? current : null;
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

  function markActions(root) {
    root.querySelectorAll('.typed-feed > .community-entry').forEach(entry => {
      entry.querySelectorAll('button').forEach(button => {
        const label = clean(button.textContent);
        const aria = button.getAttribute('aria-label') || '';
        if (label === '+' || /tambah reaction/i.test(aria)) button.classList.add('dl-v26-plus');
      });
      entry.querySelectorAll('.reply-composer,.post-thread form:has(textarea)').forEach(markComposer);
    });
  }

  function decorate() {
    if (!page?.isConnected) return;
    page.classList.add('dl-community-v26');
    page.querySelectorAll('.quick-chat-composer').forEach(markComposer);
    markActions(page);
  }

  function schedule() {
    if (!page?.isConnected || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      decorate();
    });
  }

  function attach(next) {
    if (!next) return;
    if (next === page) return schedule();

    observer?.disconnect();
    page = next;
    decorate();

    observer = new MutationObserver(records => {
      const relevant = records.some(record => {
        const host = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !host?.closest?.('.dl-v26-composer');
      });
      if (relevant) schedule();
    });
    observer.observe(page, { childList: true, subtree: true });

    [120, 360, 900].forEach(delay => setTimeout(() => page === next && schedule(), delay));
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
      observer?.disconnect();
      observer = null;
      page = null;
      return;
    }

    const found = document.querySelector(PAGE_SELECTOR);
    if (found) return attach(found);

    let tries = 0;
    const wait = () => {
      const next = document.querySelector(PAGE_SELECTOR);
      if (next) return attach(next);
      if (tries++ < 40) setTimeout(wait, 75 + tries * 4);
    };
    wait();
  }

  document.addEventListener('dlavie:community-hydrate', schedule);
  window.addEventListener('hashchange', route);
  window.addEventListener('pageshow', route);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();
