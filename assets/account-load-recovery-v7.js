(() => {
  'use strict';

  const MODE = 'account';
  const LOADING_TEXT = 'Memuat profil dan status persetujuan';
  const PORTAL_ID = 'dl-account-portal';
  const SESSION_KEY = 'sb-ydaeukhqwishlrjyfktk-auth-token';

  let timer = 0;
  let retryCount = 0;
  let observer = null;
  let raf = 0;

  function currentMode() {
    try { return new URL(location.href).searchParams.get('dlavie'); }
    catch { return null; }
  }

  function validSession() {
    try {
      const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return !!(value?.access_token && value?.refresh_token);
    } catch { return false; }
  }

  function loadingCard() {
    if (currentMode() !== MODE) return null;
    const portal = document.getElementById(PORTAL_ID);
    const card = portal?.querySelector('.dl-account-card');
    if (!portal || !card) return null;
    return (card.textContent || '').includes(LOADING_TEXT) ? card : null;
  }

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = 0;
  }

  function triggerAccountRender() {
    try {
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    } catch {
      window.dispatchEvent(new Event('popstate'));
    }
  }

  function showRecovery(card, message) {
    if (!card?.isConnected) return;
    const portal = card.closest('#' + PORTAL_ID);
    portal?.classList.remove('dl-account-loading-v7');
    portal?.classList.add('dl-account-load-error-v7');

    const lead = card.querySelector('.dl-account-lead');
    if (lead) lead.textContent = message;

    let actions = card.querySelector('.dl-account-load-actions-v7');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'dl-account-load-actions-v7';
      actions.innerHTML = '<button type="button" class="dl-account-btn primary" data-dl-account-retry>Coba lagi</button>';
      card.appendChild(actions);
    }
    const button = actions.querySelector('[data-dl-account-retry]');
    if (button && button.dataset.bound !== '1') {
      button.dataset.bound = '1';
      button.addEventListener('click', () => {
        retryCount = 0;
        portal?.classList.remove('dl-account-load-error-v7');
        actions.remove();
        if (lead) lead.textContent = 'Memuat ulang profil…';
        triggerAccountRender();
        setTimeout(schedule, 120);
      });
    }
  }

  function arm(card) {
    if (!card?.isConnected || timer) return;
    const portal = card.closest('#' + PORTAL_ID);
    portal?.classList.add('dl-account-loading-v7');
    portal?.classList.remove('dl-account-load-error-v7');

    timer = setTimeout(() => {
      timer = 0;
      const current = loadingCard();
      if (!current) { retryCount = 0; return; }

      if (!navigator.onLine) {
        showRecovery(current, 'Koneksi internet terputus. Sambungkan kembali lalu coba lagi.');
        return;
      }

      if (!validSession()) {
        showRecovery(current, 'Sesi akun sudah tidak valid. Tutup halaman akun lalu masuk kembali.');
        return;
      }

      if (retryCount < 1) {
        retryCount += 1;
        triggerAccountRender();
        setTimeout(schedule, 180);
        return;
      }

      showRecovery(current, 'Profil belum berhasil dimuat. Coba lagi tanpa perlu me-refresh seluruh website.');
    }, retryCount ? 7000 : 5200);
  }

  function run() {
    raf = 0;
    const card = loadingCard();
    if (card) {
      arm(card);
      return;
    }

    clearTimer();
    const portal = document.getElementById(PORTAL_ID);
    portal?.classList.remove('dl-account-loading-v7');
    if (!portal?.classList.contains('dl-account-load-error-v7')) retryCount = 0;
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(run);
  }

  function start() {
    observer?.disconnect();
    observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    schedule();
  }

  ['pageshow', 'popstate', 'hashchange', 'online'].forEach(name => window.addEventListener(name, schedule));
  window.addEventListener('dlavie-auth-session', () => setTimeout(schedule, 80));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
