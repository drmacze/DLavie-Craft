(() => {
  'use strict';

  const ROUTE=/#\/community(?:$|[/?])/;
  const PAGE='.community-page.community-v2';
  const EMOJI=[
    ['Cepat',['👍','❤️','😂','🔥','🎉','💎','🙏','👀','✨','🤝']],
    ['Wajah',['😀','😄','😁','😆','😅','🤣','😊','🙂','😉','😍','🥰','😘','😋','😜','🤔','🫡','😮','😱','🥹','😢','😭','😤','😡','🤯']],
    ['Gestur',['👍','👎','👏','🙌','🤝','🙏','💪','👌','✌️','🤞','🫶','👀','💯']],
    ['Craft',['⛏️','🪓','⚔️','🛡️','🏹','🧱','🪵','💎','🔥','✨','⚡','💡']],
    ['Perayaan',['🎉','🎊','🥳','🏆','⭐','🌟','🚀','✅','❌','💚','💜','🧡']]
  ];
  let observer=null,raf=0,busy=false;
  const core=()=>window.__DLAVIE_COMMUNITY_V4__;

  function login(){(document.getElementById('dl-shell-account-entry')||document.getElementById('dl-account-entry'))?.click();}
  function cleanIconChildren(el){el?.querySelectorAll?.(':scope > .dl-mc-icon,:scope > .dl-mc-sweep-icon,:scope > .dl-mc-forge-icon,:scope > svg').forEach(n=>n.remove());}
  function normalizeRow(row){
    if(!row)return;
    row.dataset.dlV8='1';
    row.style.setProperty('display','flex','important');
    row.style.setProperty('width','auto','important');
    row.style.setProperty('max-width','100%','important');
    row.style.setProperty('flex-wrap','wrap','important');
    row.style.setProperty('gap','6px','important');
    row.querySelectorAll('.dl-v4-react-chip').forEach(chip=>{
      cleanIconChildren(chip);chip.setAttribute('data-dl-no-icon','true');
      chip.style.setProperty('display','inline-flex','important');chip.style.setProperty('width','auto','important');chip.style.setProperty('min-width','44px','important');chip.style.setProperty('max-width','none','important');chip.style.setProperty('height','32px','important');chip.style.setProperty('flex','0 0 auto','important');chip.style.setProperty('padding','0 10px','important');
    });
    const add=row.querySelector('.dl-v4-react-add');
    if(add){
      cleanIconChildren(add);add.setAttribute('data-dl-no-icon','true');add.setAttribute('aria-label','Tambah reaction');add.textContent='';
      let face=add.querySelector('.dl-v8-face');if(!face){face=document.createElement('span');face.className='dl-v8-face';face.textContent='☺';add.append(face);}
      let plus=add.querySelector('.dl-v8-plus');if(!plus){plus=document.createElement('span');plus.className='dl-v8-plus';plus.textContent='+';add.append(plus);}
      add.style.setProperty('display','inline-grid','important');add.style.setProperty('width','36px','important');add.style.setProperty('min-width','36px','important');add.style.setProperty('max-width','36px','important');add.style.setProperty('height','32px','important');add.style.setProperty('flex','0 0 36px','important');add.style.setProperty('padding','0','important');
    }
  }
  function cleanLegacy(page){
    page.querySelectorAll('.entry-chat .reaction-area,.entry-chat .reaction-bar').forEach(n=>{if(!n.closest('.dl-feedback-votes,.dl-feedback-v2-votes'))n.remove();});
    page.querySelectorAll('.entry-chat .entry-actions').forEach(actions=>{
      const row=actions.querySelector(':scope > .dl-v4-reactions');
      if(row){actions.classList.add('dl-v8-actions');normalizeRow(row);}
    });
    page.querySelectorAll('.dl-v4-comment-actions .dl-v4-reactions').forEach(normalizeRow);
    page.querySelectorAll('.reply-toggle').forEach(b=>{b.setAttribute('data-dl-no-icon','true');cleanIconChildren(b);});
  }

  async function toggle(kind,id,emoji){
    const c=core();if(!c?.session?.())return login();if(busy)return;busy=true;
    const state=c.getState(),me=c.uid(),key=kind==='comment'?'comment_id':'post_id';
    const existing=state.reactions.find(r=>r[key]===id&&r.author_id===me&&r.emoji===emoji);
    try{
      if(existing){
        await c.api(`dlavie_craft_community_reactions?${key}=eq.${encodeURIComponent(id)}&author_id=eq.${encodeURIComponent(me)}&emoji=eq.${encodeURIComponent(emoji)}`,{method:'DELETE',write:true});
        const index=state.reactions.indexOf(existing);if(index>=0)state.reactions.splice(index,1);
      }else{
        const payload={post_id:kind==='post'?id:null,comment_id:kind==='comment'?id:null,author_id:me,emoji};
        await c.api('dlavie_craft_community_reactions',{method:'POST',write:true,body:JSON.stringify(payload)});
        state.reactions.push({id:`local-v8-${Date.now()}`,...payload,created_at:new Date().toISOString()});
      }
      c.scheduleDOM?.();setTimeout(()=>{c.load?.(true)?.then(()=>c.scheduleDOM?.()).catch(()=>{});},240);
    }catch(err){c.toast?.(`Reaction gagal: ${err.message}`);}finally{busy=false;}
  }

  function resolveTarget(button){
    const row=button.closest('.dl-v4-reactions');if(!row)return null;
    const kind=row.dataset.kind==='comment'?'comment':'post';
    const id=row.dataset.targetId||row.closest('[data-dl-comment-id]')?.dataset.dlCommentId||row.closest('[data-dl-post-id]')?.dataset.dlPostId;
    return id?{kind,id}:null;
  }
  function closePicker(){document.querySelector('.dl-v8-picker-scrim')?.remove();document.querySelector('.dl-v8-picker')?.remove();document.body.classList.remove('dl-v8-picker-open');}
  function openPicker(button){
    const target=resolveTarget(button);if(!target)return;if(!core()?.session?.())return login();closePicker();
    const scrim=document.createElement('div');scrim.className='dl-v8-picker-scrim';scrim.onclick=closePicker;
    const picker=document.createElement('section');picker.className='dl-v8-picker';picker.setAttribute('role','dialog');picker.setAttribute('aria-modal','true');
    picker.innerHTML='<header><div><strong>Pilih reaction</strong><small>Reaction ala Discord · satu emoji per jenis</small></div><button type="button" data-close data-dl-no-icon="true">×</button></header><label><span>Cari</span><input type="search" placeholder="Cari kategori atau emoji…"></label><div class="dl-v8-emoji-list"></div>';
    const list=picker.querySelector('.dl-v8-emoji-list'),search=picker.querySelector('input');
    const draw=q=>{list.replaceChildren();const needle=(q||'').trim().toLowerCase();EMOJI.forEach(([label,items])=>{const filtered=needle?items.filter(e=>e.includes(needle)):items;if(needle&&!label.toLowerCase().includes(needle)&&!filtered.length)return;const section=document.createElement('section'),title=document.createElement('small'),grid=document.createElement('div');title.textContent=label;(needle&&label.toLowerCase().includes(needle)?items:filtered).forEach(emoji=>{const b=document.createElement('button');b.type='button';b.textContent=emoji;b.className='dl-v8-emoji';b.setAttribute('data-dl-no-icon','true');b.onclick=()=>{closePicker();toggle(target.kind,target.id,emoji);};grid.append(b);});section.append(title,grid);list.append(section);});};
    draw('');search.oninput=()=>draw(search.value);picker.querySelector('[data-close]').onclick=closePicker;
    document.body.append(scrim,picker);document.body.classList.add('dl-v8-picker-open');setTimeout(()=>search.focus({preventScroll:true}),80);
  }

  function enhance(page){if(!page?.isConnected)return;page.classList.add('dl-reaction-ui-v8');cleanLegacy(page);document.querySelector('.dl-v4-picker')?.remove();}
  function schedule(page=document.querySelector(PAGE)){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;enhance(page);});}
  function attach(page){observer?.disconnect();observer=new MutationObserver(records=>{if(records.some(r=>{const t=r.target?.nodeType===1?r.target:r.target?.parentElement;return !t?.closest?.('.dl-v8-picker,.dl-v4-reactions');}))schedule(page);});observer.observe(page,{childList:true,subtree:true});schedule(page);}
  function route(){if(!ROUTE.test(location.hash)){observer?.disconnect();observer=null;closePicker();return;}let tries=0;const wait=()=>{const page=document.querySelector(PAGE);if(page)return attach(page);if(tries++<40)setTimeout(wait,90);};wait();}

  document.addEventListener('click',e=>{
    if(!ROUTE.test(location.hash))return;
    const add=e.target.closest?.('.dl-v4-react-add');
    if(add){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openPicker(add);return;}
  },true);
  window.addEventListener('hashchange',route);window.addEventListener('pageshow',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();