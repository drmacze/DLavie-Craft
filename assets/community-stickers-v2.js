(() => {
  'use strict';

  const PAGE='.community-page.community-v2';
  const ROUTE=/#\/community(?:$|[/?])/;
  const TOKEN=/^\[\[dlavie-sticker:([0-9a-f-]{36})\]\]$/i;
  let stickers=[];
  let observer=null;
  let pageRef=null;
  let raf=0;
  let loading=false;

  const core=()=>window.__DLAVIE_COMMUNITY_V4__;
  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function button(text,cls=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.className=cls;b.setAttribute('data-dl-no-icon','true');return b;}
  function setValue(el,value){const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;if(setter)setter.call(el,value);else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));}

  async function reload(){
    if(loading||!core())return;loading=true;
    try{stickers=await core().api('dlavie_craft_community_stickers?select=id,name,slug,public_url,mime_type,animated,active,sort_order,created_at&active=eq.true&order=sort_order.asc,created_at.asc')||[];}
    finally{loading=false;}
  }
  function byToken(body){const m=String(body||'').trim().match(TOKEN);return m?stickers.find(s=>s.id===m[1]&&s.active):null;}

  function sheet(){
    document.querySelector('.dl-sticker-sheet')?.remove();
    const o=document.createElement('div');o.className='dl-sticker-sheet';
    o.innerHTML='<section><header><div><strong>Sticker Komunitas</strong><small>Pilih sticker resmi yang disediakan developer.</small></div><button type="button" data-close data-dl-no-icon="true">×</button></header><div class="dl-sticker-sheet-body"></div></section>';
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
    const activeName=page.querySelector('.active-forum-head h2')?.textContent?.trim()||page.querySelector('.forum-sidebar nav button.active strong')?.textContent?.trim();
    const forum=st.forums.find(f=>f.name===activeName);if(!forum)return;
    const posts=st.posts.filter(p=>p.forum_id===forum.id),entries=[...page.querySelectorAll('.typed-feed > .community-entry')];
    entries.forEach((entry,i)=>{const post=posts[i];if(!post)return;renderToken(entry,post.body,false);const comments=st.comments.filter(c=>c.post_id===post.id),nodes=[...entry.querySelectorAll('.post-thread .community-comment')];nodes.forEach((n,j)=>{const c=comments[j];if(c)renderToken(n,c.body,true);});});
  }

  function openPicker(textarea){
    if(!core()?.session())return (document.getElementById('dl-shell-account-entry')||document.getElementById('dl-account-entry'))?.click();
    const ui=sheet(),top=document.createElement('div'),grid=document.createElement('div');
    top.className='dl-sticker-picker-top';top.innerHTML='<input type="search" placeholder="Cari sticker…" aria-label="Cari sticker"><span></span>';grid.className='dl-sticker-grid';ui.body.append(top,grid);
    const draw=q=>{grid.replaceChildren();const active=stickers.filter(s=>!q||s.name.toLowerCase().includes(q.toLowerCase()));top.querySelector('span').textContent=`${active.length} sticker`;if(!active.length){grid.innerHTML='<p class="dl-sticker-empty">Belum ada sticker yang cocok.</p>';return;}active.forEach(s=>{const b=button('','dl-sticker-card');b.innerHTML=`<img src="${esc(s.public_url)}" alt="${esc(s.name)}" loading="lazy" decoding="async"><span>${esc(s.name)}</span>${s.animated?'<b>GIF</b>':''}`;b.onclick=()=>{setValue(textarea,`[[dlavie-sticker:${s.id}]]`);ui.close();if(textarea.closest('.quick-chat-composer'))setTimeout(()=>textarea.closest('form')?.requestSubmit(),40);else textarea.focus();};grid.append(b);});};
    draw('');top.querySelector('input').oninput=e=>draw(e.target.value.trim());
  }

  function composerButtons(page){
    if(!stickers.length)return;
    page.querySelectorAll('form textarea').forEach(ta=>{
      const form=ta.closest('form');if(!form||form.querySelector('.dl-sticker-compose')||ta.closest('#dl-community-toolbar')||ta.closest('.feed-feedback'))return;
      const b=button('Sticker','dl-sticker-compose');b.setAttribute('aria-label','Pilih sticker komunitas');b.onclick=()=>openPicker(ta);
      const submit=form.querySelector('button[type="submit"],button:not([type])');if(submit?.parentElement)submit.parentElement.insertBefore(b,submit);else form.append(b);
    });
  }

  function enhance(page){page.querySelectorAll('.dl-sticker-studio,[data-sticker-studio]').forEach(n=>n.remove());renderMessages(page);composerButtons(page);}
  function schedule(page=document.querySelector(PAGE)){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(page?.isConnected)enhance(page);});}
  function attach(page){if(pageRef===page){schedule(page);return;}observer?.disconnect();pageRef=page;reload().then(()=>schedule(page)).catch(()=>{});observer=new MutationObserver(records=>{const meaningful=records.some(r=>{const t=r.target?.nodeType===1?r.target:r.target?.parentElement;return !t?.closest?.('.dl-sticker-message,.dl-sticker-compose,.dl-sticker-sheet');});if(meaningful)schedule(page);});observer.observe(page,{childList:true,subtree:true});}
  function route(){if(!ROUTE.test(location.hash)){observer?.disconnect();observer=null;pageRef=null;document.querySelector('.dl-sticker-sheet')?.remove();return;}let n=0;const wait=()=>{const p=document.querySelector(PAGE);if(p)return attach(p);if(n++<30)setTimeout(wait,90+n*8);};wait();}

  window.addEventListener('hashchange',route);window.addEventListener('popstate',route);window.addEventListener('pageshow',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
  window.__DLAVIE_PUBLIC_STICKERS__={reload,getStickers:()=>stickers.slice()};
})();