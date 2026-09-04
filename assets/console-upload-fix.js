(() => {
  'use strict';

  const COVER_MAX_BYTES = 8 * 1024 * 1024;
  const RELEASE_MAX_BYTES = 512 * 1024 * 1024;
  const COVER_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
  const RELEASE_EXTENSIONS = new Set(['mcpack', 'mcaddon', 'zip']);
  const MESSAGE_CLASS = 'console-upload-fix-message';

  const style = document.createElement('style');
  style.textContent = `
    .${MESSAGE_CLASS} {
      display: grid;
      gap: 6px;
      margin: 14px 0 18px;
      padding: 13px 15px;
      border: 1px solid color-mix(in srgb, #e05252 42%, transparent);
      border-radius: 14px;
      background: color-mix(in srgb, #e05252 10%, var(--surface, #fff));
      color: inherit;
      font-size: 13px;
      line-height: 1.45;
    }
    .${MESSAGE_CLASS}[data-kind="warning"] {
      border-color: color-mix(in srgb, #d79b2b 45%, transparent);
      background: color-mix(in srgb, #d79b2b 10%, var(--surface, #fff));
    }
    .${MESSAGE_CLASS} strong { font-size: 13px; }
    .${MESSAGE_CLASS} span { opacity: .82; }
  `;
  document.head.appendChild(style);

  function getProjectForm(fromNode) {
    const form = fromNode?.closest?.('form') || document.querySelector('.modal-card form');
    if (!form) return null;
    const eyebrow = form.querySelector('.eyebrow');
    return eyebrow?.textContent?.toLowerCase().includes('project editor') ? form : null;
  }

  function getFields(form) {
    const fileInputs = [...form.querySelectorAll('input[type="file"]')];
    const coverInput = fileInputs.find((input) => (input.accept || '').includes('image/png')) || null;
    const releaseInput = fileInputs.find((input) => (input.accept || '').includes('.mcpack')) || null;
    const versionInput = [...form.querySelectorAll('input')].find((input) => input.placeholder === '1.0.0') || null;
    return { coverInput, releaseInput, versionInput };
  }

  function extension(name = '') {
    const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : '';
  }

  function humanSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  }

  function normalizeBackendMessage(message = '') {
    const raw = String(message).trim();
    const lower = raw.toLowerCase();

    if (lower.includes('row-level security') || lower.includes('rls')) {
      return 'Upload ditolak oleh policy/RLS Supabase. Pastikan akun ini memiliki role developer/owner dan policy INSERT/UPDATE untuk project serta Storage bucket sudah mengizinkan role tersebut.';
    }
    if (lower.includes('bucket') && (lower.includes('not found') || lower.includes('does not exist'))) {
      return 'Storage bucket untuk file project belum tersedia atau namanya tidak cocok. Periksa bucket dlavie-project-media dan dlavie-project-files.';
    }
    if (lower.includes('payload too large') || lower.includes('maximum allowed size') || lower.includes('file size')) {
      return 'File melewati batas yang diizinkan oleh Supabase Storage/bucket. Naikkan file-size limit bucket atau unggah file yang lebih kecil.';
    }
    if (lower.includes('duplicate key') || lower.includes('already exists') || lower.includes('unique constraint')) {
      return 'Project dengan slug/identitas yang sama sudah ada. Ubah slug project atau edit project yang sudah ada.';
    }
    if (lower.includes('jwt') || lower.includes('session') || lower.includes('unauthorized') || lower.includes('401')) {
      return 'Sesi Console sudah tidak valid. Keluar lalu masuk kembali agar token developer diperbarui.';
    }
    return raw || 'Upload project gagal karena backend menolak permintaan.';
  }

  function showMessage(form, message, kind = 'error', title = 'Project belum dapat disimpan') {
    if (!form || !message) return;
    let box = form.querySelector(`.${MESSAGE_CLASS}`);
    if (!box) {
      box = document.createElement('div');
      box.className = MESSAGE_CLASS;
      box.setAttribute('role', 'alert');
      const grid = form.querySelector('.form-grid');
      if (grid) form.insertBefore(box, grid);
      else form.prepend(box);
    }
    box.dataset.kind = kind;
    box.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const span = document.createElement('span');
    span.textContent = message;
    box.append(strong, span);
  }

  function clearMessage(form) {
    form?.querySelector?.(`.${MESSAGE_CLASS}`)?.remove();
  }

  function clearValidity(input) {
    if (input) input.setCustomValidity('');
  }

  function validateProjectForm(form, report = false) {
    const { coverInput, releaseInput, versionInput } = getFields(form);
    clearValidity(coverInput);
    clearValidity(releaseInput);
    clearValidity(versionInput);

    const cover = coverInput?.files?.[0] || null;
    const release = releaseInput?.files?.[0] || null;

    if (cover) {
      if (!COVER_TYPES.has(cover.type) || !['png', 'jpg', 'jpeg', 'webp'].includes(extension(cover.name))) {
        const message = 'Cover harus berupa PNG, JPG/JPEG, atau WebP.';
        coverInput.setCustomValidity(message);
        showMessage(form, message);
        if (report) coverInput.reportValidity();
        return false;
      }
      if (cover.size > COVER_MAX_BYTES) {
        const message = `Cover ${cover.name} berukuran ${humanSize(cover.size)}. Batas maksimum cover adalah 8 MB.`;
        coverInput.setCustomValidity(message);
        showMessage(form, message);
        if (report) coverInput.reportValidity();
        return false;
      }
    }

    if (release) {
      const ext = extension(release.name);
      if (!RELEASE_EXTENSIONS.has(ext)) {
        const message = 'File rilis harus berekstensi .mcpack, .mcaddon, atau .zip.';
        releaseInput.setCustomValidity(message);
        showMessage(form, message);
        if (report) releaseInput.reportValidity();
        return false;
      }
      if (release.size > RELEASE_MAX_BYTES) {
        const message = `File ${release.name} berukuran ${humanSize(release.size)}. Batas maksimum pada Console adalah 512 MB.`;
        releaseInput.setCustomValidity(message);
        showMessage(form, message);
        if (report) releaseInput.reportValidity();
        return false;
      }
      if (!versionInput?.value?.trim()) {
        const message = 'Isi kolom Versi rilis (contoh: 1.0.0) sebelum mengunggah file rilis. Sebelumnya file dipilih tetapi dilewati diam-diam bila versi kosong.';
        versionInput?.setCustomValidity(message);
        showMessage(form, message);
        if (report) versionInput?.reportValidity();
        return false;
      }
    }

    clearMessage(form);
    return true;
  }

  document.addEventListener('change', (event) => {
    const form = getProjectForm(event.target);
    if (!form) return;
    if (event.target.matches('input[type="file"], input[placeholder="1.0.0"]')) {
      validateProjectForm(form, true);
    }
  }, true);

  document.addEventListener('input', (event) => {
    const form = getProjectForm(event.target);
    if (!form) return;
    if (event.target.matches('input[placeholder="1.0.0"]')) {
      event.target.setCustomValidity('');
      if (event.target.value.trim()) validateProjectForm(form, false);
    }
  }, true);

  document.addEventListener('submit', (event) => {
    const form = getProjectForm(event.target);
    if (!form) return;
    if (!validateProjectForm(form, true)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  let lastMirroredError = '';
  const observer = new MutationObserver(() => {
    const form = getProjectForm(document.querySelector('.modal-card form'));
    if (!form) {
      lastMirroredError = '';
      return;
    }

    const globalError = document.querySelector('.console-content .state-card.state-error p');
    const message = globalError?.textContent?.trim() || '';
    if (!message || message === lastMirroredError) return;

    lastMirroredError = message;
    showMessage(form, normalizeBackendMessage(message), 'error', 'Backend menolak upload');
  });

  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
