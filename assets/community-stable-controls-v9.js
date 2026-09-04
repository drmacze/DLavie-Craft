(() => {
  'use strict';

  const ROUTE = /#\/community(?:$|[/?])/;
  const PAGE = '.community-page.community-v2';
  const EMOJI = [
    ['Cepat', ['👍','❤️','😂','🔥','🎉','💎','🙏','👀','✨','🤝']],
    ['Wajah', ['😀','😄','😁','😆','😅','🤣','😊','🙂','😉','😍','🥰','😘','😋','😜','🤔','🫡','😮','😱','🥹','😢','😭','😤','😡','🤯']],
    ['Gestur', ['👍','👎','👏','🙌','🤝','🙏','💪','👌','✌️','🤞','🫶','👀','💯']],
    ['Craft', ['⛏️','🪓','⚔️','🛡️','🏹','🧱','🪵','💎','🔥','✨','⚡','💡']],
    ['Perayaan', ['🎉','🎊','🥳','🏆','⭐','🌟','🚀','✅','❌','💚','💜','🧡']]
  ];
  const VOTE_CHOICES = [
    { id: 'agree', label: 'Setuju', mark: '✓' },
    { id: 'natural', label: 'Natural', mark: '◆' },
    { id: 'disagree', label: 'Tidak setuju', mark: '×' }
  ];

  let observer = null;
  let raf = 0;
  let reactionBusy = false;
  let voteBusy = '';
  let votes = [];
  let voteLoading = false;
  let refreshTimer = 0;

  const core = () => window.__DLAVIE_COMMUNITY_V4__;
  const login = () => (document.getElementById('dl-shell-account-entry') || document.getElementById('dl-account-entry'))?.click();

  function makeButton(className, label = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('data-dl-no-icon', 'true');
    if (label) button.textContent = label;
    return button;
  }

  function activeForum(page, state) {
    const visibleName = page.querySelector('.active-forum-head h2')?.textContent?.trim()
      || page.querySelector('.forum-sidebar nav button.active strong')?.textContent?.trim()
      || '';
    let forum = state.forums.find(item => item.name === visibleName) || null;
    if (forum) return forum;

    const context = `${visibleName} ${page.querySelector('.active-forum-head')?.textContent || ''} ${page.querySelector('button[type="submit"]')?.textContent || ''}`.toLowerCase();
    if (/saran|ide|feedback/.test(context) || page.querySelector('.feed-feedback')) {
      return state.forums.find(item => item.forum_type === 'feedback') || null;
    }
    return null;
  }

  function postsForForum(state, forum) {
    return forum ? state.posts.filter(post => post.forum_id === forum.id) : [];
  }

  function groupedReactions(state, kind, id) {
    const key = kind === 'comment' ? 'comment_id' : 'post_id';
    const me = core()?.uid?.();
    const map = new Map();
    state.reactions.filter(row => row[key] === id).forEach(row => {
      const group = map.get(row.emoji) || { emoji: row.emoji, count: 0, mine: false };
      group.count += 1;
      if (row.author_id === me) group.mine = true;
      map.set(row.emoji, group);
    });
    return [...map.values()];
  }

  async function toggleReaction(kind, id, emoji) {
    const c = core();
    if (!c?.session?.()) return login();
    if (reactionBusy) return;
    reactionBusy = true;
    const state = c.getState();
    const me = c.uid();
    const key = kind === 'comment' ? 'comment_id' : 'post_id';
    const existing = state.reactions.find(row => row[key] === id && row.author_id === me && row.emoji === emoji);

    try {
      if (existing) {
        await c.api(`dlavie_craft_community_reactions?${key}=eq.${encodeURIComponent(id)}&author_id=eq.${encodeURIComponent(me)}&emoji=eq.${encodeURIComponent(emoji)}`, { method: 'DELETE', write: true });
        const index = state.reactions.indexOf(existing);
        if (index >= 0) state.reactions.splice(index, 1);
      } else {
        const payload = {
          post_id: kind === 'post' ? id : null,
          comment_id: kind === 'comment' ? id : null,
          author_id: me,
          emoji
        };
        await c.api('dlavie_craft_community_reactions', { method: 'POST', write: true, body: JSON.stringify(payload) });
        state.reactions.push({ id: `v9-${Date.now()}-${Math.random()}`, ...payload, created_at: new Date().toISOString() });
      }
      schedule();
      queueRefresh(260);
    } catch (error) {
      c.toast?.(`Reaction gagal: ${error.message}`);
    } finally {
      reactionBusy = false;
    }
  }

  function closePicker() {
    document.querySelector('.dl-v9-picker-backdrop')?.remove();
    document.querySelector('.dl-v9-picker')?.remove();
    document.body.classList.remove('dl-v9-picker-open');
  }

  function openPicker(kind, id) {
    if (!core()?.session?.()) return login();
    closePicker();

    const backdrop = document.createElement('div');
    backdrop.className = 'dl-v9-picker-backdrop';
    backdrop.addEventListener('click', closePicker);

    const picker = document.createElement('section');
    picker.className = 'dl-v9-picker';
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-modal', 'true');
    picker.setAttribute('aria-label', 'Pilih reaction');
    picker.innerHTML = `
      <header>
        <div><strong>Pilih reaction</strong><small>Tambahkan emoji seperti Discord</small></div>
        <button type="button" data-close data-dl-no-icon="true" aria-label="Tutup">×</button>
      </header>
      <label class="dl-v9-search"><span>Cari</span><input type="search" placeholder="Cari reaction…"></label>
      <div class="dl-v9-emoji-list"></div>`;

    const list = picker.querySelector('.dl-v9-emoji-list');
    const search = picker.querySelector('input');
    const draw = query => {
      const needle = String(query || '').trim().toLowerCase();
      list.replaceChildren();
      EMOJI.forEach(([category, items]) => {
        const matched = needle && !category.toLowerCase().includes(needle)
          ? items.filter(emoji => emoji.includes(needle))
          : items;
        if (!matched.length) return;
        const section = document.createElement('section');
        const title = document.createElement('small');
        const grid = document.createElement('div');
        title.textContent = category;
        matched.forEach(emoji => {
          const button = makeButton('dl-v9-emoji', emoji);
          button.addEventListener('click', () => {
            closePicker();
            toggleReaction(kind, id, emoji);
          });
          grid.append(button);
        });
        section.append(title, grid);
        list.append(section);
      });
    };

    draw('');
    search.addEventListener('input', () => draw(search.value));
    picker.querySelector('[data-close]').addEventListener('click', closePicker);
    document.body.append(backdrop, picker);
    document.body.classList.add('dl-v9-picker-open');
  }

  function buildActionRow(entry, post, state) {
    const comments = state.comments.filter(comment => comment.post_id === post.id);
    const groups = groupedReactions(state, 'post', post.id);
    const nativeReply = entry.querySelector(':scope > .entry-actions .reply-toggle, :scope > .entry-actions button.reply-toggle');
    const replyLabel = nativeReply?.textContent?.trim() || (comments.length ? `${comments.length} balasan` : 'Balas');
    const signature = JSON.stringify([post.id, groups.map(g => [g.emoji, g.count, g.mine]), replyLabel, comments.length]);

    let row = entry.querySelector(':scope > .dl-v9-action-row');
    if (!row) {
      row = document.createElement('div');
      row.className = 'dl-v9-action-row';
      const main = entry.querySelector(':scope > .chat-entry-main');
      if (main) main.insertAdjacentElement('afterend', row);
      else entry.append(row);
    }
    if (row.dataset.signature === signature) return;
    row.dataset.signature = signature;
    row.replaceChildren();

    groups.forEach(group => {
      const chip = makeButton(`dl-v9-react-chip${group.mine ? ' mine' : ''}`);
      chip.setAttribute('aria-pressed', String(group.mine));
      chip.innerHTML = `<span>${group.emoji}</span><b>${group.count}</b>`;
      chip.addEventListener('click', () => toggleReaction('post', post.id, group.emoji));
      row.append(chip);
    });

    const add = makeButton('dl-v9-react-add');
    add.innerHTML = '<span class="dl-v9-face">☺</span><b>+</b>';
    add.setAttribute('aria-label', 'Tambah reaction');
    add.addEventListener('click', () => openPicker('post', post.id));
    row.append(add);

    const reply = makeButton('dl-v9-reply', replyLabel);
    reply.addEventListener('click', () => {
      const latestNative = entry.querySelector(':scope > .entry-actions .reply-toggle, :scope > .entry-actions button.reply-toggle');
      if (latestNative) latestNative.click();
      else {
        const thread = entry.querySelector('.post-thread');
        if (thread) thread.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    row.append(reply);
  }

  function renderChatControls(page, forum, state) {
    const posts = postsForForum(state, forum);
    const entries = [...page.querySelectorAll('.typed-feed > .community-entry')];

    entries.forEach((entry, index) => {
      const post = posts[index];
      if (!post) return;
      entry.dataset.dlPostId = post.id;
      entry.classList.add('dl-v9-message');
      if (forum.forum_type === 'feedback') return;

      const oldActions = entry.querySelector(':scope > .entry-actions');
      if (oldActions) {
        oldActions.classList.add('dl-v9-native-actions');
        oldActions.setAttribute('aria-hidden', 'true');
      }
      entry.querySelectorAll(':scope > .reaction-area, :scope > .reaction-bar').forEach(node => node.remove());
      buildActionRow(entry, post, state);
    });
  }

  async function loadVotes() {
    if (voteLoading || !core()) return;
    voteLoading = true;
    try {
      votes = await core().api('dlavie_craft_community_feedback_votes?select=id,post_id,user_id,choice,created_at,updated_at&order=created_at.asc') || [];
    } catch (error) {
      console.warn('[DLavie vote v9]', error.message);
    } finally {
      voteLoading = false;
    }
  }

  function voteCounts(postId) {
    const result = { agree: 0, natural: 0, disagree: 0 };
    votes.filter(vote => vote.post_id === postId).forEach(vote => {
      if (vote.choice in result) result[vote.choice] += 1;
    });
    return result;
  }

  function myVote(postId) {
    const me = core()?.uid?.();
    return votes.find(vote => vote.post_id === postId && vote.user_id === me) || null;
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
        await c.api(`dlavie_craft_community_feedback_votes?post_id=eq.${encodeURIComponent(postId)}&user_id=eq.${encodeURIComponent(me)}`, {
          method: 'PATCH', write: true,
          body: JSON.stringify({ choice, updated_at: new Date().toISOString() })
        });
        existing.choice = choice;
        existing.updated_at = new Date().toISOString();
      } else {
        await c.api('dlavie_craft_community_feedback_votes', {
          method: 'POST', write: true,
          body: JSON.stringify({ post_id: postId, user_id: me, choice })
        });
        votes.push({ id: `vote-v9-${Date.now()}`, post_id: postId, user_id: me, choice, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      }
      c.toast?.(`Vote ${VOTE_CHOICES.find(item => item.id === choice)?.label || choice} tersimpan`);
      document.dispatchEvent(new CustomEvent('dlavie:community-activity', { detail: { type: 'feedback-vote' } }));
      setTimeout(async () => { await loadVotes(); schedule(); }, 320);
    } catch (error) {
      c.toast?.(`Vote gagal: ${error.message}`);
      await loadVotes();
    } finally {
      voteBusy = '';
      schedule();
    }
  }

  function buildVotePanel(postId) {
    const counts = voteCounts(postId);
    const current = myVote(postId);
    const panel = document.createElement('section');
    panel.className = 'dl-v9-vote-panel';
    panel.dataset.postId = postId;
    panel.innerHTML = '<header><div><strong>Vote ide ini</strong><small>Pilih satu pendapat. Pilihanmu bisa diganti kapan saja.</small></div><span>1 akun · 1 vote</span></header>';
    const grid = document.createElement('div');
    grid.className = 'dl-v9-vote-grid';

    VOTE_CHOICES.forEach(choice => {
      const button = makeButton(`dl-v9-vote choice-${choice.id}${current?.choice === choice.id ? ' active' : ''}`);
      button.disabled = voteBusy === postId;
      button.setAttribute('aria-pressed', String(current?.choice === choice.id));
      button.innerHTML = `<i>${choice.mark}</i><span>${choice.label}</span><b>${counts[choice.id]}</b>`;
      button.addEventListener('click', () => setVote(postId, choice.id));
      grid.append(button);
    });
    panel.append(grid);
    return panel;
  }

  function renderFeedback(page, forum, state) {
    const isFeedback = forum?.forum_type === 'feedback' || !!page.querySelector('.feed-feedback');
    page.classList.toggle('dl-v9-feedback-mode', isFeedback);
    if (!isFeedback) return;

    const feedbackForum = forum?.forum_type === 'feedback' ? forum : state.forums.find(item => item.forum_type === 'feedback');
    if (!feedbackForum) return;
    const posts = postsForForum(state, feedbackForum);
    const entries = [...page.querySelectorAll('.typed-feed > .community-entry')];

    [...page.querySelectorAll('small,p,span')].forEach(node => {
      if (/member dapat memberi dukungan dan reaction/i.test(node.textContent || '')) {
        node.textContent = 'Semua member dapat memilih Setuju, Natural, atau Tidak setuju.';
      }
    });

    entries.forEach((entry, index) => {
      const post = posts[index];
      if (!post) return;
      entry.dataset.dlPostId = post.id;
      entry.classList.add('dl-v9-feedback-entry');
      entry.querySelectorAll('.entry-actions,.reaction-area,.reaction-bar,.dl-v4-reactions,.dl-v9-action-row,.reply-toggle,.post-thread,.idea-vote').forEach(node => {
        node.style.setProperty('display', 'none', 'important');
        node.setAttribute('aria-hidden', 'true');
      });

      const counts = voteCounts(post.id);
      const signature = JSON.stringify([myVote(post.id)?.choice || '', counts.agree, counts.natural, counts.disagree, voteBusy === post.id]);
      const host = entry.querySelector('.idea-copy') || entry;
      let panel = host.querySelector(':scope > .dl-v9-vote-panel');
      if (panel?.dataset.signature === signature) return;
      panel?.remove();
      panel = buildVotePanel(post.id);
      panel.dataset.signature = signature;
      host.append(panel);
    });
  }

  function render(page) {
    const c = core();
    const state = c?.getState?.();
    if (!page?.isConnected || !state?.forums?.length) return;
    page.classList.add('dl-stable-v9');
    const forum = activeForum(page, state);
    if (!forum) return;
    renderChatControls(page, forum, state);
    renderFeedback(page, forum, state);
  }

  function schedule(page = document.querySelector(PAGE)) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render(page);
    });
  }

  function queueRefresh(delay = 180) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      if (!ROUTE.test(location.hash) || !core()) return;
      try {
        await core().load?.(true);
        await loadVotes();
      } catch {}
      schedule();
    }, delay);
  }

  function attach(page) {
    observer?.disconnect();
    Promise.resolve(core()?.load?.(true)).then(loadVotes).then(() => schedule(page)).catch(() => schedule(page));

    page.addEventListener('click', event => {
      if (event.target.closest('.forum-sidebar nav button')) queueRefresh(120);
    });

    observer = new MutationObserver(records => {
      const meaningful = records.some(record => {
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        if (!target) return true;
        return !target.closest?.('.dl-v9-action-row,.dl-v9-vote-panel,.dl-v9-picker,.dl-v9-picker-backdrop');
      });
      if (meaningful) schedule(page);
    });
    observer.observe(page, { childList: true, subtree: true });
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
      observer?.disconnect();
      observer = null;
      closePicker();
      return;
    }
    let tries = 0;
    const wait = () => {
      const page = document.querySelector(PAGE);
      if (page && core()) return attach(page);
      if (tries++ < 50) setTimeout(wait, 90);
    };
    wait();
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePicker();
  });
  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  window.addEventListener('pageshow', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();