(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  const ROLES = ['builder', 'miner', 'explorer', 'newbie', 'pvp'];
  let page = null;
  let observer = null;
  let raf = 0;
  let pulses = [];

  const norm = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function roleFrom(host) {
    if (!(host instanceof HTMLElement)) return '';
    for (const role of ROLES) {
      if (host.classList.contains(`dl-role-${role}`)) return role;
      if (host.classList.contains(`dl-v19-role-${role}`)) return role;
    }
    const chip = host.querySelector('.dl-community-role-chip,.dl-role-badge');
    const text = norm(chip?.textContent);
    return ROLES.find(role => text.includes(role)) || '';
  }

  function markRole(host) {
    if (!(host instanceof HTMLElement)) return;
    const role = roleFrom(host);
    ROLES.forEach(item => host.classList.remove(`dl-v19-role-${item}`));
    if (role) host.classList.add(`dl-v19-role-${role}`);
  }

  function decorateAuthor(scope) {
    const author = scope.querySelector('.entry-author,.comment-author');
    if (!author) return;
    author.classList.add('dl-v19-author');
    author.querySelector(':scope > strong')?.classList.add('dl-v19-name');
    author.querySelector(':scope > time')?.classList.add('dl-v19-time');
    author.querySelectorAll(':scope > .level-chip').forEach(node => node.classList.add('dl-v19-level'));
    author.querySelectorAll(':scope > .dl-community-verified').forEach(node => node.classList.add('dl-v19-verified'));
    author.querySelectorAll(':scope > .dl-community-role-chip').forEach(node => node.classList.add('dl-v19-role-source'));

    [...author.children].forEach(node => {
      if (!(node instanceof HTMLElement)) return;
      if (/diedit|edited|(^|\s)edit($|\s)/i.test(node.textContent || '')) node.classList.add('dl-v19-edited');
    });
  }

  function decorateEntry(entry) {
    if (!(entry instanceof HTMLElement)) return;
    entry.classList.add('dl-v19-entry');
    markRole(entry);
    decorateAuthor(entry);
    entry.querySelectorAll('.post-thread').forEach(thread => {
      thread.classList.add('dl-v19-thread');
      thread.querySelectorAll('.community-comment').forEach(comment => {
        comment.classList.add('dl-v19-comment');
        markRole(comment);
        if (!roleFrom(comment)) {
          const parentRole = roleFrom(entry);
          if (parentRole) comment.classList.add(`dl-v19-role-${parentRole}`);
        }
        decorateAuthor(comment);
      });
      thread.querySelector('.reply-composer,form:has(textarea)')?.classList.add('dl-v19-reply-composer');
    });

    const actions = entry.querySelector(':scope > .dl-v10-actions');
    if (actions) {
      actions.classList.add('dl-v19-actions');
      actions.querySelector('.dl-v10-reaction-strip')?.classList.add('dl-v19-reactions');
      actions.querySelectorAll('.dl-v10-chip').forEach(node => node.classList.add('dl-v19-react-chip'));
      actions.querySelector('.dl-v10-add')?.classList.add('dl-v19-react-add');
      actions.querySelector('.dl-v10-reply')?.classList.add('dl-v19-reply');
    }
  }

  function decorate(target = page) {
    if (!target?.isConnected) return;
    target.classList.add('dl-community-v19');
    target.querySelectorAll('.typed-feed > .community-entry').forEach(decorateEntry);
    target.querySelectorAll('.quick-chat-composer').forEach(node => node.classList.add('dl-v19-main-composer'));
  }

  function hydrate(target = page) {
    if (!target?.isConnected) return;
    document.dispatchEvent(new CustomEvent('dlavie:community-hydrate'));
  }

  function schedule(target = page, emit = false) {
    if (!target?.isConnected || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      decorate(target);
      if (emit) hydrate(target);
    });
  }

  function clearPulses() {
    pulses.forEach(id => clearTimeout(id));
    pulses = [];
  }

  function attach(target) {
    if (!target) return;
    if (target === page) return schedule(target, true);
    observer?.disconnect();
    clearPulses();
    page = target;
    decorate(target);
    hydrate(target);

    observer = new MutationObserver(records => {
      const relevant = records.some(record => {
        const host = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !host?.closest?.('.dl-v10-actions,.dl-community-avatar-slot-v3,.dl-community-role-chip,.dl-community-verified');
      });
      if (relevant) schedule(target, true);
    });
    observer.observe(target, { childList: true, subtree: true });

    [80, 220, 520, 1000, 1600].forEach(delay => {
      pulses.push(setTimeout(() => {
        if (target === page && target.isConnected) {
          decorate(target);
          hydrate(target);
        }
      }, delay));
    });
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
      observer?.disconnect();
      observer = null;
      clearPulses();
      page = null;
      return;
    }
    const found = document.querySelector(PAGE);
    if (found) return attach(found);
    let tries = 0;
    const wait = () => {
      const next = document.querySelector(PAGE);
      if (next) return attach(next);
      if (tries++ < 40) setTimeout(wait, 70 + tries * 5);
    };
    wait();
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('pageshow', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();
