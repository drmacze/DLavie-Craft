(() => {
  'use strict';

  const SB_URL = 'https://ydaeukhqwishlrjyfktk.supabase.co';
  const SB_KEY = 'sb_publishable_XNXU6SVeM-D477Ymy1ORsw_4hCHOll9';
  const AUTH_KEY = 'sb-ydaeukhqwishlrjyfktk-auth-token';
  const nativeFetch = window.fetch.bind(window);
  let refreshPromise = null;
  let routeKey = '';
  let scrollRaf = 0;

  function readStored() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return { raw: null, parsed: null, session: null, shape: 'none' };
      const parsed = JSON.parse(raw);
      if (parsed?.currentSession) return { raw, parsed, session: parsed.currentSession, shape: 'currentSession' };
      if (parsed?.session) return { raw, parsed, session: parsed.session, shape: 'session' };
      return { raw, parsed, session: parsed, shape: 'direct' };
    } catch {
      return { raw: null, parsed: null, session: null, shape: 'none' };
    }
  }

  function jwtExp(token) {
    try {
      const part = String(token || '').split('.')[1];
      if (!part) return 0;
      const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
      return Number(json?.exp || 0);
    } catch { return 0; }
  }

  function isExpired(session, skew = 20) {
    if (!session?.access_token) return true;
    const exp = Number(session.expires_at || jwtExp(session.access_token) || 0);
    return !!exp && exp <= Math.floor(Date.now() / 1000) + skew;
  }

  function saveSession(next) {
    const stored = readStored();
    try {
      if (stored.shape === 'currentSession') {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ ...stored.parsed, currentSession: next }));
      } else if (stored.shape === 'session') {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ ...stored.parsed, session: next }));
      } else {
        localStorage.setItem(AUTH_KEY, JSON.stringify(next));
      }
      document.dispatchEvent(new CustomEvent('dlavie:auth-changed', { detail: { source: 'gamehub-refresh' } }));
    } catch {}
  }

  function clearExpiredSession() {
    try { localStorage.removeItem(AUTH_KEY); } catch {}
    document.dispatchEvent(new CustomEvent('dlavie:auth-changed', { detail: { source: 'gamehub-expired' } }));
  }

  async function refreshSession() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      const current = readStored().session;
      if (!current?.refresh_token) return null;
      try {
        const res = await nativeFetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: current.refresh_token })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.access_token) return null;
        saveSession(data);
        return data;
      } catch { return null; }
      finally { setTimeout(() => { refreshPromise = null; }, 0); }
    })();
    return refreshPromise;
  }

  function isSupabase(url) {
    return String(url || '').startsWith(SB_URL);
  }

  function isAuthRefresh(url) {
    return String(url || '').includes('/auth/v1/token');
  }

  function isPublicRead(url, method) {
    if (String(method || 'GET').toUpperCase() !== 'GET') return false;
    const u = String(url || '');
    if (u.includes('/storage/v1/object/public/')) return true;
    return [
      '/rest/v1/dlavie_projects',
      '/rest/v1/dlavie_project_public_stats',
      '/rest/v1/dlavie_project_gallery',
      '/rest/v1/dlavie_project_versions',
      '/rest/v1/dlavie_crafters',
      '/rest/v1/dlavie_crafter_follows'
    ].some(x => u.includes(x));
  }

  function cloneHeaders(input, init) {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    return headers;
  }

  function expiredResponse() {
    return new Response(JSON.stringify({ message: 'Sesi login berakhir. Silakan masuk kembali untuk menggunakan fitur akun.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  window.fetch = async function dlavieStableFetch(input, init = {}) {
    const url = input instanceof Request ? input.url : String(input);
    if (!isSupabase(url) || isAuthRefresh(url)) return nativeFetch(input, init);

    const method = String(init.method || (input instanceof Request ? input.method : 'GET') || 'GET').toUpperCase();
    const headers = cloneHeaders(input, init);
    let session = readStored().session;
    const authorization = headers.get('Authorization') || '';
    const usesSession = authorization.startsWith('Bearer ') && session?.access_token && authorization.includes(session.access_token);

    if (usesSession && isExpired(session)) {
      const refreshed = await refreshSession();
      if (refreshed?.access_token) {
        session = refreshed;
        headers.set('Authorization', `Bearer ${refreshed.access_token}`);
      } else if (isPublicRead(url, method)) {
        headers.set('Authorization', `Bearer ${SB_KEY}`);
      } else {
        clearExpiredSession();
        return expiredResponse();
      }
    }

    const makeRequest = () => {
      if (input instanceof Request) return nativeFetch(new Request(input, { ...init, headers }));
      return nativeFetch(input, { ...init, headers });
    };

    let res = await makeRequest();
    if (res.status !== 401) return res;

    let message = '';
    try {
      const data = await res.clone().json();
      message = String(data?.message || data?.error_description || data?.hint || '');
    } catch {}
    if (!/jwt|expired|token/i.test(message)) return res;

    const refreshed = await refreshSession();
    if (refreshed?.access_token) {
      headers.set('Authorization', `Bearer ${refreshed.access_token}`);
      return makeRequest();
    }
    if (isPublicRead(url, method)) {
      headers.set('Authorization', `Bearer ${SB_KEY}`);
      return makeRequest();
    }
    clearExpiredSession();
    return expiredResponse();
  };

  function currentRouteKey() {
    const hash = location.hash || '#/';
    if (/^#\/project\//i.test(hash)) return hash.split('?')[0];
    if (hash === '#' || hash === '' || hash === '#/') return '#/';
    return '';
  }

  function resetGameHubScroll(force = false) {
    const key = currentRouteKey();
    if (!key) { routeKey = ''; return; }
    const root = document.getElementById('dl-gamehub-root');
    if (!root) return;
    if (!force && key === routeKey && window.scrollY < 180) return;
    routeKey = key;
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }

  function resetSoon(force) {
    resetGameHubScroll(force);
    setTimeout(() => resetGameHubScroll(force), 90);
    setTimeout(() => resetGameHubScroll(false), 280);
  }

  try { history.scrollRestoration = 'manual'; } catch {}
  window.addEventListener('hashchange', () => resetSoon(true));
  window.addEventListener('pageshow', () => resetSoon(false));
  document.addEventListener('click', e => {
    if (!e.target.closest('#dl-gamehub-root [data-action="home"],#dl-gamehub-root [data-action="library"],#dl-gamehub-root [data-action="inbox"]')) return;
    setTimeout(() => resetSoon(true), 0);
  }, true);
})();
