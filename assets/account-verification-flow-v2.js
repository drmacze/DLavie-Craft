(() => {
  'use strict';

  const PENDING_EMAIL = 'dlavie-pending-verification-email';
  const VERIFY_FLAG = 'verified';
  const SIGNUP_PATH = '/auth/v1/signup';
  const SITE_PATH = '/DLavie-Craft/';
  const initialUrl = new URL(location.href);
  const initialHash = new URLSearchParams((location.hash || '').replace(/^#/, ''));
  const initialType = initialHash.get('type');
  const verifiedCallback = initialUrl.searchParams.get(VERIFY_FLAG) === '1' || initialType === 'signup' || initialType === 'email';

  function verificationRedirect() {
    return `${location.origin}${location.pathname}?${VERIFY_FLAG}=1#/`;
  }

  // Supabase implicit email confirmations append session data to the URL hash.
  // The verification has already happened server-side, so keep the browser URL clean
  // and intentionally ask the user to sign in again through DLavie ID.
  if (initialType === 'signup' || initialType === 'email') {
    const clean = new URL(location.href);
    clean.searchParams.set(VERIFY_FLAG, '1');
    clean.hash = '#/';
    history.replaceState({ ...(history.state || {}), dlavieEmailVerified: true }, '', clean.pathname + clean.search + clean.hash);
  }

  // account-legal-system uses the raw GoTrue signup endpoint. Add our own redirect
  // before that script is loaded so verification comes back to the DLavie site.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function dlavieVerificationFetch(input, init) {
    try {
      const raw = typeof input === 'string' ? input : input?.url;
      if (raw) {
        const url = new URL(raw, location.href);
        if (url.hostname.endsWith('.supabase.co') && url.pathname === SIGNUP_PATH) {
          url.searchParams.set('redirect_to', verificationRedirect());
          try {
            const body = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
            if (body?.email) localStorage.setItem(PENDING_EMAIL, String(body.email).trim());
          } catch {}
          if (typeof input === 'string') input = url.toString();
        }
      }
    } catch {}
    return nativeFetch(input, init);
  };

  const emailDomain = email => String(email || '').split('@')[1]?.toLowerCase() || '';
  function inboxUrl(email) {
    const domain = emailDomain(email);
    if (domain === 'gmail.com' || domain === 'googlemail.com') return 'https://mail.google.com/mail/u/0/#inbox';
    if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) return 'https://outlook.live.com/mail/0/inbox';
    if (domain === 'yahoo.com' || domain.startsWith('yahoo.')) return 'https://mail.yahoo.com/';
    if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') return 'https://www.icloud.com/mail/';
    return 'message://';
  }

  function goPortal(mode) {
    const url = new URL(location.href);
    url.searchParams.delete(VERIFY_FLAG);
    if (mode) url.searchParams.set('dlavie', mode);
    else url.searchParams.delete('dlavie');
    url.hash = '#/';
    location.assign(url.pathname + url.search + url.hash);
  }

  function makeChest() {
    return `<div class="dl-mail-chest" aria-hidden="true">
      <div class="dl-mail-chest-aura"></div>
      <div class="dl-mail-chest-lid"><i></i></div>
      <div class="dl-mail-letter"><b>VERIFY</b><span>DLavie ID</span></div>
      <div class="dl-mail-chest-body"><i></i><b></b></div>
      <span class="dl-mail-xp xp-1"></span><span class="dl-mail-xp xp-2"></span><span class="dl-mail-xp xp-3"></span><span class="dl-mail-xp xp-4"></span>
    </div>`;
  }

  function decorateInbox() {
    const portal = document.getElementById('dl-account-portal');
    const card = portal?.querySelector('.dl-account-card');
    if (!card || card.dataset.dlInboxV2 === '1') return false;
    const title = card.querySelector('h2')?.textContent?.trim().toLowerCase() || '';
    if (!title.includes('periksa inbox')) return false;
    card.dataset.dlInboxV2 = '1';
    portal.classList.add('dl-inbox-v2-open');
    const email = localStorage.getItem(PENDING_EMAIL) || '';
    card.innerHTML = `
      <span class="dl-account-eyebrow">Verifikasi email</span>
      <div class="dl-inbox-v2-stage">${makeChest()}</div>
      <h2>Cek inbox kamu</h2>
      <p class="dl-account-lead">Link verifikasi sudah dikirim. Buka email tersebut untuk mengaktifkan DLavie ID kamu.</p>
      <div class="dl-inbox-address"><span>Email tujuan</span><strong>${email ? escapeHtml(email) : 'Email yang baru didaftarkan'}</strong><i>Link hanya perlu dibuka satu kali.</i></div>
      <div class="dl-inbox-v2-actions">
        <button type="button" class="dl-account-btn primary" data-open-inbox data-dl-no-icon="true"><span class="dl-inbox-mail-pixel" aria-hidden="true"></span>Buka inbox</button>
        <button type="button" class="dl-account-btn secondary" data-login data-dl-no-icon="true">Sudah verifikasi? Login</button>
        <button type="button" class="dl-account-link dl-inbox-change" data-register data-dl-no-icon="true">Gunakan email lain</button>
      </div>
      <div class="dl-inbox-tip"><span>TIP</span><p>Belum terlihat? Cek folder <b>Spam</b>, <b>Promotions</b>, atau tunggu beberapa saat.</p></div>`;
    card.querySelector('[data-open-inbox]').onclick = () => {
      const target = inboxUrl(email);
      if (target === 'message://') location.href = target;
      else window.open(target, '_blank', 'noopener,noreferrer');
    };
    card.querySelector('[data-login]').onclick = () => goPortal('login');
    card.querySelector('[data-register]').onclick = () => goPortal('register');
    return true;
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  }

  function scheduleInboxSweep() {
    let tries = 0;
    const run = () => {
      if (decorateInbox() || tries++ > 18) return;
      setTimeout(run, 180 + tries * 18);
    };
    setTimeout(run, 120);
  }

  function verifiedScene() {
    return `<div class="dl-verified-scene" aria-hidden="true">
      <div class="dl-verified-beacon"><i></i><b></b></div>
      <div class="dl-verified-bee"><span class="wing w1"></span><span class="wing w2"></span><span class="bee-body"><i></i><b></b></span></div>
      <span class="dl-verify-orb o1"></span><span class="dl-verify-orb o2"></span><span class="dl-verify-orb o3"></span><span class="dl-verify-orb o4"></span><span class="dl-verify-orb o5"></span>
      <div class="dl-verify-blocks"><i></i><i></i><i></i><i></i><i></i></div>
    </div>`;
  }

  function renderVerifiedPage() {
    if (!verifiedCallback || document.getElementById('dl-email-verified-page')) return;
    document.getElementById('dl-account-portal')?.remove();
    const email = localStorage.getItem(PENDING_EMAIL) || '';
    const page = document.createElement('div');
    page.id = 'dl-email-verified-page';
    page.innerHTML = `<main class="dl-verified-shell">
      <header><img src="${SITE_PATH}assets/dlavie-logo-transparent.png" alt=""><span>DLavie Craft</span><b>DLavie ID</b></header>
      <section class="dl-verified-card">
        ${verifiedScene()}
        <div class="dl-verified-copy">
          <span class="dl-verified-kicker"><i></i>VERIFICATION COMPLETE</span>
          <h1>Email sudah<br>terverifikasi.</h1>
          <p>DLavie ID kamu sudah aktif. Masuk kembali untuk memilih identity, role komunitas, dan mengambil Collector Card pertamamu.</p>
          ${email ? `<div class="dl-verified-email"><span>Akun aktif</span><strong>${escapeHtml(email)}</strong></div>` : ''}
          <div class="dl-verified-actions">
            <button type="button" class="dl-verified-login" data-login data-dl-no-icon="true"><span>Masuk ke DLavie ID</span><i>→</i></button>
            <button type="button" class="dl-verified-home" data-home data-dl-no-icon="true">Kembali ke beranda</button>
          </div>
        </div>
      </section>
      <footer><span>DLavie Craft</span><i></i><span>Email verification</span></footer>
    </main>`;
    document.body.append(page);
    document.body.classList.add('dl-verified-open');
    page.querySelector('[data-login]').onclick = () => goPortal('login');
    page.querySelector('[data-home]').onclick = () => goPortal(null);
  }

  function prefillLogin() {
    const mode = new URL(location.href).searchParams.get('dlavie');
    if (mode !== 'login') return;
    const email = localStorage.getItem(PENDING_EMAIL);
    if (!email) return;
    let tries = 0;
    const run = () => {
      const input = document.querySelector('#dl-account-portal input[type="email"]');
      if (input) {
        if (!input.value) {
          input.value = email;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }
      if (tries++ < 18) setTimeout(run, 120);
    };
    setTimeout(run, 80);
  }

  document.addEventListener('submit', event => {
    const form = event.target.closest?.('#dl-account-portal form');
    if (!form) return;
    const mode = new URL(location.href).searchParams.get('dlavie');
    if (mode === 'register') {
      const email = form.querySelector('input[type="email"]')?.value?.trim();
      if (email) localStorage.setItem(PENDING_EMAIL, email);
      scheduleInboxSweep();
    }
  }, true);

  window.addEventListener('dlavie-auth-session', () => {
    // The pending email is still useful to pre-fill a manual sign-in after verification,
    // but no inbox card needs to remain once a session exists.
    document.querySelector('#dl-account-portal')?.classList.remove('dl-inbox-v2-open');
  });

  window.addEventListener('popstate', prefillLogin);
  window.addEventListener('pageshow', () => { renderVerifiedPage(); prefillLogin(); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { renderVerifiedPage(); prefillLogin(); }, { once: true });
  } else {
    renderVerifiedPage();
    prefillLogin();
  }
})();