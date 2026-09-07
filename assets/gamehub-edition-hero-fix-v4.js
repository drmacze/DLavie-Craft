(() => {
  'use strict';
  if (window.__DLAVIE_EDITION_HERO_V4__) return;
  window.__DLAVIE_EDITION_HERO_V4__ = true;

  let raf = 0;
  let observer = null;

  function editionName(card) {
    const text = (card.querySelector('.gh-launch-content h1')?.textContent || '').toLowerCase();
    return text.includes('java') ? 'Minecraft Java' : 'Minecraft Bedrock';
  }

  function apply() {
    raf = 0;
    const root = document.getElementById('dl-gamehub-root');
    if (!root) return;

    root.querySelectorAll('.gh-launch-card').forEach(card => {
      const art = card.querySelector('.gh-edition-badge img');
      if (!art || !art.src) return;

      let media = card.querySelector(':scope > .gh-launch-media');
      if (!media) {
        media = document.createElement('img');
        media.className = 'gh-launch-media gh-edition-hero-media';
        card.insertBefore(media, card.firstChild);
      }

      if (media.src !== art.src) media.src = art.src;
      media.alt = editionName(card);
      media.loading = 'eager';
      media.decoding = 'async';
      media.classList.add('gh-edition-hero-media');
      card.classList.add('gh-edition-hero');
    });
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(apply);
  }

  function watch() {
    const root = document.getElementById('dl-gamehub-root');
    if (!root) {
      setTimeout(watch, 100);
      return;
    }
    if (observer) observer.disconnect();
    observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    apply();
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-action="edition"],[data-action="library"],[data-action="home"]')) {
      setTimeout(schedule, 40);
      setTimeout(schedule, 180);
    }
  }, true);

  window.addEventListener('hashchange', () => setTimeout(schedule, 60));
  window.addEventListener('pageshow', () => setTimeout(schedule, 60));
  document.addEventListener('dlavie:auth-changed', () => setTimeout(schedule, 80));

  watch();
})();
