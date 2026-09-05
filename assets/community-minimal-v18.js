(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  const ROLES = ['builder', 'miner', 'explorer', 'newbie', 'pvp'];
  let page = null;
  let observer = null;
  let raf = 0;
  let generation = 0;

  const norm = value => String(value || '').replace(/\s+/g, ' ').trim();
  const lower = value => norm(value).toLowerCase();

  function roleFrom(host) {
    if (!(host instanceof HTMLElement)) return '';
    for (const role of ROLES) {
      if ([...host.classList].some(cls => cls === `dl-role-${role}` || cls === `dl-v17-role-${role}` || cls === `dl-v16-role-${role}`)) return role;
    }
    const roleNode = host.querySelector('.dl-community-role-chip,.dl-role-badge,.dl-v15-role,.dl-v16-role-source,.dl-v17-role-source');
    const text = lower(roleNode?.textContent);
    return ROLES.find(role => text.includes(role)) || '';
  }

  function applyRole(host, role) {
    if (!host || !role) return;
    ROLES.forEach(item => host.classList.remove(`dl-v18-role-${item}`));
    host.classList.add(`dl-v18-role-${role}`);
    host.dataset.dlV18Role = role;
  }

  function removeNodes(nodes) {
    [...new Set(nodes.filter(Boolean))].forEach(node => node.remove());
  }

  function cleanEdited(author) {
    let edited = false;
    const editedElements = [];

    [...author.childNodes].forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (/\b(?:diedit|edited|edit)\b/i.test(node.textContent || '')) {
          edited = true;
          node.remove();
        }
        return;
      }
      if (!(node instanceof HTMLElement)) return;
      if (node.matches('time,.dl-v18-time,.dl-v18-level,.dl-v18-verified,strong')) return;
      if (node.matches('.edited-chip,.dl-v15-edited,.dl-v16-edited,.dl-v17-edited') || /^\s*[·•]?\s*(?:diedit|edited|edit)\s*$/i.test(node.textContent || '')) {
        edited = true;
        editedElements.push(node);
      }
    });

    removeNodes(editedElements);
    return edited;
  }

  function normalizeAuthor(container, host = container) {
    const author = container.querySelector('.entry-author,.comment-author');
    if (!author) return;
    author.classList.add('dl-v18-author');

    const name = author.querySelector(':scope > strong,.dl-v15-name,.dl-v16-name,.dl-v17-name');
    if (!name) return;
    name.classList.add('dl-v18-name');

    let role = roleFrom(host);
    const roleNodes = [...author.querySelectorAll('.dl-community-role-chip,.dl-role-badge,.dl-v15-role,.dl-v16-role-source,.dl-v17-role-source')];
    if (!role) {
      for (const node of roleNodes) {
        const text = lower(node.textContent);
        role = ROLES.find(item => text.includes(item)) || role;
      }
    }
    removeNodes(roleNodes);
    if (role) {
      applyRole(host, role);
      name.dataset.role = role;
    }

    const verifiedNodes = [...author.querySelectorAll('.dl-community-verified,.dl-v15-verified,.dl-v16-verified,.dl-v17-verified,.dl-v18-verified')];
    const isVerified = verifiedNodes.length > 0;
    removeNodes(verifiedNodes);

    const levelNodes = [...author.querySelectorAll('.level-chip,.dl-v15-level,.dl-v16-level,.dl-v17-level,.dl-v18-level')];
    let levelValue = '';
    for (const node of levelNodes) {
      const match = String(node.textContent || '').match(/\d+/);
      if (match) { levelValue = match[0]; break; }
    }
    removeNodes(levelNodes);

    const edited = cleanEdited(author);

    const times = [...author.querySelectorAll('time,.dl-v15-time,.dl-v16-time,.dl-v17-time,.dl-v18-time')];
    const time = times[0] || null;
    times.slice(1).forEach(node => node.remove());
    if (time) time.classList.add('dl-v18-time');

    let cursor = name;
    if (isVerified) {
      const verified = document.createElement('span');
      verified.className = 'dl-v18-verified';
      verified.setAttribute('aria-label', 'Verified');
      verified.setAttribute('title', 'Verified');
      cursor.after(verified);
      cursor = verified;
    }

    if (levelValue) {
      const level = document.createElement('span');
      level.className = 'dl-v18-level';
      level.textContent = `Lv${levelValue}`;
      cursor.after(level);
      cursor = level;
    }

    if (edited) {
      const editedNode = document.createElement('span');
      editedNode.className = 'dl-v18-edited';
      editedNode.textContent = 'edited';
      cursor.after(editedNode);
    }
  }

  function findButton(scope, predicate) {
    return [...scope.querySelectorAll('button')].find(predicate) || null;
  }

  function cleanEmptyWrapper(node, protectedRoot) {
    if (!(node instanceof HTMLElement) || node === protectedRoot) return;
    if (node.children.length === 0 && norm(node.textContent) === '') node.remove();
  }

  function buildComposerToolbar(composer, kind) {
    if (!(composer instanceof HTMLElement)) return;
    composer.classList.add(kind === 'reply' ? 'dl-v18-reply-composer' : 'dl-v18-main-composer');

    const textarea = composer.querySelector('textarea');
    if (textarea) textarea.classList.add(kind === 'reply' ? 'dl-v18-reply-field' : 'dl-v18-main-field');

    const sticker = composer.querySelector('.dl-sticker-compose') || findButton(composer, btn => /sticker/i.test(btn.textContent || btn.getAttribute('aria-label') || ''));
    const send = composer.querySelector('button[type="submit"]') || findButton(composer, btn => /^\s*kirim\s*$/i.test(btn.textContent || ''));
    if (!sticker && !send) return;

    let toolbar = composer.querySelector(`:scope > .dl-v18-${kind}-toolbar`);
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = `dl-v18-${kind}-toolbar`;
      if (textarea?.parentElement === composer) textarea.after(toolbar);
      else composer.appendChild(toolbar);
    }

    const stickerParent = sticker?.parentElement;
    const sendParent = send?.parentElement;

    if (sticker) {
      sticker.classList.add(kind === 'reply' ? 'dl-v18-reply-sticker' : 'dl-v18-main-sticker');
      toolbar.appendChild(sticker);
    }
    if (send) {
      send.classList.add(kind === 'reply' ? 'dl-v18-reply-send' : 'dl-v18-main-send');
      toolbar.appendChild(send);
    }

    cleanEmptyWrapper(stickerParent, composer);
    if (sendParent !== stickerParent) cleanEmptyWrapper(sendParent, composer);
  }

  function normalizeComment(comment, parentEntry) {
    comment.classList.add('dl-v18-comment');
    let role = roleFrom(comment) || roleFrom(parentEntry);
    if (role) applyRole(comment, role);
    normalizeAuthor(comment, comment);

    [...comment.querySelectorAll('button,a')].forEach(node => {
      if (/^\s*balas\s*$/i.test(node.textContent || '')) node.classList.add('dl-v18-inline-reply');
    });
  }

  function normalizeThread(thread, parentEntry) {
    if (!(thread instanceof HTMLElement)) return;
    thread.classList.add('dl-v18-thread');
    thread.querySelectorAll('.community-comment').forEach(comment => normalizeComment(comment, parentEntry));

    const composer = thread.querySelector('.reply-composer,form:has(textarea)');
    if (composer) {
      buildComposerToolbar(composer, 'reply');
      thread.querySelectorAll('.dl-v18-inline-reply').forEach(node => node.classList.add('dl-v18-inline-reply-open'));
    }

    for (const child of [...thread.children]) {
      if (child.matches('.community-comment,.reply-composer,form')) continue;
      if (child.querySelector?.('.community-comment,textarea')) continue;
      if (/thread|balasan untuk|\d+\s*balasan/i.test(norm(child.textContent))) child.classList.add('dl-v18-thread-heading');
    }
  }

  function normalizeActions(entry) {
    const actions = entry.querySelector(':scope > .dl-v10-actions,.dl-v15-actions,.dl-v16-actions,.dl-v17-actions');
    if (!actions) return;
    actions.classList.add('dl-v18-actions');
    actions.querySelector('.dl-v10-reaction-strip,.dl-v15-reactions,.dl-v16-reactions,.dl-v17-reactions')?.classList.add('dl-v18-reactions');
    actions.querySelectorAll('.dl-v10-chip,.dl-v15-react-chip,.dl-v16-react-chip,.dl-v17-react-chip').forEach(chip => chip.classList.add('dl-v18-react-chip'));
    actions.querySelector('.dl-v10-add,.dl-v15-react-add,.dl-v16-react-add,.dl-v17-react-add')?.classList.add('dl-v18-react-add');
    actions.querySelector('.dl-v10-reply,.dl-v15-reply,.dl-v16-reply,.dl-v17-reply')?.classList.add('dl-v18-reply');
  }

  function normalizeEntry(entry) {
    if (!(entry instanceof HTMLElement)) return;
    entry.classList.add('dl-v18-entry');
    const role = roleFrom(entry);
    if (role) applyRole(entry, role);
    normalizeAuthor(entry, entry);
    normalizeActions(entry);
    entry.querySelectorAll('.post-thread').forEach(thread => normalizeThread(thread, entry));
    const menu = entry.querySelector('.entry-menu,.message-menu,button[aria-label*="menu" i],button[aria-label*="opsi" i]');
    menu?.classList.add('dl-v18-menu');
  }

  function render(target = page) {
    if (!target?.isConnected) return;
    target.classList.add('dl-community-v18');
    target.querySelectorAll('.typed-feed > .community-entry').forEach(normalizeEntry);
    target.querySelectorAll('.quick-chat-composer').forEach(composer => buildComposerToolbar(composer, 'main'));
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
        return !host?.closest?.('.dl-v18-author,.dl-v18-actions,.dl-v18-thread,.dl-v18-main-toolbar,.dl-v18-reply-toolbar,[data-dl-community-hydration-pulse]');
      });
      if (meaningful) schedule(target);
    });
    observer.observe(target, { childList: true, subtree: true });
    [80, 220, 520, 1000, 1800].forEach(delay => setTimeout(() => {
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
      const later = document.querySelector(PAGE);
      if (later) return attach(later);
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