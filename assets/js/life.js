import { createLifeGlobe } from './life-globe.js';

(() => {
  const root = document.querySelector('[data-life]');
  if (!root) return;
  const data = JSON.parse(document.getElementById('rj-life-data').textContent);
  const chooser = root.querySelector('[data-place-select]');
  const lightbox = document.querySelector('[data-life-lightbox]');
  const motion = root.querySelector('[data-life-motion]');
  const status = root.querySelector('[data-life-status]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const europe = new Set(['Austria', 'Czechia', 'Germany', 'France', 'United Kingdom', 'Spain']);
  const byId = new Map(data.places.map(place => [place.id, place]));
  const params = new URLSearchParams(location.search);
  let selected = byId.get(params.get('place')) || byId.get(data.initial);
  let activeView = 'atlas', sceneRegion = 'all', dialogPlace = selected, globe;
  const belongs = (place, region) => region === 'all' || (region === 'china'
    ? place.countryKey === 'China' : region === 'europe'
      ? europe.has(place.countryKey) : !europe.has(place.countryKey));

  function updateUrl() {
    const url = new URL(location.href);
    url.searchParams.set('place', selected.id); url.searchParams.delete('photo');
    if (activeView === 'scenes') url.searchParams.set('view', 'scenes'); else url.searchParams.delete('view');
    if (location.protocol !== 'file:') history.replaceState(null, '', url);
    document.querySelectorAll('[data-language]').forEach(link => {
      const translated = new URL(link.href); translated.search = url.search; link.href = translated.href;
    });
  }
  function displayPlace() {
    const photo = selected.photos[0], image = root.querySelector('[data-life-photo]');
    image.src = photo.url; image.width = photo.width; image.height = photo.height; image.alt = photo.alt;
    root.querySelector('[data-life-photo-link]').href = photo.url;
    root.querySelector('[data-place-country]').textContent = selected.country;
    root.querySelector('[data-place-name]').textContent = selected.name;
    root.querySelector('[data-photo-caption]').textContent = photo.caption;
    root.querySelector('[data-photo-credit]').textContent = photo.author;
    const license = root.querySelector('[data-photo-license]');
    license.textContent = photo.license; license.href = photo.licenseUrl;
    root.querySelector('[data-photo-source]').href = photo.source;
    root.querySelector('[data-place-count]').textContent = String(data.places.indexOf(selected) + 1).padStart(2, '0') + ' / ' + data.places.length;
    chooser.value = selected.id; updateUrl();
  }
  function selectPlace(id) {
    selected = byId.get(id) || selected; displayPlace();
    globe?.focus(selected);
    status.textContent = selected.name + ' · ' + selected.country;
  }
  function switchView(name, focus = false) {
    activeView = name === 'scenes' ? 'scenes' : 'atlas';
    root.dataset.view = activeView;
    root.querySelectorAll('[data-life-panel]').forEach(panel => { panel.hidden = panel.dataset.lifePanel !== activeView; });
    root.querySelectorAll('[data-life-view]').forEach(button => {
      const active = button.dataset.lifeView === activeView;
      button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    globe?.setVisible(activeView === 'atlas'); updateUrl();
  }
  function filterScenes() {
    const query = root.querySelector('[data-place-search]').value.trim().toLocaleLowerCase();
    let count = 0;
    root.querySelectorAll('[data-scene]').forEach(card => {
      const place = byId.get(card.dataset.scene);
      card.hidden = !belongs(place, sceneRegion) || !place.search.toLocaleLowerCase().includes(query);
      if (!card.hidden) count++;
    });
    root.querySelector('[data-scenes-empty]').hidden = count > 0;
  }
  function openPhoto(place) {
    if (typeof lightbox.showModal !== 'function') { location.href = place.photos[0].url; return; }
    dialogPlace = place;
    const photo = place.photos[0], enlarged = lightbox.querySelector('[data-lightbox-photo]');
    enlarged.src = photo.url; enlarged.alt = photo.alt;
    for (const [key, value] of Object.entries({ name: place.name, country: place.country, caption: photo.caption, author: photo.author })) lightbox.querySelector('[data-lightbox-' + key + ']').textContent = value;
    const license = lightbox.querySelector('[data-lightbox-license]');
    license.textContent = photo.license; license.href = photo.licenseUrl;
    lightbox.querySelector('[data-lightbox-source]').href = photo.source;
    lightbox.showModal();
  }

  chooser.addEventListener('change', () => selectPlace(chooser.value));
  root.querySelectorAll('[data-region]').forEach(button => button.addEventListener('click', () => {
    globe?.setRegion(button.dataset.region);
    root.querySelectorAll('[data-region]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));
  root.querySelectorAll('[data-life-view]').forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.lifeView));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); switchView(event.key === 'Home' ? 'atlas' : event.key === 'End' ? 'scenes' : activeView === 'atlas' ? 'scenes' : 'atlas', true);
    });
  });
  root.querySelectorAll('[data-scenes-region]').forEach(button => button.addEventListener('click', () => {
    sceneRegion = button.dataset.scenesRegion;
    root.querySelectorAll('[data-scenes-region]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    filterScenes();
  }));
  root.querySelector('[data-place-search]').addEventListener('input', filterScenes);
  root.querySelectorAll('[data-scene]').forEach(card => card.addEventListener('click', () => openPhoto(byId.get(card.dataset.scene))));
  root.querySelector('[data-place-prev]').addEventListener('click', () => selectPlace(data.places[(data.places.indexOf(selected) - 1 + data.places.length) % data.places.length].id));
  root.querySelector('[data-place-next]').addEventListener('click', () => selectPlace(data.places[(data.places.indexOf(selected) + 1) % data.places.length].id));
  root.querySelector('[data-life-photo-link]').addEventListener('click', event => { event.preventDefault(); openPhoto(selected); });
  lightbox.querySelector('[data-lightbox-map]').addEventListener('click', () => {
    lightbox.close(); switchView('atlas'); selectPlace(dialogPlace.id);
    const stage = root.querySelector('[data-atlas-stage]');
    stage.scrollIntoView({ block: 'center', behavior: reduced.matches ? 'instant' : 'smooth' }); stage.focus({ preventScroll: true });
  });
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  const atlas = root.querySelector('[data-atlas]'), fullscreen = root.querySelector('[data-map-fullscreen]');
  fullscreen.hidden = !atlas.requestFullscreen;
  fullscreen.addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await atlas.requestFullscreen(); } catch (_) { /* Browser may disallow fullscreen. */ }
  });
  let motionOn = !reduced.matches;
  try { const saved = localStorage.getItem('rj-life-motion'); if (saved) motionOn = saved === 'on' && !reduced.matches; } catch (_) { /* Browser privacy settings may disable storage. */ }
  function setMotion() {
    root.dataset.motion = motionOn ? 'on' : 'off';
    motion.setAttribute('aria-pressed', String(!motionOn));
    motion.setAttribute('aria-label', motionOn ? data.pause : data.play); motion.title = motionOn ? data.pause : data.play;
    motion.firstElementChild.textContent = motionOn ? 'Ⅱ' : '✧';
  }
  motion.addEventListener('click', () => {
    motionOn = !motionOn; setMotion();
    try { localStorage.setItem('rj-life-motion', motionOn ? 'on' : 'off'); } catch (_) { /* Works for this visit. */ }
  });
  reduced.addEventListener('change', () => { motionOn = !reduced.matches; setMotion(); });
  setMotion(); displayPlace();
  globe = createLifeGlobe({ root, data: { ...data, initial: selected.id }, onSelect: selectPlace, reduced });
  switchView(params.get('view'));
  addEventListener('pagehide', event => { if (event.persisted) globe.setVisible(false); else globe.destroy(); });
  addEventListener('pageshow', event => { if (event.persisted) globe.setVisible(activeView === 'atlas'); });
})();
