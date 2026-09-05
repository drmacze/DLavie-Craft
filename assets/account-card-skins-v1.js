(() => {
  'use strict';

  const SKINS = [
    {id:'grasslands',name:'Grasslands',level:1,rarity:'Common',tag:'Overworld Starter'},
    {id:'amethyst-cavern',name:'Amethyst Cavern',level:5,rarity:'Rare',tag:'Crystal Resonance'},
    {id:'ocean-monument',name:'Ocean Monument',level:10,rarity:'Rare',tag:'Prismarine Current'},
    {id:'sakura-grove',name:'Sakura Grove',level:15,rarity:'Epic',tag:'Petal Breeze'},
    {id:'lush-cave',name:'Lush Cave',level:20,rarity:'Epic',tag:'Glow Berry Garden'},
    {id:'nether-flame',name:'Nether Flame',level:30,rarity:'Epic',tag:'Crimson Inferno'},
    {id:'soul-valley',name:'Soul Sand Valley',level:40,rarity:'Holo',tag:'Soulfire Mist'},
    {id:'ender-void',name:'Ender Void',level:50,rarity:'Holo',tag:'Void Resonance'},
    {id:'ender-dragon',name:'Ender Dragon',level:60,rarity:'Legendary',tag:'Dragon Ascension'},
    {id:'ancient-city',name:'Ancient City',level:70,rarity:'Legendary',tag:'Sculk Echo'},
    {id:'enchanted-library',name:'Enchanted Library',level:85,rarity:'Mythic',tag:'Arcane Archive'},
    {id:'mythic-realm',name:'Mythic Realm',level:100,rarity:'Mythic',tag:'Prismatic Apex'}
  ];

  const core = () => window.__DLAVIE_COLLECTOR__;
  let state = {level:1, equipped:'grasslands', seen:0, profile:null};
  let syncBusy = false;
  let observer = null;
  let poll = 0;
  let vaultHost = null;
  const boundCards = new WeakSet();

  const esc = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const skinById = id => SKINS.find(s => s.id === id) || SKINS[0];
  const unlocked = level => SKINS.filter(s => Number(level||1) >= s.level);
  const highest = level => unlocked(level).at(-1) || SKINS[0];
  const canUse = (id,level) => skinById(id).level <= Number(level||1);

  function sceneMarkup(skin){
    const label = `<span class="dl-skin-scene-label"><b>${esc(skin.name)}</b><small>${esc(skin.rarity)}</small></span>`;
    const evo = '<span class="dl-skin-evolution-badge"></span>';
    switch(skin.id){
      case 'amethyst-cavern': return `<div class="dl-skin-scene scene-amethyst">${label}${evo}<i class="crystal c1"></i><i class="crystal c2"></i><i class="crystal c3"></i><i class="crystal c4"></i><i class="cave-floor"></i></div>`;
      case 'ocean-monument': return `<div class="dl-skin-scene scene-ocean">${label}${evo}<i class="ocean-wave"></i><i class="prismarine p1"></i><i class="prismarine p2"></i><i class="bubble b1"></i><i class="bubble b2"></i><i class="bubble b3"></i></div>`;
      case 'sakura-grove': return `<div class="dl-skin-scene scene-sakura">${label}${evo}<i class="sakura-trunk"></i><i class="sakura-crown"></i><i class="petal p1"></i><i class="petal p2"></i><i class="petal p3"></i><i class="petal p4"></i><i class="petal p5"></i></div>`;
      case 'lush-cave': return `<div class="dl-skin-scene scene-lush">${label}${evo}<i class="lush-vine v1"></i><i class="lush-vine v2"></i><i class="glowberry g1"></i><i class="glowberry g2"></i><i class="lush-pool"></i></div>`;
      case 'nether-flame': return `<div class="dl-skin-scene scene-nether">${label}${evo}<i class="lava-band"></i><i class="nether-rock r1"></i><i class="nether-rock r2"></i><i class="flame f1"></i><i class="flame f2"></i><i class="flame f3"></i><i class="ember e1"></i><i class="ember e2"></i><i class="ember e3"></i></div>`;
      case 'soul-valley': return `<div class="dl-skin-scene scene-soul">${label}${evo}<i class="soul-fog"></i><i class="bone-pillar b1"></i><i class="bone-pillar b2"></i><i class="soul-flame s1"></i><i class="soul-flame s2"></i><i class="soul-orb o1"></i><i class="soul-orb o2"></i></div>`;
      case 'ender-void': return `<div class="dl-skin-scene scene-ender">${label}${evo}<i class="void-ring r1"></i><i class="void-ring r2"></i><i class="end-island"></i><i class="ender-particle e1"></i><i class="ender-particle e2"></i><i class="ender-particle e3"></i></div>`;
      case 'ender-dragon': return `<div class="dl-skin-scene scene-dragon">${label}${evo}<i class="dragon-wing left"></i><i class="dragon-wing right"></i><i class="dragon-body"></i><i class="dragon-head"></i><i class="dragon-eye left"></i><i class="dragon-eye right"></i><i class="dragon-tail"></i><i class="dragon-aura"></i></div>`;
      case 'ancient-city': return `<div class="dl-skin-scene scene-ancient">${label}${evo}<i class="sculk-floor"></i><i class="warden-glyph"></i><i class="echo-ring e1"></i><i class="echo-ring e2"></i><i class="soul-speck s1"></i><i class="soul-speck s2"></i></div>`;
      case 'enchanted-library': return `<div class="dl-skin-scene scene-library">${label}${evo}<i class="book-stack"></i><i class="enchanted-book"></i><i class="rune r1">ᚱ</i><i class="rune r2">✦</i><i class="rune r3">ᛉ</i><i class="arcane-ring"></i></div>`;
      case 'mythic-realm': return `<div class="dl-skin-scene scene-mythic">${label}${evo}<i class="aurora a1"></i><i class="aurora a2"></i><i class="mythic-core"></i><i class="star s1"></i><i class="star s2"></i><i class="star s3"></i><i class="star s4"></i></div>`;
      default: return `<div class="dl-skin-scene scene-grasslands">${label}${evo}<i class="sky-cloud c1"></i><i class="sky-cloud c2"></i><i class="hill h1"></i><i class="hill h2"></i><i class="grass-strip"></i><i class="sun-cube"></i></div>`;
    }
  }

  function applyCard(card, skin=skinById(state.equipped), level=Number(card?.dataset?.level||state.level||1)){
    if(!(card instanceof HTMLElement)) return;
    const usable = canUse(skin.id,level) ? skin : highest(level);
    [...card.classList].filter(c=>c.startsWith('dl-skin-')).forEach(c=>card.classList.remove(c));
    card.classList.add(`dl-skin-${usable.id}`);
    card.dataset.cardSkin = usable.id;
    card.dataset.evolutionLevel = String(level);
    const strength = Math.min(.72, .16 + Math.max(1,level)*.0052);
    card.style.setProperty('--dl-evo-strength', strength.toFixed(3));
    card.style.setProperty('--dl-evo-speed', `${Math.max(3.8,8.8-level*.035).toFixed(2)}s`);
    card.style.setProperty('--dl-evo-hue', `${(level*11)%360}deg`);
    const art=card.querySelector('.dl-card-art'); if(!art) return;
    let scene=art.querySelector(':scope > .dl-skin-scene');
    if(!scene || scene.dataset.skin!==usable.id){scene?.remove();art.insertAdjacentHTML('afterbegin',sceneMarkup(usable));scene=art.querySelector(':scope > .dl-skin-scene');if(scene)scene.dataset.skin=usable.id;}
    const evo=scene?.querySelector('.dl-skin-evolution-badge'); if(evo)evo.textContent=`EVOLUTION · LV ${level}`;
    boundCards.add(card);
  }

  function scan(root=document){
    if(root?.matches?.('.dl-collector-card')) applyCard(root);
    root?.querySelectorAll?.('.dl-collector-card').forEach(card=>applyCard(card));
  }

  async function readProfileState(){
    const c=core(); if(!c?.session?.()||!c.uid?.()) return null;
    const me=c.uid();
    const [rows,bundle]=await Promise.all([
      c.api(`dlavie_craft_community_profiles?select=user_id,equipped_card_skin,card_skin_unlock_level_seen&user_id=eq.${encodeURIComponent(me)}&limit=1`),
      c.loadBundle(true)
    ]);
    const row=rows?.[0]||{}; const level=Math.max(1,Number(bundle?.level||1));
    let equipped=String(row.equipped_card_skin||'grasslands');
    if(!canUse(equipped,level)) equipped=highest(level).id;
    return {level,equipped,seen:Math.max(0,Number(row.card_skin_unlock_level_seen||0)),profile:bundle};
  }

  async function patchProfile(payload){
    const c=core(); const me=c?.uid?.(); if(!c||!me) throw new Error('Sesi akun tidak tersedia.');
    return c.api(`dlavie_craft_community_profiles?user_id=eq.${encodeURIComponent(me)}`,{method:'PATCH',write:true,body:JSON.stringify({...payload,updated_at:new Date().toISOString()})});
  }

  async function equipSkin(id){
    const skin=skinById(id); if(skin.level>state.level) return;
    await patchProfile({equipped_card_skin:skin.id});
    state.equipped=skin.id;
    scan(document);
    renderVault();
    document.dispatchEvent(new CustomEvent('dlavie:card-skin-changed',{detail:{skin:skin.id,level:state.level}}));
    window.__DLAVIE_MOTION__?.skinEquipped?.(skin.id);
  }

  function miniScene(skin){return `<div class="dl-vault-preview dl-preview-${skin.id}"><span></span><i></i><b></b></div>`;}

  function renderVault(){
    const host=document.getElementById('dl-collector-profile'); if(!host||!state.profile) return;
    let vault=host.querySelector('#dl-card-vault');
    if(!vault){vault=document.createElement('section');vault.id='dl-card-vault';vault.className='dl-card-vault';host.append(vault);} vaultHost=vault;
    const current=skinById(state.equipped); const next=SKINS.find(s=>s.level>state.level);
    vault.innerHTML=`<div class="dl-vault-head"><div><span>CARD VAULT</span><h3>Skin Collector Card</h3><p>Visual kartu berevolusi setiap level. Skin dunia baru terbuka pada milestone tertentu.</p></div><div class="dl-vault-current"><small>DIPAKAI</small><strong>${esc(current.name)}</strong><span>${esc(current.rarity)}</span></div></div>${next?`<div class="dl-vault-progress"><div><span>Unlock berikutnya</span><b>${esc(next.name)} · Lv ${next.level}</b></div><progress max="${next.level}" value="${Math.min(state.level,next.level)}"></progress></div>`:'<div class="dl-vault-progress complete"><div><span>Collection status</span><b>Semua skin milestone terbuka</b></div></div>'}<div class="dl-vault-grid">${SKINS.map(s=>{const open=state.level>=s.level,active=s.id===state.equipped;return `<button type="button" class="dl-vault-skin ${open?'unlocked':'locked'} ${active?'equipped':''}" data-skin="${s.id}" ${open?'':'disabled'}>${miniScene(s)}<span class="dl-vault-skin-copy"><strong>${esc(s.name)}</strong><small>${open?`${esc(s.rarity)} · Lv ${s.level}`:`Terkunci · Lv ${s.level}`}</small></span><em>${active?'DIPAKAI':open?'PAKAI':'LOCKED'}</em></button>`;}).join('')}</div>`;
    vault.querySelectorAll('[data-skin]:not(:disabled)').forEach(btn=>btn.onclick=async()=>{if(btn.dataset.skin===state.equipped)return;btn.disabled=true;try{await equipSkin(btn.dataset.skin);}catch(e){btn.disabled=false;window.__DLAVIE_COLLECTOR__?.toast?.(e.message);}});
  }

  function closeUnlock(overlay){
    if(!overlay) return; const gs=window.gsap;
    if(gs) gs.to(overlay,{opacity:0,duration:.28,onComplete:()=>overlay.remove()}); else overlay.remove();
  }

  function unlockCinematic(skin){
    if(!skin||document.querySelector('.dl-skin-unlock'))return;
    const overlay=document.createElement('div'); overlay.className=`dl-skin-unlock unlock-${skin.id}`;
    const preview={...state.profile,level:state.level};
    overlay.innerHTML=`<div class="dl-unlock-world"><i></i><i></i><i></i><i></i><i></i><i></i></div><section><span class="dl-unlock-kicker">NEW CARD SKIN</span><h2>SKIN UNLOCKED!</h2><p>Level ${state.level} membuka <strong>${esc(skin.name)}</strong></p><div class="dl-unlock-card">${core().cardHTML(preview)}</div><div class="dl-unlock-meta"><b>${esc(skin.rarity)}</b><span>${esc(skin.tag)}</span></div><div class="dl-unlock-actions"><button type="button" data-vault>Simpan ke Vault</button><button type="button" class="primary" data-equip>Pakai sekarang</button></div></section>`;
    document.body.append(overlay);
    const card=overlay.querySelector('.dl-collector-card'); applyCard(card,skin,state.level);
    const gs=window.gsap;
    if(gs){const tl=gs.timeline();tl.fromTo(overlay,{autoAlpha:0},{autoAlpha:1,duration:.32}).from('.dl-unlock-kicker',{y:18,opacity:0,duration:.3},'-=.15').from('.dl-skin-unlock h2',{scale:.72,opacity:0,duration:.48,ease:'back.out(1.7)'},'-=.18').from(card,{y:90,rotationY:-14,rotationX:7,scale:.78,opacity:0,duration:.72,ease:'power3.out'},'-=.2').from('.dl-unlock-meta,.dl-unlock-actions',{y:18,opacity:0,stagger:.08,duration:.35},'-=.3');}
    overlay.querySelector('[data-vault]').onclick=()=>closeUnlock(overlay);
    overlay.querySelector('[data-equip]').onclick=async()=>{const b=overlay.querySelector('[data-equip]');b.disabled=true;try{await equipSkin(skin.id);closeUnlock(overlay);}catch(e){b.disabled=false;}};
  }

  async function checkUnlocks(){
    const newly=SKINS.filter(s=>s.level>state.seen&&s.level<=state.level); const newest=newly.at(-1);
    if(state.level>state.seen){try{await patchProfile({card_skin_unlock_level_seen:state.level});state.seen=state.level;}catch{} }
    if(newest) setTimeout(()=>unlockCinematic(newest),700);
  }

  async function sync(force=false){
    if(syncBusy)return; syncBusy=true;
    try{const next=await readProfileState();if(!next)return;const levelChanged=next.level!==state.level;state=next;scan(document);renderVault();await checkUnlocks();if(levelChanged)document.documentElement.style.setProperty('--dl-current-level',String(state.level));}
    catch(e){console.warn('[Card skins]',e.message);} finally{syncBusy=false;}
  }

  function start(){
    observer?.disconnect();observer=new MutationObserver(records=>{for(const r of records){for(const node of r.addedNodes){if(node.nodeType===1)scan(node);}}const host=document.getElementById('dl-collector-profile');if(host&&host!==vaultHost?.parentElement)renderVault();});observer.observe(document.documentElement,{childList:true,subtree:true});
    sync(true);clearInterval(poll);poll=setInterval(()=>sync(false),10000);
  }

  document.addEventListener('dlavie:collector-ready',()=>setTimeout(()=>sync(true),120));
  document.addEventListener('dlavie:collector-profile-changed',()=>setTimeout(()=>sync(true),120));
  document.addEventListener('dlavie:community-activity',()=>setTimeout(()=>sync(true),1400));
  window.addEventListener('pageshow',()=>setTimeout(()=>sync(true),180));
  window.addEventListener('hashchange',()=>setTimeout(()=>sync(true),180));

  window.__DLAVIE_CARD_SKINS__={skins:SKINS,getState:()=>({...state}),equip:equipSkin,applyCard,sync};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();