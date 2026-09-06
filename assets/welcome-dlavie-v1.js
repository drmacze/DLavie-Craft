(() => {
  'use strict';

  const STORAGE_KEY = 'dlavie:welcome:v1';
  const FORCE_PARAM = 'welcome';
  const SLIDE_MS = 4800;
  const RESUME_MS = 6200;
  const slides = [
    { image: '/DLavie-Craft/assets/welcome-start-best.webp?v=20260907w1', eyebrow: 'DLAVIE CRAFT', title: 'Mulai dengan yang terbaik.', body: 'Temukan mod, add-on, map, skin dan project Minecraft pilihan komunitas.' },
    { image: '/DLavie-Craft/assets/welcome-lets-build.webp?v=20260907w1', eyebrow: 'CREATE TOGETHER', title: 'Bangun. Bagikan. Berkembang.', body: 'Jelajahi karya creator atau ubah akunmu menjadi Crafter untuk mulai mempublikasikan project.' },
    { image: '/DLavie-Craft/assets/welcome-free-mod.webp?v=20260907w1', eyebrow: 'FREE COMMUNITY MODS', title: 'Minecraft, dibuat lebih luas.', body: 'Simpan project favorit, download build terbaru, beri rating dan temukan creator baru.' }
  ];

  const $ = (q, r = document) => r.querySelector(q);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function shouldShow() {
    const url = new URL(location.href);
    if (url.searchParams.get(FORCE_PARAM) === '1') return true;
    if (localStorage.getItem(STORAGE_KEY) === 'done') return false;
    const hash = location.hash || '#/';
    return hash === '#/' || hash === '#' || hash === '';
  }

  function create() {
    if (!shouldShow() || $('#dl-welcome')) return;
    const host = document.createElement('div');
    host.id = 'dl-welcome';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-label', 'Welcome to DLavie Craft');
    host.innerHTML = `
      <div class="dlw-frame">
        <div class="dlw-progress" aria-hidden="true"><i></i></div>
        <div class="dlw-topbar">
          <span class="dlw-brand">DLAVIE</span>
          <button class="dlw-skip" type="button" data-dlw-skip>Lewati</button>
        </div>
        <div class="dlw-viewport">
          <div class="dlw-track">
            ${slides.map((s, i) => `<section class="dlw-slide" data-slide="${i}"><img src="${s.image}" alt="" draggable="false"><div class="dlw-shade"></div></section>`).join('')}
          </div>
        </div>
        <div class="dlw-copy" aria-live="polite">
          <span class="dlw-eyebrow"></span>
          <h1></h1>
          <p></p>
        </div>
        <div class="dlw-dots" role="tablist" aria-label="Welcome slides">
          ${slides.map((_, i) => `<button type="button" role="tab" aria-label="Slide ${i+1}" data-dlw-dot="${i}"></button>`).join('')}
        </div>
        <div class="dlw-start" data-dlw-start tabindex="0" role="button" aria-label="Swipe untuk masuk ke Home">
          <div class="dlw-start-fill"></div>
          <div class="dlw-start-knob" aria-hidden="true"><span>→</span></div>
          <span class="dlw-start-label">Swipe to Start</span>
        </div>
      </div>`;
    document.body.appendChild(host);
    document.documentElement.classList.add('dl-welcome-lock');
    requestAnimationFrame(() => host.classList.add('is-ready'));
    bind(host);
  }

  function bind(host) {
    const track = $('.dlw-track', host);
    const copy = $('.dlw-copy', host);
    const progress = $('.dlw-progress i', host);
    const dots = Array.from(host.querySelectorAll('[data-dlw-dot]'));
    const start = $('[data-dlw-start]', host);
    const knob = $('.dlw-start-knob', start);
    const fill = $('.dlw-start-fill', start);
    let index = 0;
    let autoTimer = 0;
    let resumeTimer = 0;
    let progressTimer = 0;
    let drag = null;
    let startDrag = null;
    let finished = false;

    function render(animate = true) {
      track.style.transition = animate ? '' : 'none';
      track.style.transform = `translate3d(${-index * 100}%,0,0)`;
      const s = slides[index];
      $('.dlw-eyebrow', copy).textContent = s.eyebrow;
      $('h1', copy).textContent = s.title;
      $('p', copy).textContent = s.body;
      dots.forEach((d, i) => { d.classList.toggle('active', i === index); d.setAttribute('aria-selected', i === index ? 'true' : 'false'); });
      restartProgress();
      if (!animate) requestAnimationFrame(() => track.style.transition = '');
    }

    function restartProgress() {
      clearTimeout(progressTimer);
      progress.style.transition = 'none';
      progress.style.transform = 'scaleX(0)';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        progress.style.transition = `transform ${SLIDE_MS}ms linear`;
        progress.style.transform = 'scaleX(1)';
      }));
      progressTimer = setTimeout(() => {}, SLIDE_MS);
    }

    function go(next, manual = false) {
      index = (next + slides.length) % slides.length;
      render(true);
      if (manual) pauseThenResume();
    }

    function startAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => go(index + 1, false), SLIDE_MS);
    }

    function pauseThenResume() {
      clearInterval(autoTimer);
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(startAuto, RESUME_MS);
    }

    dots.forEach((d, i) => d.addEventListener('click', () => go(i, true)));

    const viewport = $('.dlw-viewport', host);
    viewport.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { id:e.pointerId, x:e.clientX, y:e.clientY, t:performance.now() };
      viewport.setPointerCapture?.(e.pointerId);
      pauseThenResume();
    });
    viewport.addEventListener('pointerup', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      const dt = Math.max(1, performance.now() - drag.t);
      const fast = Math.abs(dx / dt) > .45;
      if (Math.abs(dx) > Math.abs(dy) && (Math.abs(dx) > 48 || fast)) go(index + (dx < 0 ? 1 : -1), true);
      drag = null;
    });
    viewport.addEventListener('pointercancel', () => drag = null);

    function setStartProgress(p) {
      const max = Math.max(0, start.clientWidth - knob.offsetWidth - 12);
      const x = clamp(p, 0, 1) * max;
      knob.style.transform = `translate3d(${x}px,0,0)`;
      fill.style.transform = `scaleX(${clamp(p,0,1)})`;
      start.style.setProperty('--dlw-start-p', clamp(p,0,1));
    }

    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(autoTimer); clearTimeout(resumeTimer);
      setStartProgress(1);
      localStorage.setItem(STORAGE_KEY, 'done');
      host.classList.add('is-leaving');
      document.documentElement.classList.add('dl-welcome-enter-home');
      const url = new URL(location.href);
      if (url.searchParams.get(FORCE_PARAM) === '1') { url.searchParams.delete(FORCE_PARAM); history.replaceState(history.state, '', url.pathname + url.search + (location.hash || '#/')); }
      if (!(location.hash === '#/' || location.hash === '#' || location.hash === '')) location.hash = '#/';
      setTimeout(() => {
        host.remove();
        document.documentElement.classList.remove('dl-welcome-lock','dl-welcome-enter-home');
        window.dispatchEvent(new CustomEvent('dlavie:welcome-complete'));
      }, 720);
    }

    start.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const rect = start.getBoundingClientRect();
      startDrag = { id:e.pointerId, left:rect.left, width:rect.width, origin:e.clientX };
      start.setPointerCapture?.(e.pointerId);
      start.classList.add('dragging');
    });
    start.addEventListener('pointermove', e => {
      if (!startDrag || e.pointerId !== startDrag.id) return;
      const usable = Math.max(1, startDrag.width - knob.offsetWidth - 12);
      const p = (e.clientX - startDrag.origin) / usable;
      setStartProgress(p);
    });
    function endStart(e) {
      if (!startDrag || (e?.pointerId != null && e.pointerId !== startDrag.id)) return;
      const transform = getComputedStyle(knob).transform;
      let x = 0;
      if (transform && transform !== 'none') { try { x = new DOMMatrixReadOnly(transform).m41; } catch {} }
      const max = Math.max(1, start.clientWidth - knob.offsetWidth - 12);
      const p = x / max;
      start.classList.remove('dragging');
      startDrag = null;
      if (p >= .72) finish(); else setStartProgress(0);
    }
    start.addEventListener('pointerup', endStart);
    start.addEventListener('pointercancel', endStart);
    start.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); } });

    $('[data-dlw-skip]', host).addEventListener('click', finish);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearInterval(autoTimer); else if (!finished) startAuto(); });

    render(false);
    startAuto();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', create, { once:true });
  else create();
  window.addEventListener('pageshow', () => { if (!$('#dl-welcome')) create(); });
})();