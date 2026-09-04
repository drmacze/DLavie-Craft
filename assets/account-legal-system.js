(() => {
  'use strict';

  const SUPABASE_URL = 'https://ydaeukhqwishlrjyfktk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_XNXU6SVeM-D477Ymy1ORsw_4hCHOll9';
  const SESSION_KEY = 'sb-ydaeukhqwishlrjyfktk-auth-token';
  const PORTAL_PARAM = 'dlavie';
  const LEGAL_TYPES = ['terms', 'privacy', 'rules'];
  const SITE_BASE = '/DLavie-Craft/';

  let legalCache = null;
  let pendingSession = null;
  let recoverySession = null;
  let mandatoryConsentOpen = false;

  const isConsoleRoute = () => location.hash.startsWith('#/console');

  function authHeaders(token, json = true) {
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token || SUPABASE_KEY}`,
    };
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
  }

  function restHeaders(token, write = false) {
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token || SUPABASE_KEY}`,
      'Accept-Profile': 'api',
    };
    if (write) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Profile'] = 'api';
    }
    return headers;
  }

  function errorMessage(payload, fallback = 'Permintaan belum dapat diproses.') {
    if (!payload) return fallback;
    if (typeof payload === 'string') return payload || fallback;
    return payload.msg || payload.message || payload.error_description || payload.error || fallback;
  }

  async function request(url, options = {}) {
    let response;
    try {
      response = await fetch(url, options);
    } catch (error) {
      throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.');
    }
    const text = await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = text; }
    }
    if (!response.ok) throw new Error(errorMessage(payload, `Server mengembalikan status ${response.status}.`));
    return payload;
  }

  function normalizeSession(payload) {
    const source = payload?.session || payload;
    if (!source?.access_token || !source?.refresh_token) return null;
    const expiresIn = Number(source.expires_in || 3600);
    return {
      access_token: source.access_token,
      refresh_token: source.refresh_token,
      expires_in: expiresIn,
      expires_at: Number(source.expires_at || Math.floor(Date.now() / 1000) + expiresIn),
      token_type: source.token_type || 'bearer',
      user: source.user || payload?.user || null,
      ...(source.provider_token ? { provider_token: source.provider_token } : {}),
      ...(source.provider_refresh_token ? { provider_refresh_token: source.provider_refresh_token } : {}),
    };
  }

  function readSession() {
    try {
      const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return value?.access_token && value?.refresh_token ? value : null;
    } catch {
      return null;
    }
  }

  function saveSession(payload) {
    const session = normalizeSession(payload);
    if (!session) return null;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function fetchLegalDocuments(force = false) {
    if (legalCache && !force) return legalCache;
    const rows = await request(
      `${SUPABASE_URL}/rest/v1/dlavie_legal_documents?select=document_type,version,title,summary,content,effective_at&is_active=eq.true`,
      { headers: restHeaders(null, false) }
    );
    const docs = {};
    for (const row of Array.isArray(rows) ? rows : []) docs[row.document_type] = row;
    for (const type of LEGAL_TYPES) {
      if (!docs[type]) throw new Error('Dokumen persetujuan belum lengkap. Silakan coba lagi nanti.');
    }
    legalCache = docs;
    return docs;
  }

  async function getLegalStatus(token) {
    const payload = await request(`${SUPABASE_URL}/rest/v1/rpc/dlavie_my_legal_status`, {
      method: 'POST',
      headers: restHeaders(token, true),
      body: '{}',
    });
    return Array.isArray(payload) ? payload[0] || null : payload;
  }

  async function recordConsent(token, docs, source = 'web') {
    return request(`${SUPABASE_URL}/rest/v1/rpc/dlavie_record_account_consent`, {
      method: 'POST',
      headers: restHeaders(token, true),
      body: JSON.stringify({
        p_terms_version: docs.terms.version,
        p_privacy_version: docs.privacy.version,
        p_rules_version: docs.rules.version,
        p_source: source,
      }),
    });
  }

  async function signIn(email, password) {
    return request(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password }),
    });
  }

  async function signUp(displayName, email, password, docs) {
    return request(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        email,
        password,
        data: {
          display_name: displayName,
          accepted_terms: true,
          accepted_privacy: true,
          accepted_rules: true,
          terms_version: docs.terms.version,
          privacy_version: docs.privacy.version,
          rules_version: docs.rules.version,
          consent_source: 'signup',
        },
      }),
    });
  }

  async function sendPasswordReset(email) {
    const redirect = `${location.origin}${location.pathname}`;
    return request(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirect)}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    });
  }

  async function updatePassword(token, password) {
    return request(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ password }),
    });
  }

  async function fetchUser(token) {
    return request(`${SUPABASE_URL}/auth/v1/user`, {
      headers: authHeaders(token, false),
    });
  }

  async function signOut(token) {
    try {
      await request(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: authHeaders(token),
        body: '{}',
      });
    } catch {
      // Local sign-out still proceeds if the remote session already expired.
    }
    clearSession();
  }

  function captureRecoveryHash() {
    if (!location.hash || location.hash.startsWith('#/')) return;
    const params = new URLSearchParams(location.hash.slice(1));
    if (params.get('type') !== 'recovery' || !params.get('access_token')) return;
    recoverySession = normalizeSession({
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      expires_in: params.get('expires_in'),
      token_type: params.get('token_type') || 'bearer',
    });
    const url = new URL(location.href);
    url.searchParams.set(PORTAL_PARAM, 'reset');
    url.hash = '#/';
    history.replaceState({ dlaviePortal: 'reset' }, '', url.pathname + url.search + url.hash);
  }

  captureRecoveryHash();

  function currentMode() {
    return new URL(location.href).searchParams.get(PORTAL_PARAM);
  }

  function setMode(mode, replace = false) {
    const url = new URL(location.href);
    if (mode) url.searchParams.set(PORTAL_PARAM, mode);
    else url.searchParams.delete(PORTAL_PARAM);
    const path = url.pathname + url.search + url.hash;
    (replace ? history.replaceState : history.pushState).call(history, { dlaviePortal: mode }, '', path);
    renderFromUrl();
  }

  function removePortal() {
    document.getElementById('dl-account-portal')?.remove();
    document.body?.classList.remove('dl-account-open');
    mandatoryConsentOpen = false;
    ensureAccountEntry();
  }

  function createPortal({ closable = true } = {}) {
    removePortal();
    const portal = document.createElement('div');
    portal.id = 'dl-account-portal';
    portal.className = 'dl-account-portal';
    portal.innerHTML = `
      <div class="dl-account-shell">
        <aside class="dl-account-brand">
          <div class="dl-account-logo"><img src="${SITE_BASE}assets/dlavie-logo-transparent.png" alt=""><span>DLavie Craft</span></div>
          <div class="dl-account-brand-copy">
            <span class="dl-account-brand-kicker">DLavie ID</span>
            <h1>Satu akun untuk seluruh komunitas.</h1>
            <p>Masuk untuk berdiskusi, membagikan karya, mendapatkan XP, mengelola profil, dan menjaga aktivitas komunitas tetap tersinkron.</p>
          </div>
          <div class="dl-account-trust">
            <span><i class="dl-account-dot"></i>Persetujuan dicatat berdasarkan versi dokumen</span>
            <span><i class="dl-account-dot"></i>Sesi akun dikelola melalui autentikasi Supabase</span>
            <span><i class="dl-account-dot"></i>Hak akses developer tetap terpisah dari akun publik</span>
          </div>
        </aside>
        <main class="dl-account-main"><div class="dl-account-card" data-dl-card></div></main>
      </div>`;
    if (closable) {
      const close = document.createElement('button');
      close.className = 'dl-account-close';
      close.type = 'button';
      close.setAttribute('aria-label', 'Tutup');
      close.textContent = '×';
      close.addEventListener('click', () => setMode(null));
      portal.querySelector('.dl-account-main').appendChild(close);
    }
    document.body.appendChild(portal);
    document.body.classList.add('dl-account-open');
    document.getElementById('dl-account-entry')?.remove();
    return portal.querySelector('[data-dl-card]');
  }

  function setCardMessage(card, message, kind = 'error') {
    let node = card.querySelector('[data-dl-message]');
    if (!node) {
      node = document.createElement('div');
      node.dataset.dlMessage = '';
      card.querySelector('form')?.prepend(node);
    }
    node.className = `dl-account-message ${kind}`;
    node.textContent = message;
  }

  function renderLegalContent(container, content) {
    container.textContent = '';
    const blocks = String(content || '').replace(/\r/g, '').split(/\n\s*\n/).map(v => v.trim()).filter(Boolean);
    for (const block of blocks) {
      if (block.startsWith('## ')) {
        const heading = document.createElement('h3');
        heading.textContent = block.slice(3).trim();
        container.appendChild(heading);
        continue;
      }
      const lines = block.split('\n').map(v => v.trim()).filter(Boolean);
      if (lines.length && lines.every(v => v.startsWith('- '))) {
        const ul = document.createElement('ul');
        for (const line of lines) {
          const li = document.createElement('li');
          li.textContent = line.slice(2);
          ul.appendChild(li);
        }
        container.appendChild(ul);
        continue;
      }
      const p = document.createElement('p');
      p.textContent = lines.join(' ');
      container.appendChild(p);
    }
  }

  async function showLegalSheet(type) {
    const docs = await fetchLegalDocuments();
    const doc = docs[type];
    if (!doc) return;
    document.querySelector('.dl-legal-sheet')?.remove();
    const sheet = document.createElement('div');
    sheet.className = 'dl-legal-sheet';
    sheet.innerHTML = `
      <section class="dl-legal-sheet-card" role="dialog" aria-modal="true">
        <div class="dl-legal-sheet-head">
          <div><span class="dl-account-eyebrow">Dokumen berlaku · v${doc.version}</span><h2></h2></div>
          <button type="button" aria-label="Tutup">×</button>
        </div>
        <div class="dl-legal-content"></div>
      </section>`;
    sheet.querySelector('h2').textContent = doc.title;
    renderLegalContent(sheet.querySelector('.dl-legal-content'), doc.content);
    const close = () => sheet.remove();
    sheet.querySelector('button').addEventListener('click', close);
    sheet.addEventListener('click', event => { if (event.target === sheet) close(); });
    document.body.appendChild(sheet);
  }

  function wireLegalButtons(scope) {
    scope.querySelectorAll('[data-legal]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        showLegalSheet(button.dataset.legal).catch(error => setCardMessage(scope.closest('.dl-account-card') || scope, error.message));
      });
    });
  }

  function tabMarkup(active) {
    return `<div class="dl-account-tabs" role="tablist">
      <button type="button" data-tab="login" class="${active === 'login' ? 'active' : ''}">Masuk</button>
      <button type="button" data-tab="register" class="${active === 'register' ? 'active' : ''}">Daftar</button>
    </div>`;
  }

  function wireTabs(card) {
    card.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.tab)));
  }

  async function renderLogin() {
    const card = createPortal();
    card.innerHTML = `
      <span class="dl-account-eyebrow">Akun komunitas</span>
      <h2>Masuk ke DLavie ID</h2>
      <p class="dl-account-lead">Lanjutkan aktivitas, level, reaction, Showcase, dan profilmu dari satu akun.</p>
      ${tabMarkup('login')}
      <form class="dl-account-form">
        <label class="dl-account-field">Email<input type="email" name="email" autocomplete="email" required placeholder="nama@email.com"></label>
        <label class="dl-account-field">Password<input type="password" name="password" autocomplete="current-password" required minlength="8" placeholder="Password akun"></label>
        <div class="dl-account-row"><span class="dl-account-mini">Gunakan akun komunitas, bukan akses Console developer.</span><button class="dl-account-link" type="button" data-forgot>Lupa password?</button></div>
        <button class="dl-account-btn primary" type="submit">Masuk</button>
        <p class="dl-account-mini">Dengan menggunakan fitur anggota, Anda tunduk pada <button class="dl-account-link" type="button" data-legal="terms">Syarat & Ketentuan</button>, <button class="dl-account-link" type="button" data-legal="privacy">Privasi</button>, dan <button class="dl-account-link" type="button" data-legal="rules">Peraturan Komunitas</button>.</p>
      </form>`;
    wireTabs(card);
    wireLegalButtons(card);
    card.querySelector('[data-forgot]').addEventListener('click', () => setMode('forgot'));
    const form = card.querySelector('form');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Memeriksa akun…';
      try {
        const data = await signIn(form.email.value.trim(), form.password.value);
        const session = normalizeSession(data);
        if (!session) throw new Error('Sesi login tidak diterima dari server.');
        const docs = await fetchLegalDocuments();
        const status = await getLegalStatus(session.access_token);
        if (!status?.is_current) {
          pendingSession = session;
          await renderConsentGate(docs, session, 'login');
          return;
        }
        saveSession(session);
        location.reload();
      } catch (error) {
        setCardMessage(card, error.message);
        submit.disabled = false;
        submit.textContent = 'Masuk';
      }
    });
  }

  async function renderRegister() {
    const card = createPortal();
    card.innerHTML = `<span class="dl-account-eyebrow">Mempersiapkan pendaftaran…</span><h2>Memuat dokumen persetujuan</h2><p class="dl-account-lead">Sebentar, kami mengambil versi ketentuan yang sedang berlaku.</p>`;
    let docs;
    try { docs = await fetchLegalDocuments(); }
    catch (error) { setCardMessage(card, error.message); return; }
    card.innerHTML = `
      <span class="dl-account-eyebrow">Buat DLavie ID</span>
      <h2>Gabung sebagai crafter</h2>
      <p class="dl-account-lead">Buat akun publik untuk komunitas. Akses developer tetap memiliki otorisasi terpisah.</p>
      ${tabMarkup('register')}
      <form class="dl-account-form">
        <label class="dl-account-field">Nama tampilan<input type="text" name="displayName" required minlength="2" maxlength="32" autocomplete="nickname" placeholder="Nama Minecraft kamu"></label>
        <label class="dl-account-field">Email<input type="email" name="email" required autocomplete="email" placeholder="nama@email.com"></label>
        <label class="dl-account-field">Password<input type="password" name="password" required minlength="8" autocomplete="new-password" placeholder="Minimal 8 karakter"></label>
        <label class="dl-account-field">Ulangi password<input type="password" name="confirm" required minlength="8" autocomplete="new-password" placeholder="Ketik ulang password"></label>
        <div class="dl-account-legal-box">
          <label class="dl-account-check"><input type="checkbox" name="terms" required><span>Saya telah membaca dan menyetujui <button type="button" class="dl-account-link" data-legal="terms"><strong>${docs.terms.title}</strong></button> · v${docs.terms.version}.</span></label>
          <label class="dl-account-check"><input type="checkbox" name="privacy" required><span>Saya menyetujui pemrosesan data akun sebagaimana dijelaskan dalam <button type="button" class="dl-account-link" data-legal="privacy"><strong>${docs.privacy.title}</strong></button> · v${docs.privacy.version}.</span></label>
          <label class="dl-account-check"><input type="checkbox" name="rules" required><span>Saya telah membaca dan akan mematuhi <button type="button" class="dl-account-link" data-legal="rules"><strong>${docs.rules.title}</strong></button> · v${docs.rules.version}.</span></label>
        </div>
        <button class="dl-account-btn primary" type="submit">Buat akun</button>
        <p class="dl-account-mini">Persetujuan wajib tidak dipilih otomatis. Versi dokumen dan waktu penerimaan dicatat untuk akun ini.</p>
      </form>`;
    wireTabs(card);
    wireLegalButtons(card);
    const form = card.querySelector('form');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (form.password.value !== form.confirm.value) {
        setCardMessage(card, 'Password dan konfirmasi password harus sama.');
        return;
      }
      if (!form.terms.checked || !form.privacy.checked || !form.rules.checked) {
        setCardMessage(card, 'Semua persetujuan wajib harus dibaca dan diterima sebelum membuat akun.');
        return;
      }
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Membuat akun…';
      try {
        const data = await signUp(form.displayName.value.trim(), form.email.value.trim(), form.password.value, docs);
        const session = normalizeSession(data);
        if (session) {
          try { await recordConsent(session.access_token, docs, 'signup'); } catch {}
          saveSession(session);
          location.reload();
          return;
        }
        card.innerHTML = `
          <span class="dl-account-eyebrow">Verifikasi email</span>
          <h2>Periksa inbox kamu</h2>
          <p class="dl-account-lead">Akun sudah dibuat. Buka email verifikasi dari DLavie Craft, konfirmasi alamat email, lalu kembali untuk masuk.</p>
          <div class="dl-account-message">Jika email belum terlihat, periksa folder spam atau tunggu beberapa menit sebelum mencoba kembali.</div>
          <div style="height:14px"></div>
          <button class="dl-account-btn primary" type="button" data-back-login>Ke halaman masuk</button>`;
        card.querySelector('[data-back-login]').addEventListener('click', () => setMode('login'));
      } catch (error) {
        setCardMessage(card, error.message);
        submit.disabled = false;
        submit.textContent = 'Buat akun';
      }
    });
  }

  function renderForgot() {
    const card = createPortal();
    card.innerHTML = `
      <span class="dl-account-eyebrow">Pemulihan akun</span>
      <h2>Lupa password?</h2>
      <p class="dl-account-lead">Masukkan email akun. Jika cocok dengan akun yang tersedia, instruksi pemulihan akan dikirim melalui email.</p>
      <form class="dl-account-form">
        <label class="dl-account-field">Email<input type="email" name="email" required autocomplete="email" placeholder="nama@email.com"></label>
        <button class="dl-account-btn primary" type="submit">Kirim instruksi</button>
        <button class="dl-account-btn secondary" type="button" data-back> Kembali ke login </button>
      </form>`;
    card.querySelector('[data-back]').addEventListener('click', () => setMode('login'));
    const form = card.querySelector('form');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Mengirim…';
      try {
        await sendPasswordReset(form.email.value.trim());
        form.innerHTML = `<div class="dl-account-message">Jika alamat tersebut terdaftar, email pemulihan telah dikirim. Periksa inbox dan folder spam.</div><button class="dl-account-btn secondary" type="button" data-back>Kembali ke login</button>`;
        form.querySelector('[data-back]').addEventListener('click', () => setMode('login'));
      } catch (error) {
        setCardMessage(card, error.message);
        submit.disabled = false;
        submit.textContent = 'Kirim instruksi';
      }
    });
  }

  function renderReset() {
    const card = createPortal({ closable: false });
    const session = recoverySession || readSession();
    if (!session?.access_token) {
      card.innerHTML = `<span class="dl-account-eyebrow">Tautan tidak valid</span><h2>Sesi pemulihan tidak ditemukan</h2><p class="dl-account-lead">Minta tautan pemulihan baru agar password dapat diubah dengan aman.</p><button class="dl-account-btn primary" data-forgot>Minta tautan baru</button>`;
      card.querySelector('[data-forgot]').addEventListener('click', () => setMode('forgot'));
      return;
    }
    card.innerHTML = `
      <span class="dl-account-eyebrow">Buat password baru</span>
      <h2>Pulihkan akun</h2>
      <p class="dl-account-lead">Gunakan password baru yang tidak mudah ditebak dan jangan gunakan password yang sama dengan layanan lain.</p>
      <form class="dl-account-form">
        <label class="dl-account-field">Password baru<input name="password" type="password" minlength="8" required autocomplete="new-password" placeholder="Minimal 8 karakter"></label>
        <label class="dl-account-field">Ulangi password<input name="confirm" type="password" minlength="8" required autocomplete="new-password" placeholder="Ketik ulang password"></label>
        <button class="dl-account-btn primary" type="submit">Simpan password baru</button>
      </form>`;
    const form = card.querySelector('form');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (form.password.value !== form.confirm.value) {
        setCardMessage(card, 'Password dan konfirmasi password harus sama.');
        return;
      }
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      button.textContent = 'Menyimpan…';
      try {
        await updatePassword(session.access_token, form.password.value);
        await signOut(session.access_token);
        recoverySession = null;
        card.innerHTML = `<span class="dl-account-eyebrow">Berhasil</span><h2>Password sudah diperbarui</h2><p class="dl-account-lead">Untuk keamanan, masuk kembali menggunakan password baru.</p><button class="dl-account-btn primary" data-login>Masuk sekarang</button>`;
        card.querySelector('[data-login]').addEventListener('click', () => setMode('login'));
      } catch (error) {
        setCardMessage(card, error.message);
        button.disabled = false;
        button.textContent = 'Simpan password baru';
      }
    });
  }

  async function renderConsentGate(docsArg, sessionArg, source = 'renewal') {
    const docs = docsArg || await fetchLegalDocuments();
    const session = sessionArg || pendingSession || readSession();
    if (!session?.access_token) { setMode('login', true); return; }
    mandatoryConsentOpen = true;
    const card = createPortal({ closable: false });
    mandatoryConsentOpen = true;
    card.innerHTML = `
      <span class="dl-account-eyebrow">Persetujuan pengguna</span>
      <h2>Sebelum melanjutkan</h2>
      <p class="dl-account-lead">Akun ini belum memiliki persetujuan untuk versi dokumen yang sedang berlaku. Baca dan setujui ketiganya untuk menggunakan fitur anggota.</p>
      <div class="dl-account-consent-summary"><strong>Persetujuan yang akan dicatat</strong><span>Syarat v${docs.terms.version} · Privasi v${docs.privacy.version} · Rules v${docs.rules.version}</span></div>
      <form class="dl-account-form">
        <div class="dl-account-legal-box">
          <label class="dl-account-check"><input type="checkbox" name="terms" required><span>Saya menyetujui <button type="button" class="dl-account-link" data-legal="terms"><strong>${docs.terms.title}</strong></button>.</span></label>
          <label class="dl-account-check"><input type="checkbox" name="privacy" required><span>Saya menyetujui <button type="button" class="dl-account-link" data-legal="privacy"><strong>${docs.privacy.title}</strong></button>.</span></label>
          <label class="dl-account-check"><input type="checkbox" name="rules" required><span>Saya akan mematuhi <button type="button" class="dl-account-link" data-legal="rules"><strong>${docs.rules.title}</strong></button>.</span></label>
        </div>
        <button class="dl-account-btn primary" type="submit">Setuju & lanjutkan</button>
        <button class="dl-account-btn danger" type="button" data-logout>Keluar dari akun</button>
      </form>`;
    wireLegalButtons(card);
    card.querySelector('[data-logout]').addEventListener('click', async () => {
      await signOut(session.access_token);
      pendingSession = null;
      setMode(null, true);
      location.reload();
    });
    const form = card.querySelector('form');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.terms.checked || !form.privacy.checked || !form.rules.checked) {
        setCardMessage(card, 'Ketiga dokumen wajib disetujui untuk melanjutkan.');
        return;
      }
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      button.textContent = 'Mencatat persetujuan…';
      try {
        await recordConsent(session.access_token, docs, source);
        if (pendingSession) saveSession(pendingSession);
        pendingSession = null;
        mandatoryConsentOpen = false;
        location.reload();
      } catch (error) {
        setCardMessage(card, error.message);
        button.disabled = false;
        button.textContent = 'Setuju & lanjutkan';
      }
    });
  }

  async function renderAccount() {
    const session = readSession();
    if (!session) { setMode('login', true); return; }
    const card = createPortal();
    card.innerHTML = `<span class="dl-account-eyebrow">DLavie ID</span><h2>Akun kamu</h2><p class="dl-account-lead">Memuat profil dan status persetujuan…</p>`;
    try {
      const [user, status] = await Promise.all([fetchUser(session.access_token), getLegalStatus(session.access_token)]);
      const name = user?.user_metadata?.display_name || 'Crafter';
      card.innerHTML = `
        <span class="dl-account-eyebrow">DLavie ID</span>
        <h2>Halo, <span data-name></span></h2>
        <p class="dl-account-lead">Kelola sesi dan lihat dokumen yang berlaku untuk akun komunitasmu.</p>
        <div class="dl-account-profile">
          <div class="dl-account-profile-card"><span>Nama tampilan</span><strong data-profile-name></strong></div>
          <div class="dl-account-profile-card"><span>Email</span><strong data-email></strong></div>
          <div class="dl-account-profile-card"><span>Persetujuan saat ini</span><strong>${status?.is_current ? 'Aktif & terbaru' : 'Perlu diperbarui'}</strong><span style="margin-top:5px">${status?.accepted_at ? new Date(status.accepted_at).toLocaleString('id-ID') : 'Belum tercatat'}</span></div>
        </div>
        <div class="dl-account-divider"></div>
        <div class="dl-account-row"><button class="dl-account-link" data-legal="terms">Syarat & Ketentuan</button><button class="dl-account-link" data-legal="privacy">Privasi</button><button class="dl-account-link" data-legal="rules">Rules</button></div>
        <div style="height:18px"></div>
        <button class="dl-account-btn danger" type="button" data-logout style="width:100%">Keluar dari akun</button>`;
      card.querySelector('[data-name]').textContent = name;
      card.querySelector('[data-profile-name]').textContent = name;
      card.querySelector('[data-email]').textContent = user?.email || '—';
      wireLegalButtons(card);
      card.querySelector('[data-logout]').addEventListener('click', async () => {
        await signOut(session.access_token);
        setMode(null, true);
        location.reload();
      });
    } catch (error) {
      setCardMessage(card, error.message);
    }
  }

  async function renderLegalPage(type) {
    const card = createPortal();
    card.className = 'dl-account-legal-page';
    card.innerHTML = `<span class="dl-account-eyebrow">Dokumen DLavie Craft</span><h2>Memuat…</h2><p class="dl-account-lead">Mengambil versi dokumen yang sedang berlaku.</p>`;
    try {
      const docs = await fetchLegalDocuments();
      const doc = docs[type];
      card.innerHTML = `<span class="dl-account-eyebrow">Dokumen berlaku</span><h2></h2><p class="dl-account-lead"></p><div class="dl-legal-meta"><span data-version></span><span data-effective></span></div><div class="dl-legal-content"></div>`;
      card.querySelector('h2').textContent = doc.title;
      card.querySelector('.dl-account-lead').textContent = doc.summary;
      card.querySelector('[data-version]').textContent = `Versi ${doc.version}`;
      card.querySelector('[data-effective]').textContent = `Berlaku ${new Date(doc.effective_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}`;
      renderLegalContent(card.querySelector('.dl-legal-content'), doc.content);
    } catch (error) {
      setCardMessage(card, error.message);
    }
  }

  function renderFromUrl() {
    if (!document.body || isConsoleRoute()) return;
    const mode = currentMode();
    if (!mode) {
      if (!mandatoryConsentOpen) removePortal();
      return;
    }
    if (mode === 'login') return void renderLogin();
    if (mode === 'register') return void renderRegister();
    if (mode === 'forgot') return void renderForgot();
    if (mode === 'reset') return void renderReset();
    if (mode === 'account') return void renderAccount();
    if (LEGAL_TYPES.includes(mode)) return void renderLegalPage(mode);
    setMode(null, true);
  }

  function ensureAccountEntry() {
    if (!document.body || isConsoleRoute() || document.getElementById('dl-account-portal')) {
      document.getElementById('dl-account-entry')?.remove();
      return;
    }
    let button = document.getElementById('dl-account-entry');
    if (!button) {
      button = document.createElement('button');
      button.id = 'dl-account-entry';
      button.className = 'dl-account-entry';
      button.type = 'button';
      document.body.appendChild(button);
    }
    const session = readSession();
    button.textContent = session ? 'Akun' : 'Masuk';
    button.onclick = () => setMode(session ? 'account' : 'login');
  }

  function ensureLegalFooter() {
    if (!document.body || isConsoleRoute()) {
      document.getElementById('dl-legal-footer')?.remove();
      return;
    }
    if (document.getElementById('dl-legal-footer')) return;
    const footer = document.createElement('div');
    footer.id = 'dl-legal-footer';
    footer.className = 'dl-legal-footer';
    footer.innerHTML = `<span>© DLavie Craft</span><button data-mode="terms">Syarat & Ketentuan</button><button data-mode="privacy">Privasi</button><button data-mode="rules">Peraturan Komunitas</button>`;
    footer.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
    document.body.appendChild(footer);
  }

  function interceptCommunityAuth(event) {
    if (isConsoleRoute() || document.getElementById('dl-account-portal')) return;
    const target = event.target.closest?.('button,a');
    if (!target) return;
    const inCommunity = !!target.closest('.community-page');
    const text = (target.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const isAuthTrigger = target.classList.contains('community-member-gate') ||
      target.classList.contains('thread-login') ||
      (inCommunity && (text === 'masuk' || text === 'masuk / daftar' || text.includes('masuk untuk')));
    if (!isAuthTrigger) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    setMode('login');
  }

  function removeLegacyAuthModal() {
    const old = document.querySelector('.community-auth-card');
    if (!old || document.getElementById('dl-account-portal')) return;
    const backdrop = old.closest('.modal-backdrop');
    (backdrop || old).remove();
    setMode('login');
  }

  async function enforceCurrentConsent() {
    if (isConsoleRoute() || currentMode()) return;
    const session = readSession();
    if (!session?.access_token) return;
    try {
      const [docs, status] = await Promise.all([fetchLegalDocuments(), getLegalStatus(session.access_token)]);
      if (status && status.is_current === false) await renderConsentGate(docs, session, 'renewal');
    } catch (error) {
      console.warn('[DLavie ID] legal status check skipped:', error.message);
    }
  }

  document.addEventListener('click', interceptCommunityAuth, true);
  window.addEventListener('popstate', renderFromUrl);

  function boot() {
    if (isConsoleRoute()) return;
    renderFromUrl();
    ensureAccountEntry();
    ensureLegalFooter();
    if (!currentMode()) enforceCurrentConsent();

    const observer = new MutationObserver(() => {
      if (isConsoleRoute()) return;
      removeLegacyAuthModal();
      ensureAccountEntry();
      ensureLegalFooter();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
