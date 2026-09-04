(() => {
  'use strict';

  const ROUTE=/#\/community(?:$|[/?])/;
  const STORE='dlavie-community-level-v1:';
  let poll=0,busy=false,lastUid='';
  const core=()=>window.__DLAVIE_COMMUNITY_V4__;

  function block(type,i){
    const n=document.createElement('i');n.className=`dl-level-block type-${type}`;
    n.style.setProperty('--x',`${Math.round(Math.random()*100)}vw`);
    n.style.setProperty('--dx',`${Math.round((Math.random()-.5)*260)}px`);
    n.style.setProperty('--dy',`${Math.round(120+Math.random()*220)}px`);
    n.style.setProperty('--r',`${Math.round((Math.random()-.5)*720)}deg`);
    n.style.setProperty('--s',`${.55+Math.random()*1.15}`);
    n.style.setProperty('--d',`${Math.random()*.75}s`);
    n.style.setProperty('--life',`${1.7+Math.random()*1.5}s`);
    n.dataset.i=String(i);return n;
  }

  function celebrate(oldLevel,newLevel,profile){
    document.querySelector('.dl-levelup-overlay')?.remove();
    const overlay=document.createElement('div');overlay.className='dl-levelup-overlay';overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
    const particles=document.createElement('div');particles.className='dl-level-particles';
    const types=['grass','stone','diamond','emerald','redstone','gold'];
    for(let i=0;i<34;i++)particles.append(block(types[i%types.length],i));
    const card=document.createElement('section');card.className='dl-levelup-card';
    card.innerHTML=`<div class="dl-levelup-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div><span class="dl-levelup-kicker">ACHIEVEMENT UNLOCKED</span><div class="dl-levelup-cube" aria-hidden="true"><i></i><b></b><em></em></div><h2>LEVEL UP!</h2><p>${oldLevel>0?`Level ${oldLevel} → `:''}<strong>Level ${newLevel}</strong></p><div class="dl-levelup-badge"><span>${String(profile?.badge||'Crafter').replace(/[<>]/g,'')}</span><b>${Number(profile?.xp||0).toLocaleString('id-ID')} XP</b></div><small>Aktivitas komunitasmu membuka level baru.</small>`;
    overlay.append(particles,card);document.body.append(overlay);
    requestAnimationFrame(()=>overlay.classList.add('show'));
    setTimeout(()=>overlay.classList.add('leaving'),3900);
    setTimeout(()=>overlay.remove(),4700);
  }

  async function check(){
    if(busy||!ROUTE.test(location.hash)||!core()?.session?.())return;
    const uid=core().uid?.();if(!uid)return;busy=true;
    try{
      const rows=await core().api(`dlavie_craft_community_leaderboard?select=user_id,display_name,xp,level,badge&user_id=eq.${encodeURIComponent(uid)}&limit=1`),profile=rows?.[0];if(!profile)return;
      const key=STORE+uid,current=Math.max(1,Number(profile.level||1)),storedRaw=localStorage.getItem(key),stored=storedRaw===null?null:Number(storedRaw);
      if(stored===null||!Number.isFinite(stored)){localStorage.setItem(key,String(current));lastUid=uid;return;}
      if(current>stored){localStorage.setItem(key,String(current));celebrate(stored,current,profile);}
      else if(current!==stored)localStorage.setItem(key,String(current));
      lastUid=uid;
    }catch(e){console.warn('[Level up]',e.message);}
    finally{busy=false;}
  }

  function scheduleChecks(){setTimeout(check,850);setTimeout(check,2200);setTimeout(check,4800);}
  function route(){clearInterval(poll);if(!ROUTE.test(location.hash))return;check();poll=setInterval(check,6000);}
  document.addEventListener('submit',e=>{if(ROUTE.test(location.hash)&&e.target.closest?.('.community-page'))scheduleChecks();},true);
  document.addEventListener('dlavie:community-activity',scheduleChecks);
  document.addEventListener('click',e=>{if(!ROUTE.test(location.hash))return;if(e.target.closest?.('.reaction-button,.dl-v4-react-chip,.dl-feedback-vote,.reply-toggle'))scheduleChecks();},true);
  window.addEventListener('hashchange',route);window.addEventListener('pageshow',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();