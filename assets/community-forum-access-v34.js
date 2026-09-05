(() => {
  'use strict';

  const PAGE='.community-page.community-v2';
  const ROUTE=/#\/community(?:$|[/?])/;
  const SB_URL='https://ydaeukhqwishlrjyfktk.supabase.co';
  const SB_KEY='sb_publishable_XNXU6SVeM-D477Ymy1ORsw_4hCHOll9';
  const SESSION_KEY='sb-ydaeukhqwishlrjyfktk-auth-token';
  let forums=[];
  let developer=false;
  let loaded=false;
  let loading=null;
  let pageRef=null;
  let observer=null;
  let raf=0;
  let timer=0;

  const clean=(v='')=>String(v).replace(/\s+/g,' ').trim().toLowerCase();
  function session(){try{const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');return s?.access_token?s:null;}catch{return null;}}
  async function api(path,options={}){
    const s=session(),write=!!options.write;
    const headers={apikey:SB_KEY,Authorization:`Bearer ${s?.access_token||SB_KEY}`,'Accept-Profile':'api',Accept:'application/json',...(options.headers||{})};
    if(write){headers['Content-Type']='application/json';headers['Content-Profile']='api';headers.Prefer=options.prefer||'return=representation';}
    const request={...options,headers};delete request.write;delete request.prefer;
    const res=await fetch(`${SB_URL}/rest/v1/${path}`,request);
    const text=await res.text();let body=null;try{body=text?JSON.parse(text):null;}catch{body=text;}
    if(!res.ok)throw new Error(body?.message||body?.details||body?.hint||body||`Server ${res.status}`);
    return body;
  }

  function activeButton(page){
    return page.querySelector([
      '.forum-sidebar nav button.active',
      '.forum-sidebar nav button[aria-selected="true"]',
      '.forum-sidebar nav button[aria-current="page"]',
      '.forum-sidebar nav button[aria-pressed="true"]',
      '.forum-sidebar nav button[data-active="true"]'
    ].join(','));
  }

  function activeForum(page){
    const btn=activeButton(page);
    const heading=page.querySelector('.active-forum-head h2');
    const values=[
      btn?.dataset?.dlForumRaw,
      btn?.dataset?.dlForumLabel,
      btn?.getAttribute('aria-label'),
      btn?.querySelector('strong')?.textContent,
      heading?.dataset?.dlForumRaw,
      heading?.dataset?.dlForumLabel,
      heading?.getAttribute('aria-label'),
      heading?.textContent
    ].map(clean).filter(Boolean);
    return forums.find(f=>values.some(v=>v===clean(f.name)||v===clean(f.slug)))
      || (values.some(v=>/^(general|obrolan|percakapan|global chat)$/.test(v))?forums.find(f=>f.forum_type==='chat'):null)
      || null;
  }

  async function load(force=false){
    if(loading)return loading;
    if(loaded&&!force)return;
    loading=(async()=>{
      try{
        const [rows,dev]=await Promise.all([
          api('dlavie_craft_community_forums?select=id,slug,name,description,forum_type,icon,accent_color,sort_order,is_active,is_readonly,is_system&order=sort_order.asc'),
          api('rpc/dlavie_craft_is_developer',{method:'POST',write:true,body:'{}',prefer:'return=representation'}).catch(()=>false)
        ]);
        forums=Array.isArray(rows)?rows:[];
        developer=dev===true||dev?.value===true||dev?.is_developer===true;
        loaded=true;
      }catch(error){
        console.warn('[Forum access v34]',error?.message||error);
      }finally{loading=null;}
    })();
    return loading;
  }

  function statusOf(forum){
    if(!forum)return'public';
    if(!forum.is_active)return'draft';
    if(forum.is_readonly)return'private';
    return'public';
  }

  function banner(page,forum,status){
    let node=page.querySelector(':scope > .dl-forum-access-banner-v34,.dl-forum-access-banner-v34');
    const needs=status!=='public';
    if(!needs){node?.remove();return;}
    if(!node){
      node=document.createElement('div');
      node.className='dl-forum-access-banner-v34';
      node.innerHTML='<span class="dl-fab34-icon" aria-hidden="true"></span><div><strong></strong><small></small></div><b></b>';
      const head=page.querySelector('.active-forum-head');
      if(head)head.insertAdjacentElement('afterend',node);else page.prepend(node);
    }
    node.dataset.mode=status;
    if(status==='draft'){
      node.querySelector('.dl-fab34-icon').textContent='◌';
      node.querySelector('strong').textContent='Draft forum';
      node.querySelector('small').textContent='Hanya developer yang dapat melihat forum ini. Member tidak akan melihat forum maupun kontennya.';
      node.querySelector('b').textContent='DEVELOPER';
    }else{
      node.querySelector('.dl-fab34-icon').textContent='⌁';
      node.querySelector('strong').textContent=developer?'Private forum · Developer access':'Forum hanya-baca';
      node.querySelector('small').textContent=developer?'Member hanya dapat membaca. Akses developer tetap aktif untuk pengelolaan.':'Forum ini sedang Private. Konten tetap terlihat, tetapi posting, balasan, reaction, vote, edit, hapus, report, upload, dan sticker dinonaktifkan.';
      node.querySelector('b').textContent=developer?'OVERRIDE':'READ ONLY';
    }
    node.style.setProperty('--dl-forum-accent',forum?.accent_color||'#8b5cf6');
  }

  function unlock(page){
    page.querySelectorAll('[data-dl-forum-locked="true"]').forEach(el=>{
      if('disabled'in el)el.disabled=false;
      el.removeAttribute('data-dl-forum-locked');
    });
    page.classList.remove('dl-forum-member-locked-v34');
  }

  function lock(page){
    page.classList.add('dl-forum-member-locked-v34');
    const controls=new Set();
    page.querySelectorAll('form').forEach(form=>{
      if(form.querySelector('textarea,input[type="file"]'))form.querySelectorAll('button,input,textarea,select').forEach(el=>controls.add(el));
    });
    page.querySelectorAll([
      '.reaction-add','.reaction-button','.dl-sticker-compose','.dl-message-more',
      '.dl-v10-vote-panel button','.feed-feedback button','[data-action="edit"]','[data-action="delete"]','[data-action="report"]',
      '[data-vote]','button[class*="vote"]','button[class*="reply"]'
    ].join(',')).forEach(el=>controls.add(el));
    controls.forEach(el=>{
      if('disabled'in el&&!el.disabled){el.disabled=true;el.dataset.dlForumLocked='true';}
    });
    document.querySelector('.dl-sticker-sheet')?.remove();
  }

  function isMemberLocked(page){return page?.dataset?.dlForumAccess==='private'&&page?.dataset?.dlDeveloper!=='true';}

  function render(page=document.querySelector(PAGE)){
    if(!page?.isConnected||!loaded)return;
    const forum=activeForum(page);
    if(!forum)return;
    const status=statusOf(forum);
    page.dataset.dlForumAccess=status;
    page.dataset.dlDeveloper=developer?'true':'false';
    page.dataset.dlForumId=forum.id;
    page.dataset.dlForumType=forum.forum_type||'';
    page.style.setProperty('--dl-active-forum-accent',forum.accent_color||'#8b5cf6');
    banner(page,forum,status);
    unlock(page);
    if(status==='private'&&!developer)lock(page);
  }

  function schedule(page=document.querySelector(PAGE)){
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;render(page);});
  }

  function settle(page){schedule(page);setTimeout(()=>schedule(page),50);setTimeout(()=>schedule(page),160);setTimeout(()=>schedule(page),340);}

  function onClick(event){
    const page=event.currentTarget;
    if(event.target.closest('.forum-sidebar nav button')){settle(page);return;}
    if(!isMemberLocked(page))return;
    const action=event.target.closest([
      '.reaction-add','.reaction-button','.dl-sticker-compose','.dl-message-more',
      '.dl-v10-vote-panel button','.feed-feedback button','[data-action]','[data-vote]',
      'button[class*="vote"]','button[class*="reply"]'
    ].join(','));
    if(action){event.preventDefault();event.stopImmediatePropagation();}
  }

  function onSubmit(event){
    const page=event.currentTarget;
    if(!isMemberLocked(page))return;
    const form=event.target;
    if(form instanceof HTMLFormElement&&form.querySelector('textarea,input[type="file"]')){
      event.preventDefault();event.stopImmediatePropagation();
    }
  }

  function attach(page){
    if(pageRef===page){settle(page);return;}
    observer?.disconnect();
    if(pageRef){pageRef.removeEventListener('click',onClick,true);pageRef.removeEventListener('submit',onSubmit,true);}
    pageRef=page;
    page.addEventListener('click',onClick,true);
    page.addEventListener('submit',onSubmit,true);
    load().then(()=>settle(page));
    observer=new MutationObserver(records=>{
      if(records.some(r=>{
        const t=r.target?.nodeType===1?r.target:r.target?.parentElement;
        return !t?.closest?.('.dl-forum-access-banner-v34');
      }))schedule(page);
    });
    observer.observe(page,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-selected','aria-current','aria-pressed','data-active']});
    clearInterval(timer);
    timer=setInterval(()=>load(true).then(()=>schedule(page)),15000);
  }

  function route(){
    if(!ROUTE.test(location.hash)){
      observer?.disconnect();observer=null;clearInterval(timer);
      if(pageRef){pageRef.removeEventListener('click',onClick,true);pageRef.removeEventListener('submit',onSubmit,true);}
      pageRef=null;return;
    }
    let tries=0;
    const wait=()=>{
      const page=document.querySelector(PAGE);
      if(page)return attach(page);
      if(tries++<45)setTimeout(wait,80+tries*7);
    };
    wait();
  }

  document.addEventListener('dlavie:forum-settings-changed',()=>load(true).then(()=>settle(document.querySelector(PAGE))));
  document.addEventListener('dlavie:community-hydrate',route);
  window.addEventListener('hashchange',route);
  window.addEventListener('popstate',route);
  window.addEventListener('pageshow',route);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();

  window.__DLAVIE_FORUM_ACCESS__={reload:()=>load(true),getForums:()=>forums.slice(),isDeveloper:()=>developer,getActive:()=>{const p=document.querySelector(PAGE);return p?activeForum(p):null;}};
})();