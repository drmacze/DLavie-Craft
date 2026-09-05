(() => {
  'use strict';

  const MAP = [
    [/sticker studio|sticker/i,'slime'], [/explore|jelajah/i,'compass'], [/berita|news/i,'book'],
    [/komunitas|community/i,'chat'], [/akun|account|profile/i,'chest'], [/bantuan|support/i,'lifebuoy'],
    [/saran|ide|feedback/i,'redstone'], [/pengumuman|announcement/i,'bell'], [/obrolan|chat/i,'chat'],
    [/showcase/i,'painting'], [/level|peringkat|rank/i,'emerald'], [/terbaru|latest/i,'beacon'],
    [/ringkas|summary/i,'map'], [/\binfo\b/i,'book'], [/syarat|ketentuan|terms/i,'book'], [/privasi|privacy/i,'shield'],
    [/rules|peraturan/i,'sword'], [/keluar|logout/i,'door'], [/download|unduh/i,'chest-down'], [/upload/i,'chest-up'],
    [/kirim|send/i,'paper'], [/edit|ubah/i,'anvil'], [/hapus|delete|trash/i,'lava'], [/report|lapor/i,'tnt'],
    [/cari|search/i,'spyglass'], [/pengaturan|settings|setting/i,'gear'], [/login|masuk/i,'door'], [/daftar|register/i,'craft'],
    [/email|mail/i,'mail'], [/password|kata sandi/i,'lock'], [/builder/i,'craft'], [/miner/i,'pickaxe'],
    [/explorer/i,'compass'], [/newbie/i,'grass'], [/pvp/i,'sword']
  ];

  const REBUILD = [
    '.forum-tabs button','.forum-sidebar nav button','.main-nav a','.dl-shell-legal-links button',
    '.site-footer button','.site-footer a','.console-sidebar nav button','#dl-community-toolbar button'
  ].join(',');
  const INSERT = [
    '.quick-chat-composer button','.reply-composer button','.download-card button','.download-card a',
    '.project-card button','.project-card a','.news-card button','.news-card a','.dl-account-btn','.dl-account-link'
  ].join(',');
  const SKIP = '.dl-v10-chip,.dl-v10-vote,.dl-v10-emoji,.dl-v10-picker,.dl-sticker-sheet,.dl-sticker-card,.dl-community-role-chip,.dl-community-verified,.dl-community-avatar-slot-v3,.dl-collector-card,.dl-role-badge,.dl-reaction-crystal-v9';
  const norm = v => String(v || '').replace(/\s+/g,' ').trim();
  let raf = 0;
  const queued = new Set();

  function typeFor(label) {
    for (const [re,type] of MAP) if (re.test(label)) return type;
    return '';
  }

  function labelOf(el) {
    return norm(el.getAttribute('aria-label') || el.getAttribute('title') || el.dataset?.label || el.textContent || '');
  }

  function countOf(el,label) {
    const direct = [...el.querySelectorAll(':scope > b,:scope > strong,:scope > span')]
      .map(n => norm(n.textContent)).filter(t => /^\d+$/.test(t));
    return direct.at(-1) || label.match(/(?:^|\s)(\d+)$/)?.[1] || '';
  }

  function copyOf(el,label) {
    const candidates = [...el.querySelectorAll(':scope > strong,:scope > span')]
      .map(n => norm(n.textContent))
      .filter(t => t && !/^\d+$/.test(t) && t.length < 50);
    return candidates[0] || label.replace(/\s+\d+$/,'').trim();
  }

  const icons = {
    chat:`<rect x="3" y="4" width="18" height="13" rx="2" class="p"/><rect x="6" y="8" width="3" height="3" class="hi"/><rect x="11" y="8" width="3" height="3" class="hi"/><rect x="16" y="8" width="2" height="3" class="hi"/><path d="M6 17h6l-6 4z" class="s"/>`,
    compass:`<circle cx="12" cy="12" r="9" class="rim"/><circle cx="12" cy="12" r="6" class="paper"/><g class="needle"><path d="M12 5l2 7-2 7-2-7z" class="red"/><path d="M12 12l2 7-2 0z" class="light"/></g><rect x="11" y="11" width="2" height="2" class="dark"/>`,
    book:`<path d="M3 5h8v15H3z" class="p"/><path d="M13 5h8v15h-8z" class="p2"/><path d="M11 5h2v15h-2z" class="s"/><path d="M5 8h4M15 8h4M5 12h4M15 12h4" class="line"/>`,
    chest:`<g class="lid"><rect x="3" y="4" width="18" height="7" class="wood2"/><rect x="3" y="9" width="18" height="2" class="dark"/></g><rect x="3" y="11" width="18" height="10" class="wood"/><rect x="10" y="10" width="5" height="6" class="gold"/>`,
    'chest-down':`<rect x="3" y="11" width="18" height="10" class="wood"/><rect x="3" y="5" width="18" height="7" class="wood2"/><rect x="10" y="10" width="5" height="6" class="gold"/><path d="M12 1v7m-3-3 3 3 3-3" class="arrow"/>`,
    'chest-up':`<rect x="3" y="11" width="18" height="10" class="wood"/><rect x="3" y="5" width="18" height="7" class="wood2"/><rect x="10" y="10" width="5" height="6" class="gold"/><path d="M12 9V2m-3 3 3-3 3 3" class="arrow"/>`,
    lifebuoy:`<circle cx="12" cy="12" r="9" class="orange"/><circle cx="12" cy="12" r="4" class="paper"/><path d="M6 6l4 4m4 4 4 4M18 6l-4 4m-4 4-4 4" class="whiteLine"/>`,
    redstone:`<path d="M12 3l3 5 5 4-5 4-3 5-3-5-5-4 5-4z" class="redstone"/><rect x="10" y="10" width="4" height="4" class="redHi"/>`,
    bell:`<g class="bell"><path d="M7 7h10l2 9H5z" class="gold"/><rect x="9" y="4" width="6" height="4" class="gold2"/><rect x="10" y="17" width="4" height="3" class="dark"/></g>`,
    painting:`<rect x="2" y="4" width="20" height="16" class="frame"/><rect x="5" y="7" width="14" height="10" class="paper"/><rect x="6" y="12" width="6" height="5" class="green"/><rect x="13" y="9" width="4" height="4" class="purple"/>`,
    emerald:`<path d="M12 2l7 5-2 12H7L5 7z" class="emerald"/><path d="M9 5h3l-2 11H8z" class="glint"/>`,
    beacon:`<rect x="4" y="13" width="16" height="7" class="rim"/><rect x="7" y="9" width="10" height="6" class="aqua"/><path d="M10 9V2h4v7" class="beam"/>`,
    map:`<path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z" class="map"/><path d="M9 3v16M15 5v16" class="mapLine"/><rect x="12" y="10" width="3" height="3" class="red"/>`,
    shield:`<path d="M12 2l8 3-1 10-7 7-7-7L4 5z" class="purple"/><path d="M12 5v13" class="shieldHi"/>`,
    sword:`<g class="sword"><path d="M15 2h5v5L9 18l-3-3z" class="aqua"/><path d="M5 13l6 6-2 2-6-6z" class="wood"/><path d="M7 12l5 5" class="darkLine"/></g>`,
    door:`<g class="door"><rect x="5" y="2" width="14" height="20" class="wood"/><rect x="8" y="5" width="8" height="5" class="wood2"/><rect x="15" y="13" width="2" height="2" class="gold"/></g>`,
    paper:`<path d="M5 2h11l4 4v16H5z" class="paper"/><path d="M16 2v5h4" class="fold"/><path d="M8 10h8M8 14h8M8 18h5" class="line"/>`,
    anvil:`<path d="M4 6h16v5H4zM7 11h10v6H7zM9 17h6v4H9z" class="iron"/>`,
    lava:`<path d="M12 2c4 4 6 7 5 11-1 5-4 8-8 8-3 0-6-3-5-7 1-4 4-6 4-9 2 1 3 3 4 5 1-3 0-5 0-8z" class="lava"/>`,
    tnt:`<rect x="3" y="7" width="18" height="13" class="tnt"/><rect x="5" y="11" width="14" height="4" class="paper"/><path d="M12 7V3l4-2" class="fuse"/><rect x="16" y="1" width="3" height="3" class="spark"/>`,
    spyglass:`<g class="spy"><path d="M5 14l10-8 4 5-10 8z" class="wood"/><rect x="14" y="4" width="7" height="8" class="gold"/><circle cx="5" cy="18" r="3" class="dark"/></g>`,
    gear:`<g class="gear"><circle cx="12" cy="12" r="8" class="iron"/><circle cx="12" cy="12" r="3" class="dark"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4M4 4l3 3M17 17l3 3M20 4l-3 3M7 17l-3 3" class="gearLine"/></g>`,
    mail:`<rect x="3" y="6" width="18" height="13" class="purple"/><path d="M4 8l8 6 8-6" class="mailLine"/>`,
    lock:`<rect x="5" y="10" width="14" height="11" class="purple"/><path d="M8 10V7a4 4 0 018 0v3" class="lockLine"/><rect x="11" y="14" width="2" height="4" class="dark"/>`,
    craft:`<rect x="3" y="3" width="18" height="18" class="wood"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" class="craftLine"/>`,
    pickaxe:`<g class="pickaxe"><path d="M5 6h13l3 3H9z" class="aqua"/><path d="M13 8l-3 14" class="woodLine"/></g>`,
    grass:`<rect x="4" y="8" width="16" height="13" class="dirt"/><rect x="4" y="5" width="16" height="7" class="grass"/>`,
    slime:`<rect x="4" y="4" width="16" height="16" rx="2" class="slime"/><rect x="7" y="9" width="3" height="3" class="dark"/><rect x="14" y="9" width="3" height="3" class="dark"/><rect x="9" y="14" width="6" height="2" class="dark"/>`
  };

  function icon(type) {
    const wrap = document.createElement('span');
    wrap.className = `dl-canon-icon-v9 type-${type}`;
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" focusable="false">${icons[type] || icons.chat}</svg>`;
    return wrap;
  }

  function removeOldIcons(host) {
    host.querySelectorAll('.dl-canon-icon-v8,.dl-master-icon,.dl-mc-icon,.dl-mc-sweep-icon,.dl-mc-forge-icon,.dl-canon-icon-v9').forEach(n => n.remove());
    [...host.children].forEach(child => {
      if (!(child instanceof HTMLElement)) return;
      const cls = String(child.className || '');
      if (/(^|[-_])(icon|glyph|symbol|marker|emblem|nav-icon|menu-icon|forum-icon)([-_]|$)/i.test(cls) && !child.classList.contains('dl-canon-label-v9')) child.remove();
    });
    host.querySelectorAll(':scope > svg').forEach(svg => svg.remove());
  }

  function rebuild(host,type,label) {
    const text = copyOf(host,label);
    const count = countOf(host,label);
    host.replaceChildren(icon(type));
    const copy = document.createElement('span');
    copy.className = 'dl-canon-label-v9';
    copy.textContent = text;
    host.append(copy);
    if (count) {
      const badge = document.createElement('b');
      badge.className = 'dl-canon-count-v9';
      badge.textContent = count;
      host.append(badge);
    }
    host.classList.add('dl-canon-control-v9');
    host.dataset.dlCanonV9 = type;
  }

  function insert(host,type) {
    removeOldIcons(host);
    host.prepend(icon(type));
    host.classList.add('dl-canon-control-v9');
    host.dataset.dlCanonV9 = type;
  }

  function normalize(host) {
    if (!(host instanceof HTMLElement) || !host.isConnected || host.closest(SKIP)) return;
    const label = labelOf(host);
    if (!label) return;
    const type = typeFor(label);
    if (!type) return;
    if (host.matches(REBUILD)) {
      if (host.dataset.dlCanonV9 === type && host.querySelector(':scope > .dl-canon-icon-v9')) return;
      rebuild(host,type,label);
    } else if (host.matches(INSERT)) {
      if (host.dataset.dlCanonV9 === type && host.querySelector(':scope > .dl-canon-icon-v9')) return;
      insert(host,type);
    }
  }

  function reactionIcon(root) {
    root.querySelectorAll?.('.dl-v10-add').forEach(button => {
      if (button.querySelector('.dl-reaction-crystal-v9')) return;
      button.replaceChildren();
      const span = document.createElement('span');
      span.className = 'dl-reaction-crystal-v9';
      span.setAttribute('aria-hidden','true');
      span.innerHTML = '<i></i><b></b><em></em>';
      button.append(span);
      button.setAttribute('aria-label','Tambah reaction');
      button.setAttribute('title','Tambah reaction');
      button.dataset.dlNoIcon = 'true';
    });
  }

  function scan(root=document) {
    if (!root?.querySelectorAll) return;
    if (root.matches?.(REBUILD) || root.matches?.(INSERT)) normalize(root);
    root.querySelectorAll(`${REBUILD},${INSERT}`).forEach(normalize);
    reactionIcon(root);
  }

  function queue(root) {
    if (root?.nodeType === 1) queued.add(root);
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const batch = queued.size ? [...queued] : [document];
      queued.clear();
      batch.forEach(scan);
    });
  }

  function boot() {
    document.documentElement.classList.add('dl-canonical-icons-v9');
    document.querySelectorAll('.dl-canon-icon-v8,.dl-master-icon,.dl-mc-icon,.dl-mc-sweep-icon,.dl-mc-forge-icon').forEach(n => n.remove());
    scan(document);
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType !== 1 || node.closest?.('.dl-canon-icon-v9,.dl-reaction-crystal-v9')) continue;
        queue(node);
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  window.addEventListener('hashchange',()=>setTimeout(()=>queue(document.body),90));
  window.addEventListener('pageshow',()=>setTimeout(()=>queue(document.body),90));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();