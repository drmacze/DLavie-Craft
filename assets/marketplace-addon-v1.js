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
    ['featured','Featured','FT'],['adventure','Adventure','AD'],['survival','Survival','SV'],['roleplay','Roleplay','RP'],
    ['minigames','Minigames','MG'],['pvp','PvP','PV'],['horror','Horror','HR'],['magic','Magic','MG'],
    ['technology','Technology','TC'],['vehicles','Vehicles','VH'],['weapons','Weapons & Combat','WC'],['security','Security','SC'],
    ['economy','Economy','EC'],['furniture','Furniture','FR'],['building','Building','BL'],['animals','Animals & Wildlife','AW'],
    ['farming','Farming','FM'],['realism','Realism','RL'],['utility','Utility','UT'],['ui','UI & HUD','UI'],
    ['worldgen','World Generation','WG'],['structures','Structures','ST'],['mobs','Mobs','MB'],['bosses','Bosses','BS'],
    ['multiplayer','Multiplayer','MP'],['education','Education','ED'],['seasonal','Seasonal','SN'],['audio','Audio','AU'],
    ['animation','Animation','AN'],['quality','Quality of Life','QL']
  ];

  const addons = [
    {
      id:'dlavie-heist', title:'DLavie Heist', version:'v1.0', price:'FREE', status:'Ready',
      description:'Heist gameplay module untuk Minecraft Bedrock dengan brankas, linggis, breach 60 detik, cinematic camera, progress bar, sistem uang, dan reward perampokan.',
      compatibility:'Bedrock / PE 26.45',
      tags:['featured','adventure','roleplay','weapons','security','economy','realism','utility','multiplayer'],
      repo:HEIST_REPO, download:HEIST_DOWNLOAD,
      bullets:['Vault Safe + Crowbar','60s Breach Sequence','Cinematic Camera','Money Objective + $3,000 Reward']
    }
  ];

  let rootObserver = null;
  let themeObserver = null;
  let previousTitle = document.title;
  let filter = 'featured';
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
    if(!rgb)return .1; const s=rgb.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});
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
    for(const scope of scopes){const style=getComputedStyle(scope);for(const name of names){const v=style.getPropertyValue(name).trim();if(v && !/transparent|inherit|initial/i.test(v))return v;}}
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
        <div class="dlm-banner-kicker"><span>FREE</span> MINECRAFT MARKETPLACE ADD-ON</div>
        <h2>DLavie Heist</h2>
        <p>Brankas, linggis, cinematic breach, sistem uang, dan gameplay pembobolan untuk Minecraft Bedrock.</p>
        <div class="dlm-banner-actions">
          <a class="dlm-btn primary" href="#/marketplace">Buka Marketplace</a>
          <a class="dlm-btn ghost" href="${HEIST_REPO}" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
      <div class="dlm-banner-art" aria-hidden="true">
        <span class="dlm-safe"><i></i><b>$</b></span>
        <span class="dlm-grid g1"></span><span class="dlm-grid g2"></span>
        <span class="dlm-chip">BEDROCK</span>
      </div>`;
  }

  function ensureHomeBanner(){
    if(!isHome() || isMarketplace()){document.getElementById(BANNER_ID)?.remove();return;}
    if(document.getElementById(BANNER_ID)){syncTheme();return;}
    const root=document.getElementById(ROOT_ID); if(!root)return;
    const main=root.querySelector('main') || root.querySelector('[class*="home" i]') || root.firstElementChild;
    if(!main)return;
    const banner=document.createElement('section'); banner.id=BANNER_ID; banner.className='dlm-home-banner'; banner.setAttribute('aria-label','DLavie Heist gratis'); banner.innerHTML=bannerMarkup();
    const directSection=main.querySelector(':scope > section');
    if(directSection && directSection.parentElement===main) directSection.insertAdjacentElement('afterend',banner); else main.prepend(banner);
    syncTheme();
  }

  function categoryMarkup(){
    return categories.map(([id,name,abbr])=>`<button type="button" class="dlm-category-card${filter===id?' active':''}" data-dlm-category="${id}"><span>${abbr}</span><strong>${esc(name)}</strong><small>Jelajahi</small></button>`).join('');
  }

  function addonCardMarkup(addon){
    return `<article class="dlm-addon-card" data-id="${addon.id}">
      <div class="dlm-addon-cover" aria-hidden="true"><div class="dlm-vault"><span></span><b>$</b></div><em>FREE</em><i>HEIST CORE</i></div>
      <div class="dlm-addon-body">
        <div class="dlm-addon-meta"><span class="free">${addon.price}</span><span>${addon.version}</span><span>${addon.compatibility}</span></div>
        <h3>${esc(addon.title)}</h3><p>${esc(addon.description)}</p>
        <div class="dlm-feature-row">${addon.bullets.map(v=>`<span>${esc(v)}</span>`).join('')}</div>
        <div class="dlm-addon-actions"><a class="dlm-btn primary download" href="${addon.download}" download>Download .mcaddon</a><a class="dlm-btn ghost" href="${addon.repo}" target="_blank" rel="noopener noreferrer">Source</a></div>
      </div>
    </article>`;
  }

  function visibleAddons(){
    let list=addons.filter(a=>(filter==='featured'||a.tags.includes(filter)) && (!query || `${a.title} ${a.description} ${a.tags.join(' ')}`.toLowerCase().includes(query)));
    if(sort==='az')list=[...list].sort((a,b)=>a.title.localeCompare(b.title));
    if(sort==='newest')list=[...list].reverse();
    return list;
  }

  function renderCatalog(){
    const grid=document.querySelector(`#${PAGE_ID} .dlm-addon-grid`); const count=document.querySelector(`#${PAGE_ID} [data-dlm-count]`); if(!grid)return;
    const list=visibleAddons(); if(count)count.textContent=`${list.length} add-on`;
    grid.innerHTML=list.length?list.map(addonCardMarkup).join(''):`<div class="dlm-empty"><span>0</span><strong>Belum ada add-on di kategori ini</strong><p>Kategori sudah siap. Konten berikutnya bisa ditambahkan tanpa mengubah layout marketplace.</p><button type="button" data-dlm-category="featured">Kembali ke Featured</button></div>`;
  }

  function pageMarkup(){
    return `<div class="dlm-shell">
      <header class="dlm-topbar"><button type="button" class="dlm-back" data-dlm-back aria-label="Kembali"><span>←</span></button><a href="#/" class="dlm-brand"><i></i><span>DLavie <b>Marketplace</b></span></a><div class="dlm-top-actions"><a href="${HEIST_REPO}" target="_blank" rel="noopener noreferrer">GitHub</a></div></header>
      <main class="dlm-main">
        <section class="dlm-hero"><div><span class="dlm-eyebrow">DLAVIE CRAFT • BEDROCK</span><h1>Marketplace <em>Add-Ons</em></h1><p>Temukan add-on Minecraft Bedrock dari DLavie Craft. Katalog dibuat seperti marketplace modern dengan kategori lengkap, pencarian, filter, status versi, dan unduhan langsung.</p><div class="dlm-hero-badges"><span>${categories.length} kategori</span><span>Free downloads</span><span>Bedrock / PE</span></div></div><div class="dlm-hero-cube" aria-hidden="true"><i></i><b>+</b></div></section>

        <section class="dlm-featured"><div class="dlm-section-head"><div><span>FEATURED FREE ADD-ON</span><h2>DLavie Heist</h2></div><a href="${HEIST_REPO}" target="_blank" rel="noopener noreferrer">Project repository ↗</a></div><div class="dlm-featured-panel"><div class="dlm-featured-art"><div class="dlm-safe-large"><span></span><b>$</b></div><span class="dlm-free-ribbon">FREE</span><small>HEIST CORE • V1.0</small></div><div class="dlm-featured-copy"><p>Gameplay pembobolan untuk Bedrock: vault safe, crowbar, breach 60 detik, 20-step progress, cinematic camera, sistem uang, dan reward default $3,000.</p><div class="dlm-featured-tags"><span>Roleplay</span><span>Security</span><span>Economy</span><span>Realism</span></div><div class="dlm-banner-actions"><a class="dlm-btn primary" href="${HEIST_DOWNLOAD}" download>Download Gratis</a><a class="dlm-btn ghost" href="${HEIST_REPO}" target="_blank" rel="noopener noreferrer">Detail</a></div></div></div></section>

        <section class="dlm-browser"><div class="dlm-section-head"><div><span>BROWSE</span><h2>Jelajahi kategori</h2></div><small>${categories.length} kategori add-on</small></div><div class="dlm-category-grid">${categoryMarkup()}</div></section>

        <section class="dlm-catalog"><div class="dlm-catalog-bar"><label class="dlm-search"><span></span><input type="search" placeholder="Cari add-on..." aria-label="Cari add-on"></label><select class="dlm-sort" aria-label="Urutkan add-on"><option value="featured">Featured</option><option value="newest">Terbaru</option><option value="az">A–Z</option></select></div><div class="dlm-catalog-summary"><strong data-dlm-active-category>Featured</strong><span data-dlm-count>1 add-on</span></div><div class="dlm-addon-grid"></div></section>

        <footer class="dlm-footer"><strong>DLavie Craft Marketplace</strong><p>Katalog independen untuk Minecraft Bedrock. Tidak berafiliasi dengan Mojang Studios atau Microsoft.</p><a href="#/">Kembali ke DLavie Craft</a></footer>
      </main>
    </div>`;
  }

  function bindPage(page){
    page.addEventListener('click',e=>{
      const back=e.target.closest('[data-dlm-back]'); if(back){ if(history.length>1)history.back();else location.hash='#/';return; }
      const cat=e.target.closest('[data-dlm-category]'); if(cat){ filter=cat.dataset.dlmCategory||'featured'; page.querySelectorAll('[data-dlm-category]').forEach(b=>b.classList.toggle('active',b.dataset.dlmCategory===filter)); const name=categories.find(c=>c[0]===filter)?.[1]||'Featured'; const label=page.querySelector('[data-dlm-active-category]');if(label)label.textContent=name; renderCatalog(); page.querySelector('.dlm-catalog')?.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
    const search=page.querySelector('.dlm-search input'); if(search)search.addEventListener('input',()=>{query=search.value.trim().toLowerCase();renderCatalog();});
    const select=page.querySelector('.dlm-sort'); if(select)select.addEventListener('change',()=>{sort=select.value;renderCatalog();});
  }

  function openMarketplace(){
    document.getElementById(BANNER_ID)?.remove();
    let page=document.getElementById(PAGE_ID);
    if(!page){page=document.createElement('div');page.id=PAGE_ID;page.className='dl-marketplace-page';page.innerHTML=pageMarkup();document.body.appendChild(page);bindPage(page);renderCatalog();}
    document.body.classList.add('dl-marketplace-open');
    page.hidden=false; page.scrollTop=0; previousTitle=document.title; document.title='Marketplace Add-Ons — DLavie Craft'; syncTheme();
  }
  function closeMarketplace(){
    const page=document.getElementById(PAGE_ID); if(page)page.hidden=true; document.body.classList.remove('dl-marketplace-open'); if(document.title.includes('Marketplace Add-Ons'))document.title=previousTitle||'DLavie Craft'; setTimeout(ensureHomeBanner,80);
  }
  function route(){ if(isMarketplace())openMarketplace();else closeMarketplace(); }

  function watchRoot(){
    const root=document.getElementById(ROOT_ID); if(!root||rootObserver)return;
    rootObserver=new MutationObserver(()=>{if(!isMarketplace())ensureHomeBanner();}); rootObserver.observe(root,{childList:true,subtree:true});
  }
  function watchTheme(){
    if(themeObserver)return; themeObserver=new MutationObserver(syncTheme); themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class','style','data-theme','data-color','data-accent']}); themeObserver.observe(document.body,{attributes:true,attributeFilter:['class','style','data-theme','data-color','data-accent']});
    matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change',syncTheme);
    document.addEventListener('click',()=>setTimeout(syncTheme,80),true);
  }

  window.addEventListener('hashchange',route); window.addEventListener('popstate',route); window.addEventListener('pageshow',()=>{route();ensureHomeBanner();syncTheme();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{watchRoot();watchTheme();route();ensureHomeBanner();},{once:true}); else {watchRoot();watchTheme();route();ensureHomeBanner();}

  window.__DLAVIE_MARKETPLACE__={version:'1.0.0',open:()=>{location.hash='#/marketplace'},syncTheme};
})();