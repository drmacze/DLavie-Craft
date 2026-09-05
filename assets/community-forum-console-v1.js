(() => {
  'use strict';

  const SB_URL='https://ydaeukhqwishlrjyfktk.supabase.co';
  const SESSION_KEY='sb-ydaeukhqwishlrjyfktk-auth-token';
  const ROUTE=/^#\/console(?:\/|\?|$)/;
  let keyPromise=null;
  let developer=false;
  let checked=false;
  let checking=null;
  let forums=[];
  let selectedId='';
  let busy=false;
  let timer=0;
  let raf=0;

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function session(){try{const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');return s?.access_token?s:null;}catch{return null;}}
  async function publicKey(){
    if(!keyPromise)keyPromise=fetch('/DLavie-Craft/assets/community-chat-v3.js?v=20260904t',{cache:'force-cache'}).then(r=>r.text()).then(t=>t.match(/const SUPABASE_KEY = '([^']+)'/)?.[1]||'');
    const key=await keyPromise;if(!key)throw new Error('Konfigurasi Community tidak ditemukan.');return key;
  }
  async function api(path,options={}){
    const key=await publicKey(),s=session(),write=!!options.write;
    const headers={apikey:key,Authorization:`Bearer ${s?.access_token||key}`,'Accept-Profile':'api',Accept:'application/json',...(options.headers||{})};
    if(write){headers['Content-Type']='application/json';headers['Content-Profile']='api';headers.Prefer=options.prefer||'return=minimal';}
    const request={...options,headers};delete request.write;delete request.prefer;
    const res=await fetch(`${SB_URL}/rest/v1/${path}`,request);
    const text=await res.text();let body=null;try{body=text?JSON.parse(text):null;}catch{body=text;}
    if(!res.ok)throw new Error(body?.message||body?.details||body?.hint||body||`Server ${res.status}`);
    return body;
  }

  async function verify(force=false){
    if(checked&&!force)return developer;
    if(checking)return checking;
    checking=(async()=>{
      if(!session()){developer=false;checked=true;return false;}
      try{
        const result=await api('rpc/dlavie_craft_is_developer',{method:'POST',write:true,body:'{}',prefer:'return=representation'});
        developer=result===true||result?.value===true||result?.is_developer===true;
      }catch{developer=false;}
      checked=true;return developer;
    })().finally(()=>{checking=null;});
    return checking;
  }

  function button(label,cls=''){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.setAttribute('data-dl-no-icon','true');return b;}
  function toast(text,type='ok'){
    document.querySelector('.dl-forum-console-toast-v1')?.remove();
    const n=document.createElement('div');n.className=`dl-forum-console-toast-v1 ${type}`;n.textContent=text;document.body.append(n);
    requestAnimationFrame(()=>n.classList.add('show'));setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),180);},2400);
  }
  function statusOf(f){return!f.is_active?'draft':f.is_readonly?'private':'public';}
  function statusLabel(s){return s==='public'?'Public':s==='private'?'Private':'Draft';}
  function typeLabel(v=''){return({chat:'Chat',showcase:'Showcase',support:'Support',feedback:'Feedback',levels:'Ranks',announcements:'Announcements'})[v]||v||'Forum';}

  async function load(){
    forums=await api('dlavie_craft_community_forums?select=id,slug,name,description,forum_type,icon,accent_color,sort_order,is_active,is_readonly,is_system,updated_at&order=sort_order.asc,created_at.asc')||[];
    if(!forums.some(f=>f.id===selectedId))selectedId=forums[0]?.id||'';
    return forums;
  }

  function close(){document.querySelector('.dl-forum-console-v1')?.remove();document.documentElement.classList.remove('dl-forum-console-open-v1');}

  function shell(){
    const overlay=document.createElement('div');overlay.className='dl-forum-console-v1';
    overlay.innerHTML=`<section class="dl-fc1-shell" role="dialog" aria-modal="true" aria-label="Forum Settings">
      <header class="dl-fc1-top"><div><span>DEVELOPER CONSOLE · COMMUNITY</span><h1>Forum Settings</h1><p>Atur visibilitas, mode baca-saja, identitas, dan urutan forum tanpa mengubah struktur data forum.</p></div><button type="button" class="dl-fc1-close" data-dl-no-icon="true" aria-label="Tutup">×</button></header>
      <div class="dl-fc1-summary"><article><b data-total>—</b><span>Total</span></article><article><b data-public>—</b><span>Public</span></article><article><b data-private>—</b><span>Private</span></article><article><b data-draft>—</b><span>Draft</span></article></div>
      <main class="dl-fc1-body"><aside><div class="dl-fc1-aside-head"><strong>Forums</strong><button type="button" data-refresh data-dl-no-icon="true">Refresh</button></div><div class="dl-fc1-list"></div></aside><section class="dl-fc1-editor"><div class="dl-fc1-empty"><b>Pilih forum</b><span>Pilih salah satu forum untuk mengubah pengaturannya.</span></div></section></main>
    </section>`;
    overlay.querySelector('.dl-fc1-close').onclick=close;
    overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    overlay.querySelector('[data-refresh]').onclick=async()=>{if(busy)return;busy=true;try{await load();render(overlay);toast('Data forum diperbarui');}catch(e){toast(e.message,'error');}finally{busy=false;}};
    return overlay;
  }

  function renderSummary(root){
    const statuses=forums.map(statusOf);
    root.querySelector('[data-total]').textContent=forums.length;
    root.querySelector('[data-public]').textContent=statuses.filter(s=>s==='public').length;
    root.querySelector('[data-private]').textContent=statuses.filter(s=>s==='private').length;
    root.querySelector('[data-draft]').textContent=statuses.filter(s=>s==='draft').length;
  }

  function renderList(root){
    const list=root.querySelector('.dl-fc1-list');list.replaceChildren();
    forums.forEach(f=>{
      const s=statusOf(f),b=button('',`dl-fc1-forum${f.id===selectedId?' active':''}`);
      b.dataset.id=f.id;
      b.innerHTML=`<i style="--fc-accent:${esc(f.accent_color||'#8b5cf6')}"></i><span><strong>${esc(f.name)}</strong><small>${esc(typeLabel(f.forum_type))} · ${esc(f.slug)}</small></span><em class="${s}">${statusLabel(s)}</em>`;
      b.onclick=()=>{selectedId=f.id;render(root);};list.append(b);
    });
  }

  function field(label,html,hint=''){return`<label class="dl-fc1-field"><span>${label}</span>${html}${hint?`<small>${hint}</small>`:''}</label>`;}

  function renderEditor(root){
    const host=root.querySelector('.dl-fc1-editor'),f=forums.find(x=>x.id===selectedId);
    if(!f){host.innerHTML='<div class="dl-fc1-empty"><b>Belum ada forum</b><span>Tidak ada forum yang dapat dikelola.</span></div>';return;}
    const current=statusOf(f);
    host.innerHTML=`<form class="dl-fc1-form">
      <div class="dl-fc1-editor-head"><div><span>${esc(typeLabel(f.forum_type))}${f.is_system?' · SYSTEM':''}</span><h2>${esc(f.name)}</h2><p>ID dan tipe forum dikunci agar fitur khusus seperti Chat, Showcase, Support, Feedback, Ranks, dan Announcements tetap stabil.</p></div><div class="dl-fc1-live-dot" style="--fc-accent:${esc(f.accent_color||'#8b5cf6')}"></div></div>
      <section class="dl-fc1-section"><div class="dl-fc1-section-title"><strong>Status forum</strong><small>Public = normal · Private = terlihat tetapi read-only · Draft = tersembunyi dari member.</small></div><div class="dl-fc1-statuses">
        <label class="public"><input type="radio" name="status" value="public" ${current==='public'?'checked':''}><span><b>Public</b><small>Semua member dapat melihat dan berinteraksi sesuai tipe forum.</small></span></label>
        <label class="private"><input type="radio" name="status" value="private" ${current==='private'?'checked':''}><span><b>Private</b><small>Member dapat membaca, tetapi posting, reply, reaction, vote, edit, report, upload, dan sticker dikunci.</small></span></label>
        <label class="draft"><input type="radio" name="status" value="draft" ${current==='draft'?'checked':''}><span><b>Draft</b><small>Forum dan kontennya tidak muncul untuk member. Developer tetap dapat melihatnya.</small></span></label>
      </div></section>
      <section class="dl-fc1-section"><div class="dl-fc1-section-title"><strong>Identitas</strong><small>Nama dan deskripsi muncul pada navigasi serta header forum.</small></div><div class="dl-fc1-grid2">
        ${field('Nama forum',`<input name="name" maxlength="64" required value="${esc(f.name)}">`,'Gunakan nama singkat agar nyaman di mobile.')}
        ${field('Icon key',`<input name="icon" maxlength="32" value="${esc(f.icon||'hash')}">`,'Contoh: chat, images, lifebuoy, sparkle, trophy, megaphone.')}
      </div>
      ${field('Deskripsi',`<textarea name="description" maxlength="220" rows="3">${esc(f.description||'')}</textarea>`,'Maksimum 220 karakter.')}
      </section>
      <section class="dl-fc1-section"><div class="dl-fc1-section-title"><strong>Tampilan & urutan</strong><small>Accent dipakai untuk identitas forum. Urutan lebih kecil tampil lebih dahulu.</small></div><div class="dl-fc1-grid2">
        ${field('Accent color',`<div class="dl-fc1-color"><input type="color" name="accent_picker" value="${/^#[0-9a-f]{6}$/i.test(f.accent_color||'')?esc(f.accent_color):'#8b5cf6'}"><input name="accent_color" maxlength="7" pattern="#[0-9A-Fa-f]{6}" value="${esc(f.accent_color||'#8b5cf6')}"></div>`,'Format #RRGGBB.')}
        ${field('Urutan',`<input type="number" name="sort_order" min="0" max="9990" step="10" value="${Number(f.sort_order)||0}">`,'Rekomendasi kelipatan 10 untuk ruang penyisipan forum baru.')}
      </div></section>
      <section class="dl-fc1-section dl-fc1-policy"><div class="dl-fc1-section-title"><strong>Aturan khusus</strong><small>Pengaturan ini mengikuti tipe forum dan tidak dapat dimatikan dari sini.</small></div><div class="dl-fc1-policy-grid">
        <article><b>Sticker</b><span>${f.forum_type==='chat'?'Aktif hanya di forum Chat / General.':'Tidak tersedia di forum ini.'}</span></article>
        <article><b>Forum type</b><span>${esc(typeLabel(f.forum_type))}</span></article>
        <article><b>Slug</b><span>${esc(f.slug)}</span></article>
        <article><b>System</b><span>${f.is_system?'Dilindungi dari penghapusan':'Forum custom'}</span></article>
      </div></section>
      <footer class="dl-fc1-actions"><div><small>Perubahan status langsung berlaku setelah disimpan.</small></div><button type="button" data-reset data-dl-no-icon="true">Reset</button><button type="submit" data-save data-dl-no-icon="true">Simpan perubahan</button></footer>
    </form>`;
    const form=host.querySelector('form'),picker=form.elements.accent_picker,color=form.elements.accent_color;
    picker.oninput=()=>{color.value=picker.value.toUpperCase();};
    color.oninput=()=>{if(/^#[0-9a-f]{6}$/i.test(color.value))picker.value=color.value;};
    form.querySelector('[data-reset]').onclick=()=>render(root);
    form.onsubmit=async e=>{
      e.preventDefault();if(busy)return;
      const status=form.elements.status.value,name=form.elements.name.value.trim(),description=form.elements.description.value.trim(),icon=form.elements.icon.value.trim()||'hash',accent=color.value.trim(),sort=Math.max(0,Math.min(9990,Number(form.elements.sort_order.value)||0));
      if(!name)return toast('Nama forum wajib diisi.','error');
      if(!/^#[0-9a-f]{6}$/i.test(accent))return toast('Accent color harus memakai format #RRGGBB.','error');
      const payload={name,description,icon,accent_color:accent.toUpperCase(),sort_order:sort,updated_at:new Date().toISOString(),is_active:status!=='draft',is_readonly:status==='private'};
      const save=form.querySelector('[data-save]');busy=true;save.disabled=true;save.textContent='Menyimpan…';
      try{
        await api(`dlavie_craft_community_forums?id=eq.${encodeURIComponent(f.id)}`,{method:'PATCH',write:true,body:JSON.stringify(payload)});
        await load();render(root);toast(`${name} disimpan sebagai ${statusLabel(status)}.`);document.dispatchEvent(new CustomEvent('dlavie:forum-settings-changed',{detail:{forumId:f.id,status}}));
      }catch(err){toast(`Gagal: ${err.message}`,'error');}
      finally{busy=false;const current=root.querySelector('[data-save]');if(current){current.disabled=false;current.textContent='Simpan perubahan';}}
    };
  }

  function render(root){renderSummary(root);renderList(root);renderEditor(root);}

  async function open(){
    if(document.querySelector('.dl-forum-console-v1'))return;
    if(!(await verify(true)))return toast('Forum Settings hanya tersedia untuk developer.','error');
    const root=shell();document.body.append(root);document.documentElement.classList.add('dl-forum-console-open-v1');
    try{await load();render(root);}catch(e){root.querySelector('.dl-fc1-editor').innerHTML=`<div class="dl-fc1-empty"><b>Forum Settings gagal memuat data</b><span>${esc(e.message)}</span></div>`;toast(e.message,'error');}
  }

  function findNav(){
    const candidates=[...document.querySelectorAll('.console-sidebar nav,.console-sidebar,[class*="console"] nav,aside nav,nav')];
    return candidates.find(el=>el.offsetParent!==null&&/console|dashboard|project|upload|community|pengaturan|setting/i.test(el.textContent||''))||candidates.find(el=>el.offsetParent!==null)||null;
  }

  async function ensureLauncher(){
    if(!ROUTE.test(location.hash)){document.querySelectorAll('.dl-forum-console-launch-v1,.dl-forum-console-launch-fallback-v1').forEach(n=>n.remove());close();return;}
    if(!(await verify())){document.querySelectorAll('.dl-forum-console-launch-v1,.dl-forum-console-launch-fallback-v1').forEach(n=>n.remove());return;}
    const nav=findNav();
    if(nav){
      document.querySelector('.dl-forum-console-launch-fallback-v1')?.remove();
      if(!nav.querySelector('.dl-forum-console-launch-v1')){
        const b=button('','dl-forum-console-launch-v1');b.innerHTML='<span class="dl-fc1-nav-icon" aria-hidden="true"><i></i><b></b><em></em></span><span>Forum Settings</span>';b.onclick=open;nav.append(b);
      }
    }else if(!document.querySelector('.dl-forum-console-launch-fallback-v1')){
      const b=button('','dl-forum-console-launch-fallback-v1');b.innerHTML='<span class="dl-fc1-nav-icon" aria-hidden="true"><i></i><b></b><em></em></span><span>Forum Settings</span>';b.onclick=open;document.body.append(b);
    }
  }

  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;ensureLauncher();});}
  function route(){
    clearInterval(timer);checked=false;developer=false;
    if(!ROUTE.test(location.hash)){ensureLauncher();return;}
    let tries=0;const wait=()=>{ensureLauncher();if(tries++<35)setTimeout(wait,100+tries*8);};wait();timer=setInterval(ensureLauncher,1800);
  }
  const observer=new MutationObserver(records=>{if(!ROUTE.test(location.hash))return;if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.closest?.('.dl-forum-console-v1,.dl-forum-console-launch-v1'))))schedule();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',route);window.addEventListener('pageshow',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();