(() => {
  'use strict';

  const SB_URL='https://ydaeukhqwishlrjyfktk.supabase.co';
  const SESSION_KEY='sb-ydaeukhqwishlrjyfktk-auth-token';
  const BUCKET='community-stickers';
  const ROUTE=/^#\/console(?:\/|\?|$)/;
  const MAX=5*1024*1024;
  let keyPromise=null,stickers=[],busy=false,previewUrl='',timer=0,raf=0;

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slugify=v=>String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,28)||'sticker';
  function session(){try{const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');return s?.access_token?s:null;}catch{return null;}}
  function uid(){const s=session();if(s?.user?.id)return s.user.id;try{const p=s?.access_token?.split('.')?.[1];if(!p)return null;return JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(p.length/4)*4,'=')))?.sub||null;}catch{return null;}}
  async function publicKey(){if(!keyPromise)keyPromise=fetch('/DLavie-Craft/assets/community-chat-v3.js?v=20260904t',{cache:'force-cache'}).then(r=>r.text()).then(t=>t.match(/const SUPABASE_KEY = '([^']+)'/)?.[1]||'');const key=await keyPromise;if(!key)throw new Error('Konfigurasi Supabase tidak ditemukan.');return key;}
  async function api(path,options={}){const key=await publicKey(),s=session(),write=!!options.write;const headers={apikey:key,Authorization:`Bearer ${s?.access_token||key}`,'Accept-Profile':'api',Accept:'application/json',...(options.headers||{})};if(write){headers['Content-Type']='application/json';headers['Content-Profile']='api';headers.Prefer='return=minimal';}const request={...options,headers};delete request.write;const res=await fetch(`${SB_URL}/rest/v1/${path}`,request);const text=await res.text();let body=null;try{body=text?JSON.parse(text):null;}catch{body=text;}if(!res.ok)throw new Error(body?.message||body?.details||body?.hint||body||`Server ${res.status}`);return body;}
  function toast(text){document.querySelector('.dl-sticker-console-toast-v3')?.remove();const n=document.createElement('div');n.className='dl-sticker-console-toast-v3';n.textContent=text;document.body.append(n);requestAnimationFrame(()=>n.classList.add('show'));setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),180);},2300);}
  function button(label,cls=''){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.setAttribute('data-dl-no-icon','true');return b;}

  async function load(){
    stickers=await api('dlavie_craft_community_stickers?select=id,name,slug,file_path,public_url,mime_type,file_size,animated,active,sort_order,created_at,updated_at&order=sort_order.asc,created_at.asc')||[];
    return stickers;
  }

  async function upload(file,name){
    if(!session())throw new Error('Login developer diperlukan.');
    if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw new Error('Format harus PNG, JPG, WEBP, atau GIF.');
    if(file.size>MAX)throw new Error('Ukuran maksimal sticker 5 MB.');
    const ext=({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'})[file.type];
    const slug=`${slugify(name)}-${Date.now().toString(36)}`;
    const path=`${new Date().getUTCFullYear()}/${slug}.${ext}`;
    const key=await publicKey(),s=session();
    const objectUrl=`${SB_URL}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
    const response=await fetch(objectUrl,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${s.access_token}`,'Content-Type':file.type,'x-upsert':'false'},body:file});
    if(!response.ok)throw new Error((await response.text())||`Upload gagal (${response.status})`);
    const publicUrl=`${SB_URL}/storage/v1/object/public/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
    await api('dlavie_craft_community_stickers',{method:'POST',write:true,body:JSON.stringify({name:name.trim(),slug,file_path:path,public_url:publicUrl,mime_type:file.type,file_size:file.size,animated:file.type==='image/gif',active:true,created_by:uid()})});
  }

  function stats(){return{total:stickers.length,active:stickers.filter(s=>s.active).length,gif:stickers.filter(s=>s.animated).length};}

  function closeStudio(){
    document.querySelector('.dl-sticker-console-v3')?.remove();
    document.documentElement.classList.remove('dl-sticker-console-open-v3');
    if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}
  }

  function renderLibrary(root){
    const list=root.querySelector('.dl-sc3-library-grid');
    const count=root.querySelector('[data-library-count]');
    if(count)count.textContent=`${stickers.filter(s=>s.active).length} aktif · ${stickers.length} total`;
    list.replaceChildren();
    if(!stickers.length){list.innerHTML='<div class="dl-sc3-empty"><b>Belum ada sticker</b><span>Upload sticker pertama untuk komunitas DLavie.</span></div>';return;}
    stickers.forEach(item=>{
      const card=document.createElement('article');card.className=`dl-sc3-item${item.active?' active':''}`;
      card.innerHTML=`<div class="dl-sc3-item-preview"><img src="${esc(item.public_url)}" alt="${esc(item.name)}" loading="lazy" decoding="async">${item.animated?'<span>GIF</span>':''}</div><div class="dl-sc3-item-copy"><strong>${esc(item.name)}</strong><small>${String(item.mime_type||'image').replace('image/','').toUpperCase()} · ${Math.max(1,Math.round(Number(item.file_size||0)/1024))} KB</small></div>`;
      const actions=document.createElement('div');actions.className='dl-sc3-item-actions';
      const toggle=button(item.active?'Aktif':'Nonaktif','dl-sc3-toggle');toggle.setAttribute('aria-pressed',String(item.active));
      toggle.onclick=async()=>{if(busy)return;busy=true;toggle.disabled=true;try{await api(`dlavie_craft_community_stickers?id=eq.${encodeURIComponent(item.id)}`,{method:'PATCH',write:true,body:JSON.stringify({active:!item.active,updated_at:new Date().toISOString()})});item.active=!item.active;toast(item.active?'Sticker diaktifkan':'Sticker dinonaktifkan');renderLibrary(root);window.__DLAVIE_PUBLIC_STICKERS__?.reload?.();}catch(e){toast(`Gagal: ${e.message}`);}finally{busy=false;}};
      actions.append(toggle);card.append(actions);list.append(card);
    });
  }

  async function openStudio(){
    if(document.querySelector('.dl-sticker-console-v3'))return;
    const overlay=document.createElement('div');overlay.className='dl-sticker-console-v3';
    overlay.innerHTML=`<section class="dl-sc3-shell"><header class="dl-sc3-top"><div><span>DEVELOPER CONSOLE · COMMUNITY</span><h1>Sticker Studio</h1><p>Kelola sticker resmi yang dapat dipakai member di Community.</p></div><button type="button" class="dl-sc3-close" data-dl-no-icon="true" aria-label="Tutup">×</button></header><div class="dl-sc3-stats"><article><b data-stat-total>—</b><span>Total</span></article><article><b data-stat-active>—</b><span>Aktif</span></article><article><b data-stat-gif>—</b><span>GIF</span></article><article class="dl-sc3-display-stat"><b>160</b><span>px di chat</span></article></div><main class="dl-sc3-body"><form class="dl-sc3-upload"><div class="dl-sc3-section-title"><div><strong>Tambah sticker</strong><small>Rekomendasi 320×320 px · tampil sekitar 160×160 px seperti Discord</small></div></div><label><span>Nama sticker</span><input name="name" required maxlength="40" placeholder="Contoh: Creeper Hype"></label><label class="dl-sc3-drop"><span>Pilih file sticker</span><input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required><small>PNG, JPG, WEBP, GIF · maksimum 5 MB</small></label><div class="dl-sc3-preview-wrap"><div class="dl-sc3-preview"><span>Preview 160×160</span></div><div class="dl-sc3-preview-info"><strong>Ukuran tampilan Community</strong><p>Sticker utama ditampilkan maksimal 160×160 px. Reply memakai ukuran lebih kecil agar thread tetap ringkas.</p></div></div><button type="submit" class="dl-sc3-upload-btn" data-dl-no-icon="true">Upload sticker</button></form><section class="dl-sc3-library"><div class="dl-sc3-section-title"><div><strong>Library sticker</strong><small data-library-count>Memuat…</small></div></div><div class="dl-sc3-library-grid"></div></section></main></section>`;
    document.body.append(overlay);document.documentElement.classList.add('dl-sticker-console-open-v3');
    overlay.querySelector('.dl-sc3-close').onclick=closeStudio;
    const form=overlay.querySelector('form'),fileInput=form.elements.file,preview=overlay.querySelector('.dl-sc3-preview'),submit=form.querySelector('.dl-sc3-upload-btn');
    fileInput.onchange=()=>{if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}preview.replaceChildren();const file=fileInput.files?.[0];if(!file){preview.innerHTML='<span>Preview 160×160</span>';return;}previewUrl=URL.createObjectURL(file);const img=document.createElement('img');img.src=previewUrl;img.alt='Preview sticker';preview.append(img);};
    form.onsubmit=async e=>{e.preventDefault();if(busy)return;const file=fileInput.files?.[0],name=form.elements.name.value.trim();if(!file||!name)return;busy=true;submit.disabled=true;submit.textContent='Mengunggah…';try{await upload(file,name);await load();toast('Sticker berhasil ditambahkan');form.reset();if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}preview.innerHTML='<span>Preview 160×160</span>';updateStats(overlay);renderLibrary(overlay);window.__DLAVIE_PUBLIC_STICKERS__?.reload?.();}catch(err){toast(err.message);}finally{busy=false;submit.disabled=false;submit.textContent='Upload sticker';}};
    try{await load();updateStats(overlay);renderLibrary(overlay);}catch(e){overlay.querySelector('.dl-sc3-library-grid').innerHTML=`<div class="dl-sc3-empty"><b>Sticker Studio belum dapat memuat data</b><span>${esc(e.message)}</span></div>`;toast(`Sticker Studio: ${e.message}`);}
  }

  function updateStats(root){const s=stats();root.querySelector('[data-stat-total]').textContent=s.total;root.querySelector('[data-stat-active]').textContent=s.active;root.querySelector('[data-stat-gif]').textContent=s.gif;}

  function findNav(){
    const candidates=[...document.querySelectorAll('.console-sidebar nav,.console-sidebar,[class*="console"] nav,aside nav,nav')];
    return candidates.find(el=>el.offsetParent!==null&&/console|dashboard|project|upload|community|pengaturan|setting/i.test(el.textContent||''))||candidates.find(el=>el.offsetParent!==null)||null;
  }

  function ensureLauncher(){
    if(!ROUTE.test(location.hash)){document.querySelectorAll('.dl-sticker-launch-v3,.dl-sticker-launch-fallback-v3').forEach(n=>n.remove());closeStudio();return;}
    const nav=findNav();
    if(nav){
      document.querySelector('.dl-sticker-launch-fallback-v3')?.remove();
      if(!nav.querySelector('.dl-sticker-launch-v3')){
        const b=button('Sticker Studio','dl-sticker-launch-v3');
        b.innerHTML='<span class="dl-sc3-nav-icon" aria-hidden="true"><i></i><b></b><em></em></span><span>Sticker Studio</span>';
        b.onclick=openStudio;nav.append(b);
      }
      return;
    }
    if(!document.querySelector('.dl-sticker-launch-fallback-v3')){
      const b=button('Sticker Studio','dl-sticker-launch-fallback-v3');
      b.innerHTML='<span class="dl-sc3-nav-icon" aria-hidden="true"><i></i><b></b><em></em></span><span>Sticker Studio</span>';
      b.onclick=openStudio;document.body.append(b);
    }
  }

  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;ensureLauncher();});}
  function route(){clearInterval(timer);if(!ROUTE.test(location.hash)){ensureLauncher();return;}let tries=0;const wait=()=>{ensureLauncher();if(tries++<35)setTimeout(wait,90+tries*8);};wait();timer=setInterval(ensureLauncher,1400);}
  const observer=new MutationObserver(records=>{if(!ROUTE.test(location.hash))return;if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.closest?.('.dl-sticker-console-v3,.dl-sticker-launch-v3'))))schedule();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',route);window.addEventListener('pageshow',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();