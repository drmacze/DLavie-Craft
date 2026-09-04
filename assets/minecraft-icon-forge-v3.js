(() => {
  'use strict';

  const ICONS = {
    stone:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-top stone-hi" d="M12 2 21 7 12 12 3 7Z"/><path class="f-left stone-mid" d="M3 7 12 12v10L3 17Z"/><path class="f-main stone" d="M21 7 12 12v10l9-5Z"/><path class="f-chip" d="M7 8h3v2H7Zm7 3h2v2h-2Zm-5 5h2v2H9Z"/></svg>`,
    lantern:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-dark" d="M9 1h6v3h2v3H7V4h2Z"/><path class="f-iron" d="M6 6h12v3H6Z"/><path class="f-dark" d="M5 8h3v10H5Zm11 0h3v10h-3ZM7 18h10v3H7Z"/><path class="f-glass" d="M8 9h8v9H8Z"/><path class="f-flame" d="M10 10h4v7h-4Z"/><path class="f-core" d="M11 10h2v4h-2Z"/></svg>`,
    furnace:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-main stone" d="M3 3h18v18H3Z"/><path class="f-dark" d="M6 6h12v5H6Zm1 8h10v5H7Z"/><path class="f-fire" d="M9 15h6v3H9Z"/><path class="f-core" d="M11 14h2v4h-2Z"/><path class="f-chip" d="M5 5h3v2H5Zm10-1h3v2h-3Z"/></svg>`,
    redlamp:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-dark" d="M3 3h18v18H3Z"/><path class="f-lamp" d="M6 6h12v12H6Z"/><path class="f-core" d="M9 9h6v6H9Z"/><path class="f-chip" d="M4 10h2v4H4Zm14 0h2v4h-2ZM10 4h4v2h-4Zm0 14h4v2h-4Z"/></svg>`,
    piston:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-main wood" d="M3 5h18v7H3Z"/><path class="f-top wood-hi" d="M5 3h14v4H5Z"/><path class="f-iron" d="M9 12h6v5H9Z"/><path class="f-dark" d="M6 17h12v4H6Z"/></svg>`,
    lever:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-main stone" d="M4 15h16v6H4Z"/><path class="f-dark" d="M7 17h10v2H7Z"/><path class="f-iron lever-stick" d="M11 4h3v12h-3Z"/><path class="f-top wood-hi lever-knob" d="M9 2h7v5H9Z"/></svg>`,
    repeater:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-main stone" d="M3 6h18v13H3Z"/><path class="f-red" d="M7 9h3v7H7Zm7 0h3v7h-3Z"/><path class="f-core" d="M11 11h2v3h-2Z"/><path class="f-dark" d="M5 17h14v2H5Z"/></svg>`,
    potion:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-iron" d="M9 2h6v5H9Z"/><path class="f-glass" d="M7 6h10l3 6v8H4v-8Z"/><path class="f-potion" d="M6 13h12v5H6Z"/><path class="f-core bubble-a" d="M9 12h2v2H9Z"/><path class="f-core bubble-b" d="M14 10h2v2h-2Z"/></svg>`,
    pearl:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-pearl" d="M6 4h12v3h3v10h-3v3H6v-3H3V7h3Z"/><path class="f-core" d="M8 7h6v3H8Z"/><path class="f-dark" d="M14 14h3v3h-3Z"/></svg>`,
    bucket:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-iron" d="M5 5h14l-2 16H7Z"/><path class="f-dark" d="M7 8h10l-1 10H8Z"/><path class="f-water" d="M8 11h8v7H8Z"/><path class="f-core" d="M9 12h4v2H9Z"/></svg>`,
    minecart:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-iron" d="M4 6h16l-2 10H6Z"/><path class="f-dark" d="M7 9h10l-1 4H8Z"/><path class="f-main wheel" d="M7 17h4v4H7Zm7 0h4v4h-4Z"/></svg>`,
    rail:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-iron" d="M6 2h3v20H6Zm9 0h3v20h-3Z"/><path class="f-dark" d="M7 5h10v2H7Zm0 5h10v2H7Zm0 5h10v2H7Z"/><path class="f-red rail-spark" d="M11 18h2v4h-2Z"/></svg>`,
    shulker:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-shulker shulker-lid" d="M4 4h16v7H4Z"/><path class="f-dark" d="M6 8h12v13H6Z"/><path class="f-shulker" d="M5 11h14v9H5Z"/><path class="f-core" d="M10 13h4v3h-4Z"/></svg>`,
    bed:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-red" d="M3 8h18v9H3Z"/><path class="f-core" d="M4 7h7v5H4Z"/><path class="f-dark" d="M4 17h2v4H4Zm14 0h2v4h-2Z"/></svg>`,
    cake:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-main cake" d="M4 8h16v12H4Z"/><path class="f-top frosting" d="M4 6h16v6H4Z"/><path class="f-red candle" d="M11 2h2v5h-2Z"/><path class="f-flame cake-flame" d="M10 1h4v3h-4Z"/></svg>`,
    eye:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-dark" d="M2 12 7 6h10l5 6-5 6H7Z"/><path class="f-pearl" d="M7 8h10v8H7Z"/><path class="f-core eye-pupil" d="M10 10h4v4h-4Z"/></svg>`,
    arrow:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-main" d="M11 3h4v7h6v4h-6v7h-4v-7H4v-4h7Z" transform="rotate(90 12 12)"/><path class="f-core" d="M12 9h5v2h-5Z"/></svg>`,
    close:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-red" d="M4 4h5v5h6V4h5v5h-5v6h5v5h-5v-5H9v5H4v-5h5V9H4Z"/><path class="f-core" d="M6 5h2v2H6Z"/></svg>`,
    gear:`<svg viewBox="0 0 24 24" class="dl-mc-forge-svg" aria-hidden="true"><path class="f-iron gear-body" d="M9 2h6v3h4v4h3v6h-3v4h-4v3H9v-3H5v-4H2V9h3V5h4Z"/><path class="f-dark gear-hole" d="M9 9h6v6H9Z"/><path class="f-core" d="M11 11h2v2h-2Z"/></svg>`
  };

  const GENERIC_ICON_HOSTS = 'button,a,[role="button"],.icon-button,.mobile-menu-button,.modal-close,.console-nav-trigger,.console-nav-close,.project-glyph,.discussion-icon,.news-icon,.forum-nav-icon,.active-forum-icon,.forum-symbol,.ticket-marker,.announcement-icon,.metric-card,.community-values,.rail-heading,.section-mini-head';

  function words(el){
    const host = el.closest?.(GENERIC_ICON_HOSTS) || el.parentElement;
    return [host?.textContent,host?.getAttribute?.('aria-label'),host?.getAttribute?.('title'),host?.getAttribute?.('data-action'),host?.className]
      .filter(Boolean).join(' ').replace(/\s+/g,' ').toLowerCase();
  }

  function semantic(el){
    const s=words(el);
    if(/theme|tema|dark|light|appearance/.test(s)) return 'lantern';
    if(/setting|pengaturan|config|gear/.test(s)) return 'gear';
    if(/refresh|reload|sync|muat ulang/.test(s)) return 'repeater';
    if(/power|toggle|switch|aktif|enable|disable/.test(s)) return 'lever';
    if(/preview|lihat|view|eye/.test(s)) return 'eye';
    if(/close|tutup|cancel|batal|remove/.test(s)) return 'close';
    if(/next|lanjut|forward|arrow/.test(s)) return 'arrow';
    if(/furnace|build|compile|process|proses/.test(s)) return 'furnace';
    if(/storage|bucket|file/.test(s)) return 'bucket';
    if(/deploy|release|pipeline|rail/.test(s)) return 'rail';
    if(/package|archive|box/.test(s)) return 'shulker';
    if(/sleep|bed/.test(s)) return 'bed';
    if(/celebrate|birthday|cake/.test(s)) return 'cake';
    if(/private|secure|security/.test(s)) return 'shulker';
    if(/plugin|extension|module/.test(s)) return 'piston';
    if(/external|website|navigate/.test(s)) return 'pearl';
    return 'stone';
  }

  function make(name){
    const span=document.createElement('span');
    span.className=`dl-mc-forge-icon dl-mc-forge--${name}`;
    span.setAttribute('aria-hidden','true');
    span.innerHTML=ICONS[name] || ICONS.stone;
    return span;
  }

  function replaceGenericSvg(svg){
    if(!svg || svg.closest('.dl-mc-sweep-icon,.dl-mc-icon,.dl-mc-forge-icon')) return;
    if(svg.closest('.brand,.auth-brand,.dl-account-logo')) return;
    const host=svg.closest(GENERIC_ICON_HOSTS);
    if(!host) return;
    if(host.querySelector(':scope > .dl-mc-sweep-icon,:scope > .dl-mc-icon,:scope > .dl-mc-forge-icon')) return;
    const name=semantic(svg);
    const icon=make(name);
    svg.insertAdjacentElement('beforebegin',icon);
    svg.classList.add('dl-mc-generic-replaced');
    host.classList.add('dl-mc-forged-host');
  }

  function blockifyExisting(root=document){
    root.querySelectorAll?.('.dl-mc-sweep-icon,.dl-mc-icon,.dl-mc-forge-icon').forEach((icon,i)=>{
      if(icon.dataset.dlForgeV3==='true') return;
      icon.dataset.dlForgeV3='true';
      icon.style.setProperty('--forge-delay',`${-((i*211)%3200)}ms`);
      const host=icon.closest(GENERIC_ICON_HOSTS);
      if(host) host.classList.add('dl-mc-forged-host');
    });
  }

  function scan(root=document){
    if(root.matches?.('svg')) replaceGenericSvg(root);
    root.querySelectorAll?.('svg').forEach(replaceGenericSvg);
    blockifyExisting(root);
  }

  let raf=0;
  const roots=new Set();
  function queue(root){
    if(root?.nodeType===1 || root===document) roots.add(root);
    if(raf) return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const batch=[...roots];roots.clear();
      batch.forEach(scan);
    });
  }

  function burst(event){
    const host=event.target?.closest?.(GENERIC_ICON_HOSTS);
    const icon=host?.querySelector?.('.dl-mc-forge-icon,.dl-mc-sweep-icon,.dl-mc-icon');
    if(!icon) return;
    icon.classList.remove('dl-mc-forge-burst');
    void icon.offsetWidth;
    icon.classList.add('dl-mc-forge-burst');
    setTimeout(()=>icon.classList.remove('dl-mc-forge-burst'),760);
  }

  function boot(){
    scan(document);
    document.addEventListener('pointerdown',burst,{passive:true});
    const mo=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes) if(node.nodeType===1) queue(node);
      }
    });
    mo.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
