(() => {
  'use strict';

  const SB_URL='https://ydaeukhqwishlrjyfktk.supabase.co';
  const SB_KEY='sb_publishable_XNXU6SVeM-D477Ymy1ORsw_4hCHOll9';
  const SESSION_KEY='sb-ydaeukhqwishlrjyfktk-auth-token';
  const API_PROFILE='api';
  const PORTAL_PARAM='dlavie';

  const AVATARS={
    creeper:{label:'Creeper'}, steve:{label:'Steve'}, alex:{label:'Alex'}, enderman:{label:'Enderman'},
    zombie:{label:'Zombie'}, skeleton:{label:'Skeleton'}, piglin:{label:'Piglin'}, bee:{label:'Bee'},
    slime:{label:'Slime'}, axolotl:{label:'Axolotl'}
  };
  const ROLES={
    builder:{label:'Builder',glyph:'▦',tag:'Bangun sesuatu yang luar biasa',desc:'Untuk crafter yang hidup dari detail, struktur, dan desain.'},
    miner:{label:'Miner',glyph:'♦',tag:'Temukan resource terbaik',desc:'Untuk pemain yang suka eksplorasi bawah tanah dan progression.'},
    explorer:{label:'Explorer',glyph:'✦',tag:'Selalu mencari tempat baru',desc:'Untuk petualang, penjelajah map, biome, dan discovery.'},
    newbie:{label:'Newbie',glyph:'■',tag:'Mulai perjalanan pertamamu',desc:'Role santai untuk member baru yang masih menemukan gaya bermain.'},
    pvp:{label:'PvP',glyph:'✕',tag:'Siap untuk duel',desc:'Untuk pemain kompetitif, combat, strategy, dan challenge.'}
  };
  const GENDERS={male:'Male',female:'Female'};
  let bundleCache=null,bundleAt=0,onboardingOpen=false,observer=null,raf=0,profileRenderBusy=false;

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function session(){try{const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');return s?.access_token?s:null;}catch{return null;}}
  function uid(){const s=session();if(s?.user?.id)return s.user.id;const token=s?.access_token;if(!token)return null;try{const p=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(escape(atob(p.padEnd(Math.ceil(p.length/4)*4,'=')))))?.sub||null;}catch{return null;}}
  function headers(write=false){const s=session();const h={apikey:SB_KEY,Authorization:`Bearer ${s?.access_token||SB_KEY}`,'Accept-Profile':API_PROFILE,Accept:'application/json'};if(write){h['Content-Type']='application/json';h['Content-Profile']=API_PROFILE;h.Prefer='return=representation';}return h;}
  async function api(path,options={}){const r=await fetch(`${SB_URL}/rest/v1/${path}`,{...options,headers:{...headers(!!options.write),...(options.headers||{})}});const t=await r.text();let body=null;if(t){try{body=JSON.parse(t);}catch{body=t;}}if(!r.ok)throw new Error(body?.message||body?.details||body?.hint||(typeof body==='string'?body:'')||`Server ${r.status}`);return body;}

  function tier(level){const n=Number(level||1);if(n>=20)return'legendary';if(n>=15)return'mythic';if(n>=10)return'holo';if(n>=5)return'enchanted';return'base';}
  function avatarMarkup(key,cls=''){const safe=AVATARS[key]?key:'creeper';return `<span class="dl-mc-face av-${safe} ${cls}" role="img" aria-label="Avatar ${esc(AVATARS[safe].label)}"><i class="eye e1"></i><i class="eye e2"></i><i class="mouth"></i><i class="extra"></i></span>`;}
  function roleMarkup(role,compact=false){const r=ROLES[role];if(!r)return'';return `<span class="dl-role-badge role-${role}${compact?' compact':''}" data-role="${role}"><i>${r.glyph}</i><b>${r.label}</b><em></em></span>`;}
  function genderLabel(value){return GENDERS[value]||'—';}

  function cardHTML(profile,options={}){
    const role=ROLES[profile?.community_role]?profile.community_role:'newbie';
    const r=ROLES[role];
    const level=Math.max(1,Number(profile?.level||1));
    const xp=Math.max(0,Number(profile?.xp||0));
    const avatar=AVATARS[profile?.avatar_key]?profile.avatar_key:'creeper';
    const name=esc(profile?.display_name||'Crafter');
    const member=esc(profile?.member_code||'DLV-UNCLAIMED');
    const badge=esc(profile?.badge||'New Crafter');
    return `<article class="dl-collector-card role-${role} tier-${tier(level)}${options.levelUp?' is-level-up':''}" data-level="${level}">
      <div class="dl-collector-card-inner">
        ${options.levelUp?'<div class="dl-card-levelup-title">LEVEL UP!</div>':''}
        <div class="dl-card-art">
          <div class="dl-card-world-grid" aria-hidden="true"></div>
          <div class="dl-card-avatar-wrap">${avatarMarkup(avatar,'dl-card-avatar')}</div>
          <div class="dl-card-role-emblem" aria-hidden="true"><span>${r.glyph}</span></div>
          <div class="dl-card-sparks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div class="dl-card-name-row"><h3>${name}</h3><div class="dl-card-level-heart" aria-label="Level ${level}"><span>${level}</span></div></div>
        <div class="dl-card-info">
          <section class="dl-card-facts"><strong>PROFILE</strong><p><span>ROLE</span>${r.label}</p><p><span>GENDER</span>${genderLabel(profile?.gender)}</p><p><span>BADGE</span>${badge}</p></section>
          <section class="dl-card-stats"><p><span>ID</span><b>${member}</b></p><p><span>XP</span><b>${xp.toLocaleString('id-ID')}</b></p><p><span>CLASS</span><b>${tier(level).toUpperCase()}</b></p></section>
        </div>
        <div class="dl-card-watermark">DLavie Craft</div>
        <div class="dl-card-holo" aria-hidden="true"></div>
      </div>
    </article>`;
  }

  async function loadBundle(force=false){
    const me=uid();if(!me)return null;if(!force&&bundleCache&&bundleCache.user_id===me&&Date.now()-bundleAt<5000)return bundleCache;
    const [profiles,levels]=await Promise.all([
      api(`dlavie_craft_community_profiles?select=user_id,display_name,bio,created_at,updated_at,avatar_key,gender,community_role,member_code,onboarding_completed_at,card_collected_at&user_id=eq.${encodeURIComponent(me)}&limit=1`),
      api(`dlavie_craft_community_leaderboard?select=user_id,display_name,bio,xp,level,badge,created_at,updated_at,post_count,showcase_count,comment_count,reactions_given,reactions_received,avatar_key,gender,community_role,member_code,onboarding_completed_at,card_collected_at&user_id=eq.${encodeURIComponent(me)}&limit=1`)
    ]);
    const profile=profiles?.[0];if(!profile)return null;bundleCache={...profile,...(levels?.[0]||{}),user_id:me};bundleAt=Date.now();return bundleCache;
  }
  function complete(p){return !!(p?.gender&&p?.community_role&&p?.onboarding_completed_at&&p?.card_collected_at);}
  async function patchMe(payload){const me=uid();if(!me)throw new Error('Sesi akun tidak tersedia.');const rows=await api(`dlavie_craft_community_profiles?user_id=eq.${encodeURIComponent(me)}`,{method:'PATCH',write:true,body:JSON.stringify({...payload,updated_at:new Date().toISOString()})});bundleCache=null;bundleAt=0;return rows?.[0]||null;}

  function makeButton(label,cls=''){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.setAttribute('data-dl-no-icon','true');return b;}
  function openOnboarding(profile){
    if(onboardingOpen||!profile||location.hash.startsWith('#/console'))return;onboardingOpen=true;document.querySelector('.dl-identity-onboarding')?.remove();
    const overlay=document.createElement('div');overlay.className='dl-identity-onboarding';overlay.innerHTML='<section class="dl-onboarding-shell" role="dialog" aria-modal="true"><header><div class="dl-onboarding-brand"><span class="dl-onboarding-cube"></span><div><strong>DLavie ID</strong><small>Collector Profile Setup</small></div></div><div class="dl-onboarding-steps"><i class="active"></i><i></i><i></i></div></header><main></main></section>';document.body.append(overlay);document.body.classList.add('dl-onboarding-open');
    const state={step:1,gender:profile.gender||'',role:profile.community_role||''};
    const main=overlay.querySelector('main'),steps=[...overlay.querySelectorAll('.dl-onboarding-steps i')];
    const setStep=n=>{state.step=n;steps.forEach((s,i)=>s.classList.toggle('active',i<n));draw();};
    const draw=()=>{
      if(state.step===1){main.innerHTML=`<div class="dl-onboarding-copy"><span>STEP 01 · IDENTITY</span><h2>Pilih gender profile</h2><p>Ini menjadi bagian dari Collector Card kamu dan tidak memengaruhi role komunitas.</p></div><div class="dl-gender-grid"><button type="button" data-gender="male" class="${state.gender==='male'?'selected':''}"><span class="dl-gender-figure male"><i></i></span><strong>Male</strong><small>Profile identity</small></button><button type="button" data-gender="female" class="${state.gender==='female'?'selected':''}"><span class="dl-gender-figure female"><i></i></span><strong>Female</strong><small>Profile identity</small></button></div><div class="dl-onboarding-actions"><button type="button" class="primary" data-next ${state.gender?'':'disabled'}>Lanjut</button></div>`;
        main.querySelectorAll('[data-gender]').forEach(b=>b.onclick=()=>{state.gender=b.dataset.gender;draw();});main.querySelector('[data-next]').onclick=()=>setStep(2);return;}
      if(state.step===2){main.innerHTML=`<div class="dl-onboarding-copy"><span>STEP 02 · COMMUNITY ROLE</span><h2>Ambil role kamu</h2><p>Seperti role Discord: role tampil di samping username dan mempunyai animasi serta efek unik di Community.</p></div><div class="dl-role-pick-grid">${Object.entries(ROLES).map(([key,r])=>`<button type="button" data-role="${key}" class="role-${key} ${state.role===key?'selected':''}">${roleMarkup(key)}<strong>${r.label}</strong><small>${r.desc}</small><em>${r.tag}</em></button>`).join('')}</div><div class="dl-onboarding-actions"><button type="button" class="ghost" data-back>Kembali</button><button type="button" class="primary" data-next ${state.role?'':'disabled'}>Lanjut</button></div>`;
        main.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{state.role=b.dataset.role;draw();});main.querySelector('[data-back]').onclick=()=>setStep(1);main.querySelector('[data-next]').onclick=()=>setStep(3);return;}
      const preview={...profile,gender:state.gender,community_role:state.role};main.innerHTML=`<div class="dl-onboarding-copy centered"><span>STEP 03 · STARTER CARD</span><h2>Collector Card kamu siap</h2><p>Avatar dipilih otomatis. Kamu bisa menggantinya kapan pun dari Profile.</p></div><div class="dl-onboarding-card-stage">${cardHTML(preview)}</div><div class="dl-onboarding-actions card-actions"><button type="button" class="ghost" data-back>Kembali</button><button type="button" class="primary collect" data-collect>Collect Card</button></div>`;
      main.querySelector('[data-back]').onclick=()=>setStep(2);main.querySelector('[data-collect]').onclick=async()=>{const b=main.querySelector('[data-collect]');b.disabled=true;b.textContent='Collecting…';try{const now=new Date().toISOString();await patchMe({gender:state.gender,community_role:state.role,onboarding_completed_at:now,card_collected_at:now});const fresh=await loadBundle(true);overlay.classList.add('collected');setTimeout(()=>{overlay.remove();document.body.classList.remove('dl-onboarding-open');onboardingOpen=false;document.dispatchEvent(new CustomEvent('dlavie:collector-ready',{detail:fresh}));syncAccountProfile(true);},950);}catch(e){b.disabled=false;b.textContent='Collect Card';toast(e.message);}};
    };
    draw();
  }

  function toast(message){let t=document.querySelector('.dl-collector-toast');if(!t){t=document.createElement('div');t.className='dl-collector-toast';document.body.append(t);}t.textContent=message;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2600);}

  async function avatarPicker(){
    const current=await loadBundle(true);if(!current)return;document.querySelector('.dl-avatar-picker')?.remove();const o=document.createElement('div');o.className='dl-avatar-picker';o.innerHTML=`<section role="dialog" aria-modal="true"><header><div><strong>Pilih Avatar Minecraft</strong><small>Avatar ini tampil di Collector Card dan Community.</small></div><button type="button" data-close data-dl-no-icon="true">×</button></header><div class="dl-avatar-grid">${Object.entries(AVATARS).map(([key,a])=>`<button type="button" data-avatar="${key}" class="${current.avatar_key===key?'selected':''}">${avatarMarkup(key)}<span>${a.label}</span></button>`).join('')}</div></section>`;const close=()=>o.remove();o.querySelector('[data-close]').onclick=close;o.onclick=e=>{if(e.target===o)close();};o.querySelectorAll('[data-avatar]').forEach(b=>b.onclick=async()=>{if(b.disabled)return;o.querySelectorAll('[data-avatar]').forEach(x=>x.disabled=true);try{await patchMe({avatar_key:b.dataset.avatar});await loadBundle(true);close();toast('Avatar profile diperbarui');document.dispatchEvent(new CustomEvent('dlavie:collector-profile-changed'));syncAccountProfile(true);}catch(e){toast(e.message);o.querySelectorAll('[data-avatar]').forEach(x=>x.disabled=false);}});document.body.append(o);
  }

  async function syncAccountProfile(force=false){
    if(profileRenderBusy)return;const mode=new URL(location.href).searchParams.get(PORTAL_PARAM);const card=document.querySelector('#dl-account-portal .dl-account-card');if(mode!=='account'||!card)return;profileRenderBusy=true;
    try{const p=await loadBundle(force);if(!p||!complete(p))return;let host=card.querySelector('#dl-collector-profile');if(!host){host=document.createElement('section');host.id='dl-collector-profile';card.append(host);}host.innerHTML=`<div class="dl-profile-collector-head"><div><span>COLLECTOR PROFILE</span><h3>Kartu milikmu</h3><p>Card mengikuti level, XP, role, dan avatar secara otomatis.</p></div>${roleMarkup(p.community_role)}</div><div class="dl-profile-card-wrap">${cardHTML(p)}</div><div class="dl-profile-identity-grid"><article><span>Member ID</span><strong>${esc(p.member_code)}</strong></article><article><span>Gender</span><strong>${genderLabel(p.gender)}</strong></article><article><span>Role</span><strong>${esc(ROLES[p.community_role]?.label||'—')}</strong></article><article><span>Level</span><strong>${Math.max(1,Number(p.level||1))}</strong></article></div><button type="button" class="dl-account-btn secondary dl-avatar-change" data-avatar-change>Ubah avatar</button>`;host.querySelector('[data-avatar-change]').onclick=avatarPicker;document.getElementById('dl-account-portal')?.classList.add('dl-has-collector-profile');}
    catch(e){console.warn('[Collector profile]',e.message);}finally{profileRenderBusy=false;}
  }

  async function bootstrapIdentity(){
    if(location.hash.startsWith('#/console'))return;const s=session();if(!s)return;try{const p=await loadBundle(true);if(p&&!complete(p))openOnboarding(p);}catch(e){console.warn('[Collector onboarding]',e.message);}
  }

  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const mode=new URL(location.href).searchParams.get(PORTAL_PARAM);if(mode==='login'){const b=document.querySelector('#dl-account-portal .dl-account-form button[type="submit"]');if(b&&!b.disabled&&b.textContent.trim()==='Masuk')b.textContent='Lanjut';}if(mode==='account')syncAccountProfile();});}
  function startObserver(){observer?.disconnect();observer=new MutationObserver(records=>{const meaningful=records.some(r=>{const t=r.target?.nodeType===1?r.target:r.target?.parentElement;return !t?.closest?.('.dl-identity-onboarding,.dl-avatar-picker,#dl-collector-profile,.dl-collector-toast');});if(meaningful)schedule();});observer.observe(document.documentElement,{childList:true,subtree:true});schedule();}

  window.__DLAVIE_COLLECTOR__={api,session,uid,loadBundle,patchMe,cardHTML,avatarMarkup,roleMarkup,tier,roles:ROLES,avatars:AVATARS,genderLabel};
  window.addEventListener('popstate',schedule);window.addEventListener('hashchange',()=>{schedule();bootstrapIdentity();});window.addEventListener('pageshow',()=>{schedule();bootstrapIdentity();});document.addEventListener('dlavie:collector-profile-changed',()=>{bundleCache=null;bundleAt=0;});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{startObserver();setTimeout(bootstrapIdentity,450);},{once:true});else{startObserver();setTimeout(bootstrapIdentity,450);}
})();