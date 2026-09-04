(() => {
  'use strict';

  const MASTER = 'dl-master-icon';
  const EXCLUDE = [
    '[data-dl-no-icon]', '.dl-v10-chip', '.dl-v10-add', '.dl-v10-reply', '.dl-v10-vote',
    '.dl-v10-emoji', '.dl-v4-react-chip', '.reaction-button', '.reaction-add',
    '.emoji-grid button', '.emoji-groups button', '.dl-sticker-card', '.dl-sticker-compose',
    '.dl-collector-card', '.dl-levelup-card', '.dl-avatar-option', '.dl-role-scene',
    '.dl-onboarding-character', '.brand', '.auth-brand', '.dl-account-logo', '.dl-account-brand'
  ].join(',');

  const OLD = '.dl-mc-icon,.dl-mc-sweep-icon,.dl-mc-forge-icon';
  const HOSTS = [
    '.main-nav a', '.header-actions button', '.header-actions a', '.site-header button',
    '.site-footer button', '.site-footer a', '.dl-shell-account', '.dl-shell-legal-links button',
    '.dl-account-tabs button', '.dl-account-btn', '.dl-account-link', '.dl-account-row button',
    '.community-toolbar button', '.community-toolbar a', '.forum-sidebar nav button',
    '.forum-tabs button', '.community-page button', '.community-page a[role="button"]',
    '.console-sidebar nav button', '.console-app button', '.download-card button', '.download-card a',
    '.project-card button', '.project-card a', '.news-card button', '.news-card a'
  ].join(',');

  const ICONS = {
    grass: '<svg viewBox="0 0 24 24"><path class="top" d="M12 2 22 7.5 12 13 2 7.5Z"/><path class="left" d="M2 7.5 12 13v9L2 16.5Z"/><path class="right" d="M22 7.5 12 13v9l10-5.5Z"/><path class="shine" d="m6 7.5 6-3.2 6 3.2-6 3.1Z"/></svg>',
    chest: '<span class="piece lid"></span><span class="piece box"></span><span class="piece band"></span><span class="piece latch"></span><span class="spark s1"></span><span class="spark s2"></span>',
    lantern: '<span class="piece hook"></span><span class="piece cap"></span><span class="piece lamp"></span><span class="piece core"></span><span class="halo"></span>',
    torch: '<span class="piece stick"></span><span class="flame f1"></span><span class="flame f2"></span><span class="ember e1"></span><span class="ember e2"></span><span class="halo"></span>',
    compass: '<span class="piece rim"></span><span class="piece face"></span><span class="piece needle"></span><span class="piece pin"></span>',
    book: '<span class="piece cover l"></span><span class="piece cover r"></span><span class="piece page l"></span><span class="piece page r"></span><span class="piece spine"></span>',
    chat: '<svg viewBox="0 0 24 24"><path class="main" d="M3 4h18v13H9l-5 4v-4H3Z"/><path class="dark" d="M6 8h2v2H6Zm5 0h2v2h-2Zm5 0h2v2h-2Z"/></svg>',
    player: '<svg viewBox="0 0 24 24"><path class="main" d="M5 3h14v13H5Z"/><path class="dark" d="M8 8h2v2H8Zm6 0h2v2h-2ZM9 13h6v2H9Z"/><path class="mid" d="M3 17h18v5H3Z"/></svg>',
    mail: '<span class="piece envelope"></span><span class="piece flap a"></span><span class="piece flap b"></span><span class="pixel p1"></span><span class="pixel p2"></span>',
    lock: '<span class="piece body"></span><span class="piece shackle"></span><span class="piece keyhole"></span>',
    door: '<span class="piece frame"></span><span class="piece slab"></span><span class="piece window"></span><span class="piece knob"></span><span class="piece glow"></span>',
    craft: '<span class="piece table"></span><span class="piece grid g1"></span><span class="piece grid g2"></span><span class="pixel p1"></span>',
    pickaxe: '<span class="piece handle"></span><span class="piece head"></span><span class="spark s1"></span><span class="spark s2"></span>',
    sword: '<span class="piece blade"></span><span class="piece guard"></span><span class="piece grip"></span><span class="slash"></span>',
    shield: '<svg viewBox="0 0 24 24"><path class="dark" d="M4 3h16v11c0 4-4 7-8 8-4-1-8-4-8-8Z"/><path class="main" d="M6 5h12v9c0 3-3 5-6 6-3-1-6-3-6-6Z"/><path class="shine" d="M8 7h3v9H8Z"/></svg>',
    emerald: '<span class="gem g"></span><span class="glint"></span><span class="spark s1"></span><span class="spark s2"></span>',
    diamond: '<span class="gem d"></span><span class="glint"></span><span class="spark s1"></span><span class="spark s2"></span>',
    bell: '<span class="piece bell"></span><span class="piece clapper"></span><span class="wave w1"></span><span class="wave w2"></span>',
    search: '<span class="piece glass"></span><span class="piece handle"></span><span class="scan"></span>',
    gear: '<span class="gear-core"></span><span class="gear-teeth"></span>',
    download: '<span class="piece chestbase"></span><span class="piece arrow down"></span><span class="piece slot"></span>',
    upload: '<span class="piece chestbase"></span><span class="piece arrow up"></span><span class="piece slot"></span>',
    edit: '<span class="piece anvil"></span><span class="piece hammer"></span><span class="spark s1"></span>',
    trash: '<span class="piece tnt"></span><span class="piece fuse"></span><span class="spark s1"></span>',
    report: '<span class="piece barrier"></span><span class="piece slashbar"></span>',
    map: '<span class="piece map l"></span><span class="piece map m"></span><span class="piece map r"></span><span class="piece marker"></span>',
    plus: '<span class="piece block b1"></span><span class="piece block b2"></span><span class="piece block b3"></span>',
    arrow: '<svg viewBox="0 0 24 24"><path class="main" d="M11 4v5h10v6H11v5L3 12Z"/></svg>',
    heart: '<span class="piece heart h1"></span><span class="piece heart h2"></span><span class="piece heart h3"></span>'
  };

  const norm = el => (el?.getAttribute?.('aria-label') || el?.title || el?.textContent || '').replace(/\s+/g,' ').trim().toLowerCase();
  const path = () => `${location.hash} ${location.pathname}`.toLowerCase();

  function choose(el) {
    const t = norm(el);
    if (!t) return null;
    if (/hapus|delete|trash/.test(t)) return 'trash';
    if (/lapor|report/.test(t)) return 'report';
    if (/edit|ubah/.test(t)) return 'edit';
    if (/upload|unggah/.test(t)) return 'upload';
    if (/download|unduh/.test(t) || el.hasAttribute?.('download')) return 'download';
    if (/cari|search/.test(t)) return 'search';
    if (/pengaturan|setting|console/.test(t)) return 'gear';
    if (/tema|theme|gelap|terang|dark|light/.test(t)) return 'lantern';
    if (/masuk|login/.test(t)) return 'door';
    if (/keluar|logout/.test(t)) return 'door';
    if (/daftar|register|buat akun|gabung/.test(t)) return 'craft';
    if (/password|kunci/.test(t)) return 'lock';
    if (/email|inbox|verifikasi|kirim ulang/.test(t)) return 'mail';
    if (/akun|profile|profil|member/.test(t)) return 'player';
    if (/komunitas|community|obrolan|chat|balas|reply/.test(t)) return 'chat';
    if (/showcase|karya/.test(t)) return 'diamond';
    if (/berita|news|syarat|ketentuan|dokumen/.test(t)) return 'book';
    if (/privasi|privacy/.test(t)) return 'shield';
    if (/peraturan|rules|pvp/.test(t)) return 'sword';
    if (/pengumuman|announcement/.test(t)) return 'bell';
    if (/saran|ide|feedback/.test(t)) return 'emerald';
    if (/explore|jelajah|map/.test(t)) return 'compass';
    if (/builder|build/.test(t)) return 'craft';
    if (/miner|mine/.test(t)) return 'pickaxe';
    if (/newbie|beranda|home/.test(t)) return 'grass';
    if (/sticker/.test(t)) return 'map';
    if (/tambah|baru|create|add/.test(t)) return 'plus';
    if (/lanjut|next|kembali|back/.test(t)) return 'arrow';
    if (/kirim|send/.test(t)) return 'emerald';
    if (/simpan|save|collect/.test(t)) return 'chest';
    if (/level|xp|peringkat|rank/.test(t)) return 'emerald';
    return null;
  }

  function build(name) {
    const node = document.createElement('span');
    node.className = `${MASTER} ${MASTER}--${name}`;
    node.dataset.icon = name;
    node.setAttribute('aria-hidden','true');
    node.innerHTML = ICONS[name] || ICONS.grass;
    return node;
  }

  function hideNative(host) {
    host.querySelectorAll(':scope > svg').forEach(svg => {
      if (svg.closest(`.${MASTER}`)) return;
      svg.classList.add('dl-master-native-hidden');
      svg.setAttribute('aria-hidden','true');
    });
  }

  function decorate(host) {
    if (!host?.isConnected || host.matches(EXCLUDE) || host.closest(EXCLUDE)) return;
    if (host.closest('.dl-v10-picker,.dl-v10-vote-panel,.dl-levelup-overlay,.dl-role-picker,.dl-sticker-sheet')) return;
    const name = choose(host);
    if (!name) return;

    const current = host.querySelector(`:scope > .${MASTER}`);
    if (current?.dataset.icon === name) return;

    host.querySelectorAll(`:scope > ${OLD}`).forEach(n => n.remove());
    current?.remove();
    hideNative(host);
    host.prepend(build(name));
    host.classList.add('dl-master-iconized');
    host.dataset.dlMasterIcon = name;
  }

  function decorateFields(root) {
    root.querySelectorAll?.('.dl-account-field').forEach(label => {
      const input = label.querySelector('input');
      if (!input || label.querySelector(':scope > .dl-master-field-icon')) return;
      const t = norm(label);
      const name = /email/.test(t) ? 'mail' : /password/.test(t) ? 'lock' : /nama|username/.test(t) ? 'player' : null;
      if (!name) return;
      label.querySelectorAll(':scope > .dl-mc-field-icon').forEach(n => n.remove());
      const icon = build(name);
      icon.classList.add('dl-master-field-icon');
      input.before(icon);
      label.classList.add('dl-master-field');
    });
  }

  function decorateSectionIcons(root) {
    const pairs = [
      ['.active-forum-icon,.forum-nav-icon,.forum-symbol','chat'],
      ['.announcement-icon','bell'],
      ['.discussion-icon','chat'],
      ['.news-icon','book'],
      ['.project-glyph','chest'],
      ['.ticket-marker','shield']
    ];
    pairs.forEach(([selector,name]) => root.querySelectorAll?.(selector).forEach(host => {
      if (host.matches(EXCLUDE) || host.querySelector(`:scope > .${MASTER}`)) return;
      host.querySelectorAll(OLD).forEach(n=>n.remove());
      host.prepend(build(name));
      host.classList.add('dl-master-section-icon');
    }));
  }

  function scan(root=document) {
    if (!root?.querySelectorAll) return;
    if (root.matches?.(HOSTS)) decorate(root);
    root.querySelectorAll(HOSTS).forEach(decorate);
    decorateFields(root);
    decorateSectionIcons(root);
  }

  let raf=0;
  const queueRoots=new Set();
  function queue(root=document.body) {
    if (root?.nodeType===1) queueRoots.add(root);
    if (raf) return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const batch=queueRoots.size?[...queueRoots]:[document];
      queueRoots.clear();
      batch.forEach(scan);
    });
  }

  function boot() {
    document.documentElement.classList.add('dl-icon-master-v5');
    scan(document);
    const observer=new MutationObserver(records=>{
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType!==1) continue;
          if (node.closest?.(`.${MASTER},.dl-v10-picker,.dl-v10-vote-panel`)) continue;
          queue(node);
        }
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  window.addEventListener('hashchange',()=>setTimeout(()=>queue(document.body),70));
  window.addEventListener('popstate',()=>setTimeout(()=>queue(document.body),70));
  window.addEventListener('pageshow',()=>setTimeout(()=>queue(document.body),70));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();