(() => {
  'use strict';

  const SB_URL = 'https://ydaeukhqwishlrjyfktk.supabase.co';
  const SB_KEY = 'sb_publishable_XNXU6SVeM-D477Ymy1ORsw_4hCHOll9';
  const AUTH_KEY = 'sb-ydaeukhqwishlrjyfktk-auth-token';
  const ROOT_ID = 'dl-gamehub-root';

  let roleUserId = null;
  let roleIsCrafter = false;
  let roleCheckedAt = 0;
  let savedActive = false;
  let rendering = false;
  let savedRequest = 0;
  let rootObserver = null;

  const $ = (q, r = document) => r.querySelector(q);
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt = n => new Intl.NumberFormat('id-ID', { notation: Number(n) >= 1000000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(Number(n || 0));
  const encPath = p => String(p || '').split('/').map(encodeURIComponent).join('/');

  const icons = {
    home:'<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    saved:'<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>',
    inbox:'<path d="M4 4h16v14H4zM4 13h4l2 3h4l2-3h4"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    chevron:'<path d="m9 6 6 6-6 6"/>'
  };
  const ico = (name, size = 20) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.saved}</svg>`;

  function getSession() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const s = parsed?.currentSession || parsed?.session || parsed;
      return s?.access_token && s?.user ? s : null;
    } catch { return null; }
  }

  async function rest(path, { schema = 'api' } = {}) {
    const s = getSession();
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${s?.access_token || SB_KEY}`,
        Accept: 'application/json',
        'Accept-Profile': schema,
        'Content-Profile': schema
      }
    });
    const text = await res.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch { data = text; } }
    if (!res.ok) throw new Error(data?.message || data?.hint || `Request gagal (${res.status})`);
    return data;
  }

  function openAccount() {
    const btn = $('#dl-account-entry') || $('#dl-shell-account-entry') || $('#dl-shell-account-entry-mobile');
    if (btn) { btn.click(); return; }
    const url = new URL(location.href);
    url.searchParams.set('dlavie', 'login');
    history.pushState({ dlaviePortal: 'login' }, '', url.pathname + url.search + url.hash);
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
  }

  function toast(message) {
    let stack = $('.gh-toast-stack');
    if (!stack) { stack = document.createElement('div'); stack.className = 'gh-toast-stack'; document.body.appendChild(stack); }
    const el = document.createElement('div'); el.className = 'gh-toast'; el.textContent = message; stack.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  async function resolveCrafter(force = false) {
    const s = getSession();
    if (!s) {
      roleUserId = null; roleIsCrafter = false; roleCheckedAt = Date.now();
      applyRoleLabels(false);
      return false;
    }
    if (!force && roleUserId === s.user.id && Date.now() - roleCheckedAt < 15000) return roleIsCrafter;
    roleUserId = s.user.id;
    try {
      const rows = await rest(`dlavie_crafters?select=user_id,status&user_id=eq.${encodeURIComponent(s.user.id)}&limit=1`);
      roleIsCrafter = !!rows?.[0] && rows[0].status === 'active';
    } catch { roleIsCrafter = false; }
    roleCheckedAt = Date.now();
    applyRoleLabels(roleIsCrafter);
    return roleIsCrafter;
  }

  function applyRoleLabels(isCrafter = roleIsCrafter) {
    const nav = $('.gh-bottom-nav');
    const library = nav?.querySelector('[data-action="library"]');
    if (library) {
      const label = library.querySelector('span');
      if (label) label.textContent = isCrafter ? 'Library' : 'Tersimpan';
      library.setAttribute('aria-label', isCrafter ? 'Library' : 'Project tersimpan');
    }
    const drawer = $('.gh-drawer');
    const drawerLibrary = drawer?.querySelector('[data-go="library"]');
    if (drawerLibrary && !isCrafter) {
      Array.from(drawerLibrary.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).forEach(n => { n.textContent = ' Tersimpan'; });
    }
    const note = drawer?.querySelector('.gh-drawer-note');
    if (note && !isCrafter) note.innerHTML = 'Menu <b>Tersimpan</b> berisi project yang kamu bookmark. Mode Minecraft tetap bisa diubah melalui tombol filter di Home.';
  }

  function mediaUrl(project) {
    if (project?.cover_path) return `${SB_URL}/storage/v1/object/public/dlavie-project-media/${encPath(project.cover_path)}`;
    return project?.thumbnail_url || '';
  }

  function savedTopbar() {
    return `<header class="gh-topbar"><button class="gh-icon-btn" data-action="drawer" aria-label="Menu">${ico('menu')}</button><div class="gh-brand"><strong>Tersimpan</strong><span>Bookmark kamu</span></div><button class="gh-icon-btn gh-bell" data-action="inbox" aria-label="Inbox">${ico('inbox')}</button></header>`;
  }

  function savedBottomNav() {
    return `<nav class="gh-bottom-nav gh-bottom-nav-centered" aria-label="Navigasi utama">
      <button class="gh-nav-item" data-action="home">${ico('home')}<span>Home</span></button>
      <button class="gh-nav-item active" data-action="library" aria-label="Project tersimpan">${ico('saved')}<span>Tersimpan</span></button>
      <button class="gh-plus" data-action="plus" aria-label="Upload project">${ico('plus')}</button>
      <button class="gh-nav-item" data-action="inbox">${ico('inbox')}<span>Inbox</span></button>
      <button class="gh-nav-item" data-action="profile">${ico('user')}<span>Profile</span></button>
    </nav>`;
  }

  function projectMarkup(project, stats) {
    const cover = mediaUrl(project);
    const rating = Number(stats?.rating_average || 0).toFixed(1);
    return `<button class="gh-library-card gh-saved-card" data-action="project" data-slug="${esc(project.slug)}">
      ${cover ? `<img src="${esc(cover)}" alt="Thumbnail ${esc(project.name)}" loading="lazy">` : '<div class="gh-no-thumb">Tidak ada thumbnail</div>'}
      <span class="gh-library-card-copy"><strong>${esc(project.name)}</strong><small>${esc(project.minecraft_edition || 'bedrock')} · ${esc(project.category || project.project_type || 'Project')} · ★ ${rating} · ${fmt(project.download_count)} download</small></span>
      <span class="gh-saved-chevron">${ico('chevron', 17)}</span>
    </button>`;
  }

  function renderLoading(root) {
    root.innerHTML = `<div class="gh-shell gh-saved-view">${savedTopbar()}<div class="gh-saved-head"><div><span>PERSONAL COLLECTION</span><h1>Project tersimpan</h1><p>Semua mod, add-on, map, skin, shader dan project yang kamu bookmark akan muncul di sini.</p></div></div><div class="gh-loading"><div class="gh-spinner"></div></div></div>${savedBottomNav()}`;
    applyRoleLabels(false);
  }

  async function renderSaved() {
    const s = getSession();
    if (!s) { savedActive = false; openAccount(); return; }
    const root = document.getElementById(ROOT_ID);
    if (!root || rendering) return;
    const request = ++savedRequest;
    rendering = true;
    renderLoading(root);
    rendering = false;
    try {
      const savedRows = await rest(`dlavie_saved_projects?select=project_slug,created_at&user_id=eq.${encodeURIComponent(s.user.id)}&order=created_at.desc&limit=300`, { schema: 'public' });
      if (request !== savedRequest || !savedActive) return;
      const slugs = (savedRows || []).map(r => r.project_slug).filter(Boolean);
      let projects = [], statsRows = [];
      if (slugs.length) {
        [projects, statsRows] = await Promise.all([
          rest('dlavie_projects?select=*&status=eq.published&visibility=eq.public&limit=300'),
          rest('dlavie_project_public_stats?select=*')
        ]);
      }
      if (request !== savedRequest || !savedActive) return;
      const projectMap = new Map((projects || []).map(p => [p.slug, p]));
      const statsMap = new Map((statsRows || []).map(sv => [sv.project_id, sv]));
      const ordered = slugs.map(slug => projectMap.get(slug)).filter(Boolean);
      rendering = true;
      root.innerHTML = `<div class="gh-shell gh-saved-view">${savedTopbar()}
        <div class="gh-saved-head"><div><span>PERSONAL COLLECTION</span><h1>Project tersimpan</h1><p>Project yang kamu simpan dari halaman detail. Bookmark tetap tersinkron dengan akun DLavie ID kamu.</p></div><strong>${ordered.length}</strong></div>
        ${ordered.length ? `<div class="gh-library-list gh-saved-list">${ordered.map(p => projectMarkup(p, statsMap.get(p.id))).join('')}</div>` : `<div class="gh-saved-empty"><span>${ico('saved',28)}</span><h2>Belum ada project tersimpan</h2><p>Tekan tombol bookmark pada halaman project untuk menyimpannya di sini.</p><button data-action="home">Jelajahi project</button></div>`}
      </div>${savedBottomNav()}`;
      rendering = false;
      applyRoleLabels(false);
    } catch (e) {
      if (!savedActive) return;
      rendering = true;
      root.innerHTML = `<div class="gh-shell gh-saved-view">${savedTopbar()}<div class="gh-saved-empty"><h2>Tersimpan belum dapat dimuat</h2><p>${esc(e.message)}</p><button id="gh-saved-retry">Coba lagi</button></div></div>${savedBottomNav()}`;
      rendering = false;
      $('#gh-saved-retry', root)?.addEventListener('click', renderSaved);
      toast(e.message);
    }
  }

  async function openSaved() {
    const s = getSession();
    if (!s) { openAccount(); return; }
    const crafter = await resolveCrafter(true);
    if (crafter) return false;
    savedActive = true;
    await renderSaved();
    return true;
  }

  function watchRoot() {
    const root = document.getElementById(ROOT_ID);
    if (!root || rootObserver?.target === root) return;
    rootObserver?.disconnect?.();
    const observer = new MutationObserver(() => {
      if (!rendering && savedActive && !root.querySelector('.gh-saved-view')) queueMicrotask(renderSaved);
      else queueMicrotask(() => applyRoleLabels(roleIsCrafter));
    });
    observer.observe(root, { childList: true, subtree: true });
    rootObserver = observer;
    rootObserver.target = root;
  }

  document.addEventListener('click', async e => {
    const library = e.target.closest('.gh-bottom-nav [data-action="library"]');
    if (library) {
      const crafter = await resolveCrafter(false);
      if (!crafter) {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        await openSaved();
        return;
      }
    }

    const drawerLibrary = e.target.closest('.gh-drawer [data-go="library"]');
    if (drawerLibrary) {
      const crafter = await resolveCrafter(false);
      if (!crafter) {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        $('.gh-drawer-backdrop')?.remove();
        await openSaved();
        return;
      }
    }

    if (savedActive) {
      const leave = e.target.closest('[data-action="home"],[data-action="inbox"],[data-action="profile"],[data-action="plus"],[data-action="project"]');
      if (leave) { savedActive = false; savedRequest += 1; }
    }
  }, true);

  const documentObserver = new MutationObserver(() => {
    watchRoot();
    applyRoleLabels(roleIsCrafter);
  });

  function refresh() {
    watchRoot();
    resolveCrafter(true).catch(() => {});
  }

  documentObserver.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => {
    if (!/^#\/?(?:$|home(?:$|[/?]))/i.test(location.hash || '#/')) { savedActive = false; savedRequest += 1; }
    setTimeout(refresh, 50);
  });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', e => { if (e.key === AUTH_KEY) { roleCheckedAt = 0; savedActive = false; setTimeout(refresh, 50); } });
  document.addEventListener('dlavie:auth-changed', refresh);
  document.addEventListener('dlavie:account-updated', refresh);
  setTimeout(refresh, 60);
})();