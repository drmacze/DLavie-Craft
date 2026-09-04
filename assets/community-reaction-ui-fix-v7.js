(() => {
  'use strict';

  const ROUTE = /#\/community(?:$|[/?])/;
  const PAGE = '.community-page.community-v2';
  let pageObserver = null;
  let bodyObserver = null;
  let raf = 0;

  function cleanInjectedIcons(node) {
    node?.querySelectorAll?.(':scope > .dl-mc-icon,:scope > .dl-mc-sweep-icon,:scope > .dl-mc-forge-icon,:scope > svg').forEach(el => el.remove());
  }

  function normalizeAddButton(button) {
    if (!button) return;
    button.setAttribute('data-dl-no-icon', 'true');
    button.setAttribute('aria-label', 'Tambah reaction');
    button.title = 'Tambah reaction';
    cleanInjectedIcons(button);
    let face = button.querySelector(':scope > .dl-v7-react-face');
    let plus = button.querySelector(':scope > .dl-v7-react-plus');
    if (!face) {
      face = document.createElement('span');
      face.className = 'dl-v7-react-face';
      face.textContent = '☺';
      button.prepend(face);
    }
    if (!plus) {
      plus = document.createElement('span');
      plus.className = 'dl-v7-react-plus';
      plus.textContent = '+';
      button.append(plus);
    }
    [...button.childNodes].forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) node.textContent = '';
    });
  }

  function normalizeReactionChip(button) {
    button?.setAttribute('data-dl-no-icon', 'true');
    if (!button) return;
    button.querySelectorAll(':scope > .dl-mc-icon,:scope > .dl-mc-sweep-icon,:scope > .dl-mc-forge-icon,:scope > svg').forEach(el => el.remove());
  }

  function normalizeReply(button) {
    if (!button) return;
    button.setAttribute('data-dl-no-icon', 'true');
    button.querySelectorAll(':scope > .dl-mc-icon,:scope > .dl-mc-sweep-icon,:scope > .dl-mc-forge-icon').forEach(el => el.remove());
  }

  function enhancePicker(picker) {
    if (!picker || picker.dataset.dlV7 === '1') return;
    picker.dataset.dlV7 = '1';
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-modal', 'true');
    picker.setAttribute('aria-label', 'Pilih reaction');
    const title = picker.querySelector(':scope > header > strong');
    if (title) title.textContent = 'Pilih reaction';
    const search = picker.querySelector(':scope > header input');
    if (search) search.placeholder = 'Cari reaction…';
    document.body.classList.add('dl-v7-picker-open');
  }

  function syncPickerState() {
    const picker = document.querySelector('.dl-v4-picker');
    if (picker) enhancePicker(picker);
    else document.body.classList.remove('dl-v7-picker-open');
  }

  function enhance(page) {
    if (!page?.isConnected) return;
    page.classList.add('dl-reaction-ui-v7');

    page.querySelectorAll('.dl-v4-react-add').forEach(normalizeAddButton);
    page.querySelectorAll('.dl-v4-react-chip').forEach(normalizeReactionChip);
    page.querySelectorAll('.reply-toggle').forEach(normalizeReply);

    // Legacy/native reaction surfaces occasionally survive a React re-render and
    // become the empty vertical white pills visible on iOS. v4 owns reactions now.
    page.querySelectorAll('.reaction-area,.reaction-bar').forEach(node => {
      if (!node.closest('.dl-feedback-votes')) {
        node.classList.add('dl-v7-legacy-reaction');
        node.setAttribute('aria-hidden', 'true');
      }
    });

    page.querySelectorAll('.entry-actions').forEach(actions => {
      const row = actions.querySelector(':scope > .dl-v4-reactions');
      if (row) actions.classList.add('dl-v7-actions-ready');
    });

    syncPickerState();
  }

  function schedule(page = document.querySelector(PAGE)) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (page?.isConnected) enhance(page);
      else syncPickerState();
    });
  }

  function attach(page) {
    pageObserver?.disconnect();
    pageObserver = new MutationObserver(records => {
      const meaningful = records.some(record => {
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        if (!target) return true;
        return !target.closest?.('.dl-v4-reactions,.dl-v4-picker,.dl-v7-react-face,.dl-v7-react-plus');
      });
      if (meaningful) schedule(page);
    });
    pageObserver.observe(page, { childList: true, subtree: true });
    schedule(page);
  }

  function startBodyWatch() {
    bodyObserver?.disconnect();
    bodyObserver = new MutationObserver(records => {
      if (records.some(r => [...r.addedNodes, ...r.removedNodes].some(n => n.nodeType === 1 && (n.matches?.('.dl-v4-picker') || n.querySelector?.('.dl-v4-picker'))))) {
        requestAnimationFrame(syncPickerState);
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: false });
  }

  function route() {
    if (!ROUTE.test(location.hash)) {
      pageObserver?.disconnect();
      pageObserver = null;
      bodyObserver?.disconnect();
      bodyObserver = null;
      document.body.classList.remove('dl-v7-picker-open');
      return;
    }
    startBodyWatch();
    let tries = 0;
    const wait = () => {
      const page = document.querySelector(PAGE);
      if (page) return attach(page);
      if (tries++ < 40) setTimeout(wait, 80 + tries * 7);
    };
    wait();
  }

  document.addEventListener('click', event => {
    if (!ROUTE.test(location.hash)) return;
    if (event.target.closest?.('.dl-v4-react-add,.dl-v4-react-chip,.reply-toggle')) setTimeout(() => schedule(), 0);
  }, true);

  window.addEventListener('hashchange', route);
  window.addEventListener('pageshow', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, { once: true });
  else route();
})();