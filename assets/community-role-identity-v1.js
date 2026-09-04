(() => {
  'use strict';

  const PAGE='.community-page.community-v2';
  const ROUTE=/#\/community(?:$|[/?])/;
  let profiles=new Map(),observer=null,pageRef=null,raf=0,poll=0,loading=false;
  const collector=()=>window.__DLAVIE_COLLECTOR__;

  async function load(){
    const c=collector();if(!c||loading)return;loading=true;
    try{const rows=await c.api('dlavie_craft_community_profiles?select=user_id,display_name,avatar_key,community_role,member_code,updated_at&order=updated_at.desc');profiles=new Map((rows||[]).map(p=>[p.user_id,p]));}
    catch(e){console.warn('[Community identity]',e.message);}finally{loading=false;}
  }

  function decorateNode(node){
    const c=collector();if(!c)return;const authorId=node.dataset.dlAuthorId;if(!authorId)return;const p=profiles.get(authorId);if(!p)return;
    const strong=node.querySelector('.entry-author strong,.comment-author strong,strong');if(!strong)return;
    const owner=strong.parentElement||node;node.classList.remove('dl-role-builder','dl-role-miner','dl-role-explorer','dl-role-newbie','dl-role-pvp');if(p.community_role)node.classList.add(`dl-role-${p.community_role}`);
    let avatar=owner.querySelector(':scope > .dl-community-avatar');if(!avatar){avatar=document.createElement('span');avatar.className='dl-community-avatar';strong.insertAdjacentElement('beforebegin',avatar);}avatar.innerHTML=c.avatarMarkup(p.avatar_key);
    let role=owner.querySelector(':scope > .dl-community-role-chip');if(!role&&p.community_role){role=document.createElement('span');role.className='dl-community-role-chip';strong.insertAdjacentElement('afterend',role);}if(role){if(p.community_role){role.innerHTML=c.roleMarkup(p.community_role,true);role.hidden=false;}else role.hidden=true;}
    if(p.member_code)node.dataset.dlMemberCode=p.member_code;
  }

  function render(page=document.querySelector(PAGE)){if(!page)return;page.querySelectorAll('[data-dl-author-id]').forEach(decorateNode);}
  function schedule(page=document.querySelector(PAGE)){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(page?.isConnected)render(page);});}
  function attach(page){if(pageRef===page){schedule(page);return;}observer?.disconnect();pageRef=page;load().then(()=>schedule(page));observer=new MutationObserver(records=>{const meaningful=records.some(r=>{const t=r.target?.nodeType===1?r.target:r.target?.parentElement;return !t?.closest?.('.dl-community-avatar,.dl-community-role-chip');});if(meaningful)schedule(page);});observer.observe(page,{childList:true,subtree:true});clearInterval(poll);poll=setInterval(async()=>{await load();schedule(page);},12000);}
  function route(){if(!ROUTE.test(location.hash)){observer?.disconnect();observer=null;pageRef=null;clearInterval(poll);return;}let n=0;const wait=()=>{const p=document.querySelector(PAGE);if(p)return attach(p);if(n++<35)setTimeout(wait,80+n*7);};wait();}

  document.addEventListener('dlavie:collector-ready',async()=>{await load();schedule();});document.addEventListener('dlavie:collector-profile-changed',async()=>{await load();schedule();});window.addEventListener('hashchange',route);window.addEventListener('pageshow',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();