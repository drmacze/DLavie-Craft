(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  let page = null;
  let observer = null;
  let raf = 0;

  const text = node => String(node?.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function topChild(root, node) {
    if (!root || !node || !root.contains(node)) return null;
    let cur = node;
    while (cur.parentElement && cur.parentElement !== root) cur = cur.parentElement;
    return cur.parentElement === root ? cur : null;
  }

  function markToolbar(root) {
    root.querySelectorAll('input').forEach(input => {
      const hint = `${input.placeholder || ''} ${input.getAttribute('aria-label') || ''}`.toLowerCase();
      if (!hint.includes('cari di ruang')) return;
      let host = input.parentElement;
      for (let i = 0; host && i < 6; i++, host = host.parentElement) {
        const labels = [...host.querySelectorAll('button')].map(text);
        if (labels.some(v => v.includes('terbaru')) && labels.some(v => v.includes('ringkas')) && labels.some(v => v === 'info' || v.includes('info'))) {
          host.classList.add('dl-v22-toolbar');
          input.classList.add('dl-v22-search');
          host.querySelectorAll('button').forEach(btn => {
            const label = text(btn);
            if (label.includes('terbaru')) btn.classList.add('dl-v22-filter','is-latest');
            else if (label.includes('ringkas')) btn.classList.add('dl-v22-filter','is-summary');
            else if (label === 'info' || label.includes('info')) btn.classList.add('dl-v22-filter','is-info');
          });
          break;
        }
      }
    });
  }

  function markComposer(composer) {
    if (!(composer instanceof HTMLElement)) return;
    const textarea = composer.querySelector('textarea');
    if (!textarea) return;
    composer.classList.add('dl-v22-composer');
    if (composer.closest('.post-thread')) composer.classList.add('is-reply');
    else composer.classList.add('is-main');

    const sticker = composer.querySelector('.dl-sticker-compose,button[aria-label*="sticker" i],button[class*="sticker" i]');
    const send = composer.querySelector('button[type="submit"]') || [...composer.querySelectorAll('button')].find(btn => /^kirim$/i.test(text(btn)));
    const counter = [...composer.querySelectorAll('span,small,div')].find(node => /^\s*\d+\s*\/\s*\d+\s*$/.test(node.textContent || ''));

    textarea.classList.add('dl-v22-field');
    topChild(composer, textarea)?.classList.add('dl-v22-field-cell');
    if (sticker) {
      sticker.classList.add('dl-v22-sticker');
      topChild(composer, sticker)?.classList.add('dl-v22-sticker-cell');
    }
    if (send) {
      send.classList.add('dl-v22-send');
      topChild(composer, send)?.classList.add('dl-v22-send-cell');
    }
    if (counter) topChild(composer, counter)?.classList.add('dl-v22-counter-cell');
  }

  function markEntries(root) {
    root.querySelectorAll('.typed-feed > .community-entry').forEach(entry => {
      entry.classList.add('dl-v22-entry');
      entry.querySelectorAll('.dl-v10-actions').forEach(row => row.classList.add('dl-v22-actions'));
      entry.querySelectorAll('.dl-v10-reply').forEach(btn => btn.classList.add('dl-v22-reply'));
      entry.querySelectorAll('.dl-v10-add,button').forEach(btn => {
        const label = text(btn);
        if (btn.classList.contains('dl-v10-add') || label === '+' || /tambah reaction/i.test(btn.getAttribute('aria-label') || '')) btn.classList.add('dl-v22-plus');
      });
      entry.querySelectorAll('.reply-composer,.post-thread form:has(textarea)').forEach(markComposer);
    });
  }

  function decorate(root = page) {
    if (!root?.isConnected) return;
    root.classList.add('dl-community-v22');
    markToolbar(root);
    root.querySelectorAll('.quick-chat-composer').forEach(markComposer);
    markEntries(root);
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
      const meaningful = records.some(record => {
        const host = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !host?.closest?.('.dl-v22-composer,.dl-v22-toolbar,.dl-v10-actions');
      });
      if (meaningful) schedule();
    });
    observer.observe(target, { childList: true, subtree: true });
    [100, 280, 650, 1200].forEach(delay => setTimeout(() => target === page && schedule(), delay));
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
