(() => {
  'use strict';
  const PAGE='.community-page.community-v2';
  const ROUTE=/#\/community(?:$|[/?])/;
  let profiles=[];
  let loading=false;
  let observer=null;
  let pageRef=null;
  let raf=0;

  const core=()=>window.__DLAVIE_COMMUNITY_V4__;
  const collector=()=>window.__DLAVIE_COLLECTOR__;
  const clean=(v='')=>String(v).replace(/\s+/g,' ').trim().toLowerCase();

  async function loadProfiles(force=false){
    if(loading)return;
    if(profiles.length&&!force)return;
    const c=core();if(!c?.api)return;
    loading=true;
    try{
      profiles=await c.api('dlavie_craft_community_leaderboard?select=user_id,display_name,xp,level,avatar_key,community_role,badge,post_count,comment_count,reactions_received&order=xp.desc')||[];
    }catch(e){console.warn('[Community polish v35]',e?.message||e);}finally{loading=false;}
  }

  function findProfileForCard(card){
    const text=clean(card.textContent);
    return profiles.find(p=>p.display_name&&text.includes(clean(p.display_name)))||null;
  }

  function findAvatarSlot(card,profile){
    const nameNode=[...card.querySelectorAll('strong,b,h3,h4,span')].find(n=>clean(n.textContent)===clean(profile.display_name));
    if(!nameNode)return null;
    const candidates=[...card.querySelectorAll('div,span')].filter(el=>{
      if(el.contains(nameNode)||nameNode.contains(el))return false;
      if(el.closest('.dl-rank-avatar-v35'))return false;
      const txt=clean(el.textContent);
      if(txt.length>2)return false;
      const r=el.getBoundingClientRect();
      return r.width>=36&&r.width<=82&&r.height>=36&&r.height<=82;
    });
    return candidates.sort((a,b)=>{
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect(),nr=nameNode.getBoundingClientRect();
      return Math.abs(ar.top-nr.top)-Math.abs(br.top-nr.top);
    })[0]||null;
  }

  function progressPercent(profile){
    const level=Math.max(1,Number(profile.level)||1),xp=Math.max(0,Number(profile.xp)||0);
    if(level>=100)return 100;
    const lower=(level-1)*1000,upper=level*1000;
    return Math.max(2,Math.min(100,((xp-lower)/(upper-lower))*100));
  }

  function installProgress(card,profile){
    let bar=card.querySelector('.dl-rank-progress-v35');
    if(!bar){
      const xpText=[...card.querySelectorAll('span,small,div')].find(n=>/\b\d[\d.,]*\s*XP\b/i.test(n.textContent||''));
      const levelText=[...card.querySelectorAll('span,small,div')].find(n=>/\bLevel\s*\d+\b/i.test(n.textContent||''));
      const anchor=xpText?.parentElement||levelText?.parentElement;
      if(!anchor)return;
      bar=document.createElement('div');bar.className='dl-rank-progress-v35';bar.innerHTML='<i></i>';
      anchor.append(bar);
    }
    bar.style.setProperty('--dl-rank-progress',`${progressPercent(profile).toFixed(2)}%`);
    bar.setAttribute('aria-label',`Progress level ${profile.level}`);
  }

  function decorateRanks(page){
    if(page.dataset.dlForumType!=='levels')return;
    const likely=[...page.querySelectorAll('article,.community-entry,section>div')].filter(el=>profiles.some(p=>p.display_name&&clean(el.textContent).includes(clean(p.display_name))));
    likely.forEach(card=>{
      const profile=findProfileForCard(card);if(!profile)return;
      card.dataset.dlRankCardV35='true';
      const slot=findAvatarSlot(card,profile);
      const c=collector();
      if(slot&&c?.avatarMarkup){
        slot.classList.add('dl-rank-avatar-v35');
        slot.dataset.avatarKey=profile.avatar_key||'creeper';
        const signature=`${profile.user_id}:${profile.avatar_key||'creeper'}`;
        if(slot.dataset.dlAvatarSignature!==signature){
          slot.dataset.dlAvatarSignature=signature;
          slot.innerHTML=c.avatarMarkup(profile.avatar_key||'creeper','dl-rank-avatar-face-v35');
        }
      }
      installProgress(card,profile);
    });
  }

  function decorateShowcase(page){
    if(page.dataset.dlForumType!=='showcase')return;
    page.querySelectorAll('.typed-feed>.community-entry').forEach(entry=>entry.classList.add('dl-showcase-polished-v35'));
  }

  function decorateFeedback(page){
    if(page.dataset.dlForumType!=='feedback'&&!page.classList.contains('dl-community-v10-feedback'))return;
    page.querySelectorAll('.dl-v10-vote-panel').forEach(panel=>panel.classList.add('dl-vote-polished-v35'));
  }

  function render(page=document.querySelector(PAGE)){
    if(!page?.isConnected)return;
    decorateShowcase(page);decorateFeedback(page);decorateRanks(page);
  }
  function schedule(page=document.querySelector(PAGE)){
    if(raf)return;raf=requestAnimationFrame(()=>{raf=0;render(page);});
  }
  function settle(page){schedule(page);setTimeout(()=>schedule(page),80);setTimeout(()=>schedule(page),220);setTimeout(()=>schedule(page),500);}
  function attach(page){
    if(pageRef===page){settle(page);return;}
    observer?.disconnect();pageRef=page;
    loadProfiles().then(()=>settle(page));
    observer=new MutationObserver(records=>{
      const meaningful=records.some(r=>{
        const t=r.target?.nodeType===1?r.target:r.target?.parentElement;
        return !t?.closest?.('.dl-rank-avatar-v35,.dl-rank-progress-v35');
      });
      if(meaningful)schedule(page);
    });
    observer.observe(page,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-dl-forum-type']});
    page.addEventListener('click',e=>{if(e.target.closest('.forum-sidebar nav button'))setTimeout(()=>loadProfiles(true).then(()=>settle(page)),120);},{capture:true});
  }
  function route(){
    if(!ROUTE.test(location.hash)){observer?.disconnect();observer=null;pageRef=null;return;}
    let n=0;const wait=()=>{const p=document.querySelector(PAGE);if(p)return attach(p);if(n++<40)setTimeout(wait,80+n*7);};wait();
  }
  document.addEventListener('dlavie:community-hydrate',route);
  document.addEventListener('dlavie:collector-profile-changed',()=>loadProfiles(true).then(()=>schedule()));
  window.addEventListener('hashchange',route);window.addEventListener('pageshow',route);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();
