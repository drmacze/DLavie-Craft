(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
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

  function markToolbar(root) {
    const toolbar = root.querySelector('#dl-community-toolbar');
    if (!toolbar) return;
    toolbar.classList.add('dl-v24-toolbar');
  }

  function markComposer(composer) {
    if (!(composer instanceof HTMLElement)) return;
    const textarea = composer.querySelector('textarea');
    if (!textarea) return;

    composer.classList.add('dl-v24-composer');
    const fieldCell = topChild(composer, textarea);
    fieldCell?.classList.add('dl-v24-field-cell');

    const sticker = composer.querySelector('.dl-sticker-compose,button[aria-label*="sticker" i],button[class*="sticker" i]');
    const send = composer.querySelector('button[type="submit"]') || [...composer.querySelectorAll('button')].find(btn => /^kirim$/i.test(clean(btn.textContent)));
    const stickerCell = topChild(composer, sticker);
    const sendCell = topChild(composer, send);

    if (stickerCell && sendCell && stickerCell === sendCell) {
      stickerCell.classList.add('dl-v24-actions-cell');
    } else {
      stickerCell?.classList.add('dl-v24-sticker-cell');
      sendCell?.classList.add('dl-v24-send-cell');
    }

    const counter = [...composer.querySelectorAll('span,small,div')].find(node => /^\s*\d+\s*\/\s*\d+\s*$/.test(node.textContent || ''));
    if (counter instanceof HTMLElement) counter.classList.add('dl-v24-counter');
  }

  function markFeed(root) {
    root.querySelectorAll('.typed-feed > .community-entry').forEach(entry => {
      entry.classList.add('dl-v24-entry');
      entry.querySelectorAll('.reply-composer,.post-thread form:has(textarea)').forEach(markComposer);
    });
  }

  function decorate(root = page) {
    if (!root?.isConnected) return;
    root.classList.add('dl-community-v24');
    markToolbar(root);
    root.querySelectorAll('.quick-chat-composer').forEach(markComposer);
    markFeed(root);
  }

  function schedule() {
    if (!page?.isConnected || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      decorate(page);
    });
  }

  function attach(target) {
    if (!target) return;
    if (target === page) return schedule();

    observer?.disconnect();
    page = target;
    decorate(target);

    observer = new MutationObserver(records => {
      const relevant = records.some(record => {
        const host = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !host?.closest?.('.dl-v24-composer,#dl-community-toolbar');
      });
      if (relevant) schedule();
    });
    observer.observe(target, { childList: true, subtree: true });

    [80, 220, 520, 1000, 1800].forEach(delay => setTimeout(() => target === page && schedule(), delay));
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
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
      if (tries++ < 50) setTimeout(wait, 70 + tries * 5);
    };
    wait();
  }

  document.addEventListener('dlavie:community-hydrate', schedule);
  window.addEventListener('hashchange', route);
  window.addEventListener('pageshow', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();
