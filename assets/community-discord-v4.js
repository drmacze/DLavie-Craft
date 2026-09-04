(() => {
  'use strict';

  const SB_URL = 'https://ydaeukhqwishlrjyfktk.supabase.co';
  const SESSION_KEY = 'sb-ydaeukhqwishlrjyfktk-auth-token';
  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  const EMOJI = [
    ['Cepat',['👍','❤️','😂','🔥','🎉','💎','🙏','👀','✨','🤝','😎','😭']],
    ['Wajah',['😀','😄','😁','😆','😅','🤣','😊','🙂','😉','😍','🥰','😘','😋','😜','🤔','🫡','😮','😱','🥹','😢','😭','😤','😡','🤯']],
    ['Gestur',['👍','👎','👏','🙌','🤝','🙏','💪','👌','✌️','🤞','🫶','👀','💯']],
    ['Craft',['⛏️','🪓','⚔️','🛡️','🏹','🧱','🪵','💎','🔥','✨','⚡','💡']],
    ['Perayaan',['🎉','🎊','🥳','🏆','⭐','🌟','🚀','✅','❌','💚','💜','🧡']]
  ];

  let keyPromise = null;
  let state = { forums:[], posts:[], comments:[], reactions:[], profiles:[] };
  let observer = null;
  let pageRef = null;
  let raf = 0;
  let timer = 0;
  let busy = false;

  function session() {
    try { const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); return s?.access_token?s:null; } catch { return null; }
  }
  function uid() {
    const s=session(); if (s?.user?.id) return s.user.id;
    try { const p=s?.access_token?.split('.')?.[1]; if(!p)return null; return JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(p.length/4)*4,'=')))?.sub||null; } catch { return null; }
  }
  async function publicKey() {
    if (!keyPromise) keyPromise = fetch('/DLavie-Craft/assets/community-chat-v3.js?v=20260904t', {cache:'force-cache'})
      .then(r=>r.text()).then(t=>t.match(/const SUPABASE_KEY = '([^']+)'/)?.[1]||'');
    const key=await keyPromise; if(!key) throw new Error('Konfigurasi komunitas belum siap.'); return key;
  }
  async function api(path, options={}) {
    const key=await publicKey(); const s=session();
    const write=!!options.write;
    const headers={apikey:key,Authorization:`Bearer ${s?.access_token||key}`,'Accept-Profile':'api',Accept:'application/json',...(options.headers||{})};
    if(write){headers['Content-Type']='application/json';headers['Content-Profile']='api';headers.Prefer='return=minimal';}
    const res=await fetch(`${SB_URL}/rest/v1/${path}`,{...options,headers});
    const text=await res.text(); let body=null; try{body=text?JSON.parse(text):null;}catch{body=text;}
    if(!res.ok) throw new Error(body?.message||body?.details||body?.hint||body||`Server ${res.status}`);
    return body;
  }
  async function load() {
    const [forums,posts,comments,reactions,profiles]=await Promise.all([
      api('dlavie_craft_community_forums?select=id,name,slug,forum_type&is_active=eq.true&order=sort_order.asc'),
      api('dlavie_craft_community_posts?select=id,author_id,forum_id,body,created_at,updated_at&status=eq.published&order=created_at.desc'),
      api('dlavie_craft_community_comments?select=id,post_id,author_id,parent_comment_id,body,created_at,updated_at&status=eq.published&order=created_at.asc'),
      api('dlavie_craft_community_reactions?select=id,post_id,comment_id,author_id,emoji,created_at&order=created_at.asc'),
      api('dlavie_craft_community_leaderboard?select=user_id,display_name,level')
    ]);
    state={forums:forums||[],posts:posts||[],comments:comments||[],reactions:reactions||[],profiles:profiles||[]};
  }
  function nameOf(id){return state.profiles.find(p=>p.user_id===id)?.display_name||'Crafter';}
  function activeForum(page){const n=page.querySelector('.active-forum-head h2')?.textContent?.trim()||page.querySelector('.forum-sidebar nav button.active strong')?.textContent?.trim();return state.forums.find(f=>f.name===n)||null;}
  function button(text,cls=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.className=cls;b.setAttribute('data-dl-no-icon','true');return b;}
  function toast(text){document.querySelector('.dl-v4-toast')?.remove();const n=document.createElement('div');n.className='dl-v4-toast';n.textContent=text;document.body.append(n);requestAnimationFrame(()=>n.classList.add('show'));setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),180);},2200);}
  function login(){(document.getElementById('dl-shell-account-entry')||document.getElementById('dl-account-entry'))?.click();}

  function groups(kind,id){
    const me=uid(), map=new Map(), key=kind==='post'?'post_id':'comment_id';
    state.reactions.filter(r=>r[key]===id).forEach(r=>{const g=map.get(r.emoji)||{emoji:r.emoji,count:0,mine:false,names:[]};g.count++;g.mine ||= r.author_id===me;g.names.push(nameOf(r.author_id));map.set(r.emoji,g);});
    return [...map.values()];
  }
  async function toggle(kind,id,emoji){
    if(!session())return login(); if(busy)return; busy=true;
    const me=uid(), key=kind==='post'?'post_id':'comment_id';
    const existing=state.reactions.find(r=>r[key]===id&&r.author_id===me&&r.emoji===emoji);
    try{
      if(existing){
        await api(`dlavie_craft_community_reactions?${key}=eq.${encodeURIComponent(id)}&author_id=eq.${encodeURIComponent(me)}&emoji=eq.${encodeURIComponent(emoji)}`,{method:'DELETE',write:true});
        state.reactions=state.reactions.filter(r=>r!==existing);
      }else{
        const payload={post_id:kind==='post'?id:null,comment_id:kind==='comment'?id:null,author_id:me,emoji};
        await api('dlavie_craft_community_reactions',{method:'POST',write:true,body:JSON.stringify(payload)});
        state.reactions.push({id:`local-${Date.now()}`,...payload,created_at:new Date().toISOString()});
      }
      renderReactions(document.querySelector(PAGE)); scheduleRefresh(220);
    }catch(e){toast(`Reaction gagal: ${e.message}`);}finally{busy=false;}
  }
  function row(kind,id){
    const r=document.createElement('div');r.className='dl-v4-reactions';r.dataset.kind=kind;r.dataset.id=id;
    groups(kind,id).forEach(g=>{const b=button('',`dl-v4-react-chip${g.mine?' mine':''}`);b.innerHTML=`<span>${g.emoji}</span><b>${g.count}</b>`;b.title=g.names.slice(0,8).join(', ');b.onclick=()=>toggle(kind,id,g.emoji);r.append(b);});
    const add=button('＋','dl-v4-react-add');add.setAttribute('aria-label','Tambah reaction');add.onclick=e=>picker(kind,id,e.currentTarget);r.append(add);return r;
  }
  function picker(kind,id,anchor){
    if(!session())return login();document.querySelector('.dl-v4-picker')?.remove();
    const p=document.createElement('div');p.className='dl-v4-picker';p.innerHTML='<header><strong>Reaction</strong><input type="search" placeholder="Cari emoji…"><button type="button" data-close data-dl-no-icon="true">×</button></header><div class="dl-v4-emoji-list"></div>';
    const list=p.querySelector('.dl-v4-emoji-list');
    const draw=q=>{list.replaceChildren();EMOJI.forEach(([label,items])=>{if(q&&!label.toLowerCase().includes(q.toLowerCase()))return;const s=document.createElement('section');s.innerHTML=`<small>${label}</small><div></div>`;items.forEach(e=>{const b=button(e,'dl-v4-emoji');b.onclick=()=>{p.remove();toggle(kind,id,e);};s.querySelector('div').append(b);});list.append(s);});};
    draw('');p.querySelector('input').oninput=e=>draw(e.target.value.trim());p.querySelector('[data-close]').onclick=()=>p.remove();document.body.append(p);
    if(matchMedia('(min-width:720px)').matches){const a=anchor.getBoundingClientRect();p.style.left=`${Math.max(12,Math.min(innerWidth-350,a.left-100))}px`;p.style.top=`${Math.min(innerHeight-400,a.bottom+8)}px`;}
  }
  function renderReactions(page){
    if(!page)return;page.querySelectorAll('.dl-v4-reactions').forEach(n=>n.remove());page.querySelectorAll('.reaction-area').forEach(n=>n.classList.add('dl-v4-hide-native-reaction'));
    const forum=activeForum(page);if(!forum)return;const posts=state.posts.filter(p=>p.forum_id===forum.id);const entries=[...page.querySelectorAll('.typed-feed > .community-entry')];
    entries.forEach((entry,i)=>{const post=posts[i];if(!post)return;entry.dataset.dlPostId=post.id;const act=entry.querySelector(':scope > .entry-actions')||entry.querySelector('.entry-actions');act?.prepend(row('post',post.id));
      const comments=state.comments.filter(c=>c.post_id===post.id), nodes=[...entry.querySelectorAll('.post-thread .community-comment')];
      nodes.forEach((node,j)=>{const c=comments[j];if(!c)return;node.dataset.dlCommentId=c.id;const content=node.children?.[1]||node;let h=content.querySelector(':scope > .dl-v4-comment-actions');if(!h){h=document.createElement('div');h.className='dl-v4-comment-actions';content.append(h);}h.prepend(row('comment',c.id));});
    });
  }

  function threadify(page){
    const forum=activeForum(page);if(!forum)return;const posts=state.posts.filter(p=>p.forum_id===forum.id);const entries=[...page.querySelectorAll('.typed-feed > .community-entry')];
    entries.forEach((entry,i)=>{const post=posts[i];if(!post)return;entry.classList.add('dl-v4-message');const thread=entry.querySelector('.post-thread');const comments=state.comments.filter(c=>c.post_id===post.id);if(!thread)return;
      let head=thread.querySelector('.dl-v4-thread-head');if(!head){head=document.createElement('div');head.className='dl-v4-thread-head';head.innerHTML='<span></span><div><strong>Thread</strong><small></small></div><b></b>';thread.prepend(head);}head.querySelector('small').textContent=`Balasan untuk ${nameOf(post.author_id)}`;head.querySelector('b').textContent=`${comments.length} balasan`;
      const nodes=[...thread.querySelectorAll('.community-comment')], byId=new Map(comments.map(c=>[c.id,c])), nodeMap=new Map();nodes.forEach((n,j)=>{const c=comments[j];if(c){nodeMap.set(c.id,n);n.classList.toggle('dl-v4-nested',!!c.parent_comment_id);}});
      comments.forEach(c=>{if(!c.parent_comment_id)return;const n=nodeMap.get(c.id), parent=byId.get(c.parent_comment_id);if(!n||!parent||n.querySelector('.dl-v4-reply-context'))return;const ctx=button('','dl-v4-reply-context');ctx.innerHTML=`<span>↳</span><div><strong>Membalas ${nameOf(parent.author_id)}</strong><small>${String(parent.body||'').replace(/\s+/g,' ').slice(0,72)}</small></div>`;ctx.onclick=()=>{const pn=nodeMap.get(parent.id);pn?.scrollIntoView({behavior:'smooth',block:'center'});pn?.classList.add('dl-v4-highlight');setTimeout(()=>pn?.classList.remove('dl-v4-highlight'),900);};n.querySelector('p')?.insertAdjacentElement('beforebegin',ctx);});
    });
  }

  function sheet(title,subtitle=''){document.querySelector('.dl-v4-sheet')?.remove();const o=document.createElement('div');o.className='dl-v4-sheet';o.innerHTML=`<section><header><div><strong>${title}</strong><small>${subtitle}</small></div><button type="button" data-close data-dl-no-icon="true">×</button></header><div class="dl-v4-sheet-body"></div></section>`;const close=()=>o.remove();o.querySelector('[data-close]').onclick=close;o.onclick=e=>{if(e.target===o)close();};document.body.append(o);return{body:o.querySelector('.dl-v4-sheet-body'),close};}
  function closeMenus(except){document.querySelectorAll('.dl-v4-menu.open').forEach(m=>{if(m!==except)m.classList.remove('open');});}
  function messageMenu(kind,item,host){if(!session()||!host||host.querySelector(':scope > .dl-v4-more'))return;host.classList.add('dl-v4-action-host');const own=uid()===item.author_id,more=button('•••','dl-v4-more'),menu=document.createElement('div');menu.className='dl-v4-menu';
    const add=(label,action,fn)=>{const b=button(label);b.dataset.action=action;b.onclick=e=>{e.stopPropagation();closeMenus();fn();};menu.append(b);};
    if(own){add('Edit pesan','edit',()=>editItem(kind,item));add('Hapus pesan','delete',()=>deleteItem(kind,item));}else add('Laporkan','report',()=>reportItem(kind,item));
    more.onclick=e=>{e.stopPropagation();const open=!menu.classList.contains('open');closeMenus(menu);menu.classList.toggle('open',open);};host.append(more,menu);
  }
  function actionify(page){const forum=activeForum(page);if(!forum)return;const posts=state.posts.filter(p=>p.forum_id===forum.id);[...page.querySelectorAll('.typed-feed > .community-entry')].forEach((entry,i)=>{const post=posts[i];if(!post)return;messageMenu('post',post,entry.querySelector('.chat-bubble,.showcase-copy,.ticket-copy,.idea-copy,.announcement-layout > div:last-child')||entry);const comments=state.comments.filter(c=>c.post_id===post.id),nodes=[...entry.querySelectorAll('.post-thread .community-comment')];nodes.forEach((n,j)=>{const c=comments[j];if(c)messageMenu('comment',c,n.children?.[1]||n);});});}
  async function patch(kind,id,body){return api(`${kind==='post'?'dlavie_craft_community_posts':'dlavie_craft_community_comments'}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',write:true,body:JSON.stringify({body})});}
  function editItem(kind,item){const ui=sheet('Edit pesan','Perubahan akan tersimpan ke pesan ini.');const f=document.createElement('form');f.className='dl-v4-form';f.innerHTML='<textarea rows="5" maxlength="8000" required></textarea><div><button type="button" data-cancel data-dl-no-icon="true">Batal</button><button type="submit" data-dl-no-icon="true">Simpan</button></div>';const ta=f.querySelector('textarea');ta.value=item.body||'';f.querySelector('[data-cancel]').onclick=ui.close;f.onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;try{await patch(kind,item.id,ta.value.trim());ui.close();toast('Pesan diperbarui');scheduleRefresh(80);}catch(x){toast(x.message);}finally{busy=false;}};ui.body.append(f);ta.focus();}
  function deleteItem(kind,item){const ui=sheet('Hapus pesan?','Tindakan ini tidak dapat dibatalkan.');const b=button('Hapus','danger');b.onclick=async()=>{if(busy)return;busy=true;try{await api(`${kind==='post'?'dlavie_craft_community_posts':'dlavie_craft_community_comments'}?id=eq.${encodeURIComponent(item.id)}`,{method:'DELETE',write:true});ui.close();toast('Pesan dihapus');scheduleRefresh(80);}catch(x){toast(x.message);}finally{busy=false;}};ui.body.append(b);}
  function reportItem(kind,item){const ui=sheet('Laporkan pesan','Moderator akan meninjau laporanmu.');const f=document.createElement('form');f.className='dl-v4-form';f.innerHTML='<select><option value="spam">Spam</option><option value="harassment">Pelecehan / bullying</option><option value="hate">Ujaran kebencian</option><option value="nsfw">Konten tidak pantas</option><option value="scam">Scam / malware</option><option value="off_topic">Di luar topik</option><option value="other">Lainnya</option></select><textarea rows="3" maxlength="600" placeholder="Detail tambahan (opsional)…"></textarea><button type="submit" data-dl-no-icon="true">Kirim laporan</button>';f.onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;try{await api('dlavie_craft_community_reports',{method:'POST',write:true,body:JSON.stringify({post_id:kind==='post'?item.id:null,comment_id:kind==='comment'?item.id:null,reporter_id:uid(),reported_author_id:item.author_id,reason:f.querySelector('select').value,details:f.querySelector('textarea').value.trim(),target_excerpt:String(item.body||'').slice(0,240)})});ui.close();toast('Laporan terkirim');}catch(x){toast(/duplicate|unique/i.test(x.message)?'Pesan ini sudah kamu laporkan.':x.message);}finally{busy=false;}};ui.body.append(f);}

  function goLatest(page){
    const entry=page.querySelector('.typed-feed > .community-entry');
    if(entry){entry.scrollIntoView({behavior:'smooth',block:'center'});entry.classList.add('dl-v4-highlight');setTimeout(()=>entry.classList.remove('dl-v4-highlight'),850);return;}
    const candidates=[...page.querySelectorAll('.forum-sidebar nav button')].filter(b=>Number((b.querySelector('b')?.textContent||'0').replace(/\D/g,''))>0);const target=candidates.find(b=>!b.classList.contains('active'))||candidates[0];
    if(!target)return toast('Belum ada aktivitas baru.');target.click();setTimeout(()=>page.querySelector('.typed-feed > .community-entry')?.scrollIntoView({behavior:'smooth',block:'center'}),300);
  }
  function enhance(page){page.classList.add('dl-community-discord-v4');const latest=page.querySelector('[data-dl-community-action="latest"]');latest?.setAttribute('data-dl-no-icon','true');threadify(page);actionify(page);renderReactions(page);}
  function scheduleDOM(page=document.querySelector(PAGE)){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(page?.isConnected)enhance(page);});}
  function scheduleRefresh(delay=300){clearTimeout(timer);timer=setTimeout(async()=>{if(!ROUTE.test(location.hash))return;try{await load();scheduleDOM();}catch(e){console.warn('[Community v4]',e.message);}},delay);}
  function attach(page){if(!page||pageRef===page){scheduleDOM(page);return;}observer?.disconnect();pageRef=page;load().then(()=>scheduleDOM(page)).catch(e=>console.warn('[Community v4]',e.message));observer=new MutationObserver(records=>{const meaningful=records.some(r=>{const t=r.target?.nodeType===1?r.target:r.target?.parentElement;return !t?.closest?.('.dl-v4-reactions,.dl-v4-menu,.dl-v4-thread-head,.dl-v4-reply-context,.dl-v4-sheet,.dl-v4-picker');});if(meaningful)scheduleDOM(page);});observer.observe(page,{childList:true,subtree:true});}
  function route(){if(!ROUTE.test(location.hash)){observer?.disconnect();observer=null;pageRef=null;return;}let n=0;const wait=()=>{const p=document.querySelector(PAGE);if(p)return attach(p);if(n++<30)setTimeout(wait,80+n*8);};wait();}

  document.addEventListener('click',e=>{if(!ROUTE.test(location.hash))return;const latest=e.target.closest?.('[data-dl-community-action="latest"]');if(latest){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const p=document.querySelector(PAGE);if(p)goLatest(p);return;}if(!e.target.closest?.('.dl-v4-more,.dl-v4-menu'))closeMenus();const picker=document.querySelector('.dl-v4-picker');if(picker&&!e.target.closest?.('.dl-v4-picker,.dl-v4-react-add'))picker.remove();},true);
  window.addEventListener('hashchange',route);window.addEventListener('popstate',route);window.addEventListener('pageshow',route);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
  window.__DLAVIE_COMMUNITY_V4__={version:'20260905u',api,load,getState:()=>state,scheduleDOM,toast,publicKey,session,uid};
})();