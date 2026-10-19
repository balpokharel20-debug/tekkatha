import { compressProductImage } from './product-image.js';

export function createPopupNoticesManager(ctx) {
  const { api, esc, icon, field, heading, layout, notice, currentView, returnToNotices, websiteUrl } = ctx;
  let notices = [];
  let archived = false;
  const previewSource = (value) => value.startsWith('/assets/') ? new URL(value, websiteUrl || location.origin).href : value;

  const status = (item) => {
    if (item.deletedAt) return 'archived';
    if (!item.active) return 'paused';
    if (item.endsAt && Date.parse(item.endsAt) <= Date.now()) return 'expired';
    if (item.startsAt && Date.parse(item.startsAt) > Date.now()) return 'scheduled';
    return 'running';
  };
  const displayMode = (value) =>
    ({ first_visit: 'First visit only', every_visit: 'Every visit', after_days: 'After repeat interval' }[value] || value);
  const localDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  function imageField(image) {
    const uploaded = image.startsWith('data:image/');
    return `<div class="device-image-field wide"><span class="form-label">Popup artwork <small>Required</small></span><div class="device-image-upload"><div class="device-image-preview"><img id="popup-image-preview" ${image ? `src="${esc(previewSource(image))}"` : 'hidden'} alt="Popup preview"></div><div><label class="form-label" for="popup-image-file">Upload from your computer<input id="popup-image-file" type="file" accept="image/jpeg,image/png,image/webp" data-popup-image-control></label><p>Upload the complete banner, including its headline and button design. JPEG, PNG, or WebP · up to 12 MB.</p><p id="popup-image-status" role="status">${uploaded ? 'Uploaded artwork saved with this notice.' : image ? 'Checking the current artwork…' : 'Upload the popup artwork or use a direct image URL below.'}</p><p id="popup-image-error" role="alert" hidden></p></div></div><input type="hidden" name="image" value="${esc(image)}"><label class="form-label">Direct image URL / asset path<input name="imageUrl" type="text" value="${uploaded ? '' : esc(image)}" maxlength="2000" placeholder="https://…/banner.jpg or /assets/banner.webp"><small>Use a direct image URL, not a webpage link. The entire artwork becomes clickable.</small></label></div>`;
  }

  function bindImage(form) {
    const fileInput = form.querySelector('#popup-image-file');
    const urlInput = form.elements.imageUrl;
    const imageInput = form.elements.image;
    const preview = form.querySelector('#popup-image-preview');
    const statusText = form.querySelector('#popup-image-status');
    const error = form.querySelector('#popup-image-error');
    const imageError = 'This URL does not load as an image. Upload a JPEG, PNG, or WebP file, or use a direct image URL.';
    const showError = (message) => {
      error.textContent = message;
      error.hidden = false;
      statusText.textContent = 'Image needs attention before saving.';
    };
    const showPreview = (value) => {
      preview.hidden = !value;
      if (value) preview.src = previewSource(value);
      else preview.removeAttribute('src');
    };
    preview.addEventListener('load', () => {
      if (imageInput.value && !imageInput.value.startsWith('data:image/')) {
        error.hidden = true;
        statusText.textContent = 'Image preview loaded. Save to apply it.';
      }
    });
    preview.addEventListener('error', () => {
      if (imageInput.value && !imageInput.value.startsWith('data:image/')) showError(imageError);
    });
    if (imageInput.value && !imageInput.value.startsWith('data:image/') && preview.complete) {
      if (preview.naturalWidth) statusText.textContent = 'Image preview loaded.';
      else showError(imageError);
    }
    urlInput.addEventListener('input', () => {
      imageInput.value = urlInput.value.trim();
      fileInput.value = '';
      error.hidden = true;
      const valid = /^(https?:\/\/|\/assets\/)/i.test(imageInput.value);
      showPreview(valid ? imageInput.value : '');
      statusText.textContent = valid ? 'Checking image URL…' : 'Add a direct image URL or upload an image.';
    });
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file || form.dataset.imageProcessing === 'true') return;
      form.dataset.imageProcessing = 'true';
      form.querySelectorAll('[data-popup-image-control], button[type="submit"]').forEach((control) => (control.disabled = true));
      error.hidden = true;
      statusText.textContent = 'Compressing image…';
      try {
        const compressed = await compressProductImage(file);
        imageInput.value = compressed.text;
        urlInput.value = '';
        showPreview(compressed.text);
        statusText.textContent = `${file.name}: ${Math.ceil(compressed.bytes / 1024)} KB · ${compressed.width} × ${compressed.height}. Save to apply this image.`;
      } catch (reason) {
        error.textContent = reason.message;
        error.hidden = false;
        statusText.textContent = 'The current image has been kept.';
      } finally {
        form.dataset.imageProcessing = 'false';
        fileInput.value = '';
        form.querySelectorAll('[data-popup-image-control], button[type="submit"]').forEach((control) => (control.disabled = false));
      }
    });
    return async () => {
      const value = imageInput.value.trim();
      if (!value) {
        showError('Upload popup artwork or enter a direct image URL.');
        return false;
      }
      if (value.startsWith('data:image/')) return true;
      if (!/^(https?:\/\/|\/assets\/)/i.test(value)) {
        showError('Use a direct HTTP(S) image URL or a /assets/ path.');
        return false;
      }
      const probe = new Image();
      probe.src = previewSource(value);
      let timeout;
      try {
        await Promise.race([
          probe.decode(),
          new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('timeout')), 10000); }),
        ]);
        if (imageInput.value.trim() !== value) return false;
        error.hidden = true;
        return true;
      } catch {
        showError(imageError);
        return false;
      } finally {
        clearTimeout(timeout);
      }
    };
  }

  function listRows() {
    const filtered = notices.filter((item) => Boolean(item.deletedAt) === archived);
    return `<div class="panel-head"><h2>${archived ? 'Archived popup notices' : 'Popup notices'}</h2><span class="muted">${filtered.length} notice${filtered.length === 1 ? '' : 's'}</span></div>${filtered.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>NOTICE</th><th>FREQUENCY</th><th>STATUS</th><th>SCHEDULE</th><th>ACTIONS</th></tr></thead><tbody>${filtered.map((item) => `<tr><td><div class="popup-notice-row">${item.image ? `<img src="${esc(previewSource(item.image))}" alt="">` : '<span class="popup-notice-text-mark">T</span>'}<div><strong>${esc(item.title)}</strong><small>${item.link ? esc(item.link) : 'Destination link missing'}</small></div></div></td><td><small>${displayMode(item.displayMode)}</small>${item.displayMode === 'after_days' ? `<small>Every ${item.repeatDays} day${item.repeatDays === 1 ? '' : 's'}</small>` : ''}<small>After ${item.delaySeconds || 0}s</small></td><td><span class="pill ${status(item)}">${status(item)}</span></td><td><small>${item.startsAt ? 'From ' + esc(new Date(item.startsAt).toLocaleString()) : 'Immediately'}</small><small>${item.endsAt ? 'Until ' + esc(new Date(item.endsAt).toLocaleString()) : 'No end limit'}</small></td><td><div class="row-actions">${item.deletedAt ? `<button type="button" class="btn secondary small" data-popup-action="restore" data-popup-id="${esc(item.id)}">Restore</button>` : `<button type="button" class="icon-btn" data-popup-edit="${esc(item.id)}" aria-label="Edit ${esc(item.title)}">${icon('edit')}</button><button type="button" class="btn secondary small" data-popup-action="${item.active ? 'pause' : 'enable'}" data-popup-id="${esc(item.id)}">${item.active ? 'Pause' : 'Enable'}</button><button type="button" class="icon-btn" data-popup-action="archive" data-popup-id="${esc(item.id)}" aria-label="Archive ${esc(item.title)}">${icon('archive')}</button>`}</div></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty"><h2>${archived ? 'No archived popup notices.' : 'No popup notices yet.'}</h2><p>Upload popup artwork and choose where it should send visitors.</p></div>`}`;
  }

  function listPage() {
    return `<div id="popup-notices-workspace">${heading('Popup banners for visitors.', 'Upload one complete banner. Clicking anywhere on it opens its destination link.', `<button type="button" class="btn" data-popup-new>${icon('plus')} New popup banner</button>`)}<div class="settings-notice"><strong>One banner is shown at a time.</strong> If multiple banners are active, the most recently updated one wins. Visitors can dismiss it, and frequency settings prevent it from appearing too often.</div><div class="list-toolbar"><label class="check-label"><input type="checkbox" id="popup-archived" ${archived ? 'checked' : ''}> Show archive</label></div><section class="panel" id="popup-results">${listRows()}</section></div>`;
  }

  async function show() {
    const first = await api('/admin/notices?limit=100&includeArchived=true');
    notices = first.items;
    for (let page = 2; notices.length < first.total; page++) {
      const next = await api('/admin/notices?limit=100&includeArchived=true&page=' + page);
      if (!next.items.length) break;
      notices.push(...next.items);
    }
    if (currentView() !== 'popup') return;
    layout(listPage());
    const root = document.querySelector('#popup-notices-workspace');
    root.addEventListener('error', (event) => {
      if (event.target.matches('.popup-notice-row img'))
        event.target.outerHTML = '<span class="popup-notice-text-mark">T</span>';
    }, true);
    root.querySelector('#popup-archived').addEventListener('change', (event) => {
      archived = event.target.checked;
      root.querySelector('#popup-results').innerHTML = listRows();
    });
    root.addEventListener('click', async (event) => {
      if (event.target.closest('[data-popup-new]')) return openEditor();
      const edit = event.target.closest('[data-popup-edit]');
      if (edit) return openEditor(edit.dataset.popupEdit);
      const button = event.target.closest('[data-popup-action]');
      if (!button || button.disabled) return;
      button.disabled = true;
      const action = button.dataset.popupAction;
      const id = encodeURIComponent(button.dataset.popupId);
      try {
        await api('/admin/notices/' + id + (action === 'restore' ? '/restore' : action === 'archive' ? '' : '/active'), {
          method: action === 'restore' ? 'POST' : action === 'archive' ? 'DELETE' : 'PATCH',
          body: JSON.stringify(action === 'pause' || action === 'enable' ? { active: action === 'enable' } : {}),
        });
        await show();
        notice(action === 'restore' ? 'Popup notice restored.' : action === 'archive' ? 'Popup notice archived.' : action === 'pause' ? 'Popup notice paused.' : 'Popup notice enabled.');
      } catch (error) {
        notice(error.message);
        button.disabled = false;
      }
    });
  }

  function openEditor(id) {
    const existing = id ? notices.find((item) => item.id === id) : null;
    const item = existing || { title: '', body: '', image: '', imageAlt: '', link: '', buttonLabel: '', displayMode: 'first_visit', repeatDays: 7, delaySeconds: 0, dismissible: true, active: false, startsAt: '', endsAt: '' };
    layout(heading(existing ? 'Edit popup banner.' : 'Create a popup banner.', 'The uploaded artwork is the entire popup. Visitors can click anywhere on it.', '<button type="button" class="btn secondary" data-nav="popup">Back to popup banners</button>') + `<form id="popup-editor-form"><div id="popup-editor-error"></div><div class="editor-grid"><div><section class="form-panel"><h2>Banner and destination</h2><div class="form-grid">${field('Internal name', 'title', item.title, { required: true, max: 120, wide: true, hint: 'Used for accessibility and in the admin list. It is not displayed over the artwork.' })}${imageField(item.image)}${field('Image description', 'imageAlt', item.imageAlt, { max: 200, wide: true, hint: 'Describe the offer briefly for visitors using screen readers.' })}${field('Destination link', 'link', item.link, { type: 'url', max: 2000, required: true, wide: true, hint: 'Clicking anywhere on the popup opens this link in a new tab.' })}</div></section></div><aside class="editor-sidebar"><section class="form-panel"><h2>Display rules</h2><label class="check-label"><input type="checkbox" name="active" ${item.active ? 'checked' : ''}> Enabled on the website</label>${field('Show frequency', 'displayMode', item.displayMode, { list: [['first_visit', 'First visit only'], ['every_visit', 'Every visit'], ['after_days', 'After a repeat interval']] })}${field('Repeat after (days)', 'repeatDays', item.repeatDays, { type: 'number', min: 1, max: 365, required: true })}${field('Wait after page load (seconds)', 'delaySeconds', item.delaySeconds, { type: 'number', min: 0, max: 86400, required: true, hint: 'Use 0 to show immediately.' })}${field('Start (local time, optional)', 'startsAt', localDate(item.startsAt), { type: 'datetime-local' })}${field('End (local time, optional)', 'endsAt', localDate(item.endsAt), { type: 'datetime-local' })}<label class="check-label"><input type="checkbox" name="dismissible" ${item.dismissible !== false ? 'checked' : ''}> Allow visitors to close it</label><p>Only one active banner is selected. The newest updated banner is shown first.</p><button type="submit" class="btn">${icon('check')} ${existing ? 'Save changes' : 'Save popup banner'}</button></section></aside></div></form>`);
        history.replaceState({}, '', import.meta.env.BASE_URL.replace(/\/$/, '') + '/hello#popup-editor');
    window.scrollTo(0, 0);
    const form = document.querySelector('#popup-editor-form');
    const validateImage = bindImage(form);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (form.dataset.saving === 'true' || form.dataset.imageProcessing === 'true' || !form.reportValidity()) return;
      form.dataset.saving = 'true';
      const imageIsValid = await validateImage();
      if (!imageIsValid) {
        form.dataset.saving = 'false';
        return;
      }
      const data = new FormData(form);
      const startsAt = data.get('startsAt') ? new Date(data.get('startsAt')).toISOString() : '';
      const endsAt = data.get('endsAt') ? new Date(data.get('endsAt')).toISOString() : '';
      if (startsAt && endsAt && endsAt <= startsAt) {
        form.dataset.saving = 'false';
        return notice('The end date must be after the start date.');
      }
      const value = {
        title: data.get('title').trim(),
        body: '',
        image: data.get('image').trim(),
        imageAlt: data.get('imageAlt').trim(),
        link: data.get('link').trim(),
        buttonLabel: '',
        displayMode: data.get('displayMode'),
        repeatDays: Number(data.get('repeatDays')),
        delaySeconds: Number(data.get('delaySeconds')),
        dismissible: form.elements.dismissible.checked,
        active: form.elements.active.checked,
        startsAt,
        endsAt,
      };
      const errorBox = form.querySelector('#popup-editor-error');
      form.querySelectorAll('button, [data-popup-image-control]').forEach((control) => (control.disabled = true));
      errorBox.innerHTML = '';
      try {
        await api('/admin/notices' + (existing ? '/' + encodeURIComponent(existing.id) : ''), { method: existing ? 'PUT' : 'POST', body: JSON.stringify(value) });
        await returnToNotices();
        notice('Popup notice saved to MongoDB.');
      } catch (error) {
        errorBox.innerHTML = `<div class="form-error" role="alert">${esc(error.message)}</div>`;
      } finally {
        form.dataset.saving = 'false';
        form.querySelectorAll('button, [data-popup-image-control]').forEach((control) => (control.disabled = false));
      }
    });
  }

  return { show };
}
