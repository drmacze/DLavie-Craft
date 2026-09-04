(() => {
  'use strict';

  const SB_URL='https://ydaeukhqwishlrjyfktk.supabase.co';
  const BUCKET='community-stickers';
  const CONSOLE_ROUTE=/^#\/console(?:\?.*)?$/;
  const MAX=5*1024*1024;
  let allowed=false,checked=false,active=false,stickers=[],busy=false,previewUrl='',timer=0;
  const core=()=>window.__DLAVIE_COMMUNITY_V4__;
  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(label,cls='')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.setAttribute('data-dl-no-icon','true');return b;};
  const slugify=v=>String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,28)||'sticker';

  async function canManage(){
    if(checked)return allowed;checked=true;allowed=false;
    try{if(!core()?.session?.())return false;const rows=await core().api('dlavie_craft_my_capabilities?select=is_developer&limit=1');allowed=!!rows?.[0]?.is_developer;}catch{}
    return allowed;
  }
  async function load(){if(!allowed||!core())return;try{stickers=await core().api('dlavie_craft_community_stickers?select=id,name,slug,file_path,public_url,mime_type,file_size,animated,active,sort_order,created_at,updated_at&order=sort_order.asc,created_at.asc')||[];}catch(e){core().toast?.(e.message);}}

  async function upload(file,name){
    if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw new Error('Format harus PNG, JPG, WEBP, atau GIF.');
    if(file.size>MAX)throw new Error('Ukuran maksimal sticker 5 MB.');
    const ext=({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'})[file.type];
    const slug=`${slugify(name)}-${Date.now().toString(36)}`,path=`${new Date().getUTCFullYear()}/${slug}.${ext}`;
    const key=await core().publicKey(),session=core().session();if(!session)throw new Error('Sesi developer tidak tersedia.');
    const objectUrl=`${SB_URL}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
    const response=await fetch(objectUrl,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${session.access_token}`,'Content-Type':file.type,'x-upsert':'false'},body:file});
    if(!response.ok)throw new Error((await response.text())||`Upload gagal (${response.status})`);
    const publicUrl=`${SB_URL}/storage/v1/object/public/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
    await core().api('dlavie_craft_community_stickers',{method:'POST',write:true,body:JSON.stringify({name:name.trim(),slug,file_path:path,public_url:publicUrl,mime_type:file.type,file_size:file.size,animated:file.type==='image/gif',active:true,created_by:core().uid()})});
  }

  function stats(){return{total:stickers.length,activeCount:stickers.filter(s=>s.active).length,gif:stickers.filter(s=>s.animated).length};}
  function renderPanel(force=false){
    if(!active)return;const content=document.querySelector('.console-app .console-content');if(!content)return;
    const existing=content.querySelector(':scope > .dl-console-sticker-panel');if(existing&&!force)return;existing?.remove();
    const s=stats(),panel=document.createElement('section');panel.className='dl-console-sticker-panel';
    panel.innerHTML=`<div class="dl-console-sticker-head"><div><span>Community assets</span><h1>Sticker Studio</h1><p>Upload dan kelola sticker resmi yang tersedia untuk seluruh komunitas. Studio ini hanya berada di Developer Console.</p></div><div class="dl-console-sticker-metrics"><article><b>${s.total}</b><span>Total</span></article><article><b>${s.activeCount}</b><span>Aktif</span></article><article><b>${s.gif}</b><span>GIF</span></article></div></div><div class="dl-console-sticker-grid"><form class="dl-console-sticker-upload"><div class="dl-console-sticker-upload-title"><strong>Tambah sticker</strong><small>PNG · JPG · WEBP · GIF · maks. 5 MB</small></div><label><span>Nama sticker</span><input name="name" required maxlength="40" placeholder="Contoh: Diamond Hype"></label><label class="dl-console-sticker-file"><span>Pilih file</span><input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required><small>GIF akan tetap bergerak di chat.</small></label><div class="dl-console-sticker-preview"><span>Preview sticker</span></div><button class="button button-primary" type="submit">Upload sticker</button></form><section class="dl-console-sticker-library"><header><div><strong>Library sticker</strong><small>${s.activeCount} aktif dari ${s.total} sticker</small></div></header><div class="dl-console-sticker-list"></div></section></div>`;
    const form=panel.querySelector('form'),fileInput=form.elements.file,preview=panel.querySelector('.dl-console-sticker-preview'),submit=form.querySelector('button[type="submit"]');
    fileInput.onchange=()=>{if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}preview.replaceChildren();const file=fileInput.files?.[0];if(!file){preview.innerHTML='<span>Preview sticker</span>';return;}previewUrl=URL.createObjectURL(file);const img=document.createElement('img');img.src=previewUrl;img.alt='Preview sticker';preview.append(img);};
    form.onsubmit=async e=>{e.preventDefault();if(busy)return;const file=fileInput.files?.[0],name=form.elements.name.value.trim();if(!file||!name)return;busy=true;submit.disabled=true;submit.textContent='Mengunggah…';try{await upload(file,name);core().toast?.('Sticker berhasil ditambahkan');await load();if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}renderPanel(true);window.__DLAVIE_PUBLIC_STICKERS__?.reload?.();}catch(err){core().toast?.(err.message);}finally{busy=false;}};
    const list=panel.querySelector('.dl-console-sticker-list');if(!stickers.length)list.innerHTML='<div class="dl-console-sticker-empty">Belum ada sticker. Upload sticker pertama untuk komunitas.</div>';
    stickers.forEach(item=>{const row=document.createElement('article');row.className=`dl-console-sticker-row${item.active?' is-active':''}`;row.innerHTML=`<img src="${esc(item.public_url)}" alt="${esc(item.name)}" loading="lazy" decoding="async"><div><strong>${esc(item.name)}</strong><small>${item.animated?'GIF':String(item.mime_type||'image').replace('image/','').toUpperCase()} · ${Math.max(1,Math.round(Number(item.file_size||0)/1024))} KB</small></div>`;const toggle=button(item.active?'Aktif':'Nonaktif','dl-console-sticker-toggle');toggle.setAttribute('aria-pressed',String(item.active));toggle.onclick=async()=>{if(busy)return;busy=true;toggle.disabled=true;try{await core().api(`dlavie_craft_community_stickers?id=eq.${encodeURIComponent(item.id)}`,{method:'PATCH',write:true,body:JSON.stringify({active:!item.active,updated_at:new Date().toISOString()})});item.active=!item.active;core().toast?.(item.active?'Sticker diaktifkan':'Sticker dinonaktifkan');renderPanel(true);}catch(err){core().toast?.(err.message);}finally{busy=false;}};row.append(toggle);list.append(row);});
    content.append(panel);
  }

  async function openStudio(){active=true;document.querySelector('.console-app')?.classList.add('dl-console-sticker-active');document.querySelector('.console-sidebar')?.classList.remove('open');document.querySelectorAll('.console-sidebar nav button').forEach(b=>b.classList.toggle('active',b.dataset.dlStickerConsole==='1'));await load();renderPanel(true);}
  function closeStudio(){active=false;document.querySelector('.console-app')?.classList.remove('dl-console-sticker-active');document.querySelector('.dl-console-sticker-panel')?.remove();document.querySelector('[data-dl-sticker-console]')?.classList.remove('active');}
  function ensure(){
    if(!CONSOLE_ROUTE.test(location.hash)||!allowed)return;const app=document.querySelector('.console-app'),nav=app?.querySelector('.console-sidebar nav');if(!nav)return;
    let b=nav.querySelector('[data-dl-sticker-console]');if(!b){b=button('Sticker Studio');b.dataset.dlStickerConsole='1';b.innerHTML='<span class="dl-console-sticker-nav-glyph">◆</span> Sticker Studio';b.onclick=openStudio;nav.append(b);}b.classList.toggle('active',active);
    if(active){app.classList.add('dl-console-sticker-active');renderPanel(false);}
  }
  async function route(){
    clearInterval(timer);if(!CONSOLE_ROUTE.test(location.hash)){closeStudio();checked=false;allowed=false;return;}
    checked=false;if(!await canManage())return;let tries=0;const wait=()=>{if(document.querySelector('.console-app')){ensure();timer=setInterval(ensure,900);return;}if(tries++<40)setTimeout(wait,90);};wait();
  }

  document.addEventListener('click',e=>{if(!active)return;const native=e.target.closest?.('.console-sidebar nav button:not([data-dl-sticker-console])');if(native)closeStudio();},true);
  window.addEventListener('hashchange',route);window.addEventListener('pageshow',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();