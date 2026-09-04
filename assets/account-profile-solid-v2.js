(() => {
  'use strict';

  let observer = null;
  let raf = 0;

  function enhance(portal = document.getElementById('dl-account-portal')) {
    if (!portal?.isConnected) return;
    const profile = portal.querySelector('.dl-account-profile');
    const card = portal.querySelector('.dl-account-card');
    const isProfile = !!profile;
    portal.classList.toggle('dl-account-profile-solid-v2', isProfile);
    card?.classList.toggle('dl-account-card-profile-solid-v2', isProfile);
    if (!isProfile) return;

    profile.querySelectorAll(':scope > .dl-account-profile-card').forEach((item, index) => {
      item.dataset.profileIndex = String(index + 1);
    });

    const close = portal.querySelector('.dl-account-close');
    close?.setAttribute('data-dl-no-icon', 'true');
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      enhance();
    });
  }

  function attach() {
    observer?.disconnect();
    observer = new MutationObserver(records => {
      const meaningful = records.some(record => {
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !target?.closest?.('.dl-account-profile-card');
      });
      if (meaningful) schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
  }

  window.addEventListener('popstate', schedule);
  window.addEventListener('pageshow', schedule);
  window.addEventListener('dlavie-auth-session', () => setTimeout(schedule, 60));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
  else attach();
})();