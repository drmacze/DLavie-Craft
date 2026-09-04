(() => {
  'use strict';

  const ROUTE=/#\/community(?:$|[/?])/;
  const STORE='dlavie-community-level-v1:';
  let poll=0,busy=false;
  const collector=()=>window.__DLAVIE_COLLECTOR__;

  function particle(role,i){
    const n=document.createElement('i');n.className=`dl-levelup-card-particle role-${role}`;n.style.setProperty('--x',`${Math.round(Math.random()*100)}vw`);n.style.setProperty('--y',`${Math.round(Math.random()*100)}vh`);n.style.setProperty('--dx',`${Math.round((Math.random()-.5)*480)}px`);n.style.setProperty('--dy',`${Math.round((Math.random()-.5)*420)}px`);n.style.setProperty('--r',`${Math.round((Math.random()-.5)*900)}deg`);n.style.setProperty('--s',`${.45+Math.random()*1.2}`);n.style.setProperty('--d',`${Math.random()*.55}s`);n.dataset.i=String(i);return n;
  }

  function celebrate(oldLevel,profile){
    const c=collector();if(!c)return;document.querySelector('.dl-card-levelup-overlay')?.remove();const role=profile.community_role||'newbie';
    const o=document.createElement('div');o.className=`dl-card-levelup-overlay role-${role}`;o.setAttribute('role','status');o.setAttribute('aria-live','polite');
    const particles=document.createElement('div');particles.className='dl-card-levelup-particles';for(let i=0;i<42;i++)particles.append(particle(role,i));
    const stage=document.createElement('div');stage.className='dl-card-levelup-stage';stage.innerHTML=`<div class="dl-card-levelup-copy"><span>COMMUNITY PROGRESS</span><h1>LEVEL UP!</h1><p>Level ${Math.max(1,Number(oldLevel||1))} → <strong>${Math.max(1,Number(profile.level||1))}</strong></p></div><div class="dl-levelup-card-holder">${c.cardHTML(profile,{levelUp:true})}</div><div class="dl-card-levelup-tip">Collector Card kamu berevolusi mengikuti level.</div>`;
    o.append(particles,stage);document.body.append(o);requestAnimationFrame(()=>o.classList.add('show'));setTimeout(()=>o.classList.add('focus-card'),620);setTimeout(()=>o.classList.add('leaving'),5000);setTimeout(()=>o.remove(),5850);
  }

  async function check(){
    const c=collector();if(busy||!c||!ROUTE.test(location.hash)||!c.session())return;busy=true;
    try{const p=await c.loadBundle(true);if(!p?.card_collected_at)return;const key=STORE+p.user_id,current=Math.max(1,Number(p.level||1)),raw=localStorage.getItem(key),stored=raw===null?null:Number(raw);if(stored===null||!Number.isFinite(stored)){localStorage.setItem(key,String(current));return;}if(current>stored){localStorage.setItem(key,String(current));celebrate(stored,p);}else if(current!==stored)localStorage.setItem(key,String(current));}
    catch(e){console.warn('[Collector level up]',e.message);}finally{busy=false;}
  }

  function afterActivity(){setTimeout(check,850);setTimeout(check,2200);setTimeout(check,4600);}
  function route(){clearInterval(poll);if(!ROUTE.test(location.hash))return;setTimeout(check,700);poll=setInterval(check,6500);}
  document.addEventListener('submit',e=>{if(ROUTE.test(location.hash)&&e.target.closest?.('.community-page'))afterActivity();},true);document.addEventListener('dlavie:community-activity',afterActivity);document.addEventListener('click',e=>{if(!ROUTE.test(location.hash))return;if(e.target.closest?.('.reaction-button,.dl-v4-react-chip,.dl-feedback-vote,.reply-toggle'))afterActivity();},true);
  window.addEventListener('hashchange',route);window.addEventListener('pageshow',route);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();