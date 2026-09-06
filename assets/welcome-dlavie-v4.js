(function(){
  'use strict';
  var KEY='dlavie:welcome:v4',SLIDE_MS=5400;
  var copy=[
    ['','Temukan mod yang selalu kamu cari.','Jelajahi mod, add-on, map, skin, shader dan project Minecraft pilihan dalam satu tempat.'],
    ['','Bangun dan bagikan duniamu.','Temukan karya komunitas atau aktifkan akun Crafter untuk mempublikasikan projectmu sendiri.'],
    ['','Mainkan lebih banyak, gratis.','Simpan favorit, download build terbaru, beri rating dan temukan creator baru.']
  ];
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function stored(){try{return localStorage.getItem(KEY)==='done'}catch(e){return false}}
  function forced(){return location.search.indexOf('welcome=1')!==-1}
  function home(){var h=location.hash||'';return h===''||h==='#'||h==='#/'}
  function removeForce(){if(!forced())return;try{var u=new URL(location.href);u.searchParams.delete('welcome');history.replaceState(history.state,'',u.pathname+(u.search||'')+(location.hash||'#/'))}catch(e){}}
  var host=q('#dl-welcome-v4');
  if(!host)return;
  if(!home()||(!forced()&&stored())){host.remove();document.documentElement.classList.add('dlw4-off');document.documentElement.classList.remove('dlw4-on');return}
  window.__DLAVIE_WELCOME_ACTIVE__=true;
  document.documentElement.classList.add('dlw4-on');
  document.documentElement.classList.remove('dlw4-off');
  var track=q('.dlw4-track',host),dots=qa('[data-dlw4-dot]',host),copyBox=q('.dlw4-copy',host),start=q('.dlw4-start',host),knob=q('.dlw4-knob',host),fill=q('.dlw4-fill',host),frame=q('.dlw4-frame',host);
  var index=0,timer=0,touch=null,drag=null,leaving=false;
  function render(animate){
    if(!track)return;
    track.style.transition=animate===false?'none':'';
    track.style.transform='translate3d('+(-index*100)+'%,0,0)';
    var c=copy[index],e=q('span',copyBox),h=q('h1',copyBox),p=q('p',copyBox);
    if(e)e.textContent=c[0];if(h)h.textContent=c[1];if(p)p.textContent=c[2];
    dots.forEach(function(d,i){d.classList.toggle('active',i===index);d.setAttribute('aria-current',i===index?'true':'false')});
    if(animate===false)setTimeout(function(){track.style.transition=''},20);
    clearTimeout(timer);timer=setTimeout(function(){go(index+1)},SLIDE_MS);
  }
  function go(i){index=(i+copy.length)%copy.length;render(true);warmNext()}
  function warmNext(){var next=track&&track.children[(index+1)%copy.length];var img=next&&next.querySelector('img');if(img&&img.loading==='lazy')img.loading='eager'}
  dots.forEach(function(d,i){d.addEventListener('click',function(){go(i)})});
  frame.addEventListener('touchstart',function(e){var t=e.touches&&e.touches[0];if(!t)return;touch={x:t.clientX,y:t.clientY};clearTimeout(timer)},{passive:true});
  frame.addEventListener('touchend',function(e){var t=e.changedTouches&&e.changedTouches[0];if(!touch||!t){render(true);return}var dx=t.clientX-touch.x,dy=t.clientY-touch.y;touch=null;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>40)go(index+(dx<0?1:-1));else render(true)},{passive:true});
  function setDrag(p){p=Math.max(0,Math.min(1,p));var max=Math.max(0,start.clientWidth-knob.offsetWidth-10);knob.style.transform='translate3d('+(p*max)+'px,0,0)';fill.style.transform='scaleX('+p+')';start.setAttribute('data-p',String(p))}
  function begin(x){var r=start.getBoundingClientRect();drag={x:x,w:r.width};start.classList.add('dragging');clearTimeout(timer)}
  function move(x){if(!drag)return;setDrag((x-drag.x)/Math.max(1,drag.w-knob.offsetWidth-10))}
  function end(){if(!drag)return;var p=parseFloat(start.getAttribute('data-p')||'0');drag=null;start.classList.remove('dragging');if(p>=.66)finish();else{setDrag(0);render(true)}}
  start.addEventListener('touchstart',function(e){e.stopPropagation();var t=e.touches&&e.touches[0];if(t)begin(t.clientX)},{passive:true});
  start.addEventListener('touchmove',function(e){var t=e.touches&&e.touches[0];if(t){e.preventDefault();move(t.clientX)}},{passive:false});
  start.addEventListener('touchend',function(e){e.stopPropagation();end()},{passive:true});
  start.addEventListener('pointerdown',function(e){if(e.pointerType==='touch')return;begin(e.clientX);try{start.setPointerCapture(e.pointerId)}catch(x){}});
  start.addEventListener('pointermove',function(e){if(e.pointerType!=='touch')move(e.clientX)});
  start.addEventListener('pointerup',function(e){if(e.pointerType!=='touch')end()});
  start.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();finish()}});
  function finish(){
    if(leaving)return;leaving=true;clearTimeout(timer);setDrag(1);
    try{localStorage.setItem(KEY,'done')}catch(e){}
    removeForce();host.classList.add('leaving');document.documentElement.classList.add('dlw4-enter-home');
    setTimeout(function(){
      if(host.parentNode)host.parentNode.removeChild(host);
      window.__DLAVIE_WELCOME_ACTIVE__=false;
      document.documentElement.classList.remove('dlw4-on','dlw4-enter-home');
      document.documentElement.classList.add('dlw4-off');
      try{window.dispatchEvent(new CustomEvent('dlavie:welcome-complete'))}catch(e){}
    },560);
  }
  render(false);setTimeout(warmNext,900);
})();