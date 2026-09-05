(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  const ROLE_LABELS = {
    builder: 'Builder',
    miner: 'Miner',
    explorer: 'Explorer',
    newbie: 'Newbie',
    pvp: 'PvP'
  };

  let page = null;
  let observer = null;
  let raf = 0;
  let generation = 0;

  function roleOf(node) {
    for (const role of Object.keys(ROLE_LABELS)) {
      if (node.classList.contains(`dl-role-${role}`)) return role;
    }
    return '';
  }

  function simplifyAuthor(container, entry) {
    const author = container.querySelector('.entry-author,.comment-author');
    if (!author) return;
    author.classList.add('dl-v16-author');

    const role = roleOf(entry);
    const name = author.querySelector(':scope > strong,.dl-v15-name');
    if (name) {
      name.classList.add('dl-v16-name');
      if (role) {
        name.dataset.role = role;
        name.setAttribute('title', `${name.textContent?.trim() || 'Crafter'} · ${ROLE_LABELS[role]}`);
      }
    }

    const roleChip = author.querySelector(':scope > .dl-community-role-chip,.dl-v15-role');
    if (roleChip) {
      roleChip.classList.add('dl-v16-role-source');
      roleChip.setAttribute('aria-hidden', 'true');
      if (role) roleChip.setAttribute('title', ROLE_LABELS[role]);
    }

    const verified = author.querySelector(':scope > .dl-community-verified,.dl-v15-verified');
    if (verified) {
      verified.classList.add('dl-v16-verified');
      const label = verified.querySelector('strong')?.textContent?.trim() || verified.getAttribute('title') || 'Verified';
      verified.setAttribute('title', label);
      verified.setAttribute('aria-label', label);
    }

    const levels = [...author.querySelectorAll(':scope > .level-chip,.dl-v15-level')];
    levels.slice(1).forEach(node => node.remove());
    const level = levels[0];
    if (level) {
      level.classList.add('dl-v16-level');
      level.textContent = String(level.textContent || '').replace(/\s+/g, ' ').trim().replace(/^level\s*/i, 'Lv ');
    }

    const time = author.querySelector(':scope > time,.dl-v15-time');
    if (time) time.classList.add('dl-v16-time');

    const edited = [...author.children].find(node => /diedit|edited/i.test(node.textContent || ''));
    if (edited && edited !== time && edited !== name) {
      edited.classList.add('dl-v16-edited');
      edited.textContent = '· edit';
    }
  }

  function simplifyThread(thread) {
    if (!(thread instanceof HTMLElement)) return;
    thread.classList.add('dl-v16-thread');

    const firstComment = thread.querySelector('.community-comment');
    if (firstComment) {
      for (const child of [...thread.children]) {
        if (child === firstComment || child.contains(firstComment)) break;
        if (child.matches('form,.reply-composer') || child.querySelector('textarea,input,button[type="submit"]')) continue;
        const text = String(child.textContent || '').replace(/\s+/g, ' ').trim();
        if (/thread|balasan untuk|\d+\s*balasan/i.test(text)) {
          child.classList.add('dl-v16-thread-redundant');
          child.setAttribute('aria-hidden', 'true');
        }
      }
    }

    thread.querySelectorAll('.community-comment').forEach(comment => simplifyAuthor(comment, comment));
  }

  function simplifyActions(entry) {
    const actions = entry.querySelector(':scope > .dl-v10-actions,.dl-v15-actions');
    if (!actions) return;
    actions.classList.add('dl-v16-actions');
    actions.querySelector('.dl-v10-reaction-strip,.dl-v15-reactions')?.classList.add('dl-v16-reactions');
    actions.querySelectorAll('.dl-v10-chip,.dl-v15-react-chip').forEach(chip => chip.classList.add('dl-v16-react-chip'));
    actions.querySelector('.dl-v10-add,.dl-v15-react-add')?.classList.add('dl-v16-react-add');
    actions.querySelector('.dl-v10-reply,.dl-v15-reply')?.classList.add('dl-v16-reply');
  }

  function simplifyEntry(entry) {
    if (!(entry instanceof HTMLElement)) return;
    entry.classList.add('dl-v16-entry');
    const role = roleOf(entry);
    if (role) entry.dataset.dlV16Role = role;
    simplifyAuthor(entry, entry);
    simplifyActions(entry);
    const menu = entry.querySelector('.entry-menu,.message-menu,button[aria-label*="menu" i],button[aria-label*="opsi" i]');
    menu?.classList.add('dl-v16-menu');
    entry.querySelectorAll('.post-thread').forEach(simplifyThread);
  }

  function render(target = page) {
    if (!target?.isConnected) return;
    target.classList.add('dl-community-v16');
    target.querySelectorAll('.typed-feed > .community-entry').forEach(simplifyEntry);
  }

  function schedule(target = page) {
    if (!target?.isConnected || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render(target);
    });
  }

  function attach(target) {
    if (!target) return;
    if (target === page) return schedule(target);
    generation += 1;
    const token = generation;
    observer?.disconnect();
    page = target;
    render(target);
    observer = new MutationObserver(records => {
      if (token !== generation || target !== page) return;
      const meaningful = records.some(record => {
        const host = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !host?.closest?.('.dl-v16-author,.dl-v16-actions,.dl-v16-thread,[data-dl-community-hydration-pulse]');
      });
      if (meaningful) schedule(target);
    });
    observer.observe(target, { childList: true, subtree: true });
    [80, 220, 520, 1000].forEach(delay => setTimeout(() => {
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