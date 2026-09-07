(() => {
  'use strict';
  if (window.__DLAVIE_GAMEHUB_UI_V5__) return;
  window.__DLAVIE_GAMEHUB_UI_V5__ = true;

  const AUTH_KEY = 'sb-ydaeukhqwishlrjyfktk-auth-token';
  const BASE = '/DLavie-Craft/assets/';
  const JAVA_ART = BASE + 'minecraft-java-hq.webp?v=20260907u5';
  const BEDROCK_ART = BASE + 'minecraft-bedrock-hq.webp?v=20260907u5';
  const GUEST_AVATAR = BASE + 'avatar-guest-hq.webp?v=20260907u5';
  let raf = 0;
  let observer = null;

  function session() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const s = parsed?.currentSession || parsed?.session || parsed;
      return s?.access_token && s?.user ? s : null;
    } catch {
      return null;
    }
  }

  function accountAvatar() {
    const u = session()?.user;
    const m = u?.user_metadata || {};
    return m.avatar_url || m.picture || m.avatar || m.photo_url || GUEST_AVATAR;
  }

  function editionFor(card) {
    return (card.querySelector('.gh-launch-content h1')?.textContent || '').toLowerCase().includes('java') ? 'java' : 'bedrock';
  }

  function setImage(img, src, alt = '') {
    if (!img) return;
    const absolute = new URL(src, location.href).href;
    if (img.src !== absolute) img.src = src;
    if (alt) img.alt = alt;
    img.decoding = 'async';
  }

  function ensureProfileAvatar(root, src) {
    root.querySelectorAll('.gh-bottom-nav [data-action="profile"]').forEach(button => {
      let image = button.querySelector('.gh-nav-profile-avatar');
      if (!image) {
        image = document.createElement('img');
        image.className = 'gh-nav-profile-avatar';
        image.alt = session() ? 'Avatar akun' : 'Avatar tamu';
        const icon = button.querySelector('svg');
        if (icon) icon.replaceWith(image);
        else button.prepend(image);
      }
      setImage(image, src, session() ? 'Avatar akun' : 'Avatar tamu');
    });
  }

  function polish() {
    raf = 0;
    const root = document.getElementById('dl-gamehub-root');
    if (!root) return;

    const s = session();
    const avatar = accountAvatar();

    root.querySelectorAll('.gh-launch-card').forEach(card => {
      const edition = editionFor(card);
      const src = edition === 'java' ? JAVA_ART : BEDROCK_ART;
      let media = card.querySelector(':scope > .gh-launch-media');
      if (!media) {
        media = document.createElement('img');
        media.className = 'gh-launch-media';
        card.insertBefore(media, card.firstChild);
      }
      media.classList.add('gh-edition-hq');
      media.loading = 'eager';
      setImage(media, src, edition === 'java' ? 'Minecraft Java Edition' : 'Minecraft Bedrock Edition');
      card.querySelectorAll('.gh-edition-badge').forEach(el => el.remove());
    });

    root.querySelectorAll('.gh-user-avatar img').forEach(img => setImage(img, avatar, s ? 'Avatar akun' : 'Avatar tamu'));
    ensureProfileAvatar(root, avatar);

    root.querySelectorAll('.gh-project-card > img, .gh-mini-project > img, .gh-library-card > img, .gh-saved-card > img').forEach(img => {
      img.classList.add('gh-project-thumb-fixed');
      img.decoding = 'async';
    });
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(polish);
  }

  function openLogin() {
    if (session()) return false;
    try {
      const url = new URL(location.href);
      url.searchParams.set('dlavie', 'login');
      history.pushState({ dlaviePortal: 'login' }, '', url.pathname + url.search + (location.hash || '#/'));
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    } catch {}

    const trigger = () => {
      const btn = document.querySelector('#dl-account-entry, #dl-shell-account-entry, #dl-shell-account-entry-mobile');
      if (btn) btn.click();
    };
    requestAnimationFrame(trigger);
    setTimeout(trigger, 120);
    setTimeout(trigger, 420);
    return true;
  }

  document.addEventListener('click', event => {
    if (session()) return;
    const target = event.target.closest('.gh-bottom-nav [data-action="profile"], .gh-user-avatar, .gh-drawer [data-go="profile"], [data-action="profile"]');
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openLogin();
  }, true);

  window.addEventListener('hashchange', () => setTimeout(schedule, 40));
  window.addEventListener('pageshow', () => setTimeout(schedule, 40));
  window.addEventListener('popstate', () => setTimeout(schedule, 40));
  window.addEventListener('storage', event => {
    if (event.key === AUTH_KEY) setTimeout(schedule, 40);
  });
  document.addEventListener('dlavie:auth-changed', () => setTimeout(schedule, 40));
  document.addEventListener('dlavie:account-updated', () => setTimeout(schedule, 40));

  function watch() {
    const root = document.getElementById('dl-gamehub-root');
    if (!root) {
      setTimeout(watch, 80);
      return;
    }
    observer?.disconnect();
    observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    polish();
  }

  watch();
})();
