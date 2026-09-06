(() => {
  'use strict';

  const mark = 'data-dl-home-structure-v3';
  let queued = false;

  function apply() {
    queued = false;
    const home = document.querySelector('.explore-page');
    if (!home) return;

    home.setAttribute(mark, '');

    const discovery = home.querySelector('.discovery-panel');
    const banner = document.querySelector('#dl-marketplace-home-banner');
    if (discovery && banner && banner.parentElement === home && discovery.nextElementSibling !== banner) {
      discovery.insertAdjacentElement('afterend', banner);
    } else if (discovery && banner && banner.parentElement !== home) {
      discovery.insertAdjacentElement('afterend', banner);
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  const observer = new MutationObserver(schedule);

  function start() {
    apply();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  window.addEventListener('pageshow', schedule);
  window.addEventListener('hashchange', schedule);
})();
