(function(){
  'use strict';
  var KEY='dlavie:welcome:v3';
  var SLIDE_MS=4600;
  var HOME_WAIT_MS=9000;
  var slides=[
    {eyebrow:'DLAVIE',title:'Mulai dengan yang terbaik.',body:'Temukan mod, add-on, map, skin dan project Minecraft pilihan komunitas.'},
    {eyebrow:'CREATE TOGETHER',title:'Bangun. Bagikan. Berkembang.',body:'Jelajahi karya creator atau aktifkan akun Crafter untuk mempublikasikan projectmu.'},
    {eyebrow:'FREE MINECRAFT MOD',title:'Mainkan lebih banyak.',body:'Simpan favorit, download build terbaru, beri rating dan temukan creator baru.'}
  ];
  function getStored(){try{return window.localStorage?localStorage.getItem(KEY):null}catch(e){return null}}
  function setStored(){try{if(window.localStorage)localStorage.setItem(KEY,'done')}catch(e){}}
  function forced(){return location.search.indexOf('welcome=1')!==-1}
  function atHome(){var h=location.hash||'';return h===''||h==='#'||h==='#/'}
  function shouldShow(){return atHome()&&(forced()||getStored()!=='done')}
  function list(q,root){return Array.prototype.slice.call((root||document).querySelectorAll(q))}
  function appReady(){var root=document.getElementById('root');return !!(document.getElementById('dl-gamehub-root')||(root&&root.childElementCount>0))}
  function removeForce(){if(!forced())return;try{var parts=location.search.replace(/^\?/,'').split('&').filter(function(p){return p&&p.split('=')[0]!=='welcome'});var next=location.pathname+(parts.length?'?'+parts.join('&'):'')+(location.hash||'#/');history.replaceState(history.state,'',next)}catch(e){}}
  function disableWelcome(host){if(host&&host.parentNode)host.parentNode.removeChild(host);document.documentElement.classList.add('dlw3-skip');document.documentElement.classList.remove('dlw3-lock','dlw3-live','dlw3-enter-home')}
  function boot(){
    var host=document.getElementById('dl-welcome-v3');
    if(!host)return;
    if(!shouldShow()){disableWelcome(host);return}
    document.documentElement.classList.remove('dlw3-skip');
    document.documentElement.classList.add('dlw3-live','dlw3-lock');
    if(host.getAttribute('data-bound')==='1')return;
    host.setAttribute('data-bound','1');
    bind(host);
  }
  function bind(host){
    var track=host.querySelector('.dlw3-track');
    var copy=host.querySelector('.dlw3-copy');
    var dots=list('[data-dlw3-dot]',host);
    var bars=list('[data-dlw3-progress]',host);
    var start=host.querySelector('.dlw3-start');
    var knob=host.querySelector('.dlw3-knob');
    var fill=host.querySelector('.dlw3-fill');
    var frame=host.querySelector('.dlw3-frame');
    if(!track||!copy||!start||!knob||!fill||!frame){disableWelcome(host);return}
    var index=0,timer=0,swipe=null,drag=null,leaving=false;
    function render(animate){
      if(animate===false)track.style.transition='none';
      track.style.transform='translate3d('+(-index*100)+'%,0,0)';
      var s=slides[index];
      var eyebrow=copy.querySelector('span'),title=copy.querySelector('h1'),body=copy.querySelector('p');
      if(eyebrow)eyebrow.textContent=s.eyebrow;
      if(title)title.textContent=s.title;
      if(body)body.textContent=s.body;
      dots.forEach(function(d,i){d.classList.toggle('active',i===index)});
      bars.forEach(function(b,i){b.classList.remove('active','done');if(i<index)b.classList.add('done');if(i===index)b.classList.add('active')});
      if(animate===false)setTimeout(function(){track.style.transition=''},20);
      restart();
    }
    function go(i){index=(i+slides.length)%slides.length;render(true)}
    function restart(){clearTimeout(timer);timer=setTimeout(function(){go(index+1)},SLIDE_MS)}
    dots.forEach(function(d,i){d.addEventListener('click',function(){go(i)})});
    frame.addEventListener('touchstart',function(e){if(!e.touches||!e.touches[0])return;var t=e.touches[0];swipe={x:t.clientX,y:t.clientY};clearTimeout(timer)},{passive:true});
    frame.addEventListener('touchend',function(e){if(!swipe||!e.changedTouches||!e.changedTouches[0]){restart();return}var t=e.changedTouches[0],dx=t.clientX-swipe.x,dy=t.clientY-swipe.y;swipe=null;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>44)go(index+(dx<0?1:-1));else restart()},{passive:true});
    function setDrag(p){p=Math.max(0,Math.min(1,p));var max=Math.max(0,start.clientWidth-knob.offsetWidth-12);knob.style.transform='translate3d('+(p*max)+'px,0,0)';fill.style.transform='scaleX('+p+')';start.setAttribute('data-p',String(p))}
    function begin(x){var r=start.getBoundingClientRect();drag={x0:x,w:r.width};start.classList.add('dragging')}
    function move(x){if(!drag)return;var usable=Math.max(1,drag.w-knob.offsetWidth-12);setDrag((x-drag.x0)/usable)}
    function end(){if(!drag)return;var p=parseFloat(start.getAttribute('data-p')||'0');drag=null;start.classList.remove('dragging');if(p>=.7)finish();else setDrag(0)}
    start.addEventListener('touchstart',function(e){e.stopPropagation();if(e.touches&&e.touches[0])begin(e.touches[0].clientX)},{passive:true});
    start.addEventListener('touchmove',function(e){if(e.touches&&e.touches[0]){e.preventDefault();move(e.touches[0].clientX)}},{passive:false});
    start.addEventListener('touchend',function(e){e.stopPropagation();end()},{passive:true});
    start.addEventListener('mousedown',function(e){if(e.button!==0)return;begin(e.clientX)});
    window.addEventListener('mousemove',function(e){move(e.clientX)});
    window.addEventListener('mouseup',end);
    start.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();finish()}});
    function leaveNow(){host.classList.add('leaving');document.documentElement.classList.add('dlw3-enter-home');setTimeout(function(){if(host.parentNode)host.parentNode.removeChild(host);document.documentElement.classList.remove('dlw3-lock','dlw3-live','dlw3-enter-home');try{window.dispatchEvent(new CustomEvent('dlavie:welcome-complete'))}catch(e){}},620)}
    function finish(){
      if(leaving)return;
      leaving=true;clearTimeout(timer);setStored();setDrag(1);removeForce();
      var label=start.querySelector('strong');
      if(appReady()){leaveNow();return}
      if(label)label.textContent='Menyiapkan Home...';
      start.classList.add('waiting');
      var started=Date.now();
      var wait=setInterval(function(){
        if(!host.isConnected){clearInterval(wait);return}
        if(appReady()){clearInterval(wait);leaveNow();return}
        if(Date.now()-started>=HOME_WAIT_MS){clearInterval(wait);leaving=false;start.classList.remove('waiting');setDrag(0);if(label)label.textContent='Swipe to Start'}
      },100);
    }
    var skip=host.querySelector('[data-dlw3-skip]');
    if(skip)skip.addEventListener('click',finish);
    render(false);
  }
  function start(){try{boot()}catch(e){document.documentElement.classList.remove('dlw3-lock','dlw3-live');document.documentElement.classList.add('dlw3-skip')}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  setTimeout(start,0);
  window.addEventListener('pageshow',start);
})();
