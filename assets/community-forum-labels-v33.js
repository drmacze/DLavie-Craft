(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  let observer = null;
  let pageRef = null;
  let raf = 0;

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

  function decorate(target) {
    if (!target?.isConnected) return;

    target.querySelectorAll('.forum-sidebar nav button strong').forEach(strong => {
      const raw = strong.dataset.dlForumRaw || strong.textContent || '';
      if (!strong.dataset.dlForumRaw) strong.dataset.dlForumRaw = raw.trim();
      const label = professionalLabel(raw);
      if (!label) return;
      strong.dataset.dlForumLabel = label;
      const button = strong.closest('button');
      if (button) {
        button.setAttribute('aria-label', label);
        button.title = label;
      }
    });

    const heading = target.querySelector('.active-forum-head h2');
    if (heading) {
      const raw = heading.dataset.dlForumRaw || heading.textContent || '';
      if (!heading.dataset.dlForumRaw) heading.dataset.dlForumRaw = raw.trim();
      const label = professionalLabel(raw);
      if (label) {
        heading.dataset.dlForumLabel = label;
        heading.setAttribute('aria-label', label);
      }
    }
  }

  function schedule(target = document.querySelector(PAGE)) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (target?.isConnected) decorate(target);
    });
  }

  function attach(target) {
    if (!target) return;
    if (pageRef === target) return schedule(target);
    observer?.disconnect();
    pageRef = target;
    schedule(target);
    observer = new MutationObserver(records => {
      const meaningful = records.some(record => {
        const node = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !node?.closest?.('[data-dl-forum-label]');
      });
      if (meaningful) schedule(target);
    });
    observer.observe(target, { childList: true, subtree: true, characterData: true });
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
      observer?.disconnect();
      observer = null;
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
