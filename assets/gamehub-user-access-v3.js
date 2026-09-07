(() => {
  'use strict';
  if (window.__DLAVIE_ACCESS_V3__) return;
  window.__DLAVIE_ACCESS_V3__ = true;

  const AUTH_KEY = 'sb-ydaeukhqwishlrjyfktk-auth-token';
  const JAVA_ART = 'data:image/webp;base64,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';
  const BEDROCK_ART = 'data:image/webp;base64,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';
  const DEFAULT_AVATAR = 'data:image/webp;base64,UklGRigDAABXRUJQVlA4IBwDAAAwEwCdASpgAGAAPj0cjUOiIaGUC41UIAPEtIAIq/9Vyxv04/E/kf+Rlnrec/jP+08DT+O4pnycvAG+Ff4Dzt/8D0fP5j7gPcB+S/3z/me4R/IP6T/pvzd41Vk990zNZI5PG9VUYD99NeNrctKDACb2bhM8z1OvYAmtLdQ+kRHIdltfCFvRTQn0a2LCga+49b6v35fAcstwaaj4HLuOzzKmPgAA/t6sB76JLvewZ7fDxExvg33ZGPMQpHS1A238b8ffaangeG+g/UFN//mNfNQXyuAeNtT3+1v5UOAq9G8uq7m6Xi8s5mbql4WfLvSoi4TSfK9bY2ii5CSCDDaLz5pLbHMNd7p+INILlGkBqCGKHzfGwunTMHhUCb2G4T+Tb7cw0t6SlRUqHvnXMN/+f/9fZ8LL4kRFPIGnDb9TffqEPIjArFQ4sotlQ8rdo4RogG4lSmAyuycdq3viwCnXe4/TOXj/1j1aB0Byq2xevfHq4y4gCGgO8gXhnNoZ/SzsUkyITeu4YShBguzzL3RDhqiP7xTzOmNis5ciqVw5RNJeflvviib2VrU6QALTru/VJWO/XVMrRFC6XubUpQaELPOzV7Ca8OE0GGx/mvc/I5TIfxFYyKtIQ47+71sQLv2BdI04rjw1fJOUi6oG43+ZU0+OXcyFNVnHfoOezCA/nppDWHfDzbiqSK6AUxnqj6T/DwvLRkGEyF6Zm5dyb1TFCOxEG04ivSN3MMPnYsQwo6yG/kN/WOU9cp8eJvuQ5rl9NcpNW8TU0EJZOwaM0S0j5hEmjbJym0dE4/x1x6PfGB0sLnpqCDxKPnYbSXl3IbjSMfU+XoyZX+cKTx9u6Lxa3p+8X5Duf6TRjIe9fiZjaKhIt+6kBH6WqXdm+ailDbzB3ynrESq7W5JoCCYgVeRLX+U0kaKkkx5S8lGUyq9MHPoOsruS7jmQwIFb9jX8gcs35//kAhi4+OA/2Vv/3Kf45lce5j5LGPx5PMU4EU8ZGYI7rDRIX4yvxjRVsu6a8DhH/RN7eBT+YwVoDRnfwABoEVlnggZrk0sLd+9JwAAA=';

  function session(){
    try{
      const raw=localStorage.getItem(AUTH_KEY);if(!raw)return null;
      const parsed=JSON.parse(raw),s=parsed?.currentSession||parsed?.session||parsed;
      return s?.access_token&&s?.user?s:null;
    }catch{return null}
  }
  function avatar(){
    const u=session()?.user,m=u?.user_metadata||{};
    return m.avatar_url||m.picture||m.avatar||m.photo_url||DEFAULT_AVATAR;
  }
  function toast(message){
    let el=document.getElementById('dlavie-auth-toast');
    if(!el){el=document.createElement('div');el.id='dlavie-auth-toast';document.body.appendChild(el)}
    el.textContent=message;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2600);
  }
  function openAccount(){
    toast('Masuk atau daftar untuk menggunakan fitur ini.');
    const btn=document.querySelector('#dl-account-entry,#dl-shell-account-entry,#dl-shell-account-entry-mobile');
    if(btn){setTimeout(()=>btn.click(),30);return}
    try{
      const u=new URL(location.href);u.searchParams.set('dlavie','login');history.pushState({dlaviePortal:'login'},'',u.pathname+u.search+(u.hash||'#/'));
      window.dispatchEvent(new PopStateEvent('popstate',{state:history.state}));
    }catch{}
  }

  /* The active Supabase deployment exposes DLavie tables through the api schema.
     Rewrite only the old saved-project requests that still ask for public. */
  const nativeFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    try{
      const url=typeof input==='string'?input:input?.url||'';
      if(url.includes('/rest/v1/dlavie_saved_projects')){
        const baseHeaders=(init&&init.headers)||(typeof Request!=='undefined'&&input instanceof Request?input.headers:undefined);
        const h=new Headers(baseHeaders||{});
        if((h.get('Accept-Profile')||'').toLowerCase()==='public')h.set('Accept-Profile','api');
        if((h.get('Content-Profile')||'').toLowerCase()==='public')h.set('Content-Profile','api');
        if(typeof Request!=='undefined'&&input instanceof Request){input=new Request(input,{headers:h});return nativeFetch(input,init)}
        init=Object.assign({},init||{}, {headers:h});
      }
    }catch{}
    return nativeFetch(input,init);
  };

  function editionArt(value){return value==='java'?JAVA_ART:BEDROCK_ART}
  function polish(){
    const root=document.getElementById('dl-gamehub-root');if(!root)return;
    const s=session(),av=avatar();

    root.querySelectorAll('.gh-launch-card').forEach(card=>{
      const edition=(card.querySelector('.gh-launch-content h1')?.textContent||'').toLowerCase().includes('java')?'java':'bedrock';
      if(!card.querySelector('.gh-edition-badge')){
        const badge=document.createElement('span');badge.className='gh-edition-badge';badge.innerHTML='<img alt="" src="'+editionArt(edition)+'">';card.appendChild(badge);
      }
      const play=card.querySelector('.gh-launch-content .gh-play');
      if(play&&!play.classList.contains('gh-user-avatar')){
        const b=document.createElement('button');b.type='button';b.className='gh-user-avatar';b.dataset.action='profile';b.setAttribute('aria-label',s?'Buka profil':'Masuk ke akun');b.innerHTML='<img alt="Avatar user" src="'+av+'">';play.replaceWith(b);
      }else{
        const img=card.querySelector('.gh-user-avatar img');if(img&&img.src!==av)img.src=av;
      }
    });

    root.querySelectorAll('.gh-edition-card').forEach(card=>{
      const value=card.dataset.value==='java'?'java':'bedrock';
      const mark=card.querySelector('.gh-edition-mark');
      if(mark&&mark.dataset.art!==value){mark.dataset.art=value;mark.innerHTML='<img alt="Minecraft '+(value==='java'?'Java':'Bedrock')+'" src="'+editionArt(value)+'">'}
    });

    root.querySelectorAll('.gh-bottom-nav [data-action="profile"]').forEach(btn=>{
      const svg=btn.querySelector('svg');
      if(svg){const img=document.createElement('img');img.className='gh-nav-profile-avatar';img.alt='';img.src=av;svg.replaceWith(img)}
      else{const img=btn.querySelector('.gh-nav-profile-avatar');if(img)img.src=av}
    });

    if(!s){
      root.querySelectorAll('[data-detail="download"],[data-detail="bookmark"]').forEach(el=>el.classList.add('gh-guest-lock'));
    }
  }

  function isCommunityTarget(t){
    const el=t?.closest?.('a,button,[data-action],[data-go],[data-route]');if(!el)return false;
    const href=(el.getAttribute('href')||'').toLowerCase(),a=(el.dataset.action||'').toLowerCase(),g=(el.dataset.go||'').toLowerCase(),r=(el.dataset.route||'').toLowerCase(),txt=(el.textContent||'').trim().toLowerCase();
    return href.includes('community')||a==='community'||g==='community'||r==='community'||txt==='community'||txt==='komunitas';
  }
  function protectedTarget(t){
    if(!t?.closest)return false;
    if(t.closest('[data-detail="download"],[data-detail="bookmark"],a[download],[data-download],.download-button,.download-btn'))return true;
    const saved=t.closest('.gh-bottom-nav [data-action="library"],.gh-drawer [data-go="library"]');
    if(saved){const text=(saved.textContent||'').toLowerCase(),aria=(saved.getAttribute('aria-label')||'').toLowerCase();if(text.includes('tersimpan')||aria.includes('tersimpan')||aria.includes('project tersimpan'))return true}
    return isCommunityTarget(t);
  }
  document.addEventListener('click',e=>{
    if(session()||!protectedTarget(e.target))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openAccount();
  },true);

  function guardRoute(){
    if(session())return;
    if(/community/i.test(location.hash||'')){
      history.replaceState(history.state,'',location.pathname+location.search+'#/');
      openAccount();
    }
  }

  let queued=false;
  const mo=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;polish()})});
  function start(){mo.observe(document.body,{childList:true,subtree:true});polish();guardRoute()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('hashchange',()=>{guardRoute();setTimeout(polish,30)});
  window.addEventListener('pageshow',()=>setTimeout(polish,20));
  window.addEventListener('storage',e=>{if(e.key===AUTH_KEY)setTimeout(polish,40)});
  document.addEventListener('dlavie:auth-changed',()=>setTimeout(polish,40));
})();
