(() => {
  'use strict';
  const PAGE='.community-page.community-v2';
  const ROUTE=/#\/community(?:$|[/?])/;
  let observer=null,pageRef=null,timer=0,interval=0;

  function refresh(delay=220){
    clearTimeout(timer);
    timer=setTimeout(async()=>{
      if(!ROUTE.test(location.hash)||document.hidden)return;
      const core=window.__DLAVIE_COMMUNITY_V4__;
      if(!core)return;
      try{await core.load(true);core.scheduleDOM?.();}catch{}
    },delay);
  }

  function attach(page){
    if(pageRef===page)return;
    observer?.disconnect();pageRef=page;
    observer=new MutationObserver(records=>{
      const changed=records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&(node.matches?.('.community-entry,.community-comment')||node.querySelector?.('.community-entry,.community-comment'))));
      if(changed)refresh(260);
    });
    observer.observe(page,{childList:true,subtree:true});
    clearInterval(interval);
    interval=setInterval(()=>refresh(0),20000);
  }

  function route(){
    if(!ROUTE.test(location.hash)){
      observer?.disconnect();observer=null;pageRef=null;clearInterval(interval);interval=0;return;
    }
    let n=0;const wait=()=>{const page=document.querySelector(PAGE);if(page){attach(page);refresh(80);return;}if(n++<25)setTimeout(wait,100+n*10);};wait();
  }

  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ROUTE.test(location.hash))refresh(60);});
  window.addEventListener('hashchange',route);window.addEventListener('pageshow',route);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();