(() => {
  'use strict';

  function isProjectEditor(form) {
    const eyebrow = form?.querySelector?.('.eyebrow');
    return !!eyebrow?.textContent?.toLowerCase().includes('project editor');
  }

  function enhanceProjectEditor(form) {
    if (!isProjectEditor(form)) return;

    const labels = [...form.querySelectorAll('label')];
    const typeLabel = labels.find((label) => {
      const text = [...label.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent || '')
        .join(' ')
        .trim()
        .toLowerCase();
      return text === 'jenis';
    });

    const typeSelect = typeLabel?.querySelector('select');
    if (typeSelect && !typeSelect.querySelector('option[value="addon"]')) {
      const option = document.createElement('option');
      option.value = 'addon';
      option.textContent = 'Addon';
      typeSelect.appendChild(option);
    }

    const platformLabel = labels.find((label) => {
      const text = label.textContent?.trim()?.toLowerCase() || '';
      return text.startsWith('platform');
    });
    const platformInput = platformLabel?.querySelector('input');
    if (platformInput) {
      platformInput.placeholder = 'Android, iOS, Windows';
      platformInput.setAttribute('aria-label', 'Platform target, pisahkan dengan koma');
    }
  }

  function apply() {
    document.querySelectorAll('.modal-card form').forEach(enhanceProjectEditor);
  }

  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  apply();
})();
