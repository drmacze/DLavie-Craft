(() => {
  'use strict';

  let root = null;
  let observer = null;
  let waitTimer = 0;

  const ROLE_META = {
    builder: { title: 'Builder', icon: 'Crafting Block', fx: ['block','block','spark'] },
    miner: { title: 'Miner', icon: 'Diamond Pickaxe', fx: ['ore','spark','spark'] },
    explorer: { title: 'Explorer', icon: 'Compass', fx: ['compass','trail','trail'] },
    newbie: { title: 'Newbie', icon: 'Grass Block', fx: ['grass','sprout','spark'] },
    pvp: { title: 'PvP', icon: 'Sword & Shield', fx: ['slash','slash','spark'] }
  };

  function enhanceGender(scope) {
    scope.querySelectorAll('.dl-gender-grid [data-gender]').forEach(button => {
      if (button.dataset.dlGenderV2 === '1') return;
      button.dataset.dlGenderV2 = '1';
      const gender = button.dataset.gender;
      button.classList.add(`dl-gender-card-${gender}`);
      const figure = button.querySelector('.dl-gender-figure');
      if (figure) {
        figure.classList.add('dl-character-v2');
        figure.setAttribute('aria-label', gender === 'male' ? 'Steve animated Minecraft character' : 'Alex animated Minecraft character');
      }
      const caption = document.createElement('span');
      caption.className = 'dl-character-caption';
      caption.innerHTML = `<i aria-hidden="true"></i><b>${gender === 'male' ? 'STEVE' : 'ALEX'}</b><em>animated character</em>`;
      const strong = button.querySelector(':scope > strong');
      strong?.insertAdjacentElement('beforebegin', caption);
    });
  }

  function enhanceRoles(scope) {
    scope.querySelectorAll('.dl-role-pick-grid > button[data-role]').forEach(button => {
      const role = button.dataset.role;
      const meta = ROLE_META[role];
      if (!meta || button.dataset.dlRoleV2 === '1') return;
      button.dataset.dlRoleV2 = '1';
      button.classList.add('dl-role-card-v2', `dl-role-card-${role}`);
      const scene = document.createElement('span');
      scene.className = `dl-role-scene role-${role}`;
      scene.setAttribute('aria-hidden', 'true');
      scene.innerHTML = `<span class="dl-role-scene-icon"></span>${meta.fx.map((fx, i) => `<i class="fx-${fx} f${i+1}"></i>`).join('')}<b class="dl-role-floor"></b>`;
      button.prepend(scene);
      const badge = button.querySelector('.dl-role-badge');
      badge?.setAttribute('title', `${meta.title} · ${meta.icon}`);
    });
  }

  function enhance(scope = root) {
    if (!scope?.isConnected) return;
    scope.classList.add('dl-onboarding-visual-v2');
    enhanceGender(scope);
    enhanceRoles(scope);
  }

  function attach(next) {
    if (!next || next === root) {
      enhance(next || root);
      return;
    }
    observer?.disconnect();
    root = next;
    enhance(root);
    observer = new MutationObserver(records => {
      const meaningful = records.some(record => {
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !target?.closest?.('.dl-role-scene,.dl-character-caption');
      });
      if (meaningful) requestAnimationFrame(() => enhance(root));
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  function watch(duration = 12000) {
    clearInterval(waitTimer);
    const started = Date.now();
    const check = () => {
      const next = document.querySelector('.dl-identity-onboarding');
      if (next) attach(next);
      else if (root && !root.isConnected) {
        observer?.disconnect();
        observer = null;
        root = null;
      }
      if (Date.now() - started > duration) clearInterval(waitTimer);
    };
    check();
    waitTimer = setInterval(check, 260);
  }

  window.addEventListener('dlavie-auth-session', () => watch(16000));
  window.addEventListener('pageshow', () => watch(7000));
  window.addEventListener('hashchange', () => watch(7000));
  document.addEventListener('dlavie:collector-ready', () => watch(3000));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => watch(8000), { once: true });
  else watch(8000);
})();