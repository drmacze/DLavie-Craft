(() => {
  'use strict';

  const ROUTE = /^#\/marketplace(?:$|[/?])/;
  const HOME = /^(?:#|#\/|#\/home)?$/;
  const ROOT_ID = 'root';
  const PAGE_ID = 'dl-marketplace-page';
  const BANNER_ID = 'dl-marketplace-home-banner';
  const HEIST_REPO = 'https://github.com/drmacze/DLavie-Heist';
  const HEIST_DOWNLOAD = 'https://raw.githubusercontent.com/drmacze/DLavie-Heist/main/releases/v10.16/DLavie_Heist_Core_V1.0.mcaddon';

  const categories = [
    ['all','All Add-Ons','ALL'],['featured','Featured','★'],['new','New & Updated','NEW'],['adventure','Adventure','ADV'],
    ['survival','Survival','SUR'],['roleplay','Roleplay','RP'],['minigames','Minigames','MINI'],['pvp','PvP','PVP'],
    ['horror','Horror','HOR'],['magic','Magic','MAG'],['technology','Technology','TECH'],['vehicles','Vehicles','VEH'],
    ['combat','Weapons & Combat','COM'],['security','Security','SEC'],['economy','Economy','ECO'],['furniture','Furniture','FUR'],
    ['building','Building Tools','BLD'],['animals','Animals & Wildlife','WILD'],['farming','Farming','FARM'],['realism','Realism','REAL'],
    ['utility','Utility','UTIL'],['ui','UI & HUD','HUD'],['worldgen','World Generation','GEN'],['structures','Structures','STR'],
    ['mobs','Mobs','MOB'],['bosses','Bosses','BOSS'],['multiplayer','Multiplayer','MULTI'],['audio','Audio','AUDIO'],
    ['animation','Animation','ANIM'],['quality','Quality of Life','QOL']
  ];

  const addons = [
    {
      id:'dlavie-heist', title:'DLavie Heist', creator:'DLavie Craft', version:'1.0', price:'FREE', status:'New',
      description:'Gameplay pembobolan untuk Minecraft Bedrock dengan vault safe, crowbar, breach sequence, cinematic camera, progress bar, money objective, dan reward perampokan.',
      compatibility:'Bedrock / PE 26.45',
      tags:['featured','new','adventure','roleplay','combat','security','economy','realism','utility','multiplayer'],
      repo:HEIST_REPO, download:HEIST_DOWNLOAD, art:'heist',
      bullets:['Vault Safe','Crowbar Breach','Cinematic Camera','Money System']
    }
  ];

  let rootObserver = null;
  let themeObserver = null;
  let previousTitle = document.title;
  let filter = 'all';
  let query = '';
  let sort = 'featured';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const isMarketplace = () => ROUTE.test(location.hash);
  const isHome = () => HOME.test(location.hash || '#');

  function parseRGB(value){
    const m=String(value||'').match(/rgba?\(([^)]+)\)/i); if(!m)return null;
    const n=m[1].split(',').map(v=>Number.parseFloat(v)); if(n.length<3)return null;
    return [n[0],n[1],n[2],Number.isFinite(n[3])?n[3]:1];
  }
  function luminance(rgb){
    if(!rgb)return .1;
    const s=rgb.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});
    return .2126*s[0]+.7152*s[1]+.0722*s[2];
  }
  function resolvedBackground(){
    const candidates=[document.body,document.documentElement,document.getElementById(ROOT_ID)?.firstElementChild].filter(Boolean);
    for(const el of candidates){const rgb=parseRGB(getComputedStyle(el).backgroundColor);if(rgb&&rgb[3]>.15)return rgb;}
    return matchMedia('(prefers-color-scheme:dark)').matches?[10,9,15,1]:[245,246,243,1];
  }
  function readAccent(){
    const names=['--accent','--accent-color','--brand','--brand-color','--primary','--primary-color','--theme-accent','--dl-accent','--color-accent'];
    const scopes=[document.documentElement,document.body,document.getElementById(ROOT_ID)?.firstElementChild].filter(Boolean);
    for(const scope of scopes){const style=getComputedStyle(scope);for(const name of names){const v=style.getPropertyValue(name).trim();if(v&&!/transparent|inherit|initial/i.test(v))return v;}}
    return '#8f6cf6';
  }
  function syncTheme(){
    const mode=luminance(resolvedBackground())>.46?'light':'dark';
    const accent=readAccent();
    for(const el of [document.getElementById(PAGE_ID),document.getElementById(BANNER_ID)]) if(el){el.dataset.dlmTheme=mode;el.style.setProperty('--dlm-accent',accent);}
  }

  function bannerMarkup(){
    return `
      <div class="dlm-banner-copy">
        <div class="dlm-banner-kicker"><span>FREE</span> MINECRAFT MARKETPLACE ADD-ONS</div>
        <h2>Temukan add-on gratis untuk Bedrock.</h2>
        <p>Jelajahi gameplay packs, roleplay, survival, mobs, utilities, UI, world generation, dan kategori add-on lainnya dalam satu marketplace.</p>
        <div class="dlm-banner-actions">
          <a class="dlm-btn primary" href="#/marketplace">Buka Marketplace</a>
          <a class="dlm-btn ghost" href="#/marketplace?category=new">Lihat yang terbaru</a>
        </div>
      </div>
      <div class="dlm-banner-art" aria-hidden="true">
        <div class="dlm-market-stack"><span class="b1"></span><span class="b2"></span><span class="b3"></span><b>+</b></div>
        <span class="dlm-chip">BEDROCK ADD-ONS</span>
      </div>`;
  }

  function ensureHomeBanner(){
    if(!isHome() || isMarketplace()){document.getElementById(BANNER_ID)?.remove();return;}
    if(document.getElementById(BANNER_ID)){syncTheme();return;}
    const root=document.getElementById(ROOT_ID); if(!root)return;
    const main=root.querySelector('main') || root.querySelector('[class*="home" i]') || root.firstElementChild;
    if(!main)return;
    const banner=document.createElement('section');
    banner.id=BANNER_ID; banner.className='dlm-home-banner'; banner.setAttribute('aria-label','Minecraft Marketplace Add-Ons gratis'); banner.innerHTML=bannerMarkup();
    const directSection=main.querySelector(':scope > section');
    if(directSection && directSection.parentElement===main) directSection.insertAdjacentElement('afterend',banner); else main.prepend(banner);
    syncTheme();
  }

  function categoryMarkup(){
    return categories.map(([id,name,abbr])=>`<button type="button" class="dlm-category-card${filter===id?' active':''}" data-dlm-category="${id}"><span>${esc(abbr)}</span><strong>${esc(name)}</strong></button>`).join('');
  }

  function coverMarkup(addon){
    if(addon.art==='heist') return `<div class="dlm-addon-cover-art heist"><div class="dlm-heist-safe"><i></i><b>$</b></div><span>HEIST</span></div>`;
    return `<div class="dlm-addon-cover-art generic"><div class="dlm-pack-cube"><i></i><b>+</b></div><span>ADD-ON</span></div>`;
  }

  function addonCardMarkup(addon){
    return `<article class="dlm-addon-card" data-id="${esc(addon.id)}">
      <div class="dlm-addon-cover">${coverMarkup(addon)}<em>${esc(addon.price)}</em></div>
      <div class="dlm-addon-body">
        <div class="dlm-addon-meta"><span class="free">${esc(addon.price)}</span><span>${esc(addon.status)}</span><span>${esc(addon.compatibility)}</span></div>
        <h3>${esc(addon.title)}</h3><small class="dlm-creator">by ${esc(addon.creator)}</small><p>${esc(addon.description)}</p>
        <div class="dlm-feature-row">${addon.bullets.map(v=>`<span>${esc(v)}</span>`).join('')}</div>
        <div class="dlm-addon-actions"><a class="dlm-btn primary download" href="${addon.download}" download>Download .mcaddon</a><a class="dlm-btn ghost" href="${addon.repo}" target="_blank" rel="noopener noreferrer">Details</a></div>
      </div>
    </article>`;
  }

  function visibleAddons(){
    let list=addons.filter(a=>(filter==='all'||a.tags.includes(filter)) && (!query || `${a.title} ${a.creator} ${a.description} ${a.tags.join(' ')}`.toLowerCase().includes(query)));
    if(sort==='az')list=[...list].sort((a,b)=>a.title.localeCompare(b.title));
    if(sort==='newest')list=[...list].sort((a,b)=>(b.tags.includes('new')?1:0)-(a.tags.includes('new')?1:0));
    return list;
  }

  function renderCatalog(){
    const page=document.getElementById(PAGE_ID); if(!page)return;
    const grid=page.querySelector('.dlm-addon-grid'); const count=page.querySelector('[data-dlm-count]'); if(!grid)return;
    const list=visibleAddons(); if(count)count.textContent=`${list.length} add-on`;
    grid.innerHTML=list.length?list.map(addonCardMarkup).join(''):`<div class="dlm-empty"><span>+</span><strong>Belum ada add-on di kategori ini</strong><p>Kategori sudah tersedia dan akan terisi saat add-on baru dipublikasikan.</p><button type="button" data-dlm-category="all">Lihat semua add-on</button></div>`;
  }

  function pageMarkup(){
    return `<div class="dlm-shell">
      <header class="dlm-topbar"><button type="button" class="dlm-back" data-dlm-back aria-label="Kembali">←</button><a href="#/" class="dlm-brand"><i></i><span>DLavie <b>Add-On Marketplace</b></span></a><div class="dlm-top-actions"><a href="#/">DLavie Craft</a></div></header>
      <main class="dlm-main">
        <section class="dlm-hero">
          <div><span class="dlm-eyebrow">MINECRAFT BEDROCK</span><h1>Marketplace <em>Add-Ons</em></h1><p>Katalog add-on Minecraft Bedrock gratis dengan pencarian, filter kategori, informasi kompatibilitas, dan unduhan langsung. Dibuat sebagai hub untuk semua add-on DLavie Craft — bukan halaman khusus satu project.</p><div class="dlm-hero-badges"><span>${categories.length} kategori</span><span>Free add-ons</span><span>Bedrock / PE</span></div></div>
          <div class="dlm-hero-market" aria-hidden="true"><div class="dlm-pack-cube big"><i></i><b>+</b></div><span>MARKETPLACE</span></div>
        </section>

        <section class="dlm-browser"><div class="dlm-section-head"><div><span>CATEGORIES</span><h2>Jelajahi add-on</h2></div><small>${categories.length} kategori</small></div><div class="dlm-category-grid">${categoryMarkup()}</div></section>

        <section class="dlm-catalog"><div class="dlm-section-head compact"><div><span>CATALOG</span><h2>Free Add-Ons</h2></div><small>Semua project tersedia gratis</small></div><div class="dlm-catalog-bar"><label class="dlm-search"><span></span><input type="search" placeholder="Cari add-on, kategori, atau creator..." aria-label="Cari add-on"></label><select class="dlm-sort" aria-label="Urutkan add-on"><option value="featured">Featured</option><option value="newest">Terbaru</option><option value="az">A–Z</option></select></div><div class="dlm-catalog-summary"><strong data-dlm-active-category>All Add-Ons</strong><span data-dlm-count>${addons.length} add-on</span></div><div class="dlm-addon-grid"></div></section>

        <section class="dlm-publish-note"><div><span>PUBLISHING</span><h2>Satu marketplace untuk semua add-on.</h2></div><p>Project seperti DLavie Heist tampil sebagai item katalog. Add-on berikutnya bisa ditambahkan ke kategori yang sesuai tanpa mengubah identitas halaman Marketplace.</p></section>

        <footer class="dlm-footer"><strong>DLavie Add-On Marketplace</strong><p>Katalog independen untuk Minecraft Bedrock. Tidak berafiliasi dengan Mojang Studios atau Microsoft.</p><a href="#/">Kembali ke DLavie Craft</a></footer>
      </main>
    </div>`;
  }

  function selectCategory(id, page, shouldScroll=true){
    filter=categories.some(c=>c[0]===id)?id:'all';
    page.querySelectorAll('[data-dlm-category]').forEach(b=>b.classList.toggle('active',b.dataset.dlmCategory===filter));
    const name=categories.find(c=>c[0]===filter)?.[1]||'All Add-Ons';
    const label=page.querySelector('[data-dlm-active-category]'); if(label)label.textContent=name;
    renderCatalog();
    if(shouldScroll)page.querySelector('.dlm-catalog')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function bindPage(page){
    page.addEventListener('click',e=>{
      const back=e.target.closest('[data-dlm-back]'); if(back){if(history.length>1)history.back();else location.hash='#/';return;}
      const cat=e.target.closest('[data-dlm-category]'); if(cat)selectCategory(cat.dataset.dlmCategory||'all',page,true);
    });
    page.querySelector('.dlm-search input')?.addEventListener('input',e=>{query=e.currentTarget.value.trim().toLowerCase();renderCatalog();});
    page.querySelector('.dlm-sort')?.addEventListener('change',e=>{sort=e.currentTarget.value;renderCatalog();});
  }

  function requestedCategory(){
    const q=location.hash.split('?')[1]||''; const params=new URLSearchParams(q); return params.get('category')||'all';
  }

  function openMarketplace(){
    document.getElementById(BANNER_ID)?.remove();
    let page=document.getElementById(PAGE_ID);
    if(!page){page=document.createElement('div');page.id=PAGE_ID;page.className='dl-marketplace-page';page.innerHTML=pageMarkup();document.body.appendChild(page);bindPage(page);}
    document.body.classList.add('dl-marketplace-open'); page.hidden=false; page.scrollTop=0; previousTitle=document.title; document.title='Minecraft Add-On Marketplace — DLavie Craft';
    selectCategory(requestedCategory(),page,false); syncTheme();
  }
  function closeMarketplace(){
    const page=document.getElementById(PAGE_ID); if(page)page.hidden=true;
    document.body.classList.remove('dl-marketplace-open'); if(document.title.includes('Add-On Marketplace'))document.title=previousTitle||'DLavie Craft'; setTimeout(ensureHomeBanner,80);
  }
  function route(){if(isMarketplace())openMarketplace();else closeMarketplace();}

  function watchRoot(){
    const root=document.getElementById(ROOT_ID); if(!root||rootObserver)return;
    rootObserver=new MutationObserver(()=>{if(!isMarketplace())ensureHomeBanner();}); rootObserver.observe(root,{childList:true,subtree:true});
  }
  function watchTheme(){
    if(themeObserver)return;
    themeObserver=new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class','style','data-theme','data-color','data-accent']});
    themeObserver.observe(document.body,{attributes:true,attributeFilter:['class','style','data-theme','data-color','data-accent']});
    matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change',syncTheme);
    document.addEventListener('click',()=>setTimeout(syncTheme,80),true);
  }

  window.addEventListener('hashchange',route); window.addEventListener('popstate',route); window.addEventListener('pageshow',()=>{route();ensureHomeBanner();syncTheme();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{watchRoot();watchTheme();route();ensureHomeBanner();},{once:true}); else {watchRoot();watchTheme();route();ensureHomeBanner();}

  window.__DLAVIE_MARKETPLACE__={version:'2.0.0',open:()=>{location.hash='#/marketplace'},syncTheme};
})();