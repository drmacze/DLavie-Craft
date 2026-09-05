(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  const ROLES = ['builder','miner','explorer','newbie','pvp'];
  let page = null;
  let observer = null;
  let raf = 0;
  let generation = 0;

  const norm = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function roleFrom(node) {
    if (!(node instanceof HTMLElement)) return '';
    for (const role of ROLES) {
      if (node.classList.contains(`dl-role-${role}`) || node.classList.contains(`dl-v17-role-${role}`)) return role;
    }
    const chip = node.querySelector('.dl-community-role-chip,.dl-role-badge');
    const text = norm(chip?.textContent);
    return ROLES.find(role => text.includes(role)) || '';
  }

  function applyRole(host, role) {
    if (!host || !role) return;
    ROLES.forEach(item => host.classList.remove(`dl-v17-role-${item}`));
    host.classList.add(`dl-v17-role-${role}`);
    host.dataset.dlV17Role = role;
  }

  function simplifyVerified(author) {
    const all = [...author.querySelectorAll('.dl-community-verified,.dl-v15-verified,.dl-v16-verified')];
    all.slice(1).forEach(node => node.remove());
    const verified = all[0];
    if (!verified) return;
    verified.classList.add('dl-v17-verified');
    const title = verified.getAttribute('aria-label') || verified.getAttribute('title') || norm(verified.textContent) || 'Verified';
    verified.setAttribute('title', title);
    verified.setAttribute('aria-label', title);
  }

  function simplifyRole(author, host) {
    const chips = [...author.querySelectorAll('.dl-community-role-chip,.dl-v15-role,.dl-v16-role-source')];
    let role = roleFrom(host);
    if (!role) {
      for (const chip of chips) {
        const text = norm(chip.textContent);
        const found = ROLES.find(item => text.includes(item));
        if (found) { role = found; break; }
      }
    }
    chips.forEach(chip => {
      chip.classList.add('dl-v17-role-source');
      chip.hidden = true;
      chip.setAttribute('aria-hidden', 'true');
    });
    if (role) applyRole(host, role);
    return role;
  }

  function simplifyAuthor(container, host = container) {
    const author = container.querySelector('.entry-author,.comment-author');
    if (!author) return;
    author.classList.add('dl-v17-author');

    const name = author.querySelector(':scope > strong,.dl-v16-name,.dl-v15-name');
    if (name) name.classList.add('dl-v17-name');

    const role = simplifyRole(author, host);
    if (role && name) name.dataset.role = role;
    simplifyVerified(author);

    const levels = [...author.querySelectorAll('.level-chip,.dl-v15-level,.dl-v16-level')];
    levels.slice(1).forEach(node => node.remove());
    if (levels[0]) {
      levels[0].classList.add('dl-v17-level');
      const number = String(levels[0].textContent || '').match(/\d+/)?.[0];
      if (number) levels[0].textContent = `Lv${number}`;
    }

    const times = [...author.querySelectorAll('time,.dl-v15-time,.dl-v16-time')];
    times.slice(1).forEach(node => node.remove());
    times[0]?.classList.add('dl-v17-time');

    [...author.children].forEach(node => {
      if (node === name || node === levels[0] || node === times[0] || node.classList.contains('dl-v17-verified') || node.classList.contains('dl-v17-role-source')) return;
      if (/diedit|edited|·\s*edit/i.test(node.textContent || '')) {
        node.classList.add('dl-v17-edited');
        node.textContent = 'edited';
      }
    });
  }

  function simplifyThread(thread, parentEntry) {
    if (!(thread instanceof HTMLElement)) return;
    thread.classList.add('dl-v17-thread');
    thread.querySelectorAll('.community-comment').forEach(comment => {
      comment.classList.add('dl-v17-comment');
      let role = roleFrom(comment);
      if (!role) {
        const chip = comment.querySelector('.dl-community-role-chip,.dl-role-badge');
        const text = norm(chip?.textContent);
        role = ROLES.find(item => text.includes(item)) || '';
      }
      if (!role) role = roleFrom(parentEntry);
      if (role) applyRole(comment, role);
      simplifyAuthor(comment, comment);
    });

    const composer = thread.querySelector('.reply-composer,form:has(textarea)');
    if (composer) {
      composer.classList.add('dl-v17-reply-composer');
      const textarea = composer.querySelector('textarea');
      const sticker = composer.querySelector('.dl-sticker-compose,button[class*="sticker" i]');
      const send = composer.querySelector('button[type="submit"],.button[type="submit"]');
      textarea?.classList.add('dl-v17-reply-field');
      sticker?.classList.add('dl-v17-reply-sticker');
      send?.classList.add('dl-v17-reply-send');
    }
  }

  function simplifyEntry(entry) {
    if (!(entry instanceof HTMLElement)) return;
    entry.classList.add('dl-v17-entry');
    const role = roleFrom(entry);
    if (role) applyRole(entry, role);
    simplifyAuthor(entry, entry);
    entry.querySelectorAll('.post-thread').forEach(thread => simplifyThread(thread, entry));

    const menu = entry.querySelector('.entry-menu,.message-menu,button[aria-label*="menu" i],button[aria-label*="opsi" i]');
    menu?.classList.add('dl-v17-menu');

    const actions = entry.querySelector(':scope > .dl-v10-actions,.dl-v15-actions,.dl-v16-actions');
    if (actions) {
      actions.classList.add('dl-v17-actions');
      actions.querySelector('.dl-v10-reaction-strip,.dl-v15-reactions,.dl-v16-reactions')?.classList.add('dl-v17-reactions');
      actions.querySelectorAll('.dl-v10-chip,.dl-v15-react-chip,.dl-v16-react-chip').forEach(chip => chip.classList.add('dl-v17-react-chip'));
      actions.querySelector('.dl-v10-add,.dl-v15-react-add,.dl-v16-react-add')?.classList.add('dl-v17-react-add');
      actions.querySelector('.dl-v10-reply,.dl-v15-reply,.dl-v16-reply')?.classList.add('dl-v17-reply');
    }
  }

  function simplifyMainComposer(target) {
    target.querySelectorAll('.quick-chat-composer').forEach(composer => {
      composer.classList.add('dl-v17-main-composer');
      composer.querySelector('textarea')?.classList.add('dl-v17-main-field');
      composer.querySelector('.dl-sticker-compose,button[class*="sticker" i]')?.classList.add('dl-v17-main-sticker');
      composer.querySelector('button[type="submit"]')?.classList.add('dl-v17-main-send');
    });
  }

  function render(target = page) {
    if (!target?.isConnected) return;
    target.classList.add('dl-community-v17');
    target.querySelectorAll('.typed-feed > .community-entry').forEach(simplifyEntry);
    simplifyMainComposer(target);
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
        return !host?.closest?.('.dl-v17-author,.dl-v17-actions,.dl-v17-thread,[data-dl-community-hydration-pulse]');
      });
      if (meaningful) schedule(target);
    });
    observer.observe(target, { childList: true, subtree: true });
    [80,220,520,1000,1600].forEach(delay => setTimeout(() => {
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
      const foundLater = document.querySelector(PAGE);
      if (foundLater) return attach(foundLater);
      if (tries++ < 40) setTimeout(wait, 70 + tries * 5);
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