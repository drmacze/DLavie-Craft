(function(){
  'use strict';
  var host=document.getElementById('dl-welcome-v4');
  if(!host||host.getAttribute('data-dlw6')==='1')return;
  host.setAttribute('data-dlw6','1');

  var KEY='dlavie:welcome:v4';
  var SLIDE_MS=5000,RESUME_MS=6500,COMPLETE_AT=.78;
  var copy=[
    ['Temukan mod yang selalu kamu cari.','Jelajahi mod, add-on, map, skin, shader dan project Minecraft pilihan dalam satu tempat.'],
    ['Bangun dan bagikan duniamu.','Temukan karya komunitas atau aktifkan akun Crafter untuk mempublikasikan projectmu sendiri.'],
    ['Mainkan lebih banyak, gratis.','Simpan favorit, download build terbaru, beri rating dan temukan creator baru.']
  ];

  /* Clone the gesture surfaces so the old inline handlers cannot fight iOS touch input. */
  var oldViewport=host.querySelector('.dlw4-viewport');
  var oldStart=host.querySelector('.dlw4-start');
  var oldDots=host.querySelector('.dlw4-dots');
  if(!oldViewport||!oldStart)return;
  var viewport=oldViewport.cloneNode(true);oldViewport.parentNode.replaceChild(viewport,oldViewport);
  var start=oldStart.cloneNode(true);oldStart.parentNode.replaceChild(start,oldStart);
  var dotsWrap=oldDots?oldDots.cloneNode(true):null;if(oldDots&&dotsWrap)oldDots.parentNode.replaceChild(dotsWrap,oldDots);

  var track=viewport.querySelector('.dlw4-track');
  var slides=[].slice.call(viewport.querySelectorAll('.dlw4-slide'));
  var dots=dotsWrap?[].slice.call(dotsWrap.querySelectorAll('[data-dlw4-dot]')):[];
  var copyBox=host.querySelector('.dlw4-copy');
  var title=copyBox&&copyBox.querySelector('h1');
  var body=copyBox&&copyBox.querySelector('p');
  var knob=start.querySelector('.dlw4-knob');
  var fill=start.querySelector('.dlw4-fill');
  var label=start.querySelector('strong');
  if(!track||!slides.length||!knob||!fill)return;

  var style=document.createElement('style');
  style.id='dlw6-style';
  style.textContent='\
#dl-welcome-v4[data-dlw6="1"] .dlw4-viewport{overflow:hidden!important;touch-action:none!important;-ms-touch-action:none!important;overscroll-behavior:none!important;-webkit-user-select:none!important;user-select:none!important;cursor:grab}\
#dl-welcome-v4[data-dlw6="1"] .dlw4-viewport.dlw6-dragging{cursor:grabbing}\
#dl-welcome-v4[data-dlw6="1"] .dlw4-track{will-change:transform!important;backface-visibility:hidden!important}\
#dl-welcome-v4[data-dlw6="1"] .dlw4-slide,#dl-welcome-v4[data-dlw6="1"] .dlw4-scene{pointer-events:none!important}\
#dl-welcome-v4[data-dlw6="1"] .dlw4-start{height:56px!important;border-radius:30px!important;touch-action:none!important;-ms-touch-action:none!important;-webkit-user-select:none!important;user-select:none!important;pointer-events:auto!important;cursor:ew-resize!important;border-color:rgba(255,255,255,.22)!important;background:linear-gradient(180deg,rgba(17,13,25,.84),rgba(4,5,8,.82))!important;box-shadow:inset 0 1px rgba(255,255,255,.07),0 16px 40px rgba(0,0,0,.30),0 0 0 1px rgba(145,79,255,.05)!important}\
#dl-welcome-v4[data-dlw6="1"] .dlw4-start:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 0 31.8%,rgba(255,255,255,.09) 32% 32.3%,transparent 32.5% 65.5%,rgba(255,255,255,.09) 65.7% 66%,transparent 66.2%);opacity:.45}\
#dl-welcome-v4[data-dlw6="1"] .dlw4-fill{z-index:0!important;background:linear-gradient(90deg,rgba(111,49,205,.18),rgba(159,82,255,.42) 58%,rgba(233,211,255,.26))!important;box-shadow:0 0 30px rgba(155,80,255,.15);will-change:transform}\
#dl-welcome-v4[data-dlw6="1"] .dlw4-knob{z-index:4!important;left:5px!important;top:5px!important;width:46px!important;height:46px!important;pointer-events:none!important;background:radial-gradient(circle at 34% 24%,rgba(255,255,255,.32),rgba(255,255,255,.13) 44%,rgba(126,68,205,.22))!important;border-color:rgba(255,255,255,.30)!important;box-shadow:0 9px 25px rgba(0,0,0,.42),0 0 26px rgba(156,83,255,.20),inset 0 1px rgba(255,255,255,.14)!important;will-change:transform}\
#dl-welcome-v4[data-dlw6="1"] .dlw4-start.dlw6-scrubbing .dlw4-knob{background:radial-gradient(circle at 34% 24%,#fff,rgba(238,223,255,.95) 46%,rgba(159,93,238,.90))!important;color:#120b1c!important;box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 38px rgba(176,96,255,.40)!important}\
#dl-welcome-v4[data-dlw6="1"] .dlw4-start.dlw6-ready{border-color:rgba(220,187,255,.52)!important;box-shadow:inset 0 1px rgba(255,255,255,.09),0 16px 42px rgba(0,0,0,.31),0 0 34px rgba(164,87,255,.18)!important}\
#dl-welcome-v4[data-dlw6="1"] .dlw4-start strong{z-index:3!important;font-size:10px!important;letter-spacing:.012em!important;transition:opacity .16s ease,transform .16s ease}\
#dl-welcome-v4[data-dlw6="1"] .dlw4-start.dlw6-scrubbing strong{opacity:.78;transform:translateX(4px)}\
@media(max-width:560px){#dl-welcome-v4[data-dlw6="1"] .dlw4-start{left:26px!important;right:26px!important}}';
  document.head.appendChild(style);

  var index=0,timer=0,resumeTimer=0,copyTimer=0,leaving=false;
  var slideDrag=null,startDrag=null;

  function width(){return Math.max(1,viewport.getBoundingClientRect().width)}
  function setTrack(px,animate){
    track.style.transition=animate?'transform .38s cubic-bezier(.22,.8,.2,1)':'none';
    track.style.transform='translate3d('+px+'px,0,0)';
  }
  function setCopy(i,quiet){
    i=Math.max(0,Math.min(slides.length-1,i));
    slides.forEach(function(s,n){s.classList.toggle('active',n===i)});
    dots.forEach(function(d,n){d.classList.toggle('active',n===i);d.setAttribute('aria-current',n===i?'true':'false')});
    if(!title||!body||!copy[i])return;
    clearTimeout(copyTimer);
    if(quiet){title.textContent=copy[i][0];body.textContent=copy[i][1];if(copyBox)copyBox.classList.remove('swap');return}
    if(title.textContent===copy[i][0])return;
    if(copyBox)copyBox.classList.add('swap');
    copyTimer=setTimeout(function(){title.textContent=copy[i][0];body.textContent=copy[i][1];if(copyBox)copyBox.classList.remove('swap')},65);
  }
  function paint(i,quiet){index=Math.max(0,Math.min(slides.length-1,i));setCopy(index,quiet)}
  function restart(){clearTimeout(timer);timer=setTimeout(function(){var n=index+1;if(n>=slides.length)n=0;paint(n,false);setTrack(-index*width(),true);restart()},SLIDE_MS)}
  function pause(){clearTimeout(timer);clearTimeout(resumeTimer);resumeTimer=setTimeout(restart,RESUME_MS)}
  function snap(i,manual){paint(Math.max(0,Math.min(slides.length-1,i)),false);setTrack(-index*width(),true);manual?pause():restart()}
  function touchPoint(e,id){
    var list=e.touches&&e.touches.length?e.touches:e.changedTouches;
    if(list&&list.length){
      if(id!=null){for(var i=0;i<list.length;i++)if(list[i].identifier===id)return{x:list[i].clientX,y:list[i].clientY}}
      return{x:list[0].clientX,y:list[0].clientY};
    }
    return{x:e.clientX,y:e.clientY};
  }
  function parallax(p){var r=host.getBoundingClientRect(),x=((p.x-r.left)/Math.max(1,r.width)-.5)*2,y=((p.y-r.top)/Math.max(1,r.height)-.5)*2;host.style.setProperty('--mx',x.toFixed(3));host.style.setProperty('--my',y.toFixed(3))}

  function slideBegin(e,isTouch){
    if(leaving||startDrag||slideDrag)return;
    if(!isTouch&&e.pointerType==='mouse'&&e.button!==0)return;
    var id=isTouch&&e.touches&&e.touches[0]?e.touches[0].identifier:null;
    var p=touchPoint(e,id);parallax(p);
    slideDrag={id:id,x:p.x,y:p.y,dx:0,dy:0,t:Date.now(),horizontal:false};
    clearTimeout(timer);clearTimeout(resumeTimer);viewport.classList.add('dlw6-dragging');setTrack(-index*width(),false);
  }
  function slideMove(e){
    if(!slideDrag||startDrag)return;
    var p=touchPoint(e,slideDrag.id),dx=p.x-slideDrag.x,dy=p.y-slideDrag.y;slideDrag.dx=dx;slideDrag.dy=dy;parallax(p);
    if(!slideDrag.horizontal){
      if(Math.abs(dx)<5)return;
      if(Math.abs(dx)<Math.abs(dy)*1.05)return;
      slideDrag.horizontal=true;
    }
    if(e.cancelable)e.preventDefault();
    var d=dx;if((index===0&&d>0)||(index===slides.length-1&&d<0))d*=.24;
    setTrack(-index*width()+d,false);
  }
  function slideEnd(e){
    if(!slideDrag)return;
    var d=slideDrag,dt=Math.max(1,Date.now()-d.t),v=Math.abs(d.dx)/dt,target=index;
    if(d.horizontal&&(Math.abs(d.dx)>26||v>.20))target=index+(d.dx<0?1:-1);
    slideDrag=null;viewport.classList.remove('dlw6-dragging');host.style.setProperty('--mx','0');host.style.setProperty('--my','0');snap(target,true);
  }

  function knobMax(){return Math.max(1,start.clientWidth-knob.offsetWidth-10)}
  function setStart(p,animate){
    p=Math.max(0,Math.min(1,p));
    knob.style.transition=animate?'transform .28s cubic-bezier(.22,.8,.2,1),background .2s ease':'none';
    fill.style.transition=animate?'transform .28s cubic-bezier(.22,.8,.2,1)':'none';
    knob.style.transform='translate3d('+(knobMax()*p)+'px,0,0)';fill.style.transform='scaleX('+p+')';start.style.setProperty('--dlw-p',String(p));start.setAttribute('aria-valuenow',String(Math.round(p*100)));
    start.classList.toggle('dlw6-ready',p>=COMPLETE_AT);
    if(label)label.textContent=p>=COMPLETE_AT?'Lepas untuk masuk':(p>.08?'Terus geser…':'Swipe to Start');
  }
  function progressFromX(x){
    var r=startDrag.rect;
    return Math.max(0,Math.min(1,(x-r.left-startDrag.offset)/Math.max(1,r.width-knob.offsetWidth-10)));
  }
  function scrub(p){
    p=Math.max(0,Math.min(1,p));startDrag.p=p;setStart(p,false);
    var sceneFloat=p*(slides.length-1);setTrack(-sceneFloat*width(),false);
    var visual=Math.max(0,Math.min(slides.length-1,Math.round(sceneFloat)));setCopy(visual,false);
    host.style.setProperty('--mx',((p-.5)*.28).toFixed(3));host.style.setProperty('--my',((.5-p)*.09).toFixed(3));
  }
  function startBegin(e,isTouch){
    if(leaving||startDrag)return;
    if(!isTouch&&e.pointerType==='mouse'&&e.button!==0)return;
    e.stopPropagation();if(e.cancelable)e.preventDefault();
    var id=isTouch&&e.touches&&e.touches[0]?e.touches[0].identifier:null;
    var p=touchPoint(e,id),rect=start.getBoundingClientRect();
    clearTimeout(timer);clearTimeout(resumeTimer);slideDrag=null;
    var current=(parseFloat(start.getAttribute('aria-valuenow')||'0')/100)||0;
    var knobLeft=rect.left+5+(knobMax()*current);
    startDrag={id:id,p:current,rect:rect,offset:Math.max(0,Math.min(knob.offsetWidth,p.x-knobLeft))};
    start.classList.add('dlw6-scrubbing');scrub(progressFromX(p.x));
  }
  function startMove(e){
    if(!startDrag)return;e.stopPropagation();if(e.cancelable)e.preventDefault();scrub(progressFromX(touchPoint(e,startDrag.id).x));
  }
  function restoreStart(){
    start.classList.remove('dlw6-scrubbing','dlw6-ready');setStart(0,true);paint(0,false);setTrack(0,true);host.style.setProperty('--mx','0');host.style.setProperty('--my','0');restart();
  }
  function removeForce(){try{var u=new URL(location.href);if(u.searchParams.has('welcome')){u.searchParams.delete('welcome');history.replaceState(history.state,'',u.pathname+(u.search||'')+(location.hash||'#/'))}}catch(e){}}
  function finish(){
    if(leaving)return;leaving=true;clearTimeout(timer);clearTimeout(resumeTimer);start.classList.remove('dlw6-scrubbing');setStart(1,true);paint(slides.length-1,false);setTrack(-(slides.length-1)*width(),true);
    try{localStorage.setItem(KEY,'done')}catch(e){}removeForce();
    setTimeout(function(){host.classList.add('leaving');document.documentElement.classList.add('dlw4-enter-home');setTimeout(function(){if(host.parentNode)host.parentNode.removeChild(host);window.__DLAVIE_WELCOME_ACTIVE__=false;document.documentElement.classList.remove('dlw4-on','dlw4-enter-home');document.documentElement.classList.add('dlw4-off');try{window.dispatchEvent(new CustomEvent('dlavie:welcome-complete'))}catch(e){}},510)},130);
  }
  function startEnd(e){
    if(!startDrag)return;e.stopPropagation();if(e.cancelable)e.preventDefault();var p=startDrag.p;startDrag=null;
    if(p>=COMPLETE_AT)finish();else restoreStart();
  }

  /* TouchEvent is the primary path on iPhone/in-app Safari. It is always installed,
     even when PointerEvent exists. Pointer handlers are kept only for mouse/pen. */
  viewport.addEventListener('touchstart',function(e){slideBegin(e,true)},{passive:false});
  viewport.addEventListener('touchmove',slideMove,{passive:false});
  viewport.addEventListener('touchend',slideEnd,{passive:false});
  viewport.addEventListener('touchcancel',slideEnd,{passive:false});
  start.addEventListener('touchstart',function(e){startBegin(e,true)},{passive:false});
  start.addEventListener('touchmove',startMove,{passive:false});
  start.addEventListener('touchend',startEnd,{passive:false});
  start.addEventListener('touchcancel',startEnd,{passive:false});

  if(window.PointerEvent){
    viewport.addEventListener('pointerdown',function(e){if(e.pointerType==='touch')return;slideBegin(e,false);try{viewport.setPointerCapture(e.pointerId)}catch(x){}},{passive:false});
    viewport.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;slideMove(e)},{passive:false});
    viewport.addEventListener('pointerup',function(e){if(e.pointerType==='touch')return;slideEnd(e)},{passive:false});
    viewport.addEventListener('pointercancel',function(e){if(e.pointerType==='touch')return;slideEnd(e)},{passive:false});
    start.addEventListener('pointerdown',function(e){if(e.pointerType==='touch')return;startBegin(e,false);try{start.setPointerCapture(e.pointerId)}catch(x){}},{passive:false});
    start.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;startMove(e)},{passive:false});
    start.addEventListener('pointerup',function(e){if(e.pointerType==='touch')return;startEnd(e)},{passive:false});
    start.addEventListener('pointercancel',function(e){if(e.pointerType==='touch')return;startEnd(e)},{passive:false});
  }

  dots.forEach(function(d,i){d.addEventListener('click',function(e){e.preventDefault();snap(i,true)})});
  start.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight'){e.preventDefault();finish()}});

  setTrack(0,false);paint(0,true);setStart(0,true);restart();
  window.addEventListener('resize',function(){if(startDrag){startDrag.rect=start.getBoundingClientRect();scrub(startDrag.p)}else setTrack(-index*width(),false)},{passive:true});
})();