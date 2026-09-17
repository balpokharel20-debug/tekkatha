import { AD_PLACEMENTS, adStatus, isAdRunning } from '../shared/ads.js';

export function createAdsManager(ctx) {
  const { api, esc, icon, field, heading, layout, notice, productImageField, bindProductImage } =
    ctx;
  let ads = [],
    query = '',
    placement = 'all',
    status = 'all',
    archived = false;
  const placementName = (id) => AD_PLACEMENTS.find((item) => item.id === id)?.label || id;
  const statusName = (value) => value[0].toUpperCase() + value.slice(1);

  function listRows() {
    const filtered = ads.filter(
      (ad) =>
        Boolean(ad.deletedAt) === archived &&
        (placement === 'all' || ad.placements.includes(placement)) &&
        (status === 'all' || adStatus(ad) === status) &&
        `${ad.title} ${ad.advertiser}`.toLowerCase().includes(query.toLowerCase()),
    );
    return `<div class="panel-head"><h2>${archived ? 'Archived campaigns' : 'Ad campaigns'}</h2><span class="muted">${filtered.length} campaign${filtered.length === 1 ? '' : 's'}</span></div>${filtered.length ? `<div class="table-wrap"><table class="data-table ads-table"><thead><tr><th>CAMPAIGN</th><th>LOCATIONS</th><th>STATUS</th><th>SCHEDULE</th><th>ACTIONS</th></tr></thead><tbody>${filtered.map((ad) => `<tr><td><div class="ad-campaign"><img src="${esc(ad.image)}" alt=""><div><strong>${esc(ad.title)}</strong><small>${esc(ad.advertiser)}</small></div></div></td><td><div class="ad-locations">${ad.placements.map((id) => `<span class="pill">${esc(placementName(id))}</span>`).join('')}</div></td><td><span class="pill ${adStatus(ad)}">${statusName(adStatus(ad))}</span></td><td><small>${ad.startsAt ? 'From ' + esc(new Date(ad.startsAt).toLocaleString()) : 'No start limit'}</small><small>${ad.endsAt ? 'Until ' + esc(new Date(ad.endsAt).toLocaleString()) : 'No end limit'}</small></td><td><div class="row-actions">${ad.deletedAt ? `<button type="button" class="btn secondary small" data-ad-action="restore" data-ad-id="${esc(ad.id)}">Restore</button>` : `<button type="button" class="icon-btn" data-ad-edit="${esc(ad.id)}" aria-label="Edit ${esc(ad.title)}">${icon('edit')}</button><button type="button" class="btn secondary small" data-ad-action="${ad.active ? 'pause' : 'enable'}" data-ad-id="${esc(ad.id)}" aria-label="${ad.active ? 'Pause' : 'Enable'} ${esc(ad.title)}">${ad.active ? 'Pause' : 'Enable'}</button><button type="button" class="icon-btn" data-ad-action="archive" data-ad-id="${esc(ad.id)}" aria-label="Archive ${esc(ad.title)}">${icon('archive')}</button>`}</div></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty"><h2>${archived ? 'No archived ads.' : 'No matching ad campaigns.'}</h2><p>${archived ? 'Archived ads can be restored here.' : 'Create a campaign, choose its locations, and enable it when it is ready.'}</p></div>`}`;
  }

  function listPage() {
    return `<div id="ads-workspace">${heading('Advertising, in the right places.', 'Manage banner campaigns, schedules, and rotation across Tekkatha.', `<button type="button" class="btn" data-ad-new>${icon('plus')} New ad</button>`)}<div class="settings-notice"><strong>One banner per location.</strong> Active ads share an equal shuffled rotation every 8 seconds. Visitors can pause or skip it. Open pages refresh campaigns every minute; refreshing the website applies changes immediately.</div><section class="ad-placement-grid" aria-label="Advertisement locations">${AD_PLACEMENTS.map(
      (item) => {
        const count = ads.filter((ad) => isAdRunning(ad) && ad.placements.includes(item.id)).length;
        return `<div class="ad-placement-card"><h2>${esc(item.label)}</h2><p>${esc(item.description)}</p><div><strong>${count} live ad${count === 1 ? '' : 's'}</strong><span>${esc(item.size)}</span></div><small>${count > 1 ? 'Shuffled rotation' : count === 1 ? 'Single banner' : 'Hidden until an ad is enabled'}</small></div>`;
      },
    ).join(
      '',
    )}</section><div class="list-toolbar ads-toolbar"><label class="search-input">${icon('search')}<input type="search" id="ads-query" placeholder="Search campaigns or advertisers…" aria-label="Search ad campaigns" value="${esc(query)}"></label><div class="list-filters"><select id="ads-placement" aria-label="Ad location"><option value="all">All locations</option>${AD_PLACEMENTS.map((item) => `<option value="${item.id}" ${placement === item.id ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}</select><select id="ads-status" aria-label="Campaign status">${['all', 'running', 'paused', 'scheduled', 'expired'].map((item) => `<option value="${item}" ${status === item ? 'selected' : ''}>${item === 'all' ? 'All statuses' : statusName(item)}</option>`).join('')}</select><label class="check-label"><input type="checkbox" id="ads-archived" ${archived ? 'checked' : ''}> Show archive</label></div></div><section class="panel" id="ads-results">${listRows()}</section></div>`;
  }

  async function show() {
    const first = await api('/admin/ads?limit=100&includeArchived=true');
    ads = first.items;
    for (let page = 2; ads.length < first.total; page++) {
      const next = await api('/admin/ads?limit=100&includeArchived=true&page=' + page);
      if (!next.items.length) break;
      ads.push(...next.items);
    }
    if (ctx.currentView() !== 'ads') return;
    layout(listPage());
    const root = document.querySelector('#ads-workspace');
    root.querySelector('#ads-query').addEventListener('input', (event) => {
      query = event.target.value;
      root.querySelector('#ads-results').innerHTML = listRows();
    });
    root.addEventListener('change', (event) => {
      if (event.target.id === 'ads-placement') placement = event.target.value;
      if (event.target.id === 'ads-status') status = event.target.value;
      if (event.target.id === 'ads-archived') {
        archived = event.target.checked;
        status = 'all';
        root.querySelector('#ads-status').value = 'all';
      }
      root.querySelector('#ads-results').innerHTML = listRows();
    });
    root.addEventListener('click', async (event) => {
      if (event.target.closest('[data-ad-new]')) return openEditor();
      const edit = event.target.closest('[data-ad-edit]');
      if (edit) return openEditor(edit.dataset.adEdit);
      const button = event.target.closest('[data-ad-action]');
      if (!button || button.disabled) return;
      button.disabled = true;
      const action = button.dataset.adAction;
      const id = encodeURIComponent(button.dataset.adId);
      try {
        await api(
          '/admin/ads/' +
            id +
            (action === 'restore'
              ? '/restore'
              : ['pause', 'enable'].includes(action)
                ? '/active'
                : ''),
          {
            method: action === 'restore' ? 'POST' : action === 'archive' ? 'DELETE' : 'PATCH',
            body: JSON.stringify(
              ['pause', 'enable'].includes(action) ? { active: action === 'enable' } : {},
            ),
          },
        );
        await show();
        notice(
          action === 'restore'
            ? 'Ad restored.'
            : action === 'archive'
              ? 'Ad archived and removed from the website.'
              : action === 'pause'
                ? 'Ad paused.'
                : 'Ad enabled. Its schedule still applies.',
        );
      } catch (error) {
        notice(error.message);
        button.disabled = false;
      }
    });
  }

  function localDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  function openEditor(id) {
    const existing = id ? ads.find((ad) => ad.id === id) : null;
    if (id && !existing) return notice('This ad was not found.');
    const ad = existing || {
      title: '',
      advertiser: '',
      alt: '',
      image: '',
      link: '',
      placements: [],
      active: false,
      startsAt: '',
      endsAt: '',
    };
    ctx.setEditorView();
    layout(
      heading(
        existing ? 'Manage this campaign.' : 'Create an ad campaign.',
        'Choose a banner, destination, and one or more website locations.',
        `<button type="button" class="btn secondary" data-nav="ads">Back to ads</button>`,
      ) +
        `<form id="editor-form" class="ad-editor"><div id="editor-error"></div><div class="editor-grid"><div><section class="form-panel"><h2>Campaign and banner</h2><div class="form-grid">${field('Campaign name', 'title', ad.title, { required: true, max: 120 })}${field('Advertiser', 'advertiser', ad.advertiser, { required: true, max: 100 })}${field('Destination URL', 'link', ad.link, { type: 'url', required: true, max: 2000, wide: true })}${field('Image description', 'alt', ad.alt, { required: true, max: 200, wide: true, hint: 'Describe the offer for visitors who cannot see the image.' })}${productImageField(ad.image, { label: 'Ad banner', previewAlt: 'Advertisement banner preview', allowGif: true })}</div></section><section class="form-panel"><h2>Website locations</h2><p class="ad-form-help">Choose one or more locations. The banner fits within each space without cropping.</p><div class="ad-location-options">${AD_PLACEMENTS.map((item) => `<label class="ad-location-option"><input type="checkbox" name="placements" value="${item.id}" ${ad.placements.includes(item.id) ? 'checked' : ''}><span><strong>${esc(item.label)}</strong><small>${esc(item.description)}</small><small>Recommended: ${esc(item.size)} pixels</small></span></label>`).join('')}</div></section></div><aside class="editor-sidebar"><section class="form-panel"><h2>Delivery and schedule</h2><label class="check-label"><input type="checkbox" name="active" ${ad.active ? 'checked' : ''}> Enabled on the website</label>${field('Start (local time, optional)', 'startsAt', localDate(ad.startsAt), { type: 'datetime-local', hint: 'Leave empty to start immediately when enabled.' })}${field('End (local time, optional)', 'endsAt', localDate(ad.endsAt), { type: 'datetime-local', hint: 'Leave empty to run until paused or archived.' })}<p>Only enabled ads within their schedule appear. Locations with multiple ads rotate evenly every 8 seconds.</p><button type="submit" class="btn">${icon('check')} ${existing ? 'Save changes' : 'Save ad'}</button></section></aside></div></form>`,
    );
    history.replaceState({}, '', '/hello#ads-editor');
    window.scrollTo(0, 0);
    const form = document.querySelector('#editor-form');
    bindProductImage(form, { allowGif: true });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (form.dataset.saving === 'true') return;
      if (form.dataset.imageProcessing === 'true')
        return notice('Wait for the banner to finish compressing.');
      if (!form.reportValidity()) return;
      const errorBox = form.querySelector('#editor-error');
      const data = new FormData(form);
      try {
        const placements = data.getAll('placements');
        if (!placements.length) throw new Error('Choose at least one website location.');
        if (!data.get('image')) throw new Error('Upload a banner image or enter its URL.');
        const startsAt = data.get('startsAt') ? new Date(data.get('startsAt')).toISOString() : '';
        const endsAt = data.get('endsAt') ? new Date(data.get('endsAt')).toISOString() : '';
        if (startsAt && endsAt && endsAt <= startsAt)
          throw new Error('The end date must be after the start date.');
        const value = {
          title: data.get('title').trim(),
          advertiser: data.get('advertiser').trim(),
          alt: data.get('alt').trim(),
          image: data.get('image').trim(),
          link: data.get('link').trim(),
          placements,
          active: form.elements.active.checked,
          startsAt,
          endsAt,
        };
        form.dataset.saving = 'true';
        form
          .querySelectorAll('button, [data-image-control]')
          .forEach((control) => (control.disabled = true));
        errorBox.innerHTML = '';
        await api('/admin/ads' + (existing ? '/' + encodeURIComponent(existing.id) : ''), {
          method: existing ? 'PUT' : 'POST',
          body: JSON.stringify(value),
        });
        if (!form.isConnected) return;
        await ctx.returnToAds();
        notice('Ad saved to MongoDB. Refresh the website to see it immediately.');
      } catch (error) {
        errorBox.innerHTML = `<div class="form-error" role="alert">${esc(error.message)}</div>`;
        if (form.isConnected) errorBox.scrollIntoView({ block: 'center' });
      } finally {
        form.dataset.saving = 'false';
        form
          .querySelectorAll('button, [data-image-control]')
          .forEach((control) => (control.disabled = false));
      }
    });
  }
  return { show };
}
