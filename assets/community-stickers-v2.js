(() => {
  'use strict';

  const PAGE='.community-page.community-v2';
  const ROUTE=/#\/community(?:$|[/?])/;
  const TOKEN=/^\[\[dlavie-sticker:([0-9a-f-]{36})\]\]$/i;
  let stickers=[];
  let observer=null;
  let pageRef=null;
  let clickHost=null;
  let raf=0;
  let loading=false;

  const core=()=>window.__DLAVIE_COMMUNITY_V4__;
  const clean=(s='')=>String(s).replace(/\s+/g,' ').trim().toLowerCase();
  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function button(text,cls=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.className=cls;b.setAttribute('data-dl-no-icon','true');return b;}
  function setValue(el,value){const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;if(setter)setter.call(el,value);else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));}

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
    const st=core()?.getState?.();
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

    if(st?.forums?.length){
      const exact=st.forums.find(f=>values.some(v=>v===clean(f.name)||v===clean(f.slug)));
      if(exact)return exact;
      if(values.some(v=>/^(obrolan|general|percakapan|global chat)$/.test(v)))return st.forums.find(f=>f.forum_type==='chat')||null;
    }

    if(values.some(v=>/obrolan|general|percakapan|global\s*chat/.test(v)))return{forum_type:'chat'};
    return null;
  }

  function stickersAllowed(page){return activeForum(page)?.forum_type==='chat';}

  async function reload(){
    if(loading||!core())return;loading=true;
    try{stickers=await core().api('dlavie_craft_community_stickers?select=id,name,slug,public_url,mime_type,animated,active,sort_order,created_at&active=eq.true&order=sort_order.asc,created_at.asc')||[];}
    finally{loading=false;}
  }
  function byToken(body){const m=String(body||'').trim().match(TOKEN);return m?stickers.find(s=>s.id===m[1]&&s.active):null;}

  function sheet(){
    document.querySelector('.dl-sticker-sheet')?.remove();
    const o=document.createElement('div');o.className='dl-sticker-sheet';
    o.innerHTML='<section><header><div><strong>Sticker Komunitas</strong><small>Khusus forum General / Obrolan.</small></div><button type="button" data-close data-dl-no-icon="true">×</button></header><div class="dl-sticker-sheet-body"></div></section>';
    const close=()=>o.remove();o.querySelector('[data-close]').onclick=close;o.onclick=e=>{if(e.target===o)close();};document.body.append(o);return{body:o.querySelector('.dl-sticker-sheet-body'),close};
  }

  function renderToken(scope,body,small=false){
    const s=byToken(body);if(!s)return;
    const p=scope.querySelector('p');if(!p||p.dataset.dlSticker===s.id)return;
    p.dataset.dlSticker=s.id;p.className=`dl-sticker-message${small?' small':''}`;
    p.innerHTML=`<img src="${esc(s.public_url)}" alt="Sticker ${esc(s.name)}" loading="lazy" decoding="async"><small>${esc(s.name)}</small>`;
    scope.classList.add('dl-has-sticker');
  }

  function renderMessages(page){
    const st=core()?.getState?.();if(!st)return;
    const forum=activeForum(page);if(!forum?.id)return;
    const posts=st.posts.filter(p=>p.forum_id===forum.id),entries=[...page.querySelectorAll('.typed-feed > .community-entry')];
    entries.forEach((entry,i)=>{const post=posts[i];if(!post)return;renderToken(entry,post.body,false);const comments=st.comments.filter(c=>c.post_id===post.id),nodes=[...entry.querySelectorAll('.post-thread .community-comment')];nodes.forEach((n,j)=>{const c=comments[j];if(c)renderToken(n,c.body,true);});});
  }

  function openPicker(textarea){
    const page=document.querySelector(PAGE);
    if(!page||!stickersAllowed(page))return;
    if(!core()?.session())return (document.getElementById('dl-shell-account-entry')||document.getElementById('dl-account-entry'))?.click();
    const ui=sheet(),top=document.createElement('div'),grid=document.createElement('div');
    top.className='dl-sticker-picker-top';top.innerHTML='<input type="search" placeholder="Cari sticker…" aria-label="Cari sticker"><span></span>';grid.className='dl-sticker-grid';ui.body.append(top,grid);
    const draw=q=>{grid.replaceChildren();const active=stickers.filter(s=>!q||s.name.toLowerCase().includes(q.toLowerCase()));top.querySelector('span').textContent=`${active.length} sticker`;if(!active.length){grid.innerHTML='<p class="dl-sticker-empty">Belum ada sticker yang cocok.</p>';return;}active.forEach(s=>{const b=button('','dl-sticker-card');b.innerHTML=`<img src="${esc(s.public_url)}" alt="${esc(s.name)}" loading="lazy" decoding="async"><span>${esc(s.name)}</span>${s.animated?'<b>GIF</b>':''}`;b.onclick=()=>{const current=document.querySelector(PAGE);if(!current||!stickersAllowed(current)){ui.close();return;}setValue(textarea,`[[dlavie-sticker:${s.id}]]`);ui.close();if(textarea.closest('.quick-chat-composer'))setTimeout(()=>textarea.closest('form')?.requestSubmit(),40);else textarea.focus();};grid.append(b);});};
    draw('');top.querySelector('input').oninput=e=>draw(e.target.value.trim());
  }

  function composerButtons(page){
    page.querySelectorAll('.dl-sticker-compose').forEach(n=>n.remove());
    if(!stickers.length||!stickersAllowed(page))return;
    page.querySelectorAll('form textarea').forEach(ta=>{
      const form=ta.closest('form');if(!form||form.querySelector('.dl-sticker-compose')||ta.closest('#dl-community-toolbar')||ta.closest('.feed-feedback'))return;
      const b=button('Sticker','dl-sticker-compose');b.setAttribute('aria-label','Pilih sticker komunitas');b.onclick=()=>openPicker(ta);
      const submit=form.querySelector('button[type="submit"],button:not([type])');if(submit?.parentElement)submit.parentElement.insertBefore(b,submit);else form.append(b);
    });
  }

  function enhance(page){
    page.querySelectorAll('.dl-sticker-studio,[data-sticker-studio]').forEach(n=>n.remove());
    renderMessages(page);
    if(!stickersAllowed(page))document.querySelector('.dl-sticker-sheet')?.remove();
    composerButtons(page);
  }
  function schedule(page=document.querySelector(PAGE)){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(page?.isConnected)enhance(page);});}
  function settle(page){schedule(page);setTimeout(()=>schedule(page),50);setTimeout(()=>schedule(page),150);setTimeout(()=>schedule(page),320);}
  function onClick(e){if(e.target.closest('.forum-sidebar nav button'))settle(e.currentTarget);}
  function attach(page){
    if(pageRef===page){settle(page);return;}
    observer?.disconnect();if(clickHost)clickHost.removeEventListener('click',onClick,true);
    pageRef=page;clickHost=page;page.addEventListener('click',onClick,true);
    reload().then(()=>settle(page)).catch(()=>{});
    observer=new MutationObserver(records=>{const meaningful=records.some(r=>{const t=r.target?.nodeType===1?r.target:r.target?.parentElement;return !t?.closest?.('.dl-sticker-message,.dl-sticker-compose,.dl-sticker-sheet');});if(meaningful)schedule(page);});
    observer.observe(page,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-selected','aria-current','aria-pressed','data-active']});
  }
  function route(){
    if(!ROUTE.test(location.hash)){
      observer?.disconnect();observer=null;
      if(clickHost)clickHost.removeEventListener('click',onClick,true);
      clickHost=null;pageRef=null;document.querySelector('.dl-sticker-sheet')?.remove();return;
    }
    let n=0;const wait=()=>{const p=document.querySelector(PAGE);if(p)return attach(p);if(n++<30)setTimeout(wait,90+n*8);};wait();
  }

  window.addEventListener('hashchange',route);window.addEventListener('popstate',route);window.addEventListener('pageshow',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
  window.__DLAVIE_PUBLIC_STICKERS__={reload,getStickers:()=>stickers.slice(),isAllowed:()=>{const p=document.querySelector(PAGE);return !!p&&stickersAllowed(p);}};
})();