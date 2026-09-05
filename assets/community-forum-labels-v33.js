(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  let observer = null;
  let pageRef = null;
  let raf = 0;
  let clickHost = null;

  const clean = value => String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  function professionalLabel(value) {
    const text = clean(value);
    if (!text) return '';
    if (/obrolan|percakapan|general|global\s*chat/.test(text)) return 'General';
    if (/showcase|galeri|gallery|karya/.test(text)) return 'Showcase';
    if (/bantuan|help|support/.test(text)) return 'Support';
    if (/feedback|saran|masukan/.test(text)) return 'Feedback';
    if (/pengumuman|announcement|update|news/.test(text)) return 'Updates';
    if (/level|rank|ranking|leaderboard/.test(text)) return 'Ranks';
    return String(value || '').trim();
  }

  function hideNativeForumText(button) {
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      const parent = node.parentElement;
      if (!parent || parent.closest('.dl-v33-forum-raw,.dl-v33-forum-display,svg,.forum-nav-icon,.dl-canon-icon-v9')) return;
      const text = (node.nodeValue || '').trim();
      if (!text || /^\d+$/.test(text)) return;
      if (!/[a-zA-ZÀ-ÿ]/.test(text)) return;

      const span = document.createElement('span');
      span.className = 'dl-v33-forum-raw';
      span.setAttribute('aria-hidden', 'true');
      node.parentNode.insertBefore(span, node);
      span.appendChild(node);
    });
  }

  function decorateButton(button) {
    if (!(button instanceof HTMLElement)) return;

    const raw = button.dataset.dlForumRaw || button.textContent || '';
    if (!button.dataset.dlForumRaw) button.dataset.dlForumRaw = raw.trim();
    const label = professionalLabel(button.dataset.dlForumRaw);
    if (!label) return;

    button.dataset.dlForumLabel = label;
    button.setAttribute('aria-label', label);
    button.title = label;

    hideNativeForumText(button);

    let display = button.querySelector(':scope > .dl-v33-forum-display');
    if (!display) {
      display = document.createElement('span');
      display.className = 'dl-v33-forum-display';
      display.setAttribute('aria-hidden', 'true');
      button.appendChild(display);
    }
    display.dataset.label = label;
  }

  function getActiveButton(target) {
    return target.querySelector([
      '.forum-sidebar nav button.active',
      '.forum-sidebar nav button[aria-selected="true"]',
      '.forum-sidebar nav button[aria-current="page"]',
      '.forum-sidebar nav button[aria-pressed="true"]',
      '.forum-sidebar nav button[data-active="true"]'
    ].join(','));
  }

  function syncActiveHeading(target) {
    const heading = target.querySelector('.active-forum-head h2');
    if (!heading) return;

    const active = getActiveButton(target);
    let label = active?.dataset.dlForumLabel || '';

    // Never reuse the old heading data as the source of truth. React may keep
    // the same h2 node while switching forums, which caused General to stick.
    if (!label) label = professionalLabel(heading.textContent || '');
    if (!label) return;

    heading.dataset.dlForumLabel = label;
    heading.setAttribute('aria-label', label);
    target.dataset.dlActiveForumLabel = label;
  }

  function decorate(target) {
    if (!target?.isConnected) return;
    target.querySelectorAll('.forum-sidebar nav button').forEach(decorateButton);
    syncActiveHeading(target);
  }

  function schedule(target = document.querySelector(PAGE)) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (target?.isConnected) decorate(target);
    });
  }

  function settle(target) {
    schedule(target);
    setTimeout(() => schedule(target), 40);
    setTimeout(() => schedule(target), 120);
    setTimeout(() => schedule(target), 260);
  }

  function onNavClick(event) {
    if (!event.target.closest('.forum-sidebar nav button')) return;
    const target = event.currentTarget;
    settle(target);
  }

  function attach(target) {
    if (!target) return;
    if (pageRef === target) return settle(target);

    observer?.disconnect();
    if (clickHost) clickHost.removeEventListener('click', onNavClick, true);

    pageRef = target;
    clickHost = target;
    target.addEventListener('click', onNavClick, true);
    settle(target);

    observer = new MutationObserver(records => {
      const meaningful = records.some(record => {
        const node = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !node?.closest?.('.dl-v33-forum-raw,.dl-v33-forum-display');
      });
      if (meaningful) schedule(target);
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'aria-selected', 'aria-current', 'aria-pressed', 'data-active']
    });
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
      observer?.disconnect();
      observer = null;
      if (clickHost) clickHost.removeEventListener('click', onNavClick, true);
      clickHost = null;
      pageRef = null;
      return;
    }

    let tries = 0;
    const wait = () => {
      const target = document.querySelector(PAGE);
      if (target) return attach(target);
      if (tries++ < 40) setTimeout(wait, 80 + tries * 6);
    };
    wait();
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  window.addEventListener('pageshow', route);
  document.addEventListener('dlavie:community-hydrate', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();
