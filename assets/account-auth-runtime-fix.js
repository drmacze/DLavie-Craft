(() => {
  'use strict';

  const SESSION_KEY = 'sb-ydaeukhqwishlrjyfktk-auth-token';
  const PORTAL_PARAM = 'dlavie';
  const PATCH_FLAG = '__dlavieAccountAuthPatched';

  function validSession(value) {
    try {
      const session = typeof value === 'string' ? JSON.parse(value) : value;
      return !!(session?.access_token && session?.refresh_token);
    } catch {
      return false;
    }
  }

  function cleanStaleAuthMode() {
    if (!validSession(localStorage.getItem(SESSION_KEY))) return false;
    const url = new URL(location.href);
    const mode = url.searchParams.get(PORTAL_PARAM);
    if (mode !== 'login' && mode !== 'register') return false;
    url.searchParams.delete(PORTAL_PARAM);
    history.replaceState({ ...(history.state || {}), dlaviePortal: null, authCompleted: true }, '', url.pathname + url.search + url.hash);
    return true;
  }

  // Repair URLs left behind by older builds before the account portal boots.
  cleanStaleAuthMode();

  const proto = Storage.prototype;
  const nativeSetItem = proto.setItem;
  if (!nativeSetItem[PATCH_FLAG]) {
    function patchedSetItem(key, value) {
      const result = nativeSetItem.apply(this, arguments);
      if (this === localStorage && key === SESSION_KEY && validSession(value)) {
        cleanStaleAuthMode();
        try {
          window.dispatchEvent(new CustomEvent('dlavie-auth-session', { detail: { signedIn: true } }));
        } catch {}
      }
      return result;
    }
    patchedSetItem[PATCH_FLAG] = true;
    proto.setItem = patchedSetItem;
  }
})();
