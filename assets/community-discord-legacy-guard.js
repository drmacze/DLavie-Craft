(() => {
  'use strict';
  const ROUTE=/#\/community(?:$|[/?])/;
  let busy=false;

  async function toggle(kind,id,emoji){
    const core=window.__DLAVIE_COMMUNITY_V4__;
    if(!core?.session?.())return;
    if(busy)return;
    const me=core.uid(),state=core.getState(),key=kind==='post'?'post_id':'comment_id';
    if(!me||!state)return;
    const current=state.reactions.find(r=>r[key]===id&&r.author_id===me&&r.emoji===emoji);
    busy=true;
    try{
      if(current){
        await core.api(`dlavie_craft_community_reactions?${key}=eq.${encodeURIComponent(id)}&author_id=eq.${encodeURIComponent(me)}&emoji=eq.${encodeURIComponent(emoji)}`,{method:'DELETE',write:true});
        state.reactions=state.reactions.filter(r=>r!==current);
      }else{
        const payload={post_id:kind==='post'?id:null,comment_id:kind==='comment'?id:null,author_id:me,emoji};
        await core.api('dlavie_craft_community_reactions',{method:'POST',write:true,body:JSON.stringify(payload)});
        state.reactions.push({id:`legacy-guard-${Date.now()}`,...payload,created_at:new Date().toISOString()});
      }
      core.scheduleDOM?.();
      setTimeout(()=>core.load?.(true).then(()=>core.scheduleDOM?.()).catch(()=>{}),180);
    }catch(error){core.toast?.(`Reaction gagal: ${error.message}`);}finally{busy=false;}
  }

  document.addEventListener('click',event=>{
    if(!ROUTE.test(location.hash))return;
    const target=event.target;
    const idea=target.closest?.('.idea-vote');
    const chip=target.closest?.('.reaction-button');
    const grid=target.closest?.('.emoji-grid button');
    if(!idea&&!chip&&!grid)return;
    const entry=target.closest?.('.community-entry');
    const postId=entry?.dataset?.dlPostId;
    if(!postId)return;
    let emoji='💡';
    if(chip)emoji=chip.querySelector('span')?.textContent?.trim()||chip.textContent?.trim()?.split(/\s+/)?.[0]||'👍';
    if(grid)emoji=grid.textContent?.trim()||'👍';
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    toggle('post',postId,emoji);
  },true);
})();