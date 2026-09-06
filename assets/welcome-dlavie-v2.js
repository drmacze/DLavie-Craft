(() => {
  'use strict';

  const KEY = 'dlavie:welcome:v2';
  const SLIDE_MS = 4600;
  const slides = [
    { image:'/DLavie-Craft/assets/welcome-start-best.webp?v=20260907w3', eyebrow:'DLAVIE', title:'Mulai dengan yang terbaik.', body:'Temukan mod, add-on, map, skin dan project Minecraft pilihan komunitas.' },
    { image:'/DLavie-Craft/assets/welcome-lets-build.webp?v=20260907w3', eyebrow:'CREATE TOGETHER', title:'Bangun. Bagikan. Berkembang.', body:'Jelajahi karya creator atau aktifkan akun Crafter untuk mempublikasikan projectmu.' },
    { image:'/DLavie-Craft/assets/welcome-free-mod.webp?v=20260907w3', eyebrow:'FREE MINECRAFT MOD', title:'Mainkan lebih banyak.', body:'Simpan favorit, download build terbaru, beri rating dan temukan creator baru.' }
  ];

  const safeStorage = {
    get(k){ try { return window.localStorage ? localStorage.getItem(k) : null; } catch { return null; } },
    set(k,v){ try { if(window.localStorage) localStorage.setItem(k,v); } catch {} }
  };

  function forced(){ try { return new URL(location.href).searchParams.get('welcome') === '1'; } catch { return false; } }
  function atHome(){ const h=location.hash||''; return h===''||h==='#'||h==='#/'; }
  function shouldShow(){ return atHome() && (forced() || safeStorage.get(KEY)!=='done'); }

  function mount(){
    if(!document.body || !shouldShow() || document.getElementById('dl-welcome-v2')) return;
    const host=document.createElement('div');
    host.id='dl-welcome-v2';
    host.innerHTML=`<div class="dlw2-frame">
      <div class="dlw2-track">${slides.map((s,i)=>`<section class="dlw2-slide" data-i="${i}"><img src="${s.image}" alt="" draggable="false" decoding="async"><div class="dlw2-shade"></div></section>`).join('')}</div>
      <div class="dlw2-progress">${slides.map((_,i)=>`<i data-p="${i}"></i>`).join('')}</div>
      <div class="dlw2-top"><b>DLAVIE</b><button type="button" data-skip>Lewati</button></div>
      <div class="dlw2-copy"><span></span><h1></h1><p></p></div>
      <div class="dlw2-dots">${slides.map((_,i)=>`<button type="button" data-dot="${i}" aria-label="Slide ${i+1}"></button>`).join('')}</div>
      <div class="dlw2-start" role="button" tabindex="0" aria-label="Swipe to Start">
        <div class="dlw2-fill"></div><div class="dlw2-knob">→</div><strong>Swipe to Start</strong>
      </div>
    </div>`;
    document.body.appendChild(host);
    document.documentElement.classList.add('dlw2-lock');
    bind(host);
  }

  function bind(host){
    const track=host.querySelector('.dlw2-track');
    const copy=host.querySelector('.dlw2-copy');
    const dots=[...host.querySelectorAll('[data-dot]')];
    const bars=[...host.querySelectorAll('[data-p]')];
    const start=host.querySelector('.dlw2-start');
    const knob=host.querySelector('.dlw2-knob');
    const fill=host.querySelector('.dlw2-fill');
    let index=0, timer=0, slideTouch=null, drag=null, leaving=false;

    function render(animate=true){
      if(!animate) track.style.transition='none';
      track.style.transform=`translate3d(${-index*100}%,0,0)`;
      const s=slides[index];
      copy.querySelector('span').textContent=s.eyebrow;
      copy.querySelector('h1').textContent=s.title;
      copy.querySelector('p').textContent=s.body;
      dots.forEach((d,i)=>d.classList.toggle('active',i===index));
      bars.forEach((b,i)=>{ b.classList.toggle('done',i<index); b.classList.toggle('active',i===index); });
      if(!animate) requestAnimationFrame(()=>track.style.transition='');
      restart();
    }
    function go(i){ index=(i+slides.length)%slides.length; render(true); }
    function restart(){ clearTimeout(timer); timer=setTimeout(()=>go(index+1),SLIDE_MS); }

    dots.forEach((d,i)=>d.addEventListener('click',()=>go(i)));

    const viewport=host.querySelector('.dlw2-frame');
    viewport.addEventListener('touchstart',e=>{ const t=e.touches[0]; if(!t)return; slideTouch={x:t.clientX,y:t.clientY}; clearTimeout(timer); },{passive:true});
    viewport.addEventListener('touchend',e=>{ if(!slideTouch||!e.changedTouches[0])return; const t=e.changedTouches[0],dx=t.clientX-slideTouch.x,dy=t.clientY-slideTouch.y; slideTouch=null; if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>44) go(index+(dx<0?1:-1)); else restart(); },{passive:true});

    function setDrag(p){ p=Math.max(0,Math.min(1,p)); const max=Math.max(0,start.clientWidth-knob.offsetWidth-12); knob.style.transform=`translate3d(${p*max}px,0,0)`; fill.style.transform=`scaleX(${p})`; start.dataset.p=String(p); }
    function begin(x){ const r=start.getBoundingClientRect(); drag={x0:x,w:r.width}; start.classList.add('dragging'); }
    function move(x){ if(!drag)return; const usable=Math.max(1,drag.w-knob.offsetWidth-12); setDrag((x-drag.x0)/usable); }
    function end(){ if(!drag)return; const p=Number(start.dataset.p||0); drag=null; start.classList.remove('dragging'); if(p>=.7) finish(); else setDrag(0); }

    start.addEventListener('touchstart',e=>{e.stopPropagation();begin(e.touches[0].clientX);},{passive:true});
    start.addEventListener('touchmove',e=>{e.preventDefault();move(e.touches[0].clientX);},{passive:false});
    start.addEventListener('touchend',e=>{e.stopPropagation();end();},{passive:true});
    start.addEventListener('pointerdown',e=>{ if(e.pointerType==='touch')return; begin(e.clientX); start.setPointerCapture?.(e.pointerId); });
    start.addEventListener('pointermove',e=>{ if(e.pointerType==='touch')return; move(e.clientX); });
    start.addEventListener('pointerup',e=>{ if(e.pointerType==='touch')return; end(); });
    start.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();finish();} });

    function finish(){
      if(leaving)return; leaving=true; clearTimeout(timer); safeStorage.set(KEY,'done'); setDrag(1); host.classList.add('leaving'); document.documentElement.classList.add('dlw2-enter-home');
      try{ const u=new URL(location.href); if(u.searchParams.get('welcome')==='1'){u.searchParams.delete('welcome'); history.replaceState(history.state,'',u.pathname+u.search+(location.hash||'#/'));} }catch{}
      setTimeout(()=>{ host.remove(); document.documentElement.classList.remove('dlw2-lock','dlw2-enter-home'); window.dispatchEvent(new CustomEvent('dlavie:welcome-complete')); },620);
    }
    host.querySelector('[data-skip]').addEventListener('click',finish);

    // Fail open: welcome must never trap the website if an embedded browser behaves unexpectedly.
    const watchdog=setTimeout(()=>{ if(host.isConnected && !copy.querySelector('h1').textContent) finish(); },2500);
    host.addEventListener('transitionend',()=>clearTimeout(watchdog),{once:true});
    render(false);
  }

  function run(){
    try{ mount(); }
    catch(err){
      console.warn('[DLavie Welcome] recovery',err);
      document.documentElement.classList.remove('dlw2-lock');
      document.getElementById('dl-welcome-v2')?.remove();
    }
  }

  function boot(){
    // This script is defer-loaded, so body normally already exists. Do not wait for DOMContentLoaded:
    // later defer/CDN scripts can delay that event on iOS and embedded Safari, producing a black screen.
    if(document.body){ run(); return; }
    let tries=0;
    const poll=setInterval(()=>{
      tries++;
      if(document.body){ clearInterval(poll); run(); }
      else if(tries>180) clearInterval(poll);
    },16);
  }

  boot();
  window.addEventListener('pageshow',boot);
})();