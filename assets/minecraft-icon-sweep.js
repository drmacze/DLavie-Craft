(() => {
  'use strict';

  const ICONS = {
    cube:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-top" d="M12 2 21 7 12 12 3 7Z"/><path class="p-left" d="M3 7 12 12v10L3 17Z"/><path class="p-main" d="M21 7 12 12v10l9-5Z"/><path class="p-hi" d="m7 7 5-3 5 3-5 3Z"/></svg>`,
    grass:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-top green" d="M12 2 21 7 12 12 3 7Z"/><path class="p-left dirt" d="M3 7 12 12v10L3 17Z"/><path class="p-main dirt2" d="M21 7 12 12v10l9-5Z"/><path class="p-hi" d="m6 7 6-3 6 3-6 3Z"/></svg>`,
    chest:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow" d="M3 8h18v12H3Z"/><path class="p-main gold" d="M4 5h16v6H4Z"/><path class="p-mid gold2" d="M4 12h16v7H4Z"/><path class="p-dark" d="M3 10h18v3H3Z"/><path class="p-hi" d="M10 10h4v5h-4Z"/></svg>`,
    chat:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main" d="M3 4h18v13H9l-5 4v-4H3Z"/><path class="p-dark" d="M6 8h2v2H6Zm5 0h2v2h-2Zm5 0h2v2h-2Z"/></svg>`,
    book:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-left" d="M3 4h8c2 0 3 1 3 3v13c-1-2-3-3-5-3H3Z"/><path class="p-main" d="M21 4h-8c-2 0-3 1-3 3v13c1-2 3-3 5-3h6Z"/><path class="p-hi" d="M5 7h5v2H5Zm0 4h4v2H5Zm9-4h5v2h-5Zm1 4h4v2h-4Z"/></svg>`,
    player:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main" d="M5 3h14v13H5Z"/><path class="p-dark" d="M8 8h2v2H8Zm6 0h2v2h-2ZM9 13h6v2H9Z"/><path class="p-mid" d="M3 17h18v5H3Z"/><path class="p-hi" d="M7 4h8v2H7Z"/></svg>`,
    door:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow" d="M5 2h14v20H5Z"/><path class="p-main wood" d="M7 4h9v16H7Z"/><path class="p-mid wood2" d="M9 6h5v5H9Z"/><path class="p-hi" d="M13 13h2v2h-2Z"/></svg>`,
    craft:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow" d="M3 3h18v18H3Z"/><path class="p-main wood" d="M5 5h14v14H5Z"/><path class="p-dark" d="M10 5h2v14h-2Zm5 0h2v14h-2ZM5 10h14v2H5Zm0 5h14v2H5Z"/><path class="p-hi" d="M6 6h3v3H6Z"/></svg>`,
    shield:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow" d="M4 3h16v11c0 4-4 7-8 8-4-1-8-4-8-8Z"/><path class="p-main" d="M6 5h12v9c0 3-3 5-6 6-3-1-6-3-6-6Z"/><path class="p-hi" d="M8 7h3v9H8Z"/></svg>`,
    sword:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-hi iron" d="M15 2h6v6L10 19l-4-4Z"/><path class="p-main" d="m7 13 4 4-2 2-4-4Z"/><path class="p-dark" d="M3 15h8v3H3Zm5 3h3v4H8Z"/></svg>`,
    pickaxe:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-hi iron" d="M3 4h12l6 5-2 2-5-4H9Z"/><path class="p-main wood" d="m13 8 3 2-8 12-3-2Z"/><path class="p-dark" d="m5 18 3 2-2 3-3-2Z"/></svg>`,
    emerald:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow green" d="m12 2 8 6-3 11H7L4 8Z"/><path class="p-main green" d="m12 4 6 5-2 8H8L6 9Z"/><path class="p-hi" d="m12 6 3 3-2 5H9l-1-4Z"/></svg>`,
    diamond:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow cyan" d="m4 8 4-5h8l4 5-8 14Z"/><path class="p-main cyan" d="m7 8 3-3h4l3 3-5 10Z"/><path class="p-hi" d="m9 7 2-2h2l2 2-3 4Z"/></svg>`,
    lock:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-mid iron" d="M7 9V6c0-4 10-4 10 0v3h-3V6c0-2-4-2-4 0v3Z"/><path class="p-main gold" d="M5 9h14v12H5Z"/><path class="p-dark" d="M11 13h2v4h-2Z"/></svg>`,
    key:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main gold" d="M4 5h8v8H9v3H7v3H3v-5l4-4V8H4Z"/><path class="p-hi" d="M7 7h3v3H7Z"/><path class="p-dark" d="M12 8h9v3h-3v3h-3v-3h-3Z"/></svg>`,
    anvil:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main iron" d="M3 4h18v5h-5l-2 3v3h4v3H6v-3h4v-3L8 9H3Z"/><path class="p-dark" d="M8 18h8v3H8Z"/><path class="p-hi" d="M5 5h9v2H5Z"/></svg>`,
    search:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main" d="M4 3h11v3h3v11h-3v3H4v-3H1V6h3Zm2 3v11h7v-2h2V8h-2V6Z"/><path class="p-dark" d="m16 16 6 6-3 2-6-6Z"/></svg>`,
    hopper:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main iron" d="M2 4h20v5l-7 6v5H9v-5L2 9Z"/><path class="p-dark" d="M5 6h14v3l-6 5h-2L5 9Z"/></svg>`,
    torch:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main wood" d="M10 9h4v13h-4Z"/><path class="p-main flame" d="M8 3h8v7H8Z"/><path class="p-hi" d="M10 2h4v5h-4Z"/><path class="p-dark" d="M9 8h6v3H9Z"/></svg>`,
    dye:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main" d="M9 2h6v4l3 4v10H6V10l3-4Z"/><path class="p-hi" d="M10 3h4v3h-4Z"/><path class="p-mid" d="M8 11h8v7H8Z"/><path class="p-dark" d="M10 13h4v3h-4Z"/></svg>`,
    inventory:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow" d="M2 2h20v20H2Z"/><path class="p-main" d="M4 4h5v5H4Zm6 0h5v5h-5Zm6 0h4v5h-4ZM4 10h5v5H4Zm6 0h5v5h-5Zm6 0h4v5h-4ZM4 16h5v4H4Zm6 0h5v4h-5Zm6 0h4v4h-4Z"/></svg>`,
    barrier:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main red" d="M4 4h16v16H4Z"/><path class="p-hi" d="M7 7h3v3h4V7h3v3h-3v4h3v3h-3v-3h-4v3H7v-3h3v-4H7Z"/></svg>`,
    arrowL:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main" d="M13 4v5h8v6h-8v5L3 12Z"/><path class="p-hi" d="M11 10h8v2h-8Z"/></svg>`,
    arrowR:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main" d="M11 4v5H3v6h8v5l10-8Z"/><path class="p-hi" d="M5 10h8v2H5Z"/></svg>`,
    plus:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main green" d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/><path class="p-hi" d="M11 5h2v6h6v2h-8Z"/></svg>`,
    upload:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow" d="M3 10h18v10H3Z"/><path class="p-main gold" d="M4 7h16v5H4Z"/><path class="p-dark" d="M3 11h18v3H3Z"/><path class="p-hi" d="M10 11h4v4h-4Z"/><path class="p-main green" d="M11 12h2V7h3l-4-4-4 4h3Z"/></svg>`,
    map:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-left" d="M3 4 9 2v18l-6 2Z"/><path class="p-main" d="m9 2 6 2v18l-6-2Z"/><path class="p-mid" d="m15 4 6-2v18l-6 2Z"/><path class="p-hi green" d="M5 7h3v4H5Zm11 5h4v4h-4Z"/></svg>`,
    bell:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main gold" d="M7 4h10v3h2v9H5V7h2Z"/><path class="p-dark" d="M4 16h16v3H4Zm7 3h2v3h-2Z"/><path class="p-hi" d="M9 5h4v2H9Z"/></svg>`,
    heart:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main red" d="M3 5h7v3h4V5h7v8l-9 9-9-9Z"/><path class="p-hi" d="M5 7h3v3H5Z"/></svg>`,
    xp:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow green" d="M4 8 12 2l8 6-3 11H7Z"/><path class="p-main green" d="M7 9 12 5l5 4-2 7H9Z"/><path class="p-hi" d="M10 8h4v4h-4Z"/></svg>`,
    clock:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow" d="M4 2h16v3h2v14h-2v3H4v-3H2V5h2Z"/><path class="p-main" d="M6 5h12v14H6Z"/><path class="p-dark" d="M11 7h2v6h5v2h-7Z"/><path class="p-hi" d="M7 6h3v2H7Z"/></svg>`,
    compass:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow" d="M4 2h16v3h2v14h-2v3H4v-3H2V5h2Z"/><path class="p-main" d="M6 5h12v14H6Z"/><path class="p-main red" d="m15 7-2 7-6 3 2-7Z"/><path class="p-hi" d="M11 11h3v3h-3Z"/></svg>`,
    redstone:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main red" d="M11 2h3v6h6v3h-6v4h4v3h-4v4h-3v-4H6v-3h5v-4H3V8h8Z"/><path class="p-hi" d="M12 3h1v6h6v1h-7Z"/></svg>`,
    lava:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-shadow" d="M5 4h14v17H5Z"/><path class="p-main iron" d="M4 3h16v4H4Z"/><path class="p-main flame" d="M7 8h10v11H7Z"/><path class="p-hi" d="M9 9h3v7H9Z"/></svg>`,
    tnt:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main red" d="M3 5h18v15H3Z"/><path class="p-hi" d="M3 9h18v6H3Z"/><path class="p-dark" d="M6 10h2v4H6Zm5 0h2v4h-2Zm5 0h2v4h-2Z"/></svg>`,
    paper:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main" d="M4 2h12l4 4v16H4Z"/><path class="p-mid" d="M16 2v5h4Z"/><path class="p-dark" d="M7 10h10v2H7Zm0 4h8v2H7Z"/></svg>`,
    spyglass:`<svg viewBox="0 0 24 24" class="dl-mc-pixel-svg" aria-hidden="true"><path class="p-main gold" d="M3 4h7v6H3Zm11 10h7v6h-7Z"/><path class="p-main" d="m8 8 8 8-4 4-8-8Z"/><path class="p-hi" d="m8 9 2-2 7 7-2 2Z"/></svg>`
  };

  function combined(el){
    return [el?.textContent,el?.getAttribute?.('aria-label'),el?.getAttribute?.('title'),el?.getAttribute?.('data-action'),el?.getAttribute?.('data-testid'),el?.className]
      .filter(Boolean).join(' ').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function semantic(el){
    const s=combined(el);
    if(/download|unduh/.test(s)) return 'chest';
    if(/upload|unggah|pilih file|tambahkan gambar|add image/.test(s)) return 'upload';
    if(/home|beranda/.test(s)) return 'grass';
    if(/project|proyek|release|version|versi/.test(s)) return 'chest';
    if(/community|komunitas|forum|chat|comment|komentar|reply|balas|diskusi/.test(s)) return 'chat';
    if(/news|berita|article|artikel|changelog/.test(s)) return 'book';
    if(/login|masuk|sign in/.test(s)) return 'door';
    if(/register|daftar|buat akun|create account/.test(s)) return 'craft';
    if(/account|akun|profile|profil|member|anggota|user/.test(s)) return 'player';
    if(/privacy|privasi/.test(s)) return 'shield';
    if(/terms|syarat|ketentuan|legal|document|dokumen/.test(s)) return 'book';
    if(/rules|peraturan|moderation|moderasi/.test(s)) return 'sword';
    if(/search|cari/.test(s)) return 'search';
    if(/filter|saring/.test(s)) return 'hopper';
    if(/theme|tema|dark|light|mode|appearance|tampilan/.test(s)) return 'torch';
    if(/accent|warna|color|palette/.test(s)) return 'dye';
    if(/menu|navigation|navigasi/.test(s)) return 'inventory';
    if(/close|tutup|cancel|batal/.test(s)) return 'barrier';
    if(/back|kembali|previous|sebelumnya/.test(s)) return 'arrowL';
    if(/next|lanjut|forward|berikutnya/.test(s)) return 'arrowR';
    if(/save|simpan|approve|setuju|confirm|konfirmasi|success|berhasil|submit|publish|terbit/.test(s)) return 'emerald';
    if(/edit|ubah|rename|kelola/.test(s)) return 'anvil';
    if(/delete|hapus|trash|remove/.test(s)) return 'lava';
    if(/settings|setting|pengaturan|config|console/.test(s)) return 'redstone';
    if(/github|repository|repo|external|website|link/.test(s)) return 'compass';
    if(/gallery|galeri|image|gambar|photo|foto|showcase|media/.test(s)) return 'map';
    if(/calendar|date|tanggal|time|waktu|recent|latest|terbaru/.test(s)) return 'clock';
    if(/favorite|favourite|like|suka|reaction|reaksi|heart/.test(s)) return 'heart';
    if(/featured|unggulan|star/.test(s)) return 'diamond';
    if(/level|xp|rank|leaderboard|peringkat/.test(s)) return 'xp';
    if(/notification|notifikasi|bell|announcement|pengumuman/.test(s)) return 'bell';
    if(/copy|salin|share|bagikan/.test(s)) return 'paper';
    if(/private|lock|terkunci/.test(s)) return 'lock';
    if(/unlock|buka kunci|forgot|lupa password|recovery|pemulihan/.test(s)) return 'key';
    if(/add|tambah|new|baru|create/.test(s)) return 'plus';
    if(/warning|peringatan|error|gagal|report|lapor/.test(s)) return 'tnt';
    if(/view|lihat|preview/.test(s)) return 'spyglass';
    if(/refresh|reload|muat ulang/.test(s)) return 'redstone';
    if(/pickaxe|tools|tool/.test(s)) return 'pickaxe';
    return null;
  }

  function fallbackByClass(el){
    const s=combined(el);
    if(/mobile-menu-button/.test(s)) return 'inventory';
    if(/modal-close|console-nav-close|emoji-close/.test(s)) return 'barrier';
    if(/row-arrow/.test(s)) return 'arrowR';
    if(/project-glyph/.test(s)) return 'cube';
    if(/discussion-icon/.test(s)) return 'chat';
    if(/news-icon/.test(s)) return 'book';
    if(/active-forum-icon|forum-nav-icon/.test(s)) return 'chat';
    if(/forum-symbol/.test(s)) return 'craft';
    if(/ticket-marker/.test(s)) return 'anvil';
    if(/announcement-icon/.test(s)) return 'bell';
    if(/community-side-title/.test(s)) return 'chat';
    if(/xp-guide|level-progress|level-score/.test(s)) return 'xp';
    if(/rail-heading/.test(s)) return 'diamond';
    if(/community-values/.test(s)) return 'emerald';
    if(/metric-card/.test(s)) return 'emerald';
    if(/icon-button/.test(s)) return 'cube';
    return null;
  }

  function make(name,cls=''){
    if(!ICONS[name]) return null;
    const span=document.createElement('span');
    span.className=`dl-mc-sweep-icon dl-mc-sweep--${name}${cls?` ${cls}`:''}`;
    span.setAttribute('aria-hidden','true');
    span.innerHTML=ICONS[name];
    return span;
  }

  function hasDirectGenericSvg(el){
    return Array.from(el?.children||[]).some(n=>n.tagName==='svg'&&!n.classList.contains('dl-mc-pixel-svg'));
  }

  function upgrade(el,name){
    if(!el||!name||!ICONS[name]) return;
    const current=Array.from(el.children||[]).find(n=>n.classList?.contains('dl-mc-sweep-icon'));
    if(current){
      if(!current.classList.contains(`dl-mc-sweep--${name}`)){
        current.className=`dl-mc-sweep-icon dl-mc-sweep--${name}`;
        current.innerHTML=ICONS[name];
      }
      return;
    }
    const node=make(name);
    if(!node) return;
    el.prepend(node);
    el.classList.add('dl-mc-v2-iconized');
  }

  function scanInteractive(root){
    const list=[];
    if(root.matches?.('button,a,[role="button"]')) list.push(root);
    root.querySelectorAll?.('button,a,[role="button"]').forEach(el=>list.push(el));
    for(const el of list){
      if(el.closest?.('#dl-account-portal') && el.querySelector('.dl-mc-icon')) continue;
      if(el.querySelector(':scope > .dl-mc-icon')) continue;
      if(!hasDirectGenericSvg(el) && !el.classList.contains('icon-button') && !el.classList.contains('mobile-menu-button')) continue;
      const name=semantic(el)||fallbackByClass(el);
      if(name) upgrade(el,name);
    }
  }

  function scanContainers(root){
    const selector='.project-glyph,.discussion-icon,.news-icon,.active-forum-icon,.forum-nav-icon,.forum-symbol,.ticket-marker,.announcement-icon,.community-side-title,.xp-guide,.rail-heading,.community-values,.section-mini-head,.metric-card,.showcase-upload';
    const list=[];
    if(root.matches?.(selector)) list.push(root);
    root.querySelectorAll?.(selector).forEach(el=>list.push(el));
    for(const el of list){
      if(!hasDirectGenericSvg(el)) continue;
      const name=semantic(el)||fallbackByClass(el)||'cube';
      upgrade(el,name);
    }
  }

  function scan(root=document){
    if(!root?.querySelectorAll) return;
    scanInteractive(root);
    scanContainers(root);
  }

  let raf=0;
  const roots=new Set();
  function queue(root){
    if(root?.nodeType===1||root===document) roots.add(root);
    if(raf) return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const batch=[...roots]; roots.clear();
      batch.forEach(scan);
    });
  }

  function boot(){
    scan(document);
    const observer=new MutationObserver(records=>{
      for(const r of records){
        for(const n of r.addedNodes) if(n.nodeType===1) queue(n);
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  window.addEventListener('hashchange',()=>queue(document));
  window.addEventListener('popstate',()=>queue(document));
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();