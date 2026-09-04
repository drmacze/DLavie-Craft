(() => {
  'use strict';

  const MAP = [
    [/sticker studio/i,'slime'], [/sticker/i,'slime'], [/explore|jelajah/i,'compass'], [/berita|news/i,'book'],
    [/komunitas|community/i,'chat'], [/akun|account|profile/i,'chest'], [/bantuan|support/i,'lifebuoy'],
    [/saran|ide|feedback/i,'redstone'], [/pengumuman|announcement/i,'bell'], [/obrolan|chat/i,'chat'],
    [/showcase/i,'painting'], [/level|peringkat|rank/i,'emerald'], [/terbaru|latest/i,'beacon'],
    [/ringkas|summary/i,'map'], [/info/i,'book'], [/syarat|ketentuan|terms/i,'book'], [/privasi|privacy/i,'shield'],
    [/rules|peraturan/i,'sword'], [/keluar|logout/i,'door'], [/download|unduh/i,'chest-down'], [/upload/i,'chest-up'],
    [/kirim|send/i,'paper'], [/edit|ubah/i,'anvil'], [/hapus|delete|trash/i,'lava'], [/report|lapor/i,'tnt'],
    [/cari|search/i,'spyglass'], [/pengaturan|settings|setting/i,'gear'], [/login|masuk/i,'door'], [/daftar|register/i,'craft'],
    [/email|mail/i,'mail'], [/password|kata sandi/i,'lock'], [/builder/i,'craft'], [/miner/i,'pickaxe'],
    [/explorer/i,'compass'], [/newbie/i,'grass'], [/pvp/i,'sword']
  ];

  const SIMPLE_REBUILD = '.forum-sidebar nav button,.forum-tabs button,.main-nav a,.dl-shell-legal-links button,.site-footer button,.site-footer a,.console-sidebar nav button';
  const GENERIC = 'button,a';
  const SKIP = '.dl-v10-chip,.dl-v10-vote,.dl-v10-emoji,.dl-v10-picker,.dl-sticker-sheet,.dl-sticker-card,.dl-community-role-chip,.dl-community-verified,.dl-community-avatar-slot-v3,.dl-collector-card,.dl-role-badge';
  let raf = 0;
  const roots = new Set();

  const cleanText = value => String(value || '').replace(/\s+/g,' ').trim();

  function labelOf(el) {
    return cleanText(el.getAttribute('aria-label') || el.getAttribute('title') || el.dataset?.label || el.textContent || '');
  }

  function iconType(label) {
    for (const [re,type] of MAP) if (re.test(label)) return type;
    return '';
  }

  function icon(type) {
    const span = document.createElement('span');
    span.className = `dl-canon-icon-v8 type-${type}`;
    span.setAttribute('aria-hidden','true');
    span.innerHTML = '<i></i><b></b><em></em><u></u><s></s>';
    return span;
  }

  function visualClass(el) {
    const cls = String(el.className || '');
    return /(^|[-_])(icon|glyph|symbol|marker|emblem|nav-icon|menu-icon|forum-icon|discussion-icon|news-icon)([-_]|$)/i.test(cls)
      || /dl-master-icon|dl-mc-icon|dl-mc-sweep-icon|dl-mc-forge-icon|dl-react-crystal-v[0-9]+/i.test(cls);
  }

  function stripVisuals(host) {
    host.querySelectorAll('.dl-master-icon,.dl-mc-icon,.dl-mc-sweep-icon,.dl-mc-forge-icon,[data-dl-icon-suppressed="1"],.dl-canon-icon-v8').forEach(n => n.remove());
    [...host.children].forEach(child => {
      if (!(child instanceof HTMLElement)) return;
      if (visualClass(child)) child.remove();
    });
    host.querySelectorAll(':scope > svg').forEach(svg => svg.remove());
  }

  function numericCount(host,label) {
    const candidates = [...host.querySelectorAll('b,strong,span')].map(n => cleanText(n.textContent)).filter(t => /^\d+$/.test(t));
    if (candidates.length) return candidates[candidates.length - 1];
    const match = label.match(/(?:^|\s)(\d+)$/);
    return match?.[1] || '';
  }

  function primaryLabel(host,label) {
    const strong = [...host.querySelectorAll('strong,span')].map(n => cleanText(n.textContent)).find(t => t && !/^\d+$/.test(t) && t.length < 45);
    if (strong) return strong;
    return label.replace(/\s+\d+$/,'').trim();
  }

  function rebuildSimple(host,type,label) {
    const count = numericCount(host,label);
    const text = primaryLabel(host,label);
    host.replaceChildren();
    host.append(icon(type));
    const copy = document.createElement('span');
    copy.className = 'dl-canon-label-v8';
    copy.textContent = text;
    host.append(copy);
    if (count) {
      const badge = document.createElement('b');
      badge.className = 'dl-canon-count-v8';
      badge.textContent = count;
      host.append(badge);
    }
    host.classList.add('dl-canon-control-v8');
    host.dataset.dlCanonType = type;
  }

  function normalize(host) {
    if (!(host instanceof HTMLElement) || !host.isConnected || host.closest(SKIP)) return;
    const label = labelOf(host);
    if (!label) return;
    const type = iconType(label);
    if (!type) return;

    if (host.matches(SIMPLE_REBUILD)) {
      if (host.dataset.dlCanonType === type && host.querySelector(':scope > .dl-canon-icon-v8')) return;
      rebuildSimple(host,type,label);
      return;
    }

    stripVisuals(host);
    host.prepend(icon(type));
    host.classList.add('dl-canon-control-v8');
    host.dataset.dlCanonType = type;
  }

  function normalizeForumHeaders(root) {
    root.querySelectorAll?.('.active-forum-head').forEach(head => {
      const title = cleanText(head.querySelector('h1,h2,h3')?.textContent || head.textContent || '');
      const type = iconType(title) || 'chat';
      const heading = head.querySelector('h1,h2,h3');
      if (!heading) return;
      const contentBranch = heading.parentElement;
      [...head.children].forEach(child => {
        if (child === contentBranch || child.contains(heading)) return;
        if (visualClass(child) || (child.textContent || '').trim() === '') child.remove();
      });
      let canonical = head.querySelector(':scope > .dl-canon-icon-v8');
      if (!canonical) {
        canonical = icon(type);
        canonical.classList.add('forum-head-icon-v8');
        head.prepend(canonical);
      }
    });
  }

  function reactionIcon(root) {
    root.querySelectorAll?.('.dl-v10-add').forEach(button => {
      button.replaceChildren();
      const crystal = document.createElement('span');
      crystal.className = 'dl-reaction-crystal-v8';
      crystal.setAttribute('aria-hidden','true');
      crystal.innerHTML = '<i></i><b></b><em></em><u></u>';
      button.append(crystal);
      button.setAttribute('aria-label','Tambah reaction');
      button.setAttribute('title','Tambah reaction');
      button.dataset.dlNoIcon = 'true';
    });
  }

  function scan(root = document) {
    if (!root?.querySelectorAll) return;
    if (root.matches?.(GENERIC)) normalize(root);
    root.querySelectorAll(GENERIC).forEach(normalize);
    normalizeForumHeaders(root);
    reactionIcon(root);
  }

  function queue(root) {
    if (root?.nodeType === 1) roots.add(root);
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const batch = roots.size ? [...roots] : [document];
      roots.clear();
      batch.forEach(scan);
    });
  }

  function boot() {
    document.documentElement.classList.add('dl-canonical-icons-v8');
    // Remove leftovers from previous icon passes before the first canonical scan.
    document.querySelectorAll('.dl-master-icon,.dl-mc-icon,.dl-mc-sweep-icon,.dl-mc-forge-icon').forEach(n => n.remove());
    scan(document);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.closest?.('.dl-canon-icon-v8,.dl-reaction-crystal-v8')) continue;
          queue(node);
        }
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  window.addEventListener('hashchange',() => setTimeout(() => queue(document.body),90));
  window.addEventListener('pageshow',() => setTimeout(() => queue(document.body),90));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();