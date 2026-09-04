(() => {
  'use strict';

  const SUPABASE_URL = 'https://ydaeukhqwishlrjyfktk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_XNXU6SVeM-D477Ymy1ORsw_4hCHOll9';
  const SESSION_KEY = 'sb-ydaeukhqwishlrjyfktk-auth-token';
  const PAGE_SELECTOR = '.community-page.community-v2';
  const ROUTE_RE = /#\/community(?:$|[/?])/;
  const API_PROFILE = 'api';

  let state = { forums: [], posts: [], comments: [], reactions: [], profiles: [] };
  let stateLoadedAt = 0;
  let loadingState = null;
  let observedPage = null;
  let observer = null;
  let raf = 0;
  let refreshTimer = 0;
  let actionBusy = false;

  function readSession() {
    try {
      const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return value?.access_token ? value : null;
    } catch { return null; }
  }

  function userId() {
    const session = readSession();
    if (session?.user?.id) return session.user.id;
    const token = session?.access_token;
    if (!token) return null;
    try {
      const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(escape(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')))));
      return payload?.sub || null;
    } catch { return null; }
  }

  function headers(write = false) {
    const session = readSession();
    const h = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session?.access_token || SUPABASE_KEY}`,
      'Accept-Profile': API_PROFILE,
      Accept: 'application/json'
    };
    if (write) {
      h['Content-Type'] = 'application/json';
      h['Content-Profile'] = API_PROFILE;
      h.Prefer = 'return=minimal';
    }
    return h;
  }

  async function api(path, options = {}) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: { ...headers(!!options.write), ...(options.headers || {}) }
    });
    const text = await response.text();
    let body = null;
    if (text) {
      try { body = JSON.parse(text); } catch { body = text; }
    }
    if (!response.ok) {
      const message = body?.message || body?.details || body?.hint || (typeof body === 'string' ? body : '') || `Server ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  }

  async function loadState(force = false) {
    if (!force && Date.now() - stateLoadedAt < 2200 && state.forums.length) return state;
    if (loadingState) return loadingState;
    loadingState = Promise.all([
      api('dlavie_craft_community_forums?select=id,slug,name,forum_type&is_active=eq.true&order=sort_order.asc'),
      api('dlavie_craft_community_posts?select=id,author_id,forum_id,category,title,body,status,created_at,updated_at&status=eq.published&order=created_at.desc'),
      api('dlavie_craft_community_comments?select=id,post_id,author_id,parent_comment_id,body,status,created_at,updated_at&status=eq.published&order=created_at.asc'),
      api('dlavie_craft_community_reactions?select=id,post_id,author_id,emoji,created_at&order=created_at.asc'),
      api('dlavie_craft_community_leaderboard?select=user_id,display_name,level')
    ]).then(([forums, posts, comments, reactions, profiles]) => {
      state = {
        forums: Array.isArray(forums) ? forums : [],
        posts: Array.isArray(posts) ? posts : [],
        comments: Array.isArray(comments) ? comments : [],
        reactions: Array.isArray(reactions) ? reactions : [],
        profiles: Array.isArray(profiles) ? profiles : []
      };
      stateLoadedAt = Date.now();
      return state;
    }).finally(() => { loadingState = null; });
    return loadingState;
  }

  function activeForum(page) {
    const name = page.querySelector('.active-forum-head h2')?.textContent?.trim();
    const active = page.querySelector('.forum-sidebar nav button.active');
    const activeName = active?.querySelector('strong')?.textContent?.trim();
    return state.forums.find(f => f.name === name || f.name === activeName) || null;
  }

  function profileName(id) {
    return state.profiles.find(p => p.user_id === id)?.display_name || 'Crafter';
  }

  function edited(created, updated) {
    const a = new Date(created || 0).getTime();
    const b = new Date(updated || 0).getTime();
    return Number.isFinite(a) && Number.isFinite(b) && b - a > 2000;
  }

  function textPreview(value, max = 86) {
    const clean = String(value || '').replace(/\s+/g, ' ').trim();
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
  }

  function ensureReactionTrigger(button) {
    button.querySelectorAll(':scope > .dl-mc-sweep-icon,:scope > .dl-mc-forge-icon,:scope > .dl-mc-icon,:scope > svg').forEach(n => n.remove());
    button.classList.add('dl-reaction-trigger', 'dl-community-native-action');
    if (!button.querySelector('.dl-reaction-trigger-emoji')) {
      const emoji = document.createElement('span');
      emoji.className = 'dl-reaction-trigger-emoji';
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = '😊';
      button.prepend(emoji);
    }
    if (!button.querySelector('.dl-reaction-add-label')) {
      const label = document.createElement('span');
      label.className = 'dl-reaction-add-label';
      label.textContent = 'React';
      button.append(label);
    }
  }

  function normalizeReactionUI(page) {
    page.querySelectorAll('.reaction-add').forEach(ensureReactionTrigger);
    page.querySelectorAll('.reaction-button').forEach(button => button.classList.add('dl-reaction-chip', 'dl-community-native-action'));
  }

  function addEditedMark(scope, item) {
    if (!edited(item.created_at, item.updated_at)) return;
    const meta = scope.querySelector('.entry-author small, :scope > div > div:first-child small, small');
    if (!meta || meta.parentElement?.querySelector('.dl-edited-mark')) return;
    const mark = document.createElement('span');
    mark.className = 'dl-edited-mark';
    mark.textContent = 'diedit';
    meta.insertAdjacentElement('afterend', mark);
  }

  function createContext(comment, commentsById, commentNodes) {
    const node = commentNodes.get(comment.id);
    if (!node || !comment.parent_comment_id) return;
    node.classList.add('dl-comment-reply');
    node.classList.remove('dl-comment-root');
    if (node.querySelector('.dl-reply-context')) return;

    const parent = commentsById.get(comment.parent_comment_id);
    if (!parent) return;
    const parentNode = commentNodes.get(parent.id);
    const visibleName = parentNode?.querySelector('strong')?.textContent?.trim();
    const name = visibleName || profileName(parent.author_id);

    const context = document.createElement('button');
    context.type = 'button';
    context.className = 'dl-reply-context';
    context.setAttribute('data-dl-no-icon', 'true');
    context.innerHTML = '<span aria-hidden="true">↳</span><span><strong></strong><small></small></span>';
    context.querySelector('strong').textContent = `Membalas ${name}`;
    context.querySelector('small').textContent = textPreview(parent.body);
    context.addEventListener('click', () => {
      parentNode?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      parentNode?.classList.add('dl-comment-highlight');
      window.setTimeout(() => parentNode?.classList.remove('dl-comment-highlight'), 900);
    });
    const body = node.querySelector('p');
    body?.insertAdjacentElement('beforebegin', context);
  }

  function ensureThreadHeader(entry, post, comments) {
    const thread = entry.querySelector('.post-thread');
    if (!thread) return;
    let head = thread.querySelector('.dl-thread-head');
    if (!head) {
      head = document.createElement('div');
      head.className = 'dl-thread-head';
      head.innerHTML = '<span class="dl-thread-rail-dot" aria-hidden="true"></span><div><strong>Thread</strong><small></small></div><b></b>';
      thread.prepend(head);
    }
    head.querySelector('small').textContent = `Balasan untuk ${profileName(post.author_id)}`;
    head.querySelector('b').textContent = `${comments.length} balasan`;
  }

  function closeMenus(except = null) {
    document.querySelectorAll('.dl-message-menu.open').forEach(menu => {
      if (menu !== except) menu.classList.remove('open');
    });
  }

  function makeMenuButton(kind, item, host) {
    if (host.querySelector(':scope > .dl-message-more')) return;
    const current = userId();
    if (!current) return;
    const own = current === item.author_id;

    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'dl-message-more';
    more.setAttribute('data-dl-no-icon', 'true');
    more.setAttribute('aria-label', 'Aksi pesan');
    more.setAttribute('aria-haspopup', 'menu');
    more.textContent = '•••';

    const menu = document.createElement('div');
    menu.className = 'dl-message-menu';
    menu.setAttribute('role', 'menu');

    if (own) {
      menu.appendChild(menuItem('Edit', 'edit', () => openEdit(kind, item)));
      menu.appendChild(menuItem('Hapus', 'delete', () => openDelete(kind, item)));
    } else {
      menu.appendChild(menuItem('Laporkan', 'report', () => openReport(kind, item)));
    }

    more.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const open = !menu.classList.contains('open');
      closeMenus(menu);
      menu.classList.toggle('open', open);
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    host.classList.add('dl-message-action-host');
    host.append(more, menu);
  }

  function menuItem(label, action, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    button.setAttribute('data-dl-no-icon', 'true');
    button.dataset.action = action;
    button.textContent = label;
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      closeMenus();
      handler();
    });
    return button;
  }

  function attachActions(entry, post, comments, commentNodes) {
    const bubble = entry.querySelector('.chat-bubble,.showcase-copy,.ticket-copy,.idea-copy,.announcement-layout > div:last-child') || entry;
    makeMenuButton('post', post, bubble);
    comments.forEach(comment => {
      const node = commentNodes.get(comment.id);
      const content = node?.children?.[1] || node;
      if (content) makeMenuButton('comment', comment, content);
    });
  }

  function enhanceDOM(page = document.querySelector(PAGE_SELECTOR)) {
    if (!page || !state.forums.length) return;
    normalizeReactionUI(page);

    const forum = activeForum(page);
    if (!forum) return;
    const posts = state.posts.filter(p => p.forum_id === forum.id);
    const entries = Array.from(page.querySelectorAll('.typed-feed > .community-entry'));

    entries.forEach((entry, index) => {
      const post = posts[index];
      if (!post) return;
      entry.dataset.dlPostId = post.id;
      entry.dataset.dlAuthorId = post.author_id;
      entry.classList.add('dl-community-entry-v3');
      addEditedMark(entry, post);

      const comments = state.comments.filter(c => c.post_id === post.id);
      ensureThreadHeader(entry, post, comments);
      const nodes = Array.from(entry.querySelectorAll('.post-thread .community-comment'));
      const commentNodes = new Map();
      nodes.forEach((node, i) => {
        const comment = comments[i];
        if (!comment) return;
        node.dataset.dlCommentId = comment.id;
        node.dataset.dlAuthorId = comment.author_id;
        node.classList.add('dl-comment-v3');
        node.classList.toggle('dl-comment-root', !comment.parent_comment_id);
        node.classList.toggle('dl-comment-reply', !!comment.parent_comment_id);
        commentNodes.set(comment.id, node);
        addEditedMark(node, comment);
      });
      const commentsById = new Map(comments.map(c => [c.id, c]));
      comments.forEach(c => createContext(c, commentsById, commentNodes));
      attachActions(entry, post, comments, commentNodes);
    });
  }

  function scheduleDOM(page = document.querySelector(PAGE_SELECTOR)) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      enhanceDOM(page);
    });
  }

  function scheduleStateRefresh(delay = 450) {
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(async () => {
      if (!ROUTE_RE.test(location.hash)) return;
      try {
        await loadState(true);
        scheduleDOM();
      } catch (error) {
        console.warn('[DLavie Community v3] refresh skipped:', error.message);
      }
    }, delay);
  }

  function sheet(title, description = '') {
    document.querySelector('.dl-community-v3-sheet')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'dl-community-v3-sheet';
    overlay.innerHTML = '<section role="dialog" aria-modal="true"><div class="dl-v3-sheet-head"><div><strong></strong><small></small></div><button type="button" data-close aria-label="Tutup" data-dl-no-icon="true">×</button></div><div class="dl-v3-sheet-body"></div></section>';
    overlay.querySelector('.dl-v3-sheet-head strong').textContent = title;
    overlay.querySelector('.dl-v3-sheet-head small').textContent = description;
    const close = () => overlay.remove();
    overlay.querySelector('[data-close]').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    document.body.appendChild(overlay);
    return { overlay, body: overlay.querySelector('.dl-v3-sheet-body'), close };
  }

  function button(label, className = '') {
    const node = document.createElement('button');
    node.type = 'button';
    node.setAttribute('data-dl-no-icon', 'true');
    node.className = `dl-v3-action ${className}`.trim();
    node.textContent = label;
    return node;
  }

  async function patchItem(kind, id, payload) {
    const table = kind === 'post' ? 'dlavie_craft_community_posts' : 'dlavie_craft_community_comments';
    return api(`${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', write: true, body: JSON.stringify(payload)
    });
  }

  async function deleteItem(kind, id) {
    const table = kind === 'post' ? 'dlavie_craft_community_posts' : 'dlavie_craft_community_comments';
    return api(`${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', write: true });
  }

  function openEdit(kind, item) {
    const ui = sheet(kind === 'post' ? 'Edit pesan' : 'Edit balasan', 'Perubahan akan ditandai sebagai diedit.');
    const form = document.createElement('form');
    form.className = 'dl-v3-edit-form';
    const textarea = document.createElement('textarea');
    textarea.required = true;
    textarea.maxLength = kind === 'post' ? 8000 : 4000;
    textarea.rows = 5;
    textarea.value = item.body || '';
    const counter = document.createElement('small');
    const updateCounter = () => { counter.textContent = `${textarea.value.length}/${textarea.maxLength}`; };
    textarea.addEventListener('input', updateCounter);
    updateCounter();
    const actions = document.createElement('div');
    actions.className = 'dl-v3-sheet-actions';
    const cancel = button('Batal', 'secondary');
    const save = button('Simpan', 'primary');
    save.type = 'submit';
    cancel.addEventListener('click', ui.close);
    actions.append(cancel, save);
    form.append(textarea, counter, actions);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const body = textarea.value.trim();
      if (!body || actionBusy) return;
      actionBusy = true;
      save.disabled = true;
      save.textContent = 'Menyimpan…';
      try {
        const payload = { body };
        if (kind === 'post' && item.category === 'general') payload.title = body.replace(/\s+/g, ' ').slice(0, 100);
        await patchItem(kind, item.id, payload);
        ui.close();
        toast('Pesan diperbarui');
        scheduleStateRefresh(80);
      } catch (error) {
        inlineError(form, error.message);
      } finally {
        actionBusy = false;
        save.disabled = false;
        save.textContent = 'Simpan';
      }
    });
    ui.body.append(form);
    textarea.focus();
  }

  function openDelete(kind, item) {
    const ui = sheet(kind === 'post' ? 'Hapus pesan?' : 'Hapus balasan?', 'Tindakan ini tidak dapat dibatalkan.');
    const preview = document.createElement('blockquote');
    preview.textContent = textPreview(item.body, 170);
    const actions = document.createElement('div');
    actions.className = 'dl-v3-sheet-actions';
    const cancel = button('Batal', 'secondary');
    const remove = button('Hapus', 'danger');
    cancel.addEventListener('click', ui.close);
    remove.addEventListener('click', async () => {
      if (actionBusy) return;
      actionBusy = true;
      remove.disabled = true;
      remove.textContent = 'Menghapus…';
      try {
        await deleteItem(kind, item.id);
        ui.close();
        toast(kind === 'post' ? 'Pesan dihapus' : 'Balasan dihapus');
        scheduleStateRefresh(80);
      } catch (error) {
        inlineError(ui.body, error.message);
      } finally {
        actionBusy = false;
        remove.disabled = false;
        remove.textContent = 'Hapus';
      }
    });
    actions.append(cancel, remove);
    ui.body.append(preview, actions);
  }

  function openReport(kind, item) {
    if (!readSession()) return openLogin();
    const ui = sheet('Laporkan pesan', 'Laporan dikirim ke moderasi DLavie Craft.');
    const form = document.createElement('form');
    form.className = 'dl-v3-report-form';
    const label = document.createElement('label');
    label.textContent = 'Alasan';
    const select = document.createElement('select');
    [
      ['spam', 'Spam'], ['harassment', 'Pelecehan / bullying'], ['hate', 'Ujaran kebencian'],
      ['nsfw', 'Konten tidak pantas'], ['scam', 'Scam / malware'], ['off_topic', 'Di luar topik'], ['other', 'Lainnya']
    ].forEach(([value, text]) => {
      const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option);
    });
    label.append(select);
    const details = document.createElement('textarea');
    details.rows = 3;
    details.maxLength = 600;
    details.placeholder = 'Tambahkan detail jika diperlukan…';
    const actions = document.createElement('div');
    actions.className = 'dl-v3-sheet-actions';
    const cancel = button('Batal', 'secondary');
    const submit = button('Kirim laporan', 'primary'); submit.type = 'submit';
    cancel.addEventListener('click', ui.close);
    actions.append(cancel, submit);
    form.append(label, details, actions);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (actionBusy) return;
      const uid = userId();
      if (!uid) return openLogin();
      actionBusy = true;
      submit.disabled = true;
      submit.textContent = 'Mengirim…';
      try {
        const payload = {
          post_id: kind === 'post' ? item.id : null,
          comment_id: kind === 'comment' ? item.id : null,
          reporter_id: uid,
          reported_author_id: item.author_id,
          reason: select.value,
          details: details.value.trim(),
          target_excerpt: textPreview(item.body, 240)
        };
        await api('dlavie_craft_community_reports', { method: 'POST', write: true, body: JSON.stringify(payload) });
        ui.close();
        toast('Laporan terkirim ke moderasi');
      } catch (error) {
        inlineError(form, error.status === 409 || /duplicate|unique/i.test(error.message) ? 'Pesan ini sudah kamu laporkan dan masih menunggu moderasi.' : error.message);
      } finally {
        actionBusy = false;
        submit.disabled = false;
        submit.textContent = 'Kirim laporan';
      }
    });
    ui.body.append(form);
  }

  function inlineError(scope, message) {
    scope.querySelector('.dl-v3-inline-error')?.remove();
    const node = document.createElement('div');
    node.className = 'dl-v3-inline-error';
    node.textContent = message || 'Terjadi kesalahan.';
    scope.prepend(node);
  }

  function toast(message) {
    document.querySelector('.dl-community-v3-toast')?.remove();
    const node = document.createElement('div');
    node.className = 'dl-community-v3-toast';
    node.setAttribute('role', 'status');
    node.textContent = message;
    document.body.append(node);
    requestAnimationFrame(() => node.classList.add('show'));
    setTimeout(() => {
      node.classList.remove('show');
      setTimeout(() => node.remove(), 180);
    }, 2400);
  }

  function openLogin() {
    const button = document.getElementById('dl-shell-account-entry') || document.getElementById('dl-account-entry');
    if (button) button.click();
    else {
      const url = new URL(location.href);
      url.searchParams.set('dlavie', 'login');
      history.pushState({}, '', url.pathname + url.search + url.hash);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  function currentReaction(postId, uid) {
    return state.reactions.find(r => r.post_id === postId && r.author_id === uid) || null;
  }

  async function setSingleReaction(postId, emoji) {
    const uid = userId();
    if (!uid) return openLogin();
    const current = currentReaction(postId, uid);
    if (actionBusy) return;
    actionBusy = true;
    try {
      // Always clear this user's current reaction first. The database also has a
      // UNIQUE(post_id, author_id) constraint, so one user can never end up with
      // two different reactions even during racing taps/realtime updates.
      if (current) {
        await api(`dlavie_craft_community_reactions?post_id=eq.${encodeURIComponent(postId)}&author_id=eq.${encodeURIComponent(uid)}`, { method: 'DELETE', write: true });
      }
      const togglingOff = current?.emoji === emoji;
      if (!togglingOff) {
        await api('dlavie_craft_community_reactions', {
          method: 'POST', write: true,
          body: JSON.stringify({ post_id: postId, author_id: uid, emoji })
        });
      }
      state.reactions = state.reactions.filter(r => !(r.post_id === postId && r.author_id === uid));
      if (!togglingOff) state.reactions.push({ id: `optimistic-${Date.now()}`, post_id: postId, author_id: uid, emoji, created_at: new Date().toISOString() });
      document.querySelector(`${PAGE_SELECTOR} .emoji-popover .emoji-close`)?.click();
      scheduleStateRefresh(120);
    } catch (error) {
      toast(`Reaction gagal: ${error.message}`);
      scheduleStateRefresh(80);
    } finally {
      actionBusy = false;
    }
  }

  function reactionFromTarget(target) {
    const grid = target.closest?.('.emoji-grid button');
    if (grid) return grid.textContent.trim();
    const chip = target.closest?.('.reaction-button');
    if (chip) return chip.querySelector('span')?.textContent?.trim() || null;
    const vote = target.closest?.('.idea-vote');
    if (vote) return '💡';
    return null;
  }

  function reactionCapture(event) {
    if (!ROUTE_RE.test(location.hash) || !readSession()) return;
    const emoji = reactionFromTarget(event.target);
    if (!emoji) return;
    const entry = event.target.closest?.('.community-entry');
    const postId = entry?.dataset?.dlPostId;
    if (!postId) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    setSingleReaction(postId, emoji);
  }

  // Capture before React's delegated click handler so the original multi-reaction
  // insert cannot race the one-reaction backend rule.
  document.addEventListener('click', reactionCapture, true);
  document.addEventListener('click', event => {
    if (!event.target.closest?.('.dl-message-more,.dl-message-menu')) closeMenus();
  });

  function attach(page) {
    if (!page || observedPage === page) {
      if (page) scheduleDOM(page);
      return;
    }
    observer?.disconnect();
    observedPage = page;

    loadState(true).then(() => scheduleDOM(page)).catch(error => console.warn('[DLavie Community v3]', error.message));

    page.addEventListener('click', event => {
      if (event.target.closest('.forum-sidebar nav button')) {
        window.setTimeout(() => {
          loadState(true).then(() => scheduleDOM(page)).catch(() => {});
        }, 120);
      }
    });

    observer = new MutationObserver(records => {
      let meaningful = false;
      let dataChanged = false;
      for (const record of records) {
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        if (target?.closest?.('.dl-message-menu,.dl-message-more,.dl-reply-context,.dl-thread-head,.dl-community-v3-sheet')) continue;
        if (record.addedNodes.length || record.removedNodes.length) meaningful = true;
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.('.community-entry,.community-comment') || node.querySelector?.('.community-entry,.community-comment')) dataChanged = true;
        }
      }
      if (meaningful) scheduleDOM(page);
      if (dataChanged) scheduleStateRefresh(420);
    });
    observer.observe(page, { childList: true, subtree: true });
  }

  function wait(attempt = 0) {
    const page = document.querySelector(PAGE_SELECTOR);
    if (page) return attach(page);
    if (attempt < 30 && ROUTE_RE.test(location.hash)) setTimeout(() => wait(attempt + 1), 70 + attempt * 10);
  }

  function routeChanged() {
    if (!ROUTE_RE.test(location.hash)) {
      observer?.disconnect(); observer = null; observedPage = null;
      closeMenus();
      return;
    }
    wait();
  }

  window.addEventListener('hashchange', routeChanged);
  window.addEventListener('popstate', routeChanged);
  window.addEventListener('pageshow', routeChanged);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', routeChanged, { once: true });
  else routeChanged();
})();