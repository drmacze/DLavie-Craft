(() => {
  'use strict';

  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(hover:none), (pointer:coarse)');
  let lenis = null;
  let cardObserver = null;
  const revealed = new WeakSet();
  let repairRaf = 0;

  const gsapReady = () => !!window.gsap;
  const inAccountPortal = () => !!document.getElementById('dl-account-portal');

  function normalizePersistentVisuals(root=document){
    const scope = root?.querySelectorAll ? root : document;
    const cards = [];
    if(root?.matches?.('#dl-collector-profile .dl-collector-card')) cards.push(root);
    scope.querySelectorAll?.('#dl-collector-profile .dl-collector-card').forEach(el=>cards.push(el));
    for(const card of cards){
      if(card.closest('.dl-skin-unlock')) continue;
      if(gsapReady()) window.gsap.killTweensOf(card);
      card.style.removeProperty('opacity');
      card.style.removeProperty('visibility');
      if(coarsePointer.matches) card.style.removeProperty('transform');
      card.classList.add('dl-motion-stable');
    }

    scope.querySelectorAll?.('#dl-card-vault .dl-vault-skin').forEach(item=>{
      if(gsapReady()) window.gsap.killTweensOf(item);
      item.style.removeProperty('opacity');
      item.style.removeProperty('visibility');
      item.style.removeProperty('transform');
      if(item.classList.contains('unlocked')) item.removeAttribute('disabled');
      item.classList.add('dl-motion-stable');
    });
  }

  function scheduleRepair(root=document){
    if(repairRaf) return;
    repairRaf=requestAnimationFrame(()=>{
      repairRaf=0;
      normalizePersistentVisuals(root);
    });
  }

  function initLenis(){
    // The account/profile portal is its own scroll container. Lenis is intentionally
    // disabled there because document-level smooth scrolling can fight iOS Safari.
    if(reduceMotion.matches || !finePointer.matches || inAccountPortal() || !window.Lenis || lenis) return;
    try{
      lenis = new window.Lenis({duration:.92,smoothWheel:true,syncTouch:false,wheelMultiplier:.9,touchMultiplier:1});
      if(gsapReady()){
        window.gsap.ticker.add(time=>lenis?.raf(time*1000));
        window.gsap.ticker.lagSmoothing(0);
      }else{
        const raf=t=>{lenis?.raf(t);requestAnimationFrame(raf)};
        requestAnimationFrame(raf);
      }
      document.documentElement.classList.add('dl-lenis-active');
    }catch(e){
      console.warn('[DLavie Motion v2] Lenis disabled:',e.message);
      lenis=null;
    }
  }

  function pauseForModal(){
    if(!lenis)return;
    const blocked=inAccountPortal() || !!document.querySelector('.dl-identity-onboarding,.dl-avatar-picker,.dl-skin-unlock') || document.body.classList.contains('dl-onboarding-open');
    try{blocked?lenis.stop():lenis.start();}catch{}
  }

  function revealCard(card){
    if(!(card instanceof HTMLElement)||revealed.has(card)||reduceMotion.matches)return;
    revealed.add(card);
    // Never tween opacity on persistent profile cards. Safari/WebKit can retain an
    // interrupted autoAlpha value after DOM rerenders, making the card look dim.
    if(gsapReady() && !coarsePointer.matches){
      window.gsap.fromTo(card,{y:18,scale:.992},{y:0,scale:1,duration:.52,ease:'power3.out',clearProps:'transform'});
    }else{
      card.style.removeProperty('opacity');
      card.style.removeProperty('visibility');
      card.style.removeProperty('transform');
    }
  }

  function initCardReveal(){
    cardObserver?.disconnect();
    cardObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting&&entry.intersectionRatio>.08){
        revealCard(entry.target);
        cardObserver?.unobserve(entry.target);
      }
    }),{threshold:[0,.08,.24]});
    document.querySelectorAll('.dl-collector-card').forEach(c=>cardObserver.observe(c));
    scheduleRepair(document);
  }

  function scanAdded(root){
    if(root?.matches?.('.dl-collector-card'))cardObserver?.observe(root);
    root?.querySelectorAll?.('.dl-collector-card').forEach(c=>cardObserver?.observe(c));
    if(root?.matches?.('#dl-card-vault,.dl-vault-skin') || root?.querySelector?.('#dl-card-vault,.dl-vault-skin')) scheduleRepair(root);
  }

  function skinEquipped(){
    const card=document.querySelector('#dl-collector-profile .dl-collector-card');
    if(!card||reduceMotion.matches)return;
    const inner=card.querySelector('.dl-collector-card-inner')||card;
    if(gsapReady()){
      const g=window.gsap;
      g.killTweensOf(inner);
      g.timeline({onComplete:()=>{
        inner.style.removeProperty('transform');
        normalizePersistentVisuals(document);
      }})
      .to(inner,{scale:.982,rotationZ:-.45,duration:.10,ease:'power2.in'})
      .to(inner,{scale:1.012,rotationZ:.28,duration:.18,ease:'back.out(1.6)'})
      .to(inner,{scale:1,rotationZ:0,duration:.18,ease:'power2.out'});
    }
  }

  function animateVault(){
    if(reduceMotion.matches||!gsapReady()||coarsePointer.matches){
      scheduleRepair(document);
      return;
    }
    const cards=[...document.querySelectorAll('#dl-card-vault .dl-vault-skin')].filter(n=>!n.dataset.dlMotionV2);
    cards.forEach(n=>n.dataset.dlMotionV2='1');
    if(cards.length){
      window.gsap.fromTo(cards,{y:8,scale:.992},{y:0,scale:1,stagger:.025,duration:.28,ease:'power2.out',clearProps:'transform',onComplete:()=>normalizePersistentVisuals(document)});
    }
  }

  function boot(){
    if(window.gsap&&window.ScrollTrigger){try{window.gsap.registerPlugin(window.ScrollTrigger);}catch{}}
    initLenis();
    initCardReveal();
    normalizePersistentVisuals(document);

    const mo=new MutationObserver(records=>{
      let vault=false;
      for(const record of records){
        for(const node of record.addedNodes){
          if(node.nodeType!==1)continue;
          scanAdded(node);
          if(node.id==='dl-card-vault'||node.matches?.('.dl-vault-skin')||node.querySelector?.('#dl-card-vault,.dl-vault-skin'))vault=true;
        }
      }
      pauseForModal();
      scheduleRepair(document);
      if(vault)setTimeout(animateVault,30);
    });
    mo.observe(document.documentElement,{childList:true,subtree:true});

    window.addEventListener('pageshow',()=>{
      initLenis();initCardReveal();pauseForModal();scheduleRepair(document);
    });
    window.addEventListener('pagehide',()=>scheduleRepair(document));
    document.addEventListener('dlavie:card-skin-changed',()=>setTimeout(()=>{skinEquipped();scheduleRepair(document);},20));
    document.addEventListener('dlavie:collector-profile-changed',()=>setTimeout(()=>scheduleRepair(document),60));
    document.addEventListener('visibilitychange',()=>{
      scheduleRepair(document);
      if(!lenis)return;
      try{document.hidden?lenis.stop():lenis.start();}catch{}
    });
  }

  window.__DLAVIE_MOTION__={
    get lenis(){return lenis;},
    skinEquipped,
    revealCard,
    repair:()=>normalizePersistentVisuals(document),
    refresh(){initCardReveal();animateVault();pauseForModal();scheduleRepair(document);}
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();