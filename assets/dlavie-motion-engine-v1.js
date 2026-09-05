(() => {
  'use strict';

  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let lenis = null;
  let cardObserver = null;
  const revealed = new WeakSet();

  function gsapReady(){return !!window.gsap;}

  function initLenis(){
    if(reduceMotion.matches || !finePointer.matches || !window.Lenis || lenis) return;
    try{
      lenis = new window.Lenis({duration:1.02,smoothWheel:true,syncTouch:false,wheelMultiplier:.9,touchMultiplier:1});
      if(gsapReady()){
        window.gsap.ticker.add(time=>lenis?.raf(time*1000));
        window.gsap.ticker.lagSmoothing(0);
      }else{
        const raf=t=>{lenis?.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf);
      }
      document.documentElement.classList.add('dl-lenis-active');
    }catch(e){console.warn('[DLavie Motion] Lenis disabled:',e.message);lenis=null;}
  }

  function pauseForModal(){
    if(!lenis)return;
    const blocked=!!document.querySelector('.dl-identity-onboarding,.dl-avatar-picker,.dl-skin-unlock')||document.body.classList.contains('dl-onboarding-open');
    try{blocked?lenis.stop():lenis.start();}catch{}
  }

  function revealCard(card){
    if(!(card instanceof HTMLElement)||revealed.has(card)||reduceMotion.matches)return;
    revealed.add(card);
    if(gsapReady()){
      window.gsap.fromTo(card,{autoAlpha:0,y:24,scale:.985},{autoAlpha:1,y:0,scale:1,duration:.62,ease:'power3.out',clearProps:'opacity,visibility,transform'});
    }
  }

  function initCardReveal(){
    cardObserver?.disconnect();
    cardObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&entry.intersectionRatio>.12){revealCard(entry.target);cardObserver?.unobserve(entry.target);}}),{threshold:[0,.12,.35]});
    document.querySelectorAll('.dl-collector-card').forEach(c=>cardObserver.observe(c));
  }

  function scanAdded(root){
    if(root?.matches?.('.dl-collector-card'))cardObserver?.observe(root);
    root?.querySelectorAll?.('.dl-collector-card').forEach(c=>cardObserver?.observe(c));
  }

  function skinEquipped(id){
    const card=document.querySelector('#dl-collector-profile .dl-collector-card');
    if(!card||reduceMotion.matches)return;
    if(gsapReady()){
      const g=window.gsap;const inner=card.querySelector('.dl-collector-card-inner')||card;
      g.killTweensOf(inner);g.timeline().to(inner,{scale:.975,rotationZ:-.7,duration:.12,ease:'power2.in'}).to(inner,{scale:1.018,rotationZ:.45,duration:.22,ease:'back.out(2)'}).to(inner,{scale:1,rotationZ:0,duration:.22,ease:'power2.out'});
      const scene=card.querySelector('.dl-skin-scene');if(scene)g.fromTo(scene,{filter:'brightness(1.35) saturate(1.4)'},{filter:'brightness(1) saturate(1)',duration:.65,ease:'power2.out'});
    }
  }

  function animateVault(){
    if(reduceMotion.matches||!gsapReady())return;
    const cards=[...document.querySelectorAll('#dl-card-vault .dl-vault-skin')].filter(n=>!n.dataset.dlMotionShown);
    cards.forEach(n=>n.dataset.dlMotionShown='1');
    if(cards.length)window.gsap.from(cards,{y:12,opacity:0,stagger:.035,duration:.34,ease:'power2.out'});
  }

  function boot(){
    if(window.gsap&&window.ScrollTrigger){try{window.gsap.registerPlugin(window.ScrollTrigger);}catch{}}
    initLenis();initCardReveal();
    const mo=new MutationObserver(records=>{let vault=false;for(const record of records){for(const node of record.addedNodes){if(node.nodeType!==1)continue;scanAdded(node);if(node.id==='dl-card-vault'||node.querySelector?.('#dl-card-vault'))vault=true;}}pauseForModal();if(vault)setTimeout(animateVault,20);});
    mo.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('pageshow',()=>{initLenis();initCardReveal();pauseForModal();});
    document.addEventListener('dlavie:card-skin-changed',()=>setTimeout(()=>skinEquipped(),20));
    document.addEventListener('visibilitychange',()=>{if(!lenis)return;try{document.hidden?lenis.stop():lenis.start();}catch{}});
  }

  window.__DLAVIE_MOTION__={get lenis(){return lenis;},skinEquipped,revealCard,refresh(){initCardReveal();animateVault();pauseForModal();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();