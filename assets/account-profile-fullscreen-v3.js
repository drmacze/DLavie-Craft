(() => {
  'use strict';
  let observer=null,raf=0;
  function enhance(){
    const portal=document.getElementById('dl-account-portal');if(!portal?.isConnected)return;
    const isProfile=!!portal.querySelector('.dl-account-profile');
    portal.classList.toggle('dl-account-profile-fullscreen-v3',isProfile);
    const card=portal.querySelector('.dl-account-card');card?.classList.toggle('dl-account-profile-page-v3',isProfile);
    if(isProfile){portal.scrollTop=0;portal.querySelector('.dl-account-main')?.scrollTo?.({top:0,behavior:'auto'});portal.querySelector('.dl-account-close')?.setAttribute('data-dl-no-icon','true');}
  }
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;enhance();});}
  function start(){observer?.disconnect();observer=new MutationObserver(records=>{if(records.some(r=>{const t=r.target?.nodeType===1?r.target:r.target?.parentElement;return !t?.closest?.('.dl-account-profile-card');}))schedule();});observer.observe(document.body,{childList:true,subtree:true});schedule();}
  window.addEventListener('pageshow',schedule);window.addEventListener('popstate',schedule);window.addEventListener('dlavie-auth-session',()=>setTimeout(schedule,40));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();