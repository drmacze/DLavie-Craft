(() => {
  'use strict';

  const PAGE = '.community-page.community-v2';
  const ROUTE = /#\/community(?:$|[/?])/;
  let profiles = new Map();
  let observer = null;
  let pageRef = null;
  let raf = 0;
  let poll = 0;
  let loading = false;

  const collector = () => window.__DLAVIE_COLLECTOR__;

  async function load() {
    const c = collector();
    if (!c || loading) return;
    loading = true;
    try {
      const rows = await c.api('dlavie_craft_community_leaderboard?select=user_id,display_name,avatar_key,community_role,member_code,level,is_verified,verification_title,updated_at&order=updated_at.desc');
      profiles = new Map((rows || []).map(p => [p.user_id, p]));
    } catch (error) {
      console.warn('[Community identity v3]', error.message);
    } finally {
      loading = false;
    }
  }

  function verifiedMarkup(title = 'Verified') {
    const span = document.createElement('span');
    span.className = 'dl-community-verified';
    span.setAttribute('title', title);
    span.setAttribute('aria-label', title);
    span.innerHTML = '<i aria-hidden="true"><b>✓</b><em></em></i><strong></strong>';
    span.querySelector('strong').textContent = title;
    return span;
  }

  function isLikelyNativeAvatar(element, strong) {
    if (!(element instanceof HTMLElement)) return false;
    if (element.contains(strong)) return false;
    if (element.matches('.dl-community-role-chip,.dl-community-verified,.dl-v10-actions,.dl-v10-vote-panel')) return false;
    if (/avatar|initial|author-pic|profile-pic|user-pic/i.test(String(element.className || ''))) return true;
    const text = (element.textContent || '').replace(/\s+/g, '').trim();
    if (text.length <= 2) {
      const rect = element.getBoundingClientRect();
      if (rect.width >= 24 && rect.width <= 84 && rect.height >= 24 && rect.height <= 84) return true;
    }
    return false;
  }

  function findNativeAvatarSlot(node, strong) {
    const direct = [...node.children];
    const byClass = direct.find(child => isLikelyNativeAvatar(child, strong));
    if (byClass) return byClass;

    const content = strong.closest('.chat-entry-main,.entry-main,.community-entry-main,.comment-main,.comment-content') || strong.parentElement;
    const parent = content?.parentElement;
    if (parent && node.contains(parent)) {
      const sibling = [...parent.children].find(child => child !== content && isLikelyNativeAvatar(child, strong));
      if (sibling) return sibling;
    }

    const all = [...node.querySelectorAll(':scope > *, :scope > * > *')];
    return all.find(child => isLikelyNativeAvatar(child, strong)) || null;
  }

  function applyAvatar(node, strong, profile, c) {
    // Remove the inline avatar injected by v1/v2. Community should use the original
    // avatar slot on the left of each post/comment, not a second avatar beside the name.
    node.querySelectorAll('.dl-community-avatar:not(.dl-community-avatar-slot-v3)').forEach(old => old.remove());

    let slot = node.querySelector('.dl-community-avatar-slot-v3');
    if (!slot) slot = findNativeAvatarSlot(node, strong);
    if (!slot) return;

    slot.classList.add('dl-community-avatar-slot-v3');
    slot.dataset.avatarKey = profile.avatar_key || 'creeper';
    slot.setAttribute('aria-label', `Avatar ${profile.display_name || 'Crafter'}`);
    slot.textContent = '';
    slot.innerHTML = c.avatarMarkup(profile.avatar_key, 'dl-community-avatar-face-v3');
  }

  function decorateNode(node) {
    const c = collector();
    if (!c) return;
    const authorId = node.dataset.dlAuthorId;
    if (!authorId) return;
    const profile = profiles.get(authorId);
    if (!profile) return;

    const strong = node.querySelector('.entry-author strong,.comment-author strong,.chat-entry-main strong,.comment-main strong,strong');
    if (!strong) return;
    const owner = strong.parentElement || node;

    node.classList.remove('dl-role-builder','dl-role-miner','dl-role-explorer','dl-role-newbie','dl-role-pvp');
    if (profile.community_role) node.classList.add(`dl-role-${profile.community_role}`);

    applyAvatar(node, strong, profile, c);

    let verified = owner.querySelector(':scope > .dl-community-verified');
    if (profile.is_verified) {
      if (!verified) {
        verified = verifiedMarkup(profile.verification_title || 'Verified');
        strong.insertAdjacentElement('afterend', verified);
      }
      const label = profile.verification_title || 'Verified';
      verified.hidden = false;
      verified.setAttribute('title', label);
      verified.setAttribute('aria-label', label);
      const text = verified.querySelector('strong');
      if (text) text.textContent = label;
      node.classList.add('dl-is-verified');
    } else {
      if (verified) verified.hidden = true;
      node.classList.remove('dl-is-verified');
    }

    let role = owner.querySelector(':scope > .dl-community-role-chip');
    if (!role && profile.community_role) {
      role = document.createElement('span');
      role.className = 'dl-community-role-chip';
      (verified || strong).insertAdjacentElement('afterend', role);
    }
    if (role) {
      if (profile.community_role) {
        role.innerHTML = c.roleMarkup(profile.community_role, true);
        role.hidden = false;
      } else role.hidden = true;
    }

    const level = node.querySelector('.entry-author .level-chip,.comment-author .level-chip,.level-chip');
    if (level && Number.isFinite(Number(profile.level))) level.textContent = `Lvl ${Number(profile.level)}`;
    if (profile.member_code) node.dataset.dlMemberCode = profile.member_code;
  }

  function render(page = document.querySelector(PAGE)) {
    if (!page) return;
    page.querySelectorAll('[data-dl-author-id]').forEach(decorateNode);
  }

  function schedule(page = document.querySelector(PAGE)) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (page?.isConnected) render(page);
    });
  }

  function attach(page) {
    if (pageRef === page) {
      schedule(page);
      return;
    }
    observer?.disconnect();
    pageRef = page;
    load().then(() => schedule(page));
    observer = new MutationObserver(records => {
      const meaningful = records.some(record => {
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !target?.closest?.('.dl-community-avatar-slot-v3,.dl-community-role-chip,.dl-community-verified');
      });
      if (meaningful) schedule(page);
    });
    observer.observe(page, { childList: true, subtree: true });
    clearInterval(poll);
    poll = setInterval(async () => {
      await load();
      schedule(page);
    }, 12000);
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
      observer?.disconnect();
      observer = null;
      pageRef = null;
      clearInterval(poll);
      return;
    }
    let tries = 0;
    const wait = () => {
      const page = document.querySelector(PAGE);
      if (page) return attach(page);
      if (tries++ < 35) setTimeout(wait, 80 + tries * 7);
    };
    wait();
  }

  document.addEventListener('dlavie:collector-ready', async () => { await load(); schedule(); });
  document.addEventListener('dlavie:collector-profile-changed', async () => { await load(); schedule(); });
  window.addEventListener('hashchange', route);
  window.addEventListener('pageshow', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();