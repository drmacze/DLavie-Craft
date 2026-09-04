(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  const EMOJI = [
    ['Cepat', ['👍','❤️','😂','🔥','🎉','💎','🙏','👀','✨','🤝']],
    ['Wajah', ['😀','😄','😁','😆','😅','🤣','😊','🙂','😉','😍','🥰','😘','😋','😜','🤔','🫡','😮','😱','🥹','😢','😭','😤','😡','🤯']],
    ['Gestur', ['👍','👎','👏','🙌','🤝','🙏','💪','👌','✌️','🤞','🫶','👀','💯']],
    ['Craft', ['⛏️','🪓','⚔️','🛡️','🏹','🧱','🪵','💎','🔥','✨','⚡','💡']],
    ['Perayaan', ['🎉','🎊','🥳','🏆','⭐','🌟','🚀','✅','❌','💚','💜','🧡']]
  ];
  const VOTES = [
    { id: 'agree', label: 'Setuju', mark: '✓' },
    { id: 'natural', label: 'Natural', mark: '◆' },
    { id: 'disagree', label: 'Tidak setuju', mark: '×' }
  ];

  let pageObserver = null;
  let raf = 0;
  let voteRows = [];
  let voteLoading = false;
  let reactionBusy = false;
  let voteBusy = '';
  let refreshTimer = 0;

  const core = () => window.__DLAVIE_COMMUNITY_V4__;
  const norm = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const login = () => (document.getElementById('dl-shell-account-entry') || document.getElementById('dl-account-entry'))?.click();

  function button(className, text = '') {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = className;
    node.setAttribute('data-dl-no-icon', 'true');
    if (text) node.textContent = text;
    return node;
  }

  function currentForum(page, state) {
    const visible = page.querySelector('.active-forum-head h2')?.textContent?.trim()
      || page.querySelector('.forum-sidebar nav button.active strong')?.textContent?.trim()
      || '';
    const exact = state.forums.find(f => norm(f.name) === norm(visible));
    if (exact) return exact;
    const context = norm(`${visible} ${page.querySelector('.active-forum-head')?.textContent || ''} ${page.querySelector('button[type="submit"]')?.textContent || ''}`);
    if (/saran|ide|feedback/.test(context) || page.querySelector('.feed-feedback,.idea-layout,.idea-copy')) {
      return state.forums.find(f => f.forum_type === 'feedback') || null;
    }
    return null;
  }

  function isFeedbackPage(page, forum) {
    if (forum?.forum_type === 'feedback') return true;
    const text = norm(`${page.querySelector('.active-forum-head')?.textContent || ''} ${page.querySelector('button[type="submit"]')?.textContent || ''}`);
    return /saran|ide|feedback|kirim saran/.test(text) || !!page.querySelector('.feed-feedback,.idea-layout,.idea-copy');
  }

  function feedbackPosts(state) {
    const forum = state.forums.find(f => f.forum_type === 'feedback');
    return forum ? state.posts.filter(p => p.forum_id === forum.id) : [];
  }

  function visibleEntries(page) {
    return [...page.querySelectorAll('.typed-feed > .community-entry')];
  }

  function resolvePost(entry, index, posts) {
    const id = entry.dataset.dlPostId;
    if (id) {
      const exact = posts.find(p => p.id === id);
      if (exact) return exact;
    }
    const title = norm(entry.querySelector('h2,h3,.idea-copy h2,.idea-copy h3')?.textContent);
    if (title) {
      const exactTitle = posts.find(p => norm(p.title) === title);
      if (exactTitle) return exactTitle;
      const partial = posts.find(p => norm(p.title).includes(title) || title.includes(norm(p.title)));
      if (partial) return partial;
    }
    return posts[index] || null;
  }

  function hideLegacy(entry) {
    entry.classList.add('dl-v10-entry');
    const selectors = [
      ':scope > .entry-actions', ':scope > .reaction-area', ':scope > .reaction-bar',
      ':scope > .dl-v4-reactions', ':scope > .dl-v9-action-row',
      ':scope > .dl-v8-action-row', ':scope > .dl-v7-actions'
    ];
    selectors.forEach(selector => entry.querySelectorAll(selector).forEach(node => {
      node.classList.add('dl-v10-legacy-hidden');
      node.setAttribute('aria-hidden', 'true');
      node.style.setProperty('display', 'none', 'important');
    }));

    // Remove orphan legacy reaction controls that caused white vertical pills on iOS.
    [...entry.children].forEach(node => {
      if (!(node instanceof HTMLElement)) return;
      if (node.classList.contains('dl-v10-actions') || node.classList.contains('dl-v10-vote-panel')) return;
      const cls = node.className || '';
      if (/reaction-(add|button|bar|area)|dl-v4-react/i.test(String(cls))) {
        node.classList.add('dl-v10-legacy-hidden');
        node.style.setProperty('display', 'none', 'important');
      }
    });
  }

  function reactionGroups(state, postId) {
    const me = core()?.uid?.();
    const map = new Map();
    state.reactions.filter(r => r.post_id === postId && !r.comment_id).forEach(r => {
      const item = map.get(r.emoji) || { emoji: r.emoji, count: 0, mine: false };
      item.count += 1;
      if (r.author_id === me) item.mine = true;
      map.set(r.emoji, item);
    });
    return [...map.values()];
  }

  function queueRefresh(delay = 300) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      try {
        await core()?.load?.(true);
        schedule();
      } catch {}
    }, delay);
  }

  async function toggleReaction(postId, emoji) {
    const c = core();
    if (!c?.session?.()) return login();
    if (reactionBusy) return;
    reactionBusy = true;
    const state = c.getState();
    const me = c.uid();
    const existing = state.reactions.find(r => r.post_id === postId && !r.comment_id && r.author_id === me && r.emoji === emoji);
    try {
      if (existing) {
        await c.api(`dlavie_craft_community_reactions?post_id=eq.${encodeURIComponent(postId)}&author_id=eq.${encodeURIComponent(me)}&emoji=eq.${encodeURIComponent(emoji)}`, { method: 'DELETE', write: true });
        const index = state.reactions.indexOf(existing);
        if (index >= 0) state.reactions.splice(index, 1);
      } else {
        const payload = { post_id: postId, comment_id: null, author_id: me, emoji };
        await c.api('dlavie_craft_community_reactions', { method: 'POST', write: true, body: JSON.stringify(payload) });
        state.reactions.push({ id: `v10-${Date.now()}-${Math.random()}`, ...payload, created_at: new Date().toISOString() });
      }
      schedule();
      queueRefresh();
    } catch (error) {
      c.toast?.(`Reaction gagal: ${error.message}`);
    } finally {
      reactionBusy = false;
    }
  }

  function closePicker() {
    document.querySelector('.dl-v10-picker-backdrop')?.remove();
    document.querySelector('.dl-v10-picker')?.remove();
    document.body.classList.remove('dl-v10-picker-open');
  }

  function openPicker(postId) {
    if (!core()?.session?.()) return login();
    closePicker();
    const backdrop = document.createElement('div');
    backdrop.className = 'dl-v10-picker-backdrop';
    backdrop.addEventListener('click', closePicker);
    const picker = document.createElement('section');
    picker.className = 'dl-v10-picker';
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-modal', 'true');
    picker.innerHTML = '<header><div><strong>Pilih reaction</strong><small>Tambahkan emoji ke pesan</small></div><button type="button" data-close data-dl-no-icon="true">×</button></header><label><span>Cari</span><input type="search" placeholder="Cari reaction…"></label><div class="dl-v10-emoji-list"></div>';
    const list = picker.querySelector('.dl-v10-emoji-list');
    const search = picker.querySelector('input');
    const draw = q => {
      const needle = norm(q);
      list.replaceChildren();
      EMOJI.forEach(([label, items]) => {
        const shown = needle && !norm(label).includes(needle) ? items.filter(e => e.includes(needle)) : items;
        if (!shown.length) return;
        const section = document.createElement('section');
        const title = document.createElement('small');
        const grid = document.createElement('div');
        title.textContent = label;
        shown.forEach(emoji => {
          const b = button('dl-v10-emoji', emoji);
          b.addEventListener('click', () => { closePicker(); toggleReaction(postId, emoji); });
          grid.append(b);
        });
        section.append(title, grid);
        list.append(section);
      });
    };
    draw('');
    search.addEventListener('input', () => draw(search.value));
    picker.querySelector('[data-close]').addEventListener('click', closePicker);
    document.body.append(backdrop, picker);
    document.body.classList.add('dl-v10-picker-open');
  }

  function nativeReplyButton(entry) {
    return entry.querySelector(':scope > .entry-actions .reply-toggle, :scope > .entry-actions button.reply-toggle, .reply-toggle');
  }

  function buildReactionBar(entry, post, state) {
    const groups = reactionGroups(state, post.id);
    const comments = state.comments.filter(c => c.post_id === post.id);
    const signature = JSON.stringify([post.id, groups.map(g => [g.emoji, g.count, g.mine]), comments.length]);
    let row = entry.querySelector(':scope > .dl-v10-actions');
    if (!row) {
      row = document.createElement('div');
      row.className = 'dl-v10-actions';
      const main = entry.querySelector(':scope > .chat-entry-main,.chat-entry-main');
      if (main) main.insertAdjacentElement('afterend', row);
      else entry.append(row);
    }
    if (row.dataset.signature === signature) return;
    row.dataset.signature = signature;
    row.replaceChildren();

    const reactions = document.createElement('div');
    reactions.className = 'dl-v10-reaction-strip';
    groups.forEach(group => {
      const chip = button(`dl-v10-chip${group.mine ? ' mine' : ''}`);
      chip.setAttribute('aria-pressed', String(group.mine));
      chip.innerHTML = `<span>${group.emoji}</span><b>${group.count}</b>`;
      chip.addEventListener('click', () => toggleReaction(post.id, group.emoji));
      reactions.append(chip);
    });
    const add = button('dl-v10-add');
    add.innerHTML = '<span>☺</span><b>+</b>';
    add.setAttribute('aria-label', 'Tambah reaction');
    add.addEventListener('click', () => openPicker(post.id));
    reactions.append(add);
    row.append(reactions);

    const reply = button('dl-v10-reply', comments.length ? `${comments.length} balasan` : 'Balas');
    reply.addEventListener('click', () => {
      const native = nativeReplyButton(entry);
      if (native) native.click();
      else entry.querySelector('.post-thread')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    row.append(reply);
  }

  async function loadVoteRows() {
    if (voteLoading || !core()) return;
    voteLoading = true;
    try {
      voteRows = await core().api('dlavie_craft_community_feedback_votes?select=id,post_id,user_id,choice,created_at,updated_at&order=created_at.asc') || [];
    } catch (error) {
      console.warn('[Community v10 votes]', error.message);
    } finally {
      voteLoading = false;
    }
  }

  function voteCounts(postId) {
    const out = { agree: 0, natural: 0, disagree: 0 };
    voteRows.filter(v => v.post_id === postId).forEach(v => { if (v.choice in out) out[v.choice] += 1; });
    return out;
  }

  function myVote(postId) {
    const me = core()?.uid?.();
    return voteRows.find(v => v.post_id === postId && v.user_id === me) || null;
  }

  async function setVote(postId, choice) {
    const c = core();
    if (!c?.session?.()) return login();
    const me = c.uid();
    const existing = myVote(postId);
    if (!me || voteBusy || existing?.choice === choice) return;
    voteBusy = postId;
    schedule();
    try {
      if (existing) {
        await c.api(`dlavie_craft_community_feedback_votes?post_id=eq.${encodeURIComponent(postId)}&user_id=eq.${encodeURIComponent(me)}`, { method: 'PATCH', write: true, body: JSON.stringify({ choice, updated_at: new Date().toISOString() }) });
        existing.choice = choice;
      } else {
        await c.api('dlavie_craft_community_feedback_votes', { method: 'POST', write: true, body: JSON.stringify({ post_id: postId, user_id: me, choice }) });
        voteRows.push({ id: `v10-vote-${Date.now()}`, post_id: postId, user_id: me, choice });
      }
      c.toast?.(`Vote ${VOTES.find(v => v.id === choice)?.label || choice} tersimpan`);
      setTimeout(async () => { await loadVoteRows(); schedule(); }, 300);
    } catch (error) {
      c.toast?.(`Vote gagal: ${error.message}`);
      await loadVoteRows();
    } finally {
      voteBusy = '';
      schedule();
    }
  }

  function buildVotePanel(postId) {
    const counts = voteCounts(postId);
    const current = myVote(postId);
    const panel = document.createElement('section');
    panel.className = 'dl-v10-vote-panel';
    panel.dataset.postId = postId;
    panel.innerHTML = '<header><div><strong>Vote ide ini</strong><small>Semua member dapat memilih satu pendapat dan menggantinya kapan saja.</small></div><span>1 akun · 1 vote</span></header>';
    const grid = document.createElement('div');
    grid.className = 'dl-v10-vote-grid';
    VOTES.forEach(choice => {
      const b = button(`dl-v10-vote choice-${choice.id}${current?.choice === choice.id ? ' active' : ''}`);
      b.disabled = voteBusy === postId;
      b.setAttribute('aria-pressed', String(current?.choice === choice.id));
      b.innerHTML = `<i>${choice.mark}</i><span>${choice.label}</span><b>${counts[choice.id]}</b>`;
      b.addEventListener('click', () => setVote(postId, choice.id));
      grid.append(b);
    });
    panel.append(grid);
    return panel;
  }

  function installVotes(page, state) {
    const posts = feedbackPosts(state);
    const entries = visibleEntries(page);
    entries.forEach((entry, index) => {
      const post = resolvePost(entry, index, posts);
      if (!post) return;
      entry.dataset.dlPostId = post.id;
      entry.classList.add('dl-v10-feedback-entry');
      hideLegacy(entry);
      entry.querySelectorAll('.post-thread,.idea-vote,.dl-v9-vote-panel,.dl-feedback-votes,.dl-feedback-v2-votes,.dl-v10-actions').forEach(node => node.style.setProperty('display','none','important'));
      const signature = JSON.stringify([myVote(post.id)?.choice || '', ...Object.values(voteCounts(post.id)), voteBusy === post.id]);
      let panel = entry.querySelector(':scope > .dl-v10-vote-panel');
      if (panel?.dataset.signature === signature) return;
      panel?.remove();
      panel = buildVotePanel(post.id);
      panel.dataset.signature = signature;
      entry.append(panel);
    });

    [...page.querySelectorAll('small,p,span')].forEach(node => {
      if (/member dapat memberi dukungan dan reaction/i.test(node.textContent || '')) node.textContent = 'Semua member dapat memberi vote: Setuju, Natural, atau Tidak setuju.';
    });
  }

  function installChat(page, forum, state) {
    if (!forum) return;
    const posts = state.posts.filter(post => post.forum_id === forum.id);
    const entries = visibleEntries(page);
    entries.forEach((entry, index) => {
      const post = resolvePost(entry, index, posts);
      if (!post) return;
      entry.dataset.dlPostId = post.id;
      hideLegacy(entry);
      buildReactionBar(entry, post, state);
    });
  }

  async function render(page) {
    if (!page?.isConnected) return;
    const c = core();
    if (!c) return setTimeout(() => schedule(page), 120);
    try {
      await c.load?.(false);
      const state = c.getState?.();
      if (!state?.forums?.length) return;
      const forum = currentForum(page, state);
      const feedback = isFeedbackPage(page, forum);
      page.classList.toggle('dl-community-v10-feedback', feedback);
      page.classList.add('dl-community-v10');
      if (feedback) {
        if (!voteRows.length && !voteLoading) await loadVoteRows();
        installVotes(page, state);
      } else {
        installChat(page, forum, state);
      }
    } catch (error) {
      console.warn('[Community controls v10]', error.message);
    }
  }

  function schedule(page = document.querySelector(PAGE)) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render(page);
    });
  }

  function attach(page) {
    pageObserver?.disconnect();
    pageObserver = new MutationObserver(records => {
      const meaningful = records.some(record => {
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !target?.closest?.('.dl-v10-actions,.dl-v10-picker,.dl-v10-vote-panel');
      });
      if (meaningful) schedule(page);
    });
    pageObserver.observe(page, { childList: true, subtree: true });
    schedule(page);
  }

  function route() {
    closePicker();
    if (!ROUTE.test(location.hash)) {
      pageObserver?.disconnect();
      pageObserver = null;
      return;
    }
    let tries = 0;
    const wait = () => {
      const page = document.querySelector(PAGE);
      if (page) return attach(page);
      if (tries++ < 50) setTimeout(wait, 90);
    };
    wait();
  }

  document.addEventListener('click', event => {
    if (!ROUTE.test(location.hash)) return;
    if (event.target.closest?.('.forum-sidebar nav button')) setTimeout(() => schedule(), 160);
  }, true);
  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  window.addEventListener('pageshow', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();