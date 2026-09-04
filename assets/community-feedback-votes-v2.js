(() => {
  'use strict';

  const ROUTE=/#\/community(?:$|[/?])/;
  const PAGE='.community-page.community-v2';
  const CHOICES=[
    {id:'agree',label:'Setuju',mark:'✓'},
    {id:'natural',label:'Natural',mark:'◆'},
    {id:'disagree',label:'Tidak setuju',mark:'×'}
  ];
  let votes=[],observer=null,raf=0,poll=0,busy='',loading=false;
  const core=()=>window.__DLAVIE_COMMUNITY_V4__;
  const login=()=>(document.getElementById('dl-shell-account-entry')||document.getElementById('dl-account-entry'))?.click();
  const button=(label,cls='')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.setAttribute('data-dl-no-icon','true');return b;};

  function feedbackForum(page){
    const state=core()?.getState?.();if(!state)return null;
    const activeName=page.querySelector('.active-forum-head h2')?.textContent?.trim()||page.querySelector('.forum-sidebar nav button.active strong')?.textContent?.trim()||'';
    let forum=state.forums.find(f=>f.name===activeName);
    if(forum?.forum_type==='feedback')return forum;
    const text=(activeName+' '+(page.querySelector('.active-forum-head')?.textContent||'')+' '+(page.querySelector('button[type="submit"]')?.textContent||'')).toLowerCase();
    const looksFeedback=/saran|ide|feedback/.test(text)||!!page.querySelector('.feed-feedback');
    if(!looksFeedback)return null;
    return state.forums.find(f=>f.forum_type==='feedback')||null;
  }
  async function load(){
    if(loading||!core())return;loading=true;
    try{votes=await core().api('dlavie_craft_community_feedback_votes?select=id,post_id,user_id,choice,created_at,updated_at&order=created_at.asc')||[];}
    catch(e){console.warn('[Feedback votes v2]',e.message);}finally{loading=false;}
  }
  function counts(postId){const out={agree:0,natural:0,disagree:0};votes.filter(v=>v.post_id===postId).forEach(v=>{if(v.choice in out)out[v.choice]++;});return out;}
  function mine(postId){const me=core()?.uid?.();return votes.find(v=>v.post_id===postId&&v.user_id===me)||null;}
  async function vote(postId,choice){
    const c=core();if(!c?.session?.())return login();const me=c.uid(),existing=mine(postId);if(!me||busy||existing?.choice===choice)return;
    busy=postId;schedule();
    try{
      if(existing){
        await c.api(`dlavie_craft_community_feedback_votes?post_id=eq.${encodeURIComponent(postId)}&user_id=eq.${encodeURIComponent(me)}`,{method:'PATCH',write:true,body:JSON.stringify({choice,updated_at:new Date().toISOString()})});existing.choice=choice;existing.updated_at=new Date().toISOString();
      }else{
        await c.api('dlavie_craft_community_feedback_votes',{method:'POST',write:true,body:JSON.stringify({post_id:postId,user_id:me,choice})});votes.push({id:`local-v2-${Date.now()}`,post_id:postId,user_id:me,choice,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
      }
      c.toast?.(`Vote ${CHOICES.find(x=>x.id===choice)?.label||choice} tersimpan`);document.dispatchEvent(new CustomEvent('dlavie:community-activity',{detail:{type:'feedback-vote'}}));
      setTimeout(async()=>{await load();schedule();},350);
    }catch(err){c.toast?.(`Vote gagal: ${err.message}`);await load();}finally{busy='';schedule();}
  }
  function build(postId){
    const wrap=document.createElement('section');wrap.className='dl-feedback-v2-votes';wrap.dataset.postId=postId;
    const c=counts(postId),current=mine(postId);wrap.innerHTML='<header><div><strong>Vote ide ini</strong><small>Pilih satu pendapat. Kamu bisa menggantinya kapan saja.</small></div><span>1 akun · 1 vote</span></header>';
    const grid=document.createElement('div');grid.className='dl-feedback-v2-grid';
    CHOICES.forEach(choice=>{const b=button('',`dl-feedback-v2-choice choice-${choice.id}${current?.choice===choice.id?' active':''}`);b.disabled=busy===postId;b.setAttribute('aria-pressed',String(current?.choice===choice.id));b.innerHTML=`<i>${choice.mark}</i><span>${choice.label}</span><b>${c[choice.id]}</b>`;b.onclick=()=>vote(postId,choice.id);grid.append(b);});wrap.append(grid);return wrap;
  }
  function fixComposer(page){
    [...page.querySelectorAll('small,p,span')].forEach(el=>{const t=(el.textContent||'').trim();if(/member dapat memberi dukungan dan reaction/i.test(t))el.textContent='Member dapat memilih Setuju, Natural, atau Tidak setuju.';});
  }
  function render(page){
    if(!page?.isConnected)return;const forum=feedbackForum(page);page.classList.toggle('dl-feedback-v2-mode',!!forum);if(!forum)return;
    fixComposer(page);const state=core()?.getState?.();if(!state)return;
    const posts=state.posts.filter(p=>p.forum_id===forum.id),entries=[...page.querySelectorAll('.typed-feed > .community-entry')];
    entries.forEach((entry,index)=>{
      const postId=entry.dataset.dlPostId||posts[index]?.id;if(!postId)return;entry.dataset.dlFeedbackPostId=postId;entry.classList.add('dl-feedback-v2-entry');
      entry.querySelectorAll('.entry-actions,.reaction-area,.reaction-bar,.dl-v4-reactions,.reply-toggle,.post-thread').forEach(n=>{n.style.setProperty('display','none','important');n.setAttribute('aria-hidden','true');});
      const sig=JSON.stringify([mine(postId)?.choice||'',...Object.values(counts(postId)),busy===postId]);let panel=entry.querySelector(':scope > .dl-feedback-v2-votes, .idea-copy > .dl-feedback-v2-votes');
      if(panel?.dataset.sig===sig)return;panel?.remove();panel=build(postId);panel.dataset.sig=sig;
      const host=entry.querySelector('.idea-copy')||entry;host.append(panel);
    });
  }
  function schedule(page=document.querySelector(PAGE)){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;render(page);});}
  function attach(page){observer?.disconnect();load().then(()=>schedule(page));observer=new MutationObserver(records=>{if(records.some(r=>{const t=r.target?.nodeType===1?r.target:r.target?.parentElement;return !t?.closest?.('.dl-feedback-v2-votes');}))schedule(page);});observer.observe(page,{childList:true,subtree:true});clearInterval(poll);poll=setInterval(async()=>{if(feedbackForum(page)){await load();schedule(page);}},7000);schedule(page);}
  function route(){if(!ROUTE.test(location.hash)){observer?.disconnect();observer=null;clearInterval(poll);return;}let tries=0;const wait=()=>{const p=document.querySelector(PAGE);if(p)return attach(p);if(tries++<40)setTimeout(wait,90);};wait();}
  window.addEventListener('hashchange',route);window.addEventListener('pageshow',route);window.addEventListener('popstate',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();