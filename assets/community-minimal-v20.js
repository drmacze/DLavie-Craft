(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  let page = null;
  let observer = null;
  let raf = 0;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const lower = value => clean(value).toLowerCase();

  function topChild(root, node) {
    if (!root || !node || !root.contains(node)) return null;
    let current = node;
    while (current.parentElement && current.parentElement !== root) current = current.parentElement;
    return current.parentElement === root ? current : null;
  }

  function username(host) {
    return lower(host.querySelector('.entry-author strong,.comment-author strong,.chat-entry-main strong,.comment-main strong,strong')?.textContent);
  }

  function decorateIdentity(host) {
    if (!(host instanceof HTMLElement)) return;
    const author = host.querySelector('.entry-author,.comment-author');
    if (!author) return;

    author.classList.add('dl-v20-author');
    const name = author.querySelector(':scope > strong') || author.querySelector('strong');
    name?.classList.add('dl-v20-name');

    const developer = username(host) === 'dlaviecom';
    host.classList.toggle('dl-v20-developer', developer);

    author.querySelectorAll('.dl-community-verified').forEach(node => node.classList.add('dl-v20-verified'));
    author.querySelectorAll('.dl-community-role-chip').forEach(node => node.classList.add('dl-v20-role-icon'));
    author.querySelectorAll('.level-chip,.dl-v19-level').forEach(node => node.classList.add('dl-v20-level'));
    author.querySelectorAll('time,.dl-v19-time').forEach(node => node.classList.add('dl-v20-time'));

    [...author.children].forEach(node => {
      if (!(node instanceof HTMLElement)) return;
      if (/diedit|edited|(^|\s)edit($|\s)/i.test(node.textContent || '')) node.classList.add('dl-v20-edited');
    });
  }

  function decoratePlus(scope) {
    scope.querySelectorAll('button').forEach(button => {
      if (clean(button.textContent) === '+') button.classList.add('dl-v20-plus');
    });
  }

  function decorateComposer(composer) {
    if (!(composer instanceof HTMLElement)) return;
    const isReply = !!composer.closest('.post-thread');
    composer.classList.add('dl-v20-composer', isReply ? 'dl-v20-reply-composer' : 'dl-v20-main-composer');

    const textarea = composer.querySelector('textarea');
    const sticker = composer.querySelector('.dl-sticker-compose,button[class*="sticker" i],button[aria-label*="sticker" i]');
    const send = composer.querySelector('button[type="submit"]') || [...composer.querySelectorAll('button')].find(btn => /^kirim$/i.test(clean(btn.textContent)));

    const fieldCell = topChild(composer, textarea);
    const stickerCell = topChild(composer, sticker);
    const sendCell = topChild(composer, send);

    fieldCell?.classList.add('dl-v20-field-cell');
    textarea?.classList.add('dl-v20-field');

    if (sticker) sticker.classList.add('dl-v20-sticker');
    if (send) send.classList.add('dl-v20-send');

    if (stickerCell && sendCell && stickerCell === sendCell) {
      stickerCell.classList.add('dl-v20-actions-cell');
    } else {
      stickerCell?.classList.add('dl-v20-sticker-cell');
      sendCell?.classList.add('dl-v20-send-cell');
    }

    const counter = [...composer.querySelectorAll('span,small,div')].find(node => /^\s*\d+\s*\/\s*\d+\s*$/.test(node.textContent || ''));
    topChild(composer, counter)?.classList.add('dl-v20-counter-cell');
  }

  function decorate(target = page) {
    if (!target?.isConnected) return;
    target.classList.add('dl-community-v20');

    target.querySelectorAll('.typed-feed > .community-entry').forEach(entry => {
      entry.classList.add('dl-v20-entry');
      decorateIdentity(entry);
      decoratePlus(entry);
      entry.querySelectorAll('.post-thread .community-comment').forEach(comment => {
        comment.classList.add('dl-v20-comment');
        decorateIdentity(comment);
        decoratePlus(comment);
      });
      entry.querySelectorAll('.reply-composer,.post-thread form:has(textarea)').forEach(decorateComposer);
    });

    target.querySelectorAll('.quick-chat-composer').forEach(decorateComposer);
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
        return !host?.closest?.('.dl-v20-author,.dl-v20-composer,[data-dl-community-hydration-pulse]');
      });
      if (relevant) schedule();
    });
    observer.observe(target, { childList: true, subtree: true });
    [80, 220, 520, 1000].forEach(delay => setTimeout(() => target === page && schedule(), delay));
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
      if (tries++ < 40) setTimeout(wait, 75 + tries * 5);
    };
    wait();
  }

  document.addEventListener('dlavie:community-hydrate', schedule);
  window.addEventListener('hashchange', route);
  window.addEventListener('pageshow', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();