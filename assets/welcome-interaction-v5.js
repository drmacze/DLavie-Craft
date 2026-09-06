(function(){
  'use strict';
  var host=document.getElementById('dl-welcome-v4');
  if(!host||host.dataset.dlw5==='1')return;
  host.dataset.dlw5='1';
  var KEY='dlavie:welcome:v4';
  var SLIDE_MS=4800,RESUME_MS=6200;
  var copy=[
    ['Temukan mod yang selalu kamu cari.','Jelajahi mod, add-on, map, skin, shader dan project Minecraft pilihan dalam satu tempat.'],
    ['Bangun dan bagikan duniamu.','Temukan karya komunitas atau aktifkan akun Crafter untuk mempublikasikan projectmu sendiri.'],
    ['Mainkan lebih banyak, gratis.','Simpan favorit, download build terbaru, beri rating dan temukan creator baru.']
  ];
  var style=document.createElement('style');
  style.id='dlw5-style';
  style.textContent='\n#dl-welcome-v4 .dlw4-viewport{overflow:hidden!important;scroll-snap-type:none!important;scroll-behavior:auto!important;-webkit-overflow-scrolling:auto!important;touch-action:none!important;overscroll-behavior:none!important;}\n#dl-welcome-v4 .dlw4-track{display:flex!important;width:100%!important;height:100%!important;will-change:transform!important;transition:transform .46s cubic-bezier(.22,.8,.2,1)!important;}\n#dl-welcome-v4 .dlw4-slide{flex:0 0 100%!important;width:100%!important;height:100%!important;scroll-snap-align:none!important;}\n#dl-welcome-v4 .dlw4-slide img{opacity:1!important;filter:none!important;transform:none!important;image-rendering:auto!important;-webkit-user-drag:none!important;}\n#dl-welcome-v4 .dlw4-slide:after{display:none!important;}\n#dl-welcome-v4 .dlw4-shade{background:linear-gradient(180deg,transparent 0%,transparent 66%,rgba(2,3,6,.16) 78%,rgba(2,3,6,.62) 91%,rgba(5,6,8,.92) 100%)!important;}\n#dl-welcome-v4 .dlw4-start{touch-action:none!important;pointer-events:auto!important;user-select:none!important;-webkit-user-select:none!important;}\n#dl-welcome-v4 .dlw4-range{display:none!important;}\n#dl-welcome-v4 .dlw4-knob{pointer-events:none!important;}\n#dl-welcome-v4 .dlw4-dots{pointer-events:auto!important;}\n#dl-welcome-v4 .dlw4-dots button{pointer-events:auto!important;}\n#dl-welcome-v4 .dlw4-copy{pointer-events:none!important;}\n';
  document.head.appendChild(style);

  var viewport=host.querySelector('.dlw4-viewport');
  var track=host.querySelector('.dlw4-track');
  var slides=[].slice.call(host.querySelectorAll('.dlw4-slide'));
  var dots=[].slice.call(host.querySelectorAll('[data-dlw4-dot]'));
  var copyBox=host.querySelector('.dlw4-copy');
  var title=copyBox&&copyBox.querySelector('h1');
  var body=copyBox&&copyBox.querySelector('p');
  var oldStart=host.querySelector('.dlw4-start');
  if(!viewport||!track||!slides.length||!oldStart)return;

  var start=oldStart.cloneNode(true);
  var oldRange=start.querySelector('.dlw4-range');if(oldRange)oldRange.remove();
  oldStart.parentNode.replaceChild(start,oldStart);
  var knob=start.querySelector('.dlw4-knob');
  var fill=start.querySelector('.dlw4-fill');

  var index=0,timer=0,resumeTimer=0,leaving=false;
  var slideDrag=null,startDrag=null;
  function w(){return Math.max(1,viewport.getBoundingClientRect().width)}
  function setTrack(px,animate){track.style.transition=animate?'transform .46s cubic-bezier(.22,.8,.2,1)':'none';track.style.transform='translate3d('+px+'px,0,0)'}
  function paint(i){
    index=Math.max(0,Math.min(slides.length-1,i));
    slides.forEach(function(s,n){s.classList.toggle('active',n===index)});
    dots.forEach(function(d,n){d.classList.toggle('active',n===index);d.setAttribute('aria-current',n===index?'true':'false')});
    if(title&&body){copyBox.classList.add('swap');setTimeout(function(){title.textContent=copy[index][0];body.textContent=copy[index][1];copyBox.classList.remove('swap')},90)}
  }
  function snap(i,manual){
    i=Math.max(0,Math.min(slides.length-1,i));paint(i);setTrack(-index*w(),true);if(manual)pause();else restart();
  }
  function nextAuto(){var n=index+1;if(n>=slides.length)n=0;paint(n);setTrack(-index*w(),true);restart()}
  function restart(){clearTimeout(timer);timer=setTimeout(nextAuto,SLIDE_MS)}
  function pause(){clearTimeout(timer);clearTimeout(resumeTimer);resumeTimer=setTimeout(restart,RESUME_MS)}

  function point(e){var t=e.touches&&e.touches[0]||e.changedTouches&&e.changedTouches[0]||e;return{x:t.clientX,y:t.clientY}}
  function slideBegin(e){
    if(leaving)return;var p=point(e);slideDrag={x:p.x,y:p.y,dx:0,t:Date.now(),horizontal:false};clearTimeout(timer);clearTimeout(resumeTimer);track.style.transition='none';
  }
  function slideMove(e){
    if(!slideDrag)return;var p=point(e),dx=p.x-slideDrag.x,dy=p.y-slideDrag.y;slideDrag.dx=dx;
    if(!slideDrag.horizontal){if(Math.abs(dx)<7)return;if(Math.abs(dx)<=Math.abs(dy))return;slideDrag.horizontal=true}
    if(e.cancelable)e.preventDefault();
    var d=dx;if((index===0&&d>0)||(index===slides.length-1&&d<0))d*=.28;
    setTrack(-index*w()+d,false);
  }
  function slideEnd(e){
    if(!slideDrag)return;var d=slideDrag,dt=Math.max(1,Date.now()-d.t),velocity=Math.abs(d.dx)/dt,target=index;
    if(d.horizontal&&(Math.abs(d.dx)>44||velocity>.42))target=index+(d.dx<0?1:-1);
    slideDrag=null;snap(target,true);
  }

  function startMax(){return Math.max(1,start.clientWidth-knob.offsetWidth-10)}
  function setStart(p,animate){p=Math.max(0,Math.min(1,p));start.classList.toggle('dragging',!animate);knob.style.transform='translate3d('+(startMax()*p)+'px,0,0)';start.style.setProperty('--dlw-p',String(p));if(fill)fill.style.transform='scaleX('+p+')'}
  function startBegin(e){if(leaving)return;e.stopPropagation();var p=point(e);startDrag={x:p.x,p:0};clearTimeout(timer);if(e.cancelable)e.preventDefault()}
  function startMove(e){if(!startDrag)return;e.stopPropagation();if(e.cancelable)e.preventDefault();var p=point(e);startDrag.p=Math.max(0,Math.min(1,(p.x-startDrag.x)/startMax()));setStart(startDrag.p,false)}
  function startEnd(e){if(!startDrag)return;e.stopPropagation();var p=startDrag.p;startDrag=null;if(p>=.62)finish();else{setStart(0,true);restart()}}

  function removeForce(){try{var u=new URL(location.href);u.searchParams.delete('welcome');history.replaceState(history.state,'',u.pathname+(u.search||'')+(location.hash||'#/'))}catch(e){}}
  function finish(){
    if(leaving)return;leaving=true;clearTimeout(timer);clearTimeout(resumeTimer);setStart(1,true);try{localStorage.setItem(KEY,'done')}catch(e){}removeForce();host.classList.add('leaving');document.documentElement.classList.add('dlw4-enter-home');
    setTimeout(function(){if(host.parentNode)host.parentNode.removeChild(host);window.__DLAVIE_WELCOME_ACTIVE__=false;document.documentElement.classList.remove('dlw4-on','dlw4-enter-home');document.documentElement.classList.add('dlw4-off');try{window.dispatchEvent(new CustomEvent('dlavie:welcome-complete'))}catch(e){}},520);
  }

  if(window.PointerEvent){
    viewport.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse'&&e.button!==0)return;slideBegin(e);try{viewport.setPointerCapture(e.pointerId)}catch(x){}},{passive:false});
    viewport.addEventListener('pointermove',slideMove,{passive:false});
    viewport.addEventListener('pointerup',slideEnd,{passive:false});viewport.addEventListener('pointercancel',slideEnd,{passive:false});
    start.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse'&&e.button!==0)return;startBegin(e);try{start.setPointerCapture(e.pointerId)}catch(x){}},{passive:false});
    start.addEventListener('pointermove',startMove,{passive:false});start.addEventListener('pointerup',startEnd,{passive:false});start.addEventListener('pointercancel',startEnd,{passive:false});
  }else{
    viewport.addEventListener('touchstart',slideBegin,{passive:false});viewport.addEventListener('touchmove',slideMove,{passive:false});viewport.addEventListener('touchend',slideEnd,{passive:false});viewport.addEventListener('touchcancel',slideEnd,{passive:false});
    start.addEventListener('touchstart',startBegin,{passive:false});start.addEventListener('touchmove',startMove,{passive:false});start.addEventListener('touchend',startEnd,{passive:false});start.addEventListener('touchcancel',startEnd,{passive:false});
  }
  dots.forEach(function(d,i){var c=d.cloneNode(true);d.parentNode.replaceChild(c,d);c.addEventListener('click',function(e){e.preventDefault();snap(i,true)})});
  setTrack(0,false);paint(0);setStart(0,true);restart();
  window.addEventListener('resize',function(){setTrack(-index*w(),false);setStart(startDrag?startDrag.p:0,true)},{passive:true});
})();