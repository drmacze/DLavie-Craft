(() => {
  'use strict';

  const SB_URL='https://ydaeukhqwishlrjyfktk.supabase.co';
  const PAGE='.community-page.community-v2';
  const ROUTE=/#\/community(?:$|[/?])/;
  const BUCKET='community-stickers';
  const TOKEN=/^\[\[dlavie-sticker:([0-9a-f-]{36})\]\]$/i;
  const MAX=5*1024*1024;
  let stickers=[];
  let isDeveloper=false;
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
    try{
      stickers=await core().api('dlavie_craft_community_stickers?select=id,name,slug,file_path,public_url,mime_type,file_size,animated,active,sort_order,created_by,created_at&order=sort_order.asc,created_at.asc')||[];
      isDeveloper=false;
      if(core().session()){
        try{const caps=await core().api('dlavie_craft_my_capabilities?select=is_developer&limit=1');isDeveloper=!!caps?.[0]?.is_developer;}catch{}
      }
    }finally{loading=false;}
  }
  function byToken(body){const m=String(body||'').trim().match(TOKEN);return m?stickers.find(s=>s.id===m[1]&&s.active):null;}

  function sheet(title,subtitle=''){
    document.querySelector('.dl-sticker-sheet')?.remove();
    const o=document.createElement('div');o.className='dl-sticker-sheet';o.innerHTML=`<section><header><div><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></div><button type="button" data-close data-dl-no-icon="true">×</button></header><div class="dl-sticker-sheet-body"></div></section>`;
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
    const ui=sheet('Sticker Komunitas','Pilih sticker resmi yang disediakan developer.');
    const top=document.createElement('div');top.className='dl-sticker-picker-top';top.innerHTML='<input type="search" placeholder="Cari sticker…" aria-label="Cari sticker"><span></span>';
    const grid=document.createElement('div');grid.className='dl-sticker-grid';ui.body.append(top,grid);
    const draw=q=>{grid.replaceChildren();const active=stickers.filter(s=>s.active&&(!q||s.name.toLowerCase().includes(q.toLowerCase())));top.querySelector('span').textContent=`${active.length} sticker`;if(!active.length){grid.innerHTML='<p class="dl-sticker-empty">Belum ada sticker yang cocok.</p>';return;}active.forEach(s=>{const b=button('','dl-sticker-card');b.innerHTML=`<img src="${esc(s.public_url)}" alt="${esc(s.name)}" loading="lazy" decoding="async"><span>${esc(s.name)}</span>${s.animated?'<b>GIF</b>':''}`;b.onclick=()=>{setValue(textarea,`[[dlavie-sticker:${s.id}]]`);ui.close();setTimeout(()=>textarea.closest('form')?.requestSubmit(),40);};grid.append(b);});};
    draw('');top.querySelector('input').oninput=e=>draw(e.target.value.trim());
  }

  function composerButtons(page){
    if(!stickers.some(s=>s.active))return;
    page.querySelectorAll('form textarea').forEach(ta=>{
      const form=ta.closest('form');if(!form||form.querySelector('.dl-sticker-compose')||ta.closest('#dl-community-toolbar'))return;
      const b=button('Sticker','dl-sticker-compose');b.setAttribute('aria-label','Pilih sticker komunitas');b.onclick=()=>openPicker(ta);
      const submit=form.querySelector('button[type="submit"],button:not([type])');if(submit?.parentElement)submit.parentElement.insertBefore(b,submit);else form.append(b);
    });
  }

  function slugify(v){return String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,26)||'sticker';}
  async function upload(file,name){
    if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw new Error('Format harus PNG, JPG, WEBP, atau GIF.');
    if(file.size>MAX)throw new Error('Ukuran maksimal sticker 5 MB.');
    const ext=({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'})[file.type],slug=`${slugify(name)}-${Date.now().toString(36)}`,path=`${new Date().getUTCFullYear()}/${slug}.${ext}`;
    const key=await core().publicKey(),s=core().session();
    const url=`${SB_URL}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
    const res=await fetch(url,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${s.access_token}`,'Content-Type':file.type,'x-upsert':'false'},body:file});
    if(!res.ok)throw new Error((await res.text())||`Upload gagal (${res.status})`);
    const publicUrl=`${SB_URL}/storage/v1/object/public/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
    await core().api('dlavie_craft_community_stickers',{method:'POST',write:true,body:JSON.stringify({name:name.trim(),slug,file_path:path,public_url:publicUrl,mime_type:file.type,file_size:file.size,animated:file.type==='image/gif',active:true,created_by:core().uid()})});
  }

  function studio(){
    if(!isDeveloper)return;
    const ui=sheet('Sticker Studio','Khusus developer · sticker aktif dapat dipakai seluruh komunitas.');
    const form=document.createElement('form');form.className='dl-sticker-upload';form.innerHTML='<label><span>Nama sticker</span><input name="name" maxlength="40" required placeholder="Contoh: Diamond Hype"></label><label class="dl-sticker-file"><span>File sticker</span><input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required><small>PNG · JPG · WEBP · GIF · maks. 5 MB</small></label><div class="dl-sticker-preview"></div>';
    const submit=button('Upload sticker','primary');submit.type='submit';form.append(submit);const fi=form.elements.file;
    fi.onchange=()=>{const box=form.querySelector('.dl-sticker-preview');box.replaceChildren();const f=fi.files?.[0];if(!f)return;const img=document.createElement('img');img.src=URL.createObjectURL(f);img.alt='Preview';box.append(img);};
    form.onsubmit=async e=>{e.preventDefault();const file=fi.files?.[0],name=form.elements.name.value.trim();if(!file||!name)return;submit.disabled=true;submit.textContent='Mengunggah…';try{await upload(file,name);core().toast('Sticker ditambahkan');await reload();ui.close();schedule();}catch(x){core().toast(x.message);}finally{submit.disabled=false;submit.textContent='Upload sticker';}};
    const list=document.createElement('div');list.className='dl-sticker-admin';stickers.forEach(s=>{const row=document.createElement('article');row.innerHTML=`<img src="${esc(s.public_url)}" alt=""><div><strong>${esc(s.name)}</strong><small>${s.animated?'GIF':s.mime_type.replace('image/','').toUpperCase()}</small></div>`;const toggle=button(s.active?'Aktif':'Nonaktif',s.active?'active':'');toggle.onclick=async()=>{toggle.disabled=true;try{await core().api(`dlavie_craft_community_stickers?id=eq.${encodeURIComponent(s.id)}`,{method:'PATCH',write:true,body:JSON.stringify({active:!s.active,updated_at:new Date().toISOString()})});s.active=!s.active;toggle.textContent=s.active?'Aktif':'Nonaktif';toggle.classList.toggle('active',s.active);schedule();}catch(x){core().toast(x.message);}finally{toggle.disabled=false;}};row.append(toggle);list.append(row);});
    ui.body.append(form,list);
  }

  function studioButton(page){
    const host=page.querySelector('#dl-community-toolbar .dl-community-toolbar-actions');if(!host)return;let b=host.querySelector('[data-sticker-studio]');if(!isDeveloper){b?.remove();return;}if(!b){b=button('Sticker Studio','dl-sticker-studio');b.dataset.stickerStudio='1';b.onclick=studio;host.append(b);}
  }

  function enhance(page){renderMessages(page);composerButtons(page);studioButton(page);}
  function schedule(page=document.querySelector(PAGE)){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(page?.isConnected)enhance(page);});}
  function attach(page){if(pageRef===page){schedule(page);return;}observer?.disconnect();pageRef=page;reload().then(()=>schedule(page)).catch(()=>{});observer=new MutationObserver(records=>{const meaningful=records.some(r=>{const t=r.target?.nodeType===1?r.target:r.target?.parentElement;return !t?.closest?.('.dl-sticker-message,.dl-sticker-compose,.dl-sticker-sheet,.dl-sticker-studio');});if(meaningful)schedule(page);});observer.observe(page,{childList:true,subtree:true});}
  function route(){if(!ROUTE.test(location.hash)){observer?.disconnect();observer=null;pageRef=null;return;}let n=0;const wait=()=>{const p=document.querySelector(PAGE);if(p)return attach(p);if(n++<30)setTimeout(wait,90+n*8);};wait();}
  window.addEventListener('hashchange',route);window.addEventListener('popstate',route);window.addEventListener('pageshow',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();