(() => {
  'use strict';

  const PAGE='.community-page.community-v2';
  const ROUTE=/#\/community(?:$|[/?])/;
  const CHOICES=[
    {id:'agree',label:'Setuju',mark:'✓'},
    {id:'natural',label:'Natural',mark:'◆'},
    {id:'disagree',label:'Tidak setuju',mark:'×'}
  ];
  let votes=[];
  let observer=null,pageRef=null,raf=0,poll=0,loading=false,busy='';
  const core=()=>window.__DLAVIE_COMMUNITY_V4__;
  const button=(label,cls='')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.setAttribute('data-dl-no-icon','true');return b;};
  const login=()=>(document.getElementById('dl-shell-account-entry')||document.getElementById('dl-account-entry'))?.click();

  async function load(){
    if(loading||!core())return;loading=true;
    try{votes=await core().api('dlavie_craft_community_feedback_votes?select=id,post_id,user_id,choice,created_at,updated_at&order=created_at.asc')||[];}
    catch(e){console.warn('[Feedback votes]',e.message);}
    finally{loading=false;}
  }

  function activeForum(page){
    const st=core()?.getState?.();if(!st)return null;
    const name=page.querySelector('.active-forum-head h2')?.textContent?.trim()||page.querySelector('.forum-sidebar nav button.active strong')?.textContent?.trim();
    return st.forums.find(f=>f.name===name)||null;
  }
  function counts(postId){
    const result={agree:0,natural:0,disagree:0};
    votes.filter(v=>v.post_id===postId).forEach(v=>{if(v.choice in result)result[v.choice]++;});
    return result;
  }
  function mine(postId){const me=core()?.uid?.();return votes.find(v=>v.post_id===postId&&v.user_id===me)||null;}

  async function vote(postId,choice){
    if(!core()?.session?.())return login();
    const me=core().uid(),existing=mine(postId);if(!me||busy||existing?.choice===choice)return;
    busy=postId;render(document.querySelector(PAGE));
    try{
      if(existing){
        await core().api(`dlavie_craft_community_feedback_votes?post_id=eq.${encodeURIComponent(postId)}&user_id=eq.${encodeURIComponent(me)}`,{method:'PATCH',write:true,body:JSON.stringify({choice,updated_at:new Date().toISOString()})});
        existing.choice=choice;existing.updated_at=new Date().toISOString();
      }else{
        await core().api('dlavie_craft_community_feedback_votes',{method:'POST',write:true,body:JSON.stringify({post_id:postId,user_id:me,choice})});
        votes.push({id:`local-${Date.now()}`,post_id:postId,user_id:me,choice,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
      }
      core().toast?.(`Vote ${CHOICES.find(c=>c.id===choice)?.label||choice} tersimpan`);
      document.dispatchEvent(new CustomEvent('dlavie:community-activity',{detail:{type:'feedback-vote'}}));
      schedule();setTimeout(async()=>{await load();schedule();},450);
    }catch(e){core().toast?.(`Vote gagal: ${e.message}`);await load();schedule();}
    finally{busy='';schedule();}
  }

  function panel(postId){
    const wrap=document.createElement('div');wrap.className='dl-feedback-votes';wrap.dataset.postId=postId;
    const c=counts(postId),current=mine(postId);
    const head=document.createElement('div');head.className='dl-feedback-vote-head';head.innerHTML='<strong>Bagaimana menurutmu?</strong><span>Satu akun · satu pilihan</span>';wrap.append(head);
    const grid=document.createElement('div');grid.className='dl-feedback-vote-grid';
    CHOICES.forEach(choice=>{const b=button('',`dl-feedback-vote choice-${choice.id}${current?.choice===choice.id?' active':''}`);b.disabled=busy===postId;b.setAttribute('aria-pressed',String(current?.choice===choice.id));b.setAttribute('aria-label',`${choice.label}, ${c[choice.id]} vote`);const mark=document.createElement('span'),copy=document.createElement('span'),num=document.createElement('b');mark.className='dl-feedback-vote-mark';mark.textContent=choice.mark;copy.textContent=choice.label;num.textContent=String(c[choice.id]);b.append(mark,copy,num);b.onclick=()=>vote(postId,choice.id);grid.append(b);});
    wrap.append(grid);return wrap;
  }

  function render(page){
    if(!page)return;const forum=activeForum(page);page.classList.toggle('dl-feedback-mode',forum?.forum_type==='feedback');if(forum?.forum_type!=='feedback')return;
    const st=core()?.getState?.();if(!st)return;
    const posts=st.posts.filter(p=>p.forum_id===forum.id),entries=[...page.querySelectorAll('.typed-feed > .community-entry')];
    entries.forEach((entry,i)=>{
      const postId=entry.dataset.dlPostId||posts[i]?.id;if(!postId)return;
      entry.dataset.dlFeedbackPostId=postId;
      entry.querySelectorAll('.reaction-area,.dl-v4-reactions,.reply-toggle').forEach(n=>n.setAttribute('aria-hidden','true'));
      const host=entry.querySelector('.idea-copy')||entry;
      const old=host.querySelector(':scope > .dl-feedback-votes');
      const sig=JSON.stringify([mine(postId)?.choice||'',...Object.values(counts(postId)),busy===postId]);
      if(old?.dataset.sig===sig)return;
      old?.remove();const next=panel(postId);next.dataset.sig=sig;host.append(next);
    });
  }
  function schedule(page=document.querySelector(PAGE)){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(page?.isConnected)render(page);});}
  function startPoll(){clearInterval(poll);poll=setInterval(async()=>{const page=document.querySelector(PAGE);if(!page||activeForum(page)?.forum_type!=='feedback')return;await load();schedule(page);},8000);}
  function attach(page){if(pageRef===page){schedule(page);return;}observer?.disconnect();pageRef=page;load().then(()=>schedule(page));observer=new MutationObserver(records=>{const meaningful=records.some(r=>{const t=r.target?.nodeType===1?r.target:r.target?.parentElement;return !t?.closest?.('.dl-feedback-votes');});if(meaningful)schedule(page);});observer.observe(page,{childList:true,subtree:true});startPoll();}
  function route(){if(!ROUTE.test(location.hash)){observer?.disconnect();observer=null;pageRef=null;clearInterval(poll);return;}let n=0;const wait=()=>{const p=document.querySelector(PAGE);if(p)return attach(p);if(n++<30)setTimeout(wait,80+n*8);};wait();}

  window.addEventListener('hashchange',route);window.addEventListener('popstate',route);window.addEventListener('pageshow',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();