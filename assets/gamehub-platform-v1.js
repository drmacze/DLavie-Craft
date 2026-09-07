(() => {
  'use strict';

  const SB_URL = 'https://ydaeukhqwishlrjyfktk.supabase.co';
  const SB_KEY = 'sb_publishable_XNXU6SVeM-D477Ymy1ORsw_4hCHOll9';
  const AUTH_KEY = 'sb-ydaeukhqwishlrjyfktk-auth-token';
  const ROOT_ID = 'dl-gamehub-root';
  const TERMS_VERSION = 'crafter-v1';

  const state = {
    view: 'home',
    edition: (() => { try { return localStorage.getItem('dlavie:edition') === 'java' ? 'java' : 'bedrock'; } catch { return 'bedrock'; } })(),
    category: 'all',
    query: '',
    sort: 'updated',
    publicError: '',
    projects: [],
    stats: new Map(),
    loading: false,
    loaded: false,
    isCrafter: false,
    crafterCheckedFor: null,
    consoleTab: 'dashboard',
    consoleData: null,
    inbox: null,
    detail: null,
    detailMediaIndex: 0,
  };

  const categories = [
    ['all', 'Semua'], ['mod', 'Mod'], ['modpack', 'Modpack'], ['resource_pack', 'Resource Pack'], ['data_pack', 'Data Pack'], ['addon', 'Add-On'], ['map', 'Map'], ['skin', 'Skin'],
    ['texture_pack', 'Texture'], ['shader', 'Shader'], ['adventure', 'Adventure'],
    ['survival', 'Survival'], ['roleplay', 'Roleplay'], ['pvp', 'PvP'],
    ['horror', 'Horror'], ['vehicles', 'Vehicles'], ['mobs', 'Mobs']
  ];

  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const slugify = (v = '') => String(v).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  const fmt = n => new Intl.NumberFormat('id-ID', { notation: Number(n) >= 1000000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(Number(n || 0));
  const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const encPath = p => String(p || '').split('/').map(encodeURIComponent).join('/');

  const icons = {
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    sliders:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4"/>',
    home:'<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    library:'<path d="M4 4h6v16H4zM14 4h6v16h-6z"/>',
    inbox:'<path d="M4 4h16v14H4zM4 13h4l2 3h4l2-3h4"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    play:'<path d="m9 7 9 5-9 5z"/>',
    chevron:'<path d="m9 6 6 6-6 6"/>',
    close:'<path d="M6 6l12 12M18 6 6 18"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
    share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
    download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    back:'<path d="m15 18-6-6 6-6"/>',
    grid:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    edit:'<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    mail:'<path d="M3 5h18v14H3zM3 7l9 6 9-6"/>'
  };
  const ico = (name, size = 20) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.grid}</svg>`;

  function getSession() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const s = parsed?.currentSession || parsed?.session || parsed;
      return s?.access_token && s?.user ? s : null;
    } catch { return null; }
  }
  const currentUser = () => getSession()?.user || null;
  function username() {
    const u = currentUser();
    return u?.user_metadata?.display_name || u?.user_metadata?.name || u?.email?.split('@')[0] || 'User';
  }

  async function rest(path, { method = 'GET', body, schema = 'api', extra = {}, representation = false } = {}) {
    const s = getSession();
    const headers = {
      apikey: SB_KEY,
      Authorization: `Bearer ${s?.access_token || SB_KEY}`,
      Accept: 'application/json',
      'Accept-Profile': schema,
      'Content-Profile': schema,
      ...extra,
    };
    if (body !== undefined && !(body instanceof Blob) && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (representation) headers.Prefer = 'return=representation';
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, { method, headers, body: body === undefined ? undefined : (headers['Content-Type'] ? JSON.stringify(body) : body) });
    const text = await res.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch { data = text; } }
    if (!res.ok) throw new Error(data?.message || data?.hint || data?.error_description || `Request gagal (${res.status})`);
    return data;
  }

  async function upload(bucket, path, file) {
    const s = getSession();
    if (!s) throw new Error('Login diperlukan untuk upload.');
    const res = await fetch(`${SB_URL}/storage/v1/object/${bucket}/${encPath(path)}`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${s.access_token}`, 'x-upsert': 'true', 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Upload file gagal.');
    return path;
  }

  function mediaUrl(project) {
    if (project?.cover_path) return `${SB_URL}/storage/v1/object/public/dlavie-project-media/${encPath(project.cover_path)}`;
    return project?.thumbnail_url || '';
  }
  const galleryUrl = path => `${SB_URL}/storage/v1/object/public/dlavie-project-media/${encPath(path)}`;

  function toast(message, kind = '') {
    let stack = $('.gh-toast-stack');
    if (!stack) {
      stack = document.createElement('div'); stack.className = 'gh-toast-stack'; document.body.appendChild(stack);
    }
    const el = document.createElement('div'); el.className = `gh-toast ${kind}`; el.textContent = message; stack.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  function openAccount() {
    const mode = getSession() ? 'account' : 'login';
    const url = new URL(location.href);
    url.searchParams.set('dlavie', mode);
    history.pushState({ dlaviePortal: mode }, '', url.pathname + url.search + url.hash);
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
  }

  function requireSession() {
    const s = getSession();
    if (!s) { openAccount(); return null; }
    return s;
  }

  async function checkCrafter(force = false) {
    const s = getSession();
    if (!s) { state.isCrafter = false; state.crafterCheckedFor = null; return false; }
    if (!force && state.crafterCheckedFor === s.user.id) return state.isCrafter;
    try {
      const rows = await rest(`dlavie_crafters?select=user_id,status&user_id=eq.${encodeURIComponent(s.user.id)}&limit=1`);
      state.isCrafter = !!rows?.[0] && rows[0].status === 'active';
    } catch { state.isCrafter = false; }
    state.crafterCheckedFor = s.user.id;
    return state.isCrafter;
  }

  function img(project, cls = '') {
    const url = mediaUrl(project);
    return url ? `<img class="${cls}" src="${esc(url)}" alt="Thumbnail ${esc(project?.name || '')}" loading="lazy">` : `<div class="gh-no-thumb ${cls}">Tidak ada thumbnail</div>`;
  }

  function statFor(id) { return state.stats.get(id) || { rating_average: 0, rating_count: 0, download_count: 0, global_download_rank: '—' }; }
  function visibleProjects() {
    const q = state.query.trim().toLowerCase();
    return state.projects.filter(p => {
      if ((p.minecraft_edition || 'bedrock') !== state.edition) return false;
      if (state.category !== 'all') {
        if (!(p.project_type === state.category || p.category === state.category || (p.tags || []).some(tag => String(tag).toLowerCase() === state.category))) return false;
      }
      if (q) {
        const hay = `${p.name} ${p.summary || ''} ${p.project_type || ''} ${p.category || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  async function allPublicRows(path) {
    const rows = [];
    for (;;) {
      const page = await rest(`${path}&limit=200&offset=${rows.length}`);
      if (!Array.isArray(page)) throw new Error('Respons katalog tidak valid.');
      if (!page.length) return rows;
      rows.push(...page);
    }
  }

  async function loadPublic(force = false) {
    if (state.loading || (state.loaded && !force)) return;
    state.loading = true;
    state.publicError = '';
    try {
      const [projects, stats] = await Promise.all([
        allPublicRows('dlavie_projects?select=*&status=eq.published&visibility=eq.public&order=id.asc'),
        allPublicRows('dlavie_project_public_stats?select=*&order=project_id.asc')
      ]);
      state.projects = Array.isArray(projects) ? projects : [];
      state.stats = new Map((stats || []).map(s => [s.project_id, s]));
      state.loaded = true;
    } catch (e) { state.publicError = e.message; toast(e.message, 'error'); }
    finally { state.loading = false; rerenderCurrent(); }
  }

  function topbar(title = 'Home', subtitle = 'DLavie Craft') {
    return `<header class="gh-topbar">
      <button class="gh-icon-btn" data-action="drawer" aria-label="Menu">${ico('menu')}</button>
      <div class="gh-brand"><strong>${esc(title)}</strong><span>${esc(subtitle)}</span></div>
      <button class="gh-icon-btn gh-bell" data-action="inbox" aria-label="Inbox">${ico('bell')}</button>
    </header>`;
  }

  function bottomNav(active = 'home') {
    return `<nav class="gh-bottom-nav" aria-label="Navigasi utama">
      <button class="gh-nav-item ${active === 'home' ? 'active' : ''}" data-action="home">${ico('home')}<span>Home</span></button>
      <button class="gh-nav-item ${active === 'library' ? 'active' : ''}" data-action="library">${ico('library')}<span>Library</span></button>
      <button class="gh-plus" data-action="plus" aria-label="Upload project">${ico('plus')}</button>
      <button class="gh-nav-item ${active === 'inbox' ? 'active' : ''}" data-action="inbox">${ico('inbox')}<span>Inbox</span></button>
      <button class="gh-nav-item" data-action="profile">${ico('user')}<span>Profile</span></button>
    </nav>`;
  }

  function shell(content, { active = 'home', title = 'Home', subtitle = 'DLavie Craft' } = {}) {
    return `<div class="gh-shell">${topbar(title, subtitle)}${content}</div>${bottomNav(active)}`;
  }

  function editionHeroHtml() {
    return `<section class="market-edition-picker" aria-label="Pilih edisi Minecraft">
      <div class="market-edition-heading"><h2>Minecraft kamu</h2><span>Geser untuk memilih edisi</span></div>
      <div class="market-edition-track" tabindex="0" aria-label="Kartu edisi Minecraft; gunakan tombol panah">${['bedrock','java'].map(ed => {
        const name = ed === 'java' ? 'Java' : 'Bedrock';
        return `<article class="market-edition-slide" data-edition="${ed}" aria-label="Minecraft ${name}">
          <img src="/DLavie-Craft/assets/minecraft-${ed}-hq.webp" alt="" decoding="async">
          <div class="market-edition-copy"><span>${ed === 'java' ? 'Windows · macOS · Linux' : 'Mobile · Windows · Konsol'}</span><h2>Minecraft<br>${name} Edition</h2><p>${ed === 'java' ? 'Mod, modpack & resource pack' : 'Add-on, map & texture pack'}</p>
          <button class="market-play" data-action="launch-edition" data-value="${ed}" aria-label="${ed === 'java' ? 'Cara bermain Minecraft Java' : 'Buka Minecraft Bedrock'}">${ico('play',24)}<span>${ed === 'java' ? 'Cara bermain' : 'Play'}</span></button></div>
        </article>`;
      }).join('')}</div>
      <div class="market-edition-tabs" role="group" aria-label="Edisi aktif">${['bedrock','java'].map(ed => `<button data-action="edition" data-value="${ed}" aria-pressed="${state.edition === ed}">${ed === 'java' ? 'Java' : 'Bedrock'}</button>`).join('')}</div>
      <p class="market-launch-status" role="status"></p>
    </section>`;
  }

  function homeHtml() {
    const list = visibleProjects().sort((a, b) => state.sort === 'downloads'
      ? Number(b.download_count || 0) - Number(a.download_count || 0)
      : (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0));
    const filtered = state.query.trim() || state.category !== 'all';
    const card = p => {
      const stats = statFor(p.id);
      return `<a class="market-project" href="#/project/${encodeURIComponent(p.slug)}">
        ${img(p)}<div class="market-project-copy"><div class="market-tags"><span>${esc(categories.find(([key]) => key === p.project_type)?.[1] || p.project_type || 'Project')}</span>${p.featured ? '<span class="market-featured">Pilihan</span>' : ''}</div>
        <h3>${esc(p.name)}</h3><span class="market-open" aria-hidden="true">${ico('chevron',22)}</span><p>${esc(p.summary || 'Lihat detail dan versi yang tersedia.')}</p>
        <div class="market-meta"><span>${ico('download',15)} ${fmt(p.download_count)} unduhan</span>${Number(stats.rating_count) > 0 ? `<span>${ico('star',15)} ${Number(stats.rating_average).toFixed(1)}</span>` : ''}</div></div>
      </a>`;
    };
    let results;
    if (state.loading) results = '<div class="market-state" role="status"><div class="gh-spinner"></div><p>Memuat proyek…</p></div>';
    else if (state.publicError) results = '<div class="market-state" role="alert"><h3>Proyek belum dapat dimuat</h3><p>Silakan coba kembali.</p><button data-action="retry-public">Coba lagi</button></div>';
    else if (!list.length) results = `<div class="market-state"><h3>${filtered ? 'Tidak ada proyek yang cocok' : 'Belum ada proyek di edisi ini'}</h3><p>${filtered ? 'Coba kata kunci lain atau hapus filter pencarian.' : 'Proyek publik dari kreator akan tampil di sini.'}</p>${filtered ? '<button data-action="reset-search">Hapus filter</button>' : ''}</div>`;
    else results = `<div class="market-results">${list.map(card).join('')}</div>`;
    return shell(`<main class="market-home">
      <h1 class="market-sr-only">Jelajahi proyek Minecraft</h1>${editionHeroHtml()}
      <div class="market-controls"><label class="market-search" for="gh-search">${ico('search')}<input id="gh-search" type="search" value="${esc(state.query)}" aria-label="Cari proyek Minecraft" placeholder="Cari mod, map, shader…" autocomplete="off"></label>
      <details class="market-filter"><summary aria-label="Urutkan proyek">${ico('sliders')}</summary><div class="market-filter-panel"><label class="market-sort">Urutkan<select id="market-sort"><option value="updated" ${state.sort === 'updated' ? 'selected' : ''}>Baru diperbarui</option><option value="downloads" ${state.sort === 'downloads' ? 'selected' : ''}>Paling diunduh</option></select></label></div></details></div>
      <div class="market-layout"><aside class="market-sidebar"><div class="market-categories" role="group" aria-label="Kategori proyek">${categories.filter(([key]) => state.edition === 'java' ? key !== 'addon' : !['mod','modpack','resource_pack','data_pack'].includes(key)).map(([key,label]) => `<button data-action="category" data-value="${key}" aria-pressed="${state.category === key}">${esc(label)}</button>`).join('')}</div></aside>
      <section class="market-catalog" aria-labelledby="market-results-title"><div class="market-results-head"><div><h2 id="market-results-title">${filtered ? 'Hasil pencarian' : 'Jelajahi proyek'}</h2><span role="status">${state.loading ? 'Memuat…' : `${list.length} proyek · ${state.edition === 'java' ? 'Java' : 'Bedrock'}`}</span></div></div>${results}</section></div>
      <footer class="market-footer"><strong>DLavie Craft</strong><span>Platform komunitas independen. Tidak berafiliasi dengan Mojang atau Microsoft.</span></footer>
    </main>`, {active:'home',title:'Home',subtitle:'DLavie Craft'});
  }

  function libraryHtml() {
    const list = visibleProjects();
    return shell(`
      <div class="gh-view-head"><div><span>Global library mode</span><h1>Pilih Minecraft</h1><p>Pilihan ini menjadi mode aktif untuk katalog DLavie Craft. Konten Home akan mengikuti Java atau Bedrock.</p></div></div>
      <div class="gh-editions">
        <button class="gh-edition-card ${state.edition==='bedrock'?'active':''}" data-action="edition" data-value="bedrock"><span>Cross-platform</span><h2>Minecraft Bedrock</h2><p>Android, iOS, Windows dan perangkat Bedrock. Add-On, Map, Skin, Shader, Texture, UI dan lainnya.</p><b class="gh-edition-mark">B</b></button>
        <button class="gh-edition-card ${state.edition==='java'?'active':''}" data-action="edition" data-value="java"><span>PC ecosystem</span><h2>Minecraft Java</h2><p>Mods, Modpacks, Maps, Resource Packs, Data Packs dan project khusus Java Edition.</p><b class="gh-edition-mark">J</b></button>
      </div>
      <div class="gh-section-head"><div><span>${state.edition==='java'?'Java':'Bedrock'}</span><h2>${list.length} project tersedia</h2></div></div>
      <div class="gh-library-list">${list.length ? list.map(p=>`<button class="gh-library-card" data-action="project" data-slug="${esc(p.slug)}">${img(p)}<span class="gh-library-card-copy"><strong>${esc(p.name)}</strong><small>${esc(p.category||p.project_type)} · ★ ${Number(statFor(p.id).rating_average||0).toFixed(1)} · #${statFor(p.id).global_download_rank||'—'}</small></span></button>`).join('') : '<div class="gh-empty">Belum ada project untuk edition ini.</div>'}</div>`, {active:'library', title:'Library', subtitle:state.edition==='java'?'Java Edition':'Bedrock Edition'});
  }

  function inboxHtml() {
    if (!getSession()) return shell('<div class="gh-empty">Masuk untuk melihat inbox dari admin dan developer DLavie Craft.</div>', {active:'inbox',title:'Inbox'});
    if (state.inbox === null) return shell('<div class="gh-loading"><div class="gh-spinner"></div></div>', {active:'inbox',title:'Inbox'});
    return shell(`<div class="gh-view-head"><div><span>Direct notices</span><h1>Inbox</h1><p>Pesan resmi dari admin dan developer website akan muncul di sini.</p></div></div><div class="gh-inbox">${state.inbox.length?state.inbox.map(m=>`<button class="gh-message ${m.read_at?'':'unread'}" data-action="message" data-id="${m.id}"><span class="gh-message-icon">${ico('mail',18)}</span><span><strong>${esc(m.subject)}</strong><p>${esc(m.body)}</p></span><time>${fmtDate(m.created_at)}</time></button>`).join(''):'<div class="gh-empty">Inbox masih kosong.</div>'}</div>`, {active:'inbox',title:'Inbox'});
  }

  async function loadInbox() {
    const s=requireSession(); if(!s) return;
    try { state.inbox = await rest(`dlavie_crafter_inbox?select=*&user_id=eq.${encodeURIComponent(s.user.id)}&order=created_at.desc&limit=100`); }
    catch(e){ state.inbox=[]; toast(e.message,'error'); }
    if(state.view==='inbox') renderView();
  }

  function consoleHtml() {
    const d = state.consoleData;
    if (!d) return shell('<div class="gh-loading"><div class="gh-spinner"></div></div>', {title:'Console Crafter',subtitle:'Workspace'});
    const stats=d.stats||{};
    const tabs=`<div class="gh-console-tabs"><button data-action="console-tab" data-value="dashboard" class="${state.consoleTab==='dashboard'?'active':''}">Dashboard</button><button data-action="console-tab" data-value="library" class="${state.consoleTab==='library'?'active':''}">Library</button><button data-action="editor" class="${state.consoleTab==='publish'?'active':''}">Upload project</button></div>`;
    const dashboard=`<div class="gh-stats-grid"><div class="gh-stat"><span>Projects</span><strong>${fmt(stats.total_projects)}</strong></div><div class="gh-stat"><span>Published</span><strong>${fmt(stats.published_projects)}</strong></div><div class="gh-stat"><span>Downloads</span><strong>${fmt(stats.total_downloads)}</strong></div><div class="gh-stat"><span>Followers</span><strong>${fmt(stats.followers)}</strong></div><div class="gh-stat"><span>Profile views</span><strong>${fmt(stats.profile_views)}</strong></div></div><div class="gh-section-head"><div><span>Performance</span><h2>Project terbaru</h2></div><button data-action="console-tab" data-value="library">Kelola semua</button></div>${ownProjectsHtml(d.projects.slice(0,5),d.publicStats)}`;
    const library=`<div class="gh-section-head" style="margin-top:14px"><div><span>Creator library</span><h2>Semua project</h2></div><button class="gh-btn accent" data-action="editor">Upload baru</button></div>${ownProjectsHtml(d.projects,d.publicStats)}`;
    return shell(`<div class="gh-view-head"><div><span>Crafter workspace</span><h1>Console Crafter</h1><p>Kelola project, draft, versi, preview, rating dan performa publikasi dari satu dashboard.</p></div></div>${tabs}${state.consoleTab==='library'?library:dashboard}`, {title:'Console Crafter',subtitle:username()});
  }

  function ownProjectsHtml(projects, statsMap) {
    if(!projects.length) return '<div class="gh-empty">Belum ada project. Gunakan tombol + untuk upload project pertama.</div>';
    return `<div class="gh-console-library">${projects.map(p=>{const s=statsMap.get(p.id)||{};return `<article class="gh-own-project">${img(p)}<div><strong>${esc(p.name)}</strong><div class="gh-own-meta"><span>${esc(p.status)}</span><span>${esc(p.minecraft_edition||'bedrock')}</span><span>★ ${Number(s.rating_average||0).toFixed(1)} (${fmt(s.rating_count)})</span><span>#${s.global_download_rank||'—'} global</span><span>${fmt(p.download_count)} download</span></div></div><div class="gh-own-actions"><button data-action="toggle-project" data-id="${p.id}" data-status="${p.status}">${p.status==='published'?'Jadikan draft':'Publish'}</button><button data-action="edit-project" data-id="${p.id}">Edit</button></div></article>`}).join('')}</div>`;
  }

  async function loadConsole(force=false) {
    const s=requireSession(); if(!s) return;
    if(!(await checkCrafter())) { startCrafterFlow(); return; }
    if(state.consoleData && !force){ if(state.view==='console') renderView(); return; }
    try {
      const [statsRows,projects,publicStats] = await Promise.all([
        rest(`dlavie_crafter_dashboard_stats?select=*&user_id=eq.${encodeURIComponent(s.user.id)}&limit=1`),
        rest(`dlavie_projects?select=*&created_by=eq.${encodeURIComponent(s.user.id)}&order=updated_at.desc&limit=200`),
        rest('dlavie_project_public_stats?select=*')
      ]);
      state.consoleData={stats:statsRows?.[0]||{},projects:projects||[],publicStats:new Map((publicStats||[]).map(x=>[x.project_id,x]))};
    } catch(e){toast(e.message,'error');state.consoleData={stats:{},projects:[],publicStats:new Map()};}
    if(state.view==='console') renderView();
  }

  function renderView() {
    const root = ensureRoot(); if(!root) return;
    if(state.view==='home') root.innerHTML=homeHtml();
    else if(state.view==='library') root.innerHTML=libraryHtml();
    else if(state.view==='inbox') root.innerHTML=inboxHtml();
    else if(state.view==='console') root.innerHTML=consoleHtml();
    bindRoot(root);
  }

  function bindRoot(root) {
    const track = $('.market-edition-track', root);
    if (track) {
      const slides = $$('.market-edition-slide', track);
      const leftFor = slide => slide.offsetLeft - slides[0].offsetLeft;
      track.scrollLeft = leftFor(slides[state.edition === 'java' ? 1 : 0]);
      let timer;
      track.addEventListener('scroll', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (!track.isConnected) return;
          const nearest = slides.reduce((a,b) => Math.abs(leftFor(a)-track.scrollLeft) < Math.abs(leftFor(b)-track.scrollLeft) ? a : b);
          if (nearest.dataset.edition !== state.edition) setEdition(nearest.dataset.edition, false);
        }, 160);
      }, {passive:true});
      track.addEventListener('keydown', e => {
        if (e.target !== track || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
        e.preventDefault();
        setEdition(['ArrowRight','End'].includes(e.key) ? 'java' : 'bedrock', false);
        $('.market-edition-track',root)?.focus({preventScroll:true});
      });
    }

    const search=$('#gh-search',root); if(search) search.addEventListener('input',e=>{state.query=e.target.value;renderView();requestAnimationFrame(()=>{const n=$('#gh-search');if(n){n.focus();if(n.type !== 'search') n.setSelectionRange(n.value.length,n.value.length)}})});
    const sort = $('#market-sort',root);
    if(sort) sort.addEventListener('change', e => {state.sort=e.target.value;renderView();$('#market-sort')?.focus();});
    root.onclick = async e => {
      const t=e.target.closest('[data-action]'); if(!t) return;
      const a=t.dataset.action;
      if(a==='retry-public'){loadPublic(true);renderView();}
      else if(a==='reset-search'){state.query='';state.category='all';renderView();}
      else if(a==='home'){state.view='home';renderView();}
      else if(a==='library'){state.view='library';renderView();}
      else if(a==='inbox'){state.view='inbox';state.inbox=null;renderView();loadInbox();}
      else if(a==='profile'){openAccount();}
      else if(a==='drawer'){openDrawer();}
      else if(a==='plus'){handlePlus();}
      else if(a==='category'){const offset=$('.market-categories',root)?.scrollLeft || 0;state.category=t.dataset.value;renderView();const bar=$('.market-categories',root);if(bar){bar.scrollLeft=offset;bar.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});}}
      else if(a==='edition'){setEdition(t.dataset.value);}
      else if(a==='launch-edition'){e.stopPropagation();launchEdition(t.dataset.value);}
      else if(a==='project'){location.hash=`#/project/${encodeURIComponent(t.dataset.slug)}`;}
      else if(a==='console-tab'){state.consoleTab=t.dataset.value;renderView();}
      else if(a==='editor'){openProjectEditor();}
      else if(a==='edit-project'){openProjectEditor(state.consoleData?.projects.find(p=>p.id===t.dataset.id));}
      else if(a==='toggle-project'){toggleProject(t.dataset.id,t.dataset.status);}
      else if(a==='message'){markMessage(t.dataset.id);}
    };
  }

  function ensureRoot() {
    let root=document.getElementById(ROOT_ID); if(root) return root;
    const shell=$('.page-shell') || $('.site-frame') || document.body;
    root=document.createElement('div');root.id=ROOT_ID;shell.appendChild(root);return root;
  }

  function setEdition(ed, focus = true) {
    state.edition=ed==='java'?'java':'bedrock';
    try { localStorage.setItem('dlavie:edition',state.edition); } catch {}
    state.category='all';state.query='';renderView();
    if (focus) $(`.market-edition-tabs [data-value="${state.edition}"]`)?.focus({preventScroll:true});
  }

  function launchEdition(edition = state.edition) {
    const status = $('.market-launch-status');
    if (edition === 'java') {
      if (status) status.innerHTML = 'Buka Minecraft Launcher di komputer, lalu pilih Java Edition. <a href="https://www.minecraft.net/download" target="_blank" rel="noopener">Unduh Launcher</a>';
      else toast('Buka Minecraft Launcher di komputer, lalu pilih Java Edition.');
      return;
    }
    if (status) status.innerHTML = 'Izinkan browser membuka Minecraft. Jika belum terbuka, coba melalui Safari atau browser utama. <a href="https://www.minecraft.net/get-minecraft" target="_blank" rel="noopener">Dapatkan Minecraft</a>';
    location.href = 'minecraft://';
  }

  function openDrawer() {
    let host=$('.gh-drawer-backdrop'); if(host) host.remove();
    host=document.createElement('div');host.className='gh-drawer-backdrop';host.innerHTML=`<aside class="gh-drawer"><div class="gh-drawer-head"><div><strong>DLavie Craft</strong><span>${esc(username())}</span></div><button class="gh-close" data-close>${ico('close',18)}</button></div><nav class="gh-drawer-nav"><button data-go="home">${ico('home',18)} Home</button><button data-go="library">${ico('library',18)} Library</button><a href="#/community">${ico('globe',18)} Community</a>${state.isCrafter?`<button data-go="console">${ico('chart',18)} Console Crafter</button>`:''}<button data-go="profile">${ico('user',18)} Account & Profile</button></nav><div class="gh-drawer-note">Mode aktif: <b>${state.edition==='java'?'Minecraft Java':'Minecraft Bedrock'}</b>. Ubah melalui Library untuk memfilter katalog di seluruh Game Hub.</div></aside>`;
    document.body.appendChild(host);requestAnimationFrame(()=>host.classList.add('open'));
    host.addEventListener('click',e=>{if(e.target===host||e.target.closest('[data-close]')){host.classList.remove('open');setTimeout(()=>host.remove(),240);return;}const go=e.target.closest('[data-go]')?.dataset.go;if(!go)return;host.remove();if(go==='profile')openAccount();else{state.view=go;renderView();if(go==='console')loadConsole();}});
  }

  function modal(html, large=false) {
    $('#gh-modal-host')?.remove();const host=document.createElement('div');host.id='gh-modal-host';host.className='gh-modal-backdrop';host.innerHTML=`<section class="gh-modal ${large?'large':''}">${html}</section>`;document.body.appendChild(host);host.addEventListener('click',e=>{if(e.target===host||e.target.closest('[data-modal-close]')) host.remove();});return host;
  }
  const modalHead=(eyebrow,title)=>`<div class="gh-modal-head"><div><span>${esc(eyebrow)}</span><h2>${esc(title)}</h2></div><button class="gh-close" data-modal-close>${ico('close',18)}</button></div>`;

  async function handlePlus() {
    if(!requireSession()) return;
    const crafter=await checkCrafter(true);
    if(!crafter){startCrafterFlow();return;}
    openProjectEditor();
  }

  function startCrafterFlow() {
    if(!requireSession()) return;
    const host=modal(`${modalHead('Crafter access','Sebelum kamu mempublikasikan project')}<p style="font-size:10px;color:var(--gh-muted);line-height:1.55">Fitur Crafter memberi akses publikasi ke komunitas. Baca alur, risiko dan tanggung jawab berikut sebelum melanjutkan.</p><div class="gh-rules"><div class="gh-rule"><b>01</b><div><b>Project harus milikmu atau kamu punya izin.</b><p>Dilarang membagikan karya berhak cipta, hasil reupload tanpa izin, malware, atau file yang menipu pengguna.</p></div></div><div class="gh-rule"><b>02</b><div><b>Metadata harus akurat.</b><p>Versi Minecraft, platform, thumbnail, deskripsi, changelog dan kategori tidak boleh menyesatkan.</p></div></div><div class="gh-rule"><b>03</b><div><b>Kamu bertanggung jawab atas file yang diunggah.</b><p>Pelanggaran panduan komunitas dapat menyebabkan project ditarik, akun Crafter dibatasi, atau akses publikasi dicabut.</p></div></div><div class="gh-rule"><b>04</b><div><b>Moderasi tetap berlaku.</b><p>DLavie Craft dapat meninjau, menyembunyikan atau menghapus konten yang berisiko bagi pengguna maupun platform.</p></div></div></div><div class="gh-countdown"><span>Waktu baca minimum sebelum persetujuan</span><strong id="gh-countdown">10 detik</strong></div><label class="gh-check"><input id="gh-agree" type="checkbox" disabled> <span>Saya telah membaca aturan, perjanjian pengguna, memahami risikonya, dan setuju mematuhi panduan komunitas.</span></label><div class="gh-modal-actions"><button class="gh-btn" data-modal-close>Batal</button><button class="gh-btn primary" id="gh-crafter-next" disabled>Next</button></div>`);
    let n=10;const label=$('#gh-countdown',host),check=$('#gh-agree',host),next=$('#gh-crafter-next',host);const timer=setInterval(()=>{n-=1;if(label)label.textContent=n>0?`${n} detik`:'Siap';if(n<=0){clearInterval(timer);if(check)check.disabled=false;}},1000);check?.addEventListener('change',()=>{next.disabled=!check.checked;});next?.addEventListener('click',()=>{clearInterval(timer);host.remove();confirmCrafterConversion();});
  }

  function confirmCrafterConversion() {
    const host=modal(`${modalHead('Account upgrade','Ubah akun menjadi Crafter?')}<p style="font-size:10px;color:var(--gh-muted);line-height:1.6">Akun DLavie ID kamu akan memperoleh <b>Console Crafter</b>, dashboard statistik, Library creator, upload project dan kontrol draft/public. Perubahan ini tidak menghapus data akun yang sudah ada.</p><div class="gh-modal-actions"><button class="gh-btn" data-modal-close>Nanti</button><button class="gh-btn accent" id="gh-activate-crafter">Ubah ke Akun Crafter</button></div>`);
    $('#gh-activate-crafter',host)?.addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Mengaktifkan…';try{await rest('rpc/dlavie_activate_crafter',{method:'POST',body:{p_terms_version:TERMS_VERSION}});state.isCrafter=true;state.crafterCheckedFor=currentUser()?.id;state.consoleData=null;host.remove();toast('Akun Crafter berhasil diaktifkan.','success');openProjectEditor();}catch(err){toast(err.message,'error');b.disabled=false;b.textContent='Ubah ke Akun Crafter';}});
  }

  function openProjectEditor(project=null) {
    const s=requireSession();if(!s)return;if(!state.isCrafter){handlePlus();return;}
    const p=project||{};const host=modal(`${modalHead(project?'Edit project':'Upload project',project?'Kelola project kamu':'Publikasikan project baru')}<form id="gh-project-form"><div class="gh-form-grid"><div class="gh-field"><label>Nama project</label><input name="name" required maxlength="80" value="${esc(p.name||'')}"></div><div class="gh-field"><label>Minecraft</label><select name="edition"><option value="bedrock" ${(p.minecraft_edition||state.edition)==='bedrock'?'selected':''}>Bedrock</option><option value="java" ${(p.minecraft_edition||state.edition)==='java'?'selected':''}>Java</option></select></div><div class="gh-field"><label>Type</label><select name="type">${['addon','mod','map','skin','texture_pack','shader','resource_pack','data_pack','modpack','world','server'].map(v=>`<option value="${v}" ${p.project_type===v?'selected':''}>${v.replace('_',' ')}</option>`).join('')}</select></div><div class="gh-field"><label>Category</label><select name="category">${categories.filter(x=>x[0]!=='all').map(([v,l])=>`<option value="${v}" ${(p.category||'addon')===v?'selected':''}>${l}</option>`).join('')}</select></div><div class="gh-field span2"><label>Ringkasan</label><input name="summary" required maxlength="220" value="${esc(p.summary||'')}"></div><div class="gh-field span2"><label>Deskripsi</label><textarea name="description" required maxlength="12000">${esc(p.description||'')}</textarea></div><div class="gh-field"><label>Versi project</label><input name="version" required placeholder="1.0.0" value="${esc(p.version||'1.0.0')}"></div><div class="gh-field"><label>Versi Minecraft</label><input name="mcversions" required placeholder="1.21.100, 1.21.110" value="${esc((p.minecraft_versions||[]).join(', '))}"></div><div class="gh-field"><label>Platform</label><input name="platforms" required placeholder="Android, iOS, Windows" value="${esc((p.platforms||[]).join(', ') || ((p.minecraft_edition||state.edition)==='java'?'Windows, macOS, Linux':'Android, iOS, Windows'))}"></div><div class="gh-field"><label>Status</label><select name="status"><option value="draft" ${p.status!=='published'?'selected':''}>Draft</option><option value="published" ${p.status==='published'?'selected':''}>Public</option></select></div><div class="gh-field span2"><label>Changelog versi ini</label><textarea name="changelog" placeholder="Apa yang berubah pada versi ini?">${esc(p.metadata?.last_changelog||'')}</textarea></div><div class="gh-field span2"><label>Thumbnail</label><div class="gh-file">PNG, JPG atau WebP. Tidak wajib; jika kosong akan tampil “Tidak ada thumbnail”.<input name="cover" type="file" accept="image/png,image/jpeg,image/webp"></div></div><div class="gh-field span2"><label>Photo preview · maksimal 5</label><div class="gh-file">Preview bersifat opsional dan akan tampil sebagai slider.<input name="gallery" type="file" accept="image/png,image/jpeg,image/webp" multiple></div></div><div class="gh-field span2"><label>File rilis</label><div class="gh-file">.mcaddon, .mcpack, .zip, .jar atau format distribusi project.<input name="release" type="file" accept=".mcaddon,.mcpack,.zip,.jar,application/zip,application/octet-stream"></div></div></div><div class="gh-modal-actions"><button type="button" class="gh-btn" data-modal-close>Batal</button><button class="gh-btn accent" type="submit">${project?'Simpan perubahan':'Simpan project'}</button></div></form>`,true);
    $('#gh-project-form',host)?.addEventListener('submit',e=>saveProject(e,project,host));
  }

  async function saveProject(e,existing,host) {
    e.preventDefault();const s=requireSession();if(!s)return;const form=e.currentTarget,submit=form.querySelector('[type="submit"]');submit.disabled=true;submit.textContent='Menyimpan…';
    try{
      const fd=new FormData(form);const split=v=>String(v||'').split(',').map(x=>x.trim()).filter(Boolean);const nowSuffix=Date.now().toString(36).slice(-4);
      const row={name:String(fd.get('name')).trim(),summary:String(fd.get('summary')).trim(),description:String(fd.get('description')).trim(),version:String(fd.get('version')).trim(),minecraft_versions:split(fd.get('mcversions')),platforms:split(fd.get('platforms')),tags:[String(fd.get('category')),String(fd.get('type'))],status:String(fd.get('status')),visibility:'public',project_type:String(fd.get('type')),minecraft_edition:String(fd.get('edition')),category:String(fd.get('category')),performance_tier:'balanced',accent_color:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().match(/^#[0-9a-f]{6}$/i)?.[0]||'#7c5cff',metadata:{...(existing?.metadata||{}),creator:'crafter',last_changelog:String(fd.get('changelog')||'')},updated_by:s.user.id};
      let saved;
      if(existing){const rows=await rest(`dlavie_projects?id=eq.${existing.id}`,{schema:'public',method:'PATCH',body:row,representation:true});saved=rows?.[0]||{...existing,...row};}
      else{row.slug=`${slugify(row.name)}-${nowSuffix}`;row.created_by=s.user.id;const rows=await rest('dlavie_projects',{schema:'public',method:'POST',body:row,representation:true});saved=rows?.[0];}
      if(!saved?.id) throw new Error('Project tidak dapat dibuat.');
      const cover=fd.get('cover');if(cover instanceof File && cover.size){const ext=(cover.name.split('.').pop()||'webp').toLowerCase();const path=`${s.user.id}/${saved.id}/cover.${ext}`;await upload('dlavie-project-media',path,cover);await rest(`dlavie_projects?id=eq.${saved.id}`,{schema:'public',method:'PATCH',body:{cover_path:path,updated_by:s.user.id}});saved.cover_path=path;}
      const gallery=fd.getAll('gallery').filter(f=>f instanceof File&&f.size);if(gallery.length>5) throw new Error('Photo preview maksimal 5 gambar.');
      if(gallery.length){const existingGallery=await rest(`dlavie_project_gallery?select=id&project_id=eq.${saved.id}`,{schema:'public'}).catch(()=>[]);if((existingGallery?.length||0)+gallery.length>5) throw new Error('Total photo preview project tidak boleh lebih dari 5.');for(const [i,file] of gallery.entries()){const ext=(file.name.split('.').pop()||'webp').toLowerCase();const path=`${s.user.id}/${saved.id}/preview-${Date.now()}-${i}.${ext}`;await upload('dlavie-project-media',path,file);await rest('dlavie_project_gallery',{schema:'public',method:'POST',body:{project_id:saved.id,image_path:path,alt_text:`Preview ${saved.name}`,sort_order:(existingGallery?.length||0)+i,created_by:s.user.id}});}}
      const release=fd.get('release');if(release instanceof File&&release.size){const safe=release.name.replace(/[^a-zA-Z0-9._-]/g,'-');const path=`${s.user.id}/${saved.id}/${Date.now()}-${safe}`;await upload('dlavie-project-files',path,release);await rest('dlavie_project_versions',{schema:'public',method:'POST',body:{project_id:saved.id,version:row.version,game_versions:row.minecraft_versions,channel:'stable',status:row.status==='published'?'published':'draft',changelog:String(fd.get('changelog')||''),file_path:path,file_name:release.name,file_size:release.size,created_by:s.user.id,published_at:row.status==='published'?new Date().toISOString():null}});}
      host.remove();state.consoleData=null;await loadPublic(true);toast(existing?'Project diperbarui.':'Project berhasil dibuat.','success');state.view='console';state.consoleTab='library';renderView();await loadConsole(true);
    }catch(err){toast(err.message,'error');submit.disabled=false;submit.textContent=existing?'Simpan perubahan':'Simpan project';}
  }

  async function toggleProject(id,status) {
    const next=status==='published'?'draft':'published';
    try{await rest(`dlavie_projects?id=eq.${id}`,{schema:'public',method:'PATCH',body:{status:next,updated_by:currentUser()?.id,published_at:next==='published'?new Date().toISOString():null}});await rest(`dlavie_project_versions?project_id=eq.${id}`,{schema:'public',method:'PATCH',body:{status:next==='published'?'published':'draft',published_at:next==='published'?new Date().toISOString():null}}).catch(()=>{});state.consoleData=null;toast(next==='published'?'Project dipublikasikan.':'Project dijadikan draft.','success');await loadPublic(true);await loadConsole(true);}catch(e){toast(e.message,'error');}
  }

  async function markMessage(id) {
    const m=state.inbox?.find(x=>x.id===id);if(!m||m.read_at)return;try{await rest(`dlavie_crafter_inbox?id=eq.${id}`,{schema:'public',method:'PATCH',body:{read_at:new Date().toISOString()}});m.read_at=new Date().toISOString();renderView();}catch(e){toast(e.message,'error');}
  }

  async function renderDetail(slug) {
    const root=ensureRoot();document.body.classList.add('dl-gamehub-active');root.innerHTML='<div class="gh-detail"><div class="gh-loading"><div class="gh-spinner"></div></div></div>';
    try{
      let p=state.projects.find(x=>x.slug===slug);if(!p){const rows=await rest(`dlavie_projects?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);p=rows?.[0];}
      if(!p) throw new Error('Project tidak ditemukan.');
      const [versions,gallery,stats] = await Promise.all([rest(`dlavie_project_versions?select=*&project_id=eq.${p.id}&order=published_at.desc,created_at.desc`),rest(`dlavie_project_gallery?select=*&project_id=eq.${p.id}&order=sort_order.asc`),rest(`dlavie_project_public_stats?select=*&project_id=eq.${p.id}&limit=1`)]);
      state.detail={project:p,versions:versions||[],gallery:gallery||[],stats:stats?.[0]||statFor(p.id)};state.detailMediaIndex=0;drawDetail();
    }catch(e){root.innerHTML=`<div class="gh-detail">${topbar('Project')}<div class="gh-empty">${esc(e.message)}</div></div>`;toast(e.message,'error');}
  }

  function detailMedia() {
    const d=state.detail;if(!d)return[];const arr=[];const cover=mediaUrl(d.project);if(cover)arr.push(cover);for(const g of d.gallery){const u=galleryUrl(g.image_path);if(u&&!arr.includes(u))arr.push(u);}return arr;
  }

  function drawDetail() {
    const d=state.detail;if(!d)return;const p=d.project,s=d.stats||{},media=detailMedia(),current=media[state.detailMediaIndex]||'';const similar=state.projects.filter(x=>x.id!==p.id&&(x.minecraft_edition||'bedrock')===(p.minecraft_edition||'bedrock')&&(x.category===p.category||x.project_type===p.project_type)).slice(0,8);
    const root=ensureRoot();root.innerHTML=`<div class="gh-detail"><div class="gh-detail-top"><button class="gh-icon-btn" data-detail="back">${ico('back')}</button><div class="gh-brand"><strong>Project</strong><span>${esc(p.minecraft_edition||'bedrock')}</span></div><button class="gh-icon-btn" data-detail="more">${ico('menu')}</button></div><div class="gh-detail-grid"><section class="gh-detail-media">${current?`<img id="gh-detail-image" src="${esc(current)}" alt="Preview ${esc(p.name)}">`:'<div class="gh-no-thumb">Tidak ada thumbnail</div>'}${media.length>1?`<div class="gh-gallery-dots">${media.map((_,i)=>`<button class="${i===state.detailMediaIndex?'active':''}" data-media="${i}" aria-label="Preview ${i+1}"></button>`).join('')}</div>`:''}</section><aside class="gh-detail-panel"><div class="gh-detail-title"><div><small>${esc((p.minecraft_edition||'bedrock').toUpperCase())} · ${esc(p.category||p.project_type)}</small><h1>${esc(p.name)}</h1></div><button class="gh-rating-button" data-detail="rate">★ ${Number(s.rating_average||0).toFixed(1)} / 5</button></div><div class="gh-metrics"><div class="gh-metric"><strong>${Number(s.rating_average||0).toFixed(1)}/5</strong><span>${fmt(s.rating_count)} rating</span></div><div class="gh-metric"><strong>${fmt(p.download_count)}</strong><span>Total unduhan</span></div><div class="gh-metric"><strong>${fmtDate(p.updated_at||p.published_at)}</strong><span>Diperbarui</span></div></div><p class="gh-description">${esc(p.description||p.summary||'Belum ada deskripsi.')}</p><div class="gh-detail-actions"><button class="gh-download" data-detail="download">${ico('download',17)} &nbsp; Download</button><button class="gh-round" data-detail="share" aria-label="Share">${ico('share',18)}</button><button class="gh-round" data-detail="bookmark" aria-label="Simpan">${ico('heart',18)}</button></div><div class="gh-similar"><h3>Similar mod</h3><div class="gh-similar-list">${similar.length?similar.map(x=>`<button class="gh-similar-card" data-slug="${esc(x.slug)}">${mediaUrl(x)?`<img src="${esc(mediaUrl(x))}" alt="">`:'<div class="gh-no-thumb">Tidak ada thumbnail</div>'}<strong>${esc(x.name)}</strong></button>`).join(''):'<div class="gh-empty">Belum ada project serupa.</div>'}</div></div></aside></div></div>${bottomNav('home')}`;
    root.onclick=async e=>{const m=e.target.closest('[data-media]');if(m){state.detailMediaIndex=Number(m.dataset.media);drawDetail();return;}const sim=e.target.closest('[data-slug]');if(sim){location.hash=`#/project/${encodeURIComponent(sim.dataset.slug)}`;return;}const b=e.target.closest('[data-detail]');if(b){const a=b.dataset.detail;if(a==='back')location.hash='#/';else if(a==='download')downloadProject();else if(a==='share')shareProject();else if(a==='bookmark')bookmarkProject();else if(a==='rate')openRating();else if(a==='more')openDrawer();return;}const nav=e.target.closest('[data-action]');if(nav){if(nav.dataset.action==='home')location.hash='#/';else if(nav.dataset.action==='library'){location.hash='#/';state.view='library';setTimeout(renderView,30);}else if(nav.dataset.action==='plus')handlePlus();else if(nav.dataset.action==='inbox'){location.hash='#/';state.view='inbox';setTimeout(()=>{renderView();loadInbox()},30);}else if(nav.dataset.action==='profile')openAccount();}};
  }

  async function openRating() {
    const s=requireSession();if(!s)return;const p=state.detail?.project;if(!p)return;
    try{const receipts=await rest(`dlavie_user_project_downloads?select=project_id&user_id=eq.${encodeURIComponent(s.user.id)}&project_id=eq.${p.id}&limit=1`);if(!receipts?.length){toast(`${username()} belum download mod ini`,'error');return;}}catch(e){toast(e.message,'error');return;}
    const host=modal(`${modalHead('Rating','Beri rating project')}<p style="font-size:10px;color:var(--gh-muted)">Rating tersedia karena akunmu sudah mengunduh project ini.</p><div class="gh-stars">${[1,2,3,4,5].map(n=>`<button data-star="${n}" aria-label="${n} bintang">★</button>`).join('')}</div><div class="gh-modal-actions"><button class="gh-btn" data-modal-close>Batal</button></div>`);let chosen=0;$$('[data-star]',host).forEach(b=>b.addEventListener('click',async()=>{chosen=Number(b.dataset.star);$$('[data-star]',host).forEach(x=>x.classList.toggle('active',Number(x.dataset.star)<=chosen));try{const result=await rest('rpc/dlavie_rate_project',{method:'POST',body:{p_project_id:p.id,p_rating:chosen}});state.detail.stats.rating_average=result.rating_average;state.detail.stats.rating_count=result.rating_count;state.stats.set(p.id,{...statFor(p.id),rating_average:result.rating_average,rating_count:result.rating_count});toast('Rating berhasil disimpan.','success');setTimeout(()=>{host.remove();drawDetail()},250);}catch(e){toast(e.message,'error');}}));
  }

  async function downloadProject() {
    const s=requireSession();if(!s)return;const d=state.detail;if(!d)return;const version=d.versions.find(v=>v.status==='published'&&v.file_path)||d.versions.find(v=>v.file_path);if(!version){toast('File download belum tersedia.','error');return;}
    try{await rest('rpc/dlavie_record_project_download',{method:'POST',body:{p_project_id:d.project.id}});const res=await fetch(`${SB_URL}/storage/v1/object/authenticated/dlavie-project-files/${encPath(version.file_path)}`,{headers:{apikey:SB_KEY,Authorization:`Bearer ${s.access_token}`}});if(!res.ok)throw new Error('File tidak dapat diunduh.');const blob=await res.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=version.file_name||`${d.project.slug}-${version.version}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);d.project.download_count=Number(d.project.download_count||0)+1;toast('Download dimulai. Kamu sekarang dapat memberi rating.','success');drawDetail();}catch(e){toast(e.message,'error');}
  }

  async function shareProject() {
    const p=state.detail?.project;if(!p)return;const url=`${location.origin}${location.pathname}#/project/${encodeURIComponent(p.slug)}`;try{if(navigator.share)await navigator.share({title:p.name,text:p.summary||'Project Minecraft di DLavie Craft',url});else{await navigator.clipboard.writeText(url);toast('Link project disalin.','success');}}catch{}
  }

  async function bookmarkProject() {
    const s=requireSession();if(!s)return;const p=state.detail?.project;if(!p)return;
    try{const rows=await rest(`dlavie_saved_projects?select=project_slug&user_id=eq.${encodeURIComponent(s.user.id)}&project_slug=eq.${encodeURIComponent(p.slug)}&limit=1`,{schema:'public'});if(rows?.length){await rest(`dlavie_saved_projects?user_id=eq.${encodeURIComponent(s.user.id)}&project_slug=eq.${encodeURIComponent(p.slug)}`,{schema:'public',method:'DELETE'});toast('Project dihapus dari bookmark.');}else{await rest('dlavie_saved_projects',{schema:'public',method:'POST',body:{user_id:s.user.id,project_slug:p.slug}});toast('Project disimpan ke bookmark.','success');}}catch(e){toast(e.message,'error');}
  }

  function rerenderCurrent(){if(document.body.classList.contains('dl-gamehub-active')&&state.view!=='detail')renderView();}

  async function syncRoute() {
    const hash=location.hash||'#/' ;const detail=hash.match(/^#\/project\/([^/?#]+)/i);const home=hash==='#/'||hash==='#'||hash==='';
    if(detail){document.body.classList.add('dl-gamehub-active');state.view='detail';await loadPublic();renderDetail(decodeURIComponent(detail[1]));return;}
    if(home){document.body.classList.add('dl-gamehub-active');if(state.view==='detail')state.view='home';ensureRoot();renderView();loadPublic();checkCrafter().then(()=>{if($('.gh-drawer-backdrop')) openDrawer();});return;}
    document.body.classList.remove('dl-gamehub-active');document.getElementById(ROOT_ID)?.remove();
  }

  let raf=0;function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;syncRoute();});}
  const observer=new MutationObserver(()=>{const hash=location.hash||'#/' ;if((hash==='#/'||hash==='#'||hash===''||/^#\/project\//i.test(hash))&&!document.getElementById(ROOT_ID))schedule();});
  function start(){observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);window.addEventListener('popstate',schedule);document.addEventListener('dlavie:auth-changed',()=>{state.crafterCheckedFor=null;state.consoleData=null;state.inbox=null;checkCrafter(true).then(rerenderCurrent);});schedule();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
