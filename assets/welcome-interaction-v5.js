(function(){
  'use strict';
  var host=document.getElementById('dl-welcome-v4');
  if(!host||host.getAttribute('data-dlw5')==='1')return;
  host.setAttribute('data-dlw5','1');

  var KEY='dlavie:welcome:v4';
  var SLIDE_MS=5000,RESUME_MS=6500,SCENE_END=.82,COMPLETE_AT=.91;
  var copy=[
    ['Temukan mod yang selalu kamu cari.','Jelajahi mod, add-on, map, skin, shader dan project Minecraft pilihan dalam satu tempat.'],
    ['Bangun dan bagikan duniamu.','Temukan karya komunitas atau aktifkan akun Crafter untuk mempublikasikan projectmu sendiri.'],
    ['Mainkan lebih banyak, gratis.','Simpan favorit, download build terbaru, beri rating dan temukan creator baru.']
  ];

  /* Replace the interactive nodes once. This removes the older inline gesture listeners,
     so WebKit only has one owner for swipe state and pointer capture. */
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
  style.id='dlw5-style';
  style.textContent='\
#dl-welcome-v4[data-dlw5="1"] .dlw4-viewport{overflow:hidden!important;touch-action:none!important;overscroll-behavior:none!important;cursor:grab}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-viewport.dlw5-dragging{cursor:grabbing}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-track{will-change:transform!important;backface-visibility:hidden}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-slide{will-change:transform,opacity;backface-visibility:hidden}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-scene{filter:saturate(1.10) contrast(1.035);transition:filter .28s ease}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-aura{filter:blur(4px) saturate(1.18)}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-start{height:56px!important;border-radius:30px!important;border-color:rgba(255,255,255,.20)!important;background:linear-gradient(180deg,rgba(17,13,25,.82),rgba(4,5,8,.78))!important;box-shadow:inset 0 1px rgba(255,255,255,.07),0 16px 40px rgba(0,0,0,.30),0 0 0 1px rgba(145,79,255,.045)!important;touch-action:none!important;pointer-events:auto!important;user-select:none!important;-webkit-user-select:none!important;isolation:isolate;cursor:ew-resize}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-start:before{content:"";position:absolute;z-index:1;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 0 32.2%,rgba(255,255,255,.11) 32.3% 32.5%,transparent 32.6% 65.5%,rgba(255,255,255,.11) 65.6% 65.8%,transparent 65.9%);opacity:.38}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-start:after{content:"";position:absolute;z-index:1;left:12px;right:12px;bottom:5px;height:1px;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(167,92,255,.38),rgba(255,255,255,.15),transparent);opacity:.55}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-fill{z-index:0;background:linear-gradient(90deg,rgba(104,45,194,.16),rgba(159,82,255,.37) 56%,rgba(232,207,255,.24))!important;box-shadow:0 0 28px rgba(150,78,255,.13);will-change:transform}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-knob{z-index:4!important;left:5px!important;top:5px!important;width:46px!important;height:46px!important;pointer-events:auto!important;touch-action:none!important;background:radial-gradient(circle at 34% 24%,rgba(255,255,255,.30),rgba(255,255,255,.12) 44%,rgba(126,68,205,.20))!important;border-color:rgba(255,255,255,.27)!important;box-shadow:0 9px 25px rgba(0,0,0,.40),0 0 25px rgba(156,83,255,.18),inset 0 1px rgba(255,255,255,.13)!important;will-change:transform}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-start.dlw5-scrubbing .dlw4-knob{background:radial-gradient(circle at 34% 24%,#fff,rgba(238,223,255,.94) 46%,rgba(159,93,238,.88))!important;color:#120b1c!important;box-shadow:0 10px 30px rgba(0,0,0,.44),0 0 36px rgba(176,96,255,.37)!important}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-start.dlw5-ready{border-color:rgba(218,183,255,.46)!important;box-shadow:inset 0 1px rgba(255,255,255,.08),0 16px 42px rgba(0,0,0,.31),0 0 32px rgba(164,87,255,.15)!important}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-start strong{z-index:3;font-size:10px!important;letter-spacing:.012em;transition:opacity .16s ease,transform .16s ease}\
#dl-welcome-v4[data-dlw5="1"] .dlw4-start.dlw5-scrubbing strong{opacity:.78;transform:translateX(3px)}\
@media(max-width:560px){#dl-welcome-v4[data-dlw5="1"] .dlw4-start{left:26px!important;right:26px!important}}';
  document.head.appendChild(style);

  var index=0,timer=0,resumeTimer=0,copyTimer=0,leaving=false;
  var slideDrag=null,startDrag=null,activePointer=null,activeTouch=null;

  function w(){return Math.max(1,viewport.getBoundingClientRect().width)}
  function setTrack(px,animate){
    track.style.transition=animate?'transform .42s cubic-bezier(.22,.8,.2,1)':'none';
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
    copyTimer=setTimeout(function(){title.textContent=copy[i][0];body.textContent=copy[i][1];if(copyBox)copyBox.classList.remove('swap')},70);
  }
  function paint(i,quiet){index=Math.max(0,Math.min(slides.length-1,i));setCopy(index,quiet)}
  function restart(){clearTimeout(timer);timer=setTimeout(function(){var n=index+1;if(n>=slides.length)n=0;paint(n,false);setTrack(-index*w(),true);restart()},SLIDE_MS)}
  function pause(){clearTimeout(timer);clearTimeout(resumeTimer);resumeTimer=setTimeout(restart,RESUME_MS)}
  function snap(i,manual){paint(i,false);setTrack(-index*w(),true);manual?pause():restart()}

  function point(e){
    var list=e.touches&&e.touches.length?e.touches:e.changedTouches;
    if(list&&list.length){
      if(activeTouch!==null){for(var i=0;i<list.length;i++)if(list[i].identifier===activeTouch)return{x:list[i].clientX,y:list[i].clientY}}
      return{x:list[0].clientX,y:list[0].clientY};
    }
    return{x:e.clientX,y:e.clientY};
  }
  function parallax(p){var r=host.getBoundingClientRect(),x=((p.x-r.left)/Math.max(1,r.width)-.5)*2,y=((p.y-r.top)/Math.max(1,r.height)-.5)*2;host.style.setProperty('--mx',x.toFixed(3));host.style.setProperty('--my',y.toFixed(3))}

  function slideBegin(e){if(leaving||startDrag)return;if(e.pointerType==='mouse'&&e.button!==0)return;var p=point(e);parallax(p);slideDrag={x:p.x,y:p.y,dx:0,t:Date.now(),horizontal:false};clearTimeout(timer);clearTimeout(resumeTimer);viewport.classList.add('dlw5-dragging');setTrack(-index*w(),false)}
  function slideMove(e){if(!slideDrag||startDrag)return;var p=point(e),dx=p.x-slideDrag.x,dy=p.y-slideDrag.y;parallax(p);slideDrag.dx=dx;if(!slideDrag.horizontal){if(Math.abs(dx)<7)return;if(Math.abs(dx)<=Math.abs(dy))return;slideDrag.horizontal=true}if(e.cancelable)e.preventDefault();var d=dx;if((index===0&&d>0)||(index===slides.length-1&&d<0))d*=.26;setTrack(-index*w()+d,false)}
  function slideEnd(){if(!slideDrag)return;var d=slideDrag,dt=Math.max(1,Date.now()-d.t),v=Math.abs(d.dx)/dt,target=index;if(d.horizontal&&(Math.abs(d.dx)>44||v>.40))target=index+(d.dx<0?1:-1);slideDrag=null;viewport.classList.remove('dlw5-dragging');host.style.setProperty('--mx','0');host.style.setProperty('--my','0');snap(target,true)}

  function knobMax(){return Math.max(1,start.clientWidth-knob.offsetWidth-10)}
  function setStart(p,animate){
    p=Math.max(0,Math.min(1,p));
    if(animate){knob.style.transition='transform .30s cubic-bezier(.22,.8,.2,1),background .2s ease';fill.style.transition='transform .30s cubic-bezier(.22,.8,.2,1)'}else{knob.style.transition='none';fill.style.transition='none'}
    knob.style.transform='translate3d('+(knobMax()*p)+'px,0,0)';fill.style.transform='scaleX('+p+')';start.style.setProperty('--dlw-p',String(p));start.setAttribute('aria-valuenow',String(Math.round(p*100)));
    start.classList.toggle('dlw5-ready',p>=COMPLETE_AT);
    if(label)label.textContent=p>=COMPLETE_AT?'Lepas untuk masuk':(p>.08?'Terus geser…':'Swipe to Start');
  }
  function scrub(p){
    p=Math.max(0,Math.min(1,p));startDrag.p=p;setStart(p,false);
    var remaining=Math.max(0,slides.length-1-startDrag.baseIndex);
    var sceneProgress=Math.min(1,p/SCENE_END);
    var sceneFloat=startDrag.baseIndex+(remaining*sceneProgress);
    setTrack(-sceneFloat*w(),false);
    var visual=Math.max(startDrag.baseIndex,Math.min(slides.length-1,Math.round(sceneFloat)));
    setCopy(visual,false);
    host.style.setProperty('--mx',((p-.5)*.30).toFixed(3));host.style.setProperty('--my',((.5-p)*.10).toFixed(3));
  }
  function pFromX(x){
    var r=startDrag.rect,half=knob.offsetWidth*.5;
    return Math.max(0,Math.min(1,(x-r.left-half)/Math.max(1,r.width-knob.offsetWidth-10)));
  }
  function startBegin(e,isTouch){
    if(leaving)return;if(e.pointerType==='mouse'&&e.button!==0)return;
    e.stopPropagation();if(e.cancelable)e.preventDefault();
    clearTimeout(timer);clearTimeout(resumeTimer);slideDrag=null;
    if(isTouch&&e.touches&&e.touches[0])activeTouch=e.touches[0].identifier;
    if(e.pointerId!=null)activePointer=e.pointerId;
    startDrag={baseIndex:index,p:0,rect:start.getBoundingClientRect()};
    start.classList.add('dlw5-scrubbing');
    try{if(activePointer!==null)start.setPointerCapture(activePointer)}catch(x){}
    scrub(pFromX(point(e).x));
  }
  function startMove(e){
    if(!startDrag)return;if(activePointer!==null&&e.pointerId!=null&&e.pointerId!==activePointer)return;
    e.stopPropagation();if(e.cancelable)e.preventDefault();scrub(pFromX(point(e).x));
  }
  function restoreStart(){
    var base=startDrag?startDrag.baseIndex:index;
    start.classList.remove('dlw5-scrubbing','dlw5-ready');setStart(0,true);paint(base,false);setTrack(-base*w(),true);host.style.setProperty('--mx','0');host.style.setProperty('--my','0');
    setTimeout(function(){knob.style.transition='';fill.style.transition=''},340);restart();
  }
  function removeForce(){try{var u=new URL(location.href);if(u.searchParams.has('welcome')){u.searchParams.delete('welcome');history.replaceState(history.state,'',u.pathname+(u.search||'')+(location.hash||'#/'))}}catch(e){}}
  function finish(){
    if(leaving)return;leaving=true;clearTimeout(timer);clearTimeout(resumeTimer);start.classList.remove('dlw5-scrubbing');setStart(1,true);paint(slides.length-1,false);setTrack(-(slides.length-1)*w(),true);
    try{localStorage.setItem(KEY,'done')}catch(e){}removeForce();
    setTimeout(function(){host.classList.add('leaving');document.documentElement.classList.add('dlw4-enter-home');setTimeout(function(){if(host.parentNode)host.parentNode.removeChild(host);window.__DLAVIE_WELCOME_ACTIVE__=false;document.documentElement.classList.remove('dlw4-on','dlw4-enter-home');document.documentElement.classList.add('dlw4-off');try{window.dispatchEvent(new CustomEvent('dlavie:welcome-complete'))}catch(e){}},510)},170);
  }
  function startEnd(e){
    if(!startDrag)return;if(activePointer!==null&&e.pointerId!=null&&e.pointerId!==activePointer)return;
    e.stopPropagation();if(e.cancelable)e.preventDefault();var p=startDrag.p;
    try{if(activePointer!==null)start.releasePointerCapture(activePointer)}catch(x){}
    activePointer=null;activeTouch=null;
    if(p>=COMPLETE_AT){startDrag=null;finish()}else{restoreStart();startDrag=null}
  }

  if(window.PointerEvent){
    viewport.addEventListener('pointerdown',function(e){slideBegin(e);try{viewport.setPointerCapture(e.pointerId)}catch(x){}},{passive:false});viewport.addEventListener('pointermove',slideMove,{passive:false});viewport.addEventListener('pointerup',slideEnd,{passive:false});viewport.addEventListener('pointercancel',slideEnd,{passive:false});
    start.addEventListener('pointerdown',function(e){startBegin(e,false)},{passive:false});start.addEventListener('pointermove',startMove,{passive:false});start.addEventListener('pointerup',startEnd,{passive:false});start.addEventListener('pointercancel',startEnd,{passive:false});
  }
  /* Explicit touch fallback is kept even when PointerEvent exists because some iOS in-app browsers
     expose PointerEvent but still route drag gestures through TouchEvent. */
  start.addEventListener('touchstart',function(e){if(startDrag)return;startBegin(e,true)},{passive:false});start.addEventListener('touchmove',startMove,{passive:false});start.addEventListener('touchend',startEnd,{passive:false});start.addEventListener('touchcancel',startEnd,{passive:false});
  if(!window.PointerEvent){viewport.addEventListener('touchstart',slideBegin,{passive:false});viewport.addEventListener('touchmove',slideMove,{passive:false});viewport.addEventListener('touchend',slideEnd,{passive:false});viewport.addEventListener('touchcancel',slideEnd,{passive:false})}

  dots.forEach(function(d,i){d.addEventListener('click',function(e){e.preventDefault();snap(i,true)})});
  start.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight'){e.preventDefault();startDrag={baseIndex:index,p:1,rect:start.getBoundingClientRect()};scrub(1);setTimeout(function(){startDrag=null;finish()},150)}});

  setTrack(0,false);paint(0,true);setStart(0,true);restart();
  window.addEventListener('resize',function(){if(startDrag){startDrag.rect=start.getBoundingClientRect();scrub(startDrag.p)}else setTrack(-index*w(),false)},{passive:true});
})();