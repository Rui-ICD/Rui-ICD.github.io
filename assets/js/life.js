(() => {
  const root = document.querySelector('[data-life]');
  if (!root) return;
  const data = JSON.parse(document.getElementById('rj-life-data').textContent);
  const stage = root.querySelector('[data-atlas-stage]');
  const layer = root.querySelector('[data-atlas-layer]');
  const points = root.querySelector('[data-atlas-points]');
  const chooser = root.querySelector('[data-place-select]');
  const lightbox = document.querySelector('[data-life-lightbox]');
  const motion = root.querySelector('[data-life-motion]');
  const status = root.querySelector('[data-life-status]');
  const europe = new Set(['Austria', 'Czechia', 'Germany', 'France', 'United Kingdom', 'Spain']);
  const byId = new Map(data.places.map((place) => [place.id, place]));
  const params = new URLSearchParams(location.search);
  const MIN_ZOOM = .8, MAX_ZOOM = 512;
  const limit = (n, min, max) => Math.max(min, Math.min(max, n));
  let selected = byId.get(params.get('place')) || byId.get(data.initial);
  let svg = layer.querySelector('svg');
  let view = { x: 0, y: 0, k: 1 }, target = { ...view };
  let activeView = 'atlas', sceneRegion = 'all', frame = 0, detailRequest;
  let dialogPlace = selected, previousSize, gesture, touchTapId, moved = false;
  const pointers = new Map();
  const markers = new Map();
  const unit = () => stage.clientWidth / 1040;
  const mapHeight = () => stage.clientHeight / unit();
  const center = () => ({ x: 520, y: mapHeight() / 2 });
  const belongs = (place, region) => region === 'all' || (region === 'china'
    ? place.countryKey === 'China' : region === 'europe'
      ? europe.has(place.countryKey) : !europe.has(place.countryKey));

  function fit(places) {
    const xs = places.map(p => p.point.x), ys = places.map(p => p.point.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const c = center();
    const k = limit(Math.min(830 / Math.max(15, maxX - minX),
      (mapHeight() - 145 / unit()) / Math.max(15, maxY - minY)), MIN_ZOOM, 80);
    return { k, x: c.x - (minX + maxX) * k / 2, y: c.y - (minY + maxY) * k / 2 };
  }

  function bounded(next) {
    const k = limit(next.k, MIN_ZOOM, MAX_ZOOM), height = mapHeight();
    const y = 540 * k < height
      ? limit(next.y, (height - 540 * k) / 2 - 120, (height - 540 * k) / 2 + 120)
      : limit(next.y, height - 540 * k - 120, 120);
    return { k, x: limit(next.x, Math.min(0, 1040 - 1040 * k) - 200, 200), y };
  }

  function highlightCountry() {
    svg.querySelectorAll('.is-active-country').forEach(el => el.classList.remove('is-active-country'));
    svg.querySelectorAll('[data-country="' + selected.point.country + '"]').forEach(el => el.classList.add('is-active-country'));
  }

  async function loadDetail() {
    if (detailRequest || (location.protocol === 'file:' && !data.detailMap.startsWith('data:'))) return;
    detailRequest = fetch(data.detailMap).then(response => {
      if (!response.ok) throw new Error('Map detail unavailable');
      return response.text();
    }).then(text => {
      const document = new DOMParser().parseFromString(text, 'image/svg+xml');
      if (document.querySelector('parsererror') || document.documentElement.localName !== 'svg') throw new Error('Invalid map detail');
      const detailed = window.document.importNode(document.documentElement, true);
      svg.replaceWith(detailed); svg = detailed;
      root.dataset.mapDetail = 'ready';
      highlightCountry(); draw();
    }).catch(() => { detailRequest = null; /* The local overview remains usable if a detail download fails. */ });
  }

  // Markers stay in screen space. Neither their size nor their animations restart
  // while zooming, and SVG viewBox zoom preserves hairline geographic borders.
  points.replaceChildren();
  for (const [index, place] of data.places.entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rj-spark is-' + place.marker;
    button.dataset.place = place.id;
    button.style.setProperty('--spark-delay', (-index * .619) + 's');
    button.style.setProperty('--spark-speed', (2.7 + index % 6 * .31) + 's');
    button.title = place.name + ' · ' + place.country + (place.marker === 'capital' ? ' · ' + data.capital : '');
    button.setAttribute('aria-label', button.title);
    for (const className of ['rj-spark-halo', 'rj-spark-star', 'rj-spark-core', 'rj-spark-glint']) {
      const span = document.createElement('span');
      span.className = className; span.setAttribute('aria-hidden', 'true'); button.append(span);
    }
    const label = document.createElement('span');
    label.className = 'rj-spark-label'; label.textContent = place.name;
    button.append(label);
    button.addEventListener('pointerdown', event => { moved = false; if (event.pointerType !== 'touch') event.stopPropagation(); });
    button.addEventListener('click', () => { if (!moved) selectPlace(place.id); });
    markers.set(place.id, button); points.append(button);
  }

  function draw() {
    if (!stage.clientWidth) return;
    const scale = unit(), height = mapHeight();
    svg.setAttribute('viewBox', [-view.x / view.k, -view.y / view.k, 1040 / view.k, height / view.k].join(' '));
    root.style.setProperty('--map-k', view.k);
    root.querySelector('[data-zoom-level]').textContent = (view.k < 10 ? view.k.toFixed(1) : Math.round(view.k)) + '×';
    for (const place of data.places) {
      const button = markers.get(place.id);
      const x = (place.point.x * view.k + view.x) * scale;
      const y = (place.point.y * view.k + view.y) * scale;
      button.hidden = x < -35 || x > stage.clientWidth + 35 || y < -35 || y > stage.clientHeight + 35;
      button.style.left = x + 'px'; button.style.top = y + 'px';
      button.classList.toggle('is-selected', place.id === selected.id);
      button.classList.toggle('is-low', y > stage.clientHeight - 75);
      button.classList.toggle('is-left', x < 80);
      button.classList.toggle('is-right', x > stage.clientWidth - 80);
      button.setAttribute('aria-pressed', String(place.id === selected.id));
    }
    if (view.k >= 6) loadDetail();
  }

  function animate() {
    frame = 0;
    const distance = Math.abs(target.x - view.x) + Math.abs(target.y - view.y) + Math.abs(target.k - view.k) * 100;
    if (distance < .05 || reduced.matches) { view = { ...target }; draw(); return; }
    for (const key of ['x', 'y', 'k']) view[key] += (target[key] - view[key]) * .32;
    draw(); frame = requestAnimationFrame(animate);
  }

  function moveTo(next, smooth = true) {
    target = bounded(next);
    if (!smooth) {
      cancelAnimationFrame(frame); frame = 0; view = { ...target }; draw();
    } else if (!frame) frame = requestAnimationFrame(animate);
  }

  function zoom(multiplier, anchor = center()) {
    const k = limit(target.k * multiplier, MIN_ZOOM, MAX_ZOOM), ratio = k / target.k;
    moveTo({ k, x: anchor.x - (anchor.x - target.x) * ratio, y: anchor.y - (anchor.y - target.y) * ratio });
  }

  function updateUrl() {
    const url = new URL(location.href);
    url.searchParams.set('place', selected.id);
    url.searchParams.delete('photo');
    if (activeView === 'scenes') url.searchParams.set('view', 'scenes');
    else url.searchParams.delete('view');
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

  function selectPlace(id, fly = false) {
    selected = byId.get(id) || selected;
    displayPlace(); highlightCountry();
    if (stage.clientWidth) {
      const x = selected.point.x * target.k + target.x, y = selected.point.y * target.k + target.y, c = center();
      if (fly || x < 65 / unit() || x > 1040 - 65 / unit() || y < 65 / unit() || y > mapHeight() - 65 / unit()) {
        moveTo({ k: target.k, x: c.x - selected.point.x * target.k, y: c.y - selected.point.y * target.k });
      } else draw();
    }
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
    if (activeView === 'atlas') resize();
    updateUrl();
  }

  function filterScenes() {
    const search = root.querySelector('[data-place-search]').value.trim().toLocaleLowerCase();
    let count = 0;
    root.querySelectorAll('[data-scene]').forEach(card => {
      const place = byId.get(card.dataset.scene);
      card.hidden = !belongs(place, sceneRegion) || !(place.search || place.name + ' ' + place.id + ' ' + place.country).toLocaleLowerCase().includes(search);
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

  function resize() {
    if (!stage.clientWidth) return;
    const size = { width: stage.clientWidth, height: stage.clientHeight };
    if (previousSize) {
      const oldHeight = previousSize.height / (previousSize.width / 1040);
      const newHeight = size.height / (size.width / 1040);
      target.y += (newHeight - oldHeight) / 2;
      moveTo(target, false);
    } else moveTo(fit(data.places), false);
    previousSize = size;
  }

  chooser.addEventListener('change', () => selectPlace(chooser.value));
  root.querySelectorAll('[data-region]').forEach(button => button.addEventListener('click', () => {
    const subset = data.places.filter(place => belongs(place, button.dataset.region));
    moveTo(fit(subset));
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
    lightbox.close(); switchView('atlas'); selectPlace(dialogPlace.id, true);
    stage.scrollIntoView({ block: 'center', behavior: reduced.matches ? 'instant' : 'smooth' });
    stage.focus({ preventScroll: true });
  });
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  root.querySelector('[data-zoom="in"]').addEventListener('click', () => zoom(1.6));
  root.querySelector('[data-zoom="out"]').addEventListener('click', () => zoom(1 / 1.6));
  root.querySelector('[data-world]').addEventListener('click', () => moveTo({ k: 1, x: 0, y: (mapHeight() - 540) / 2 }));
  const atlas = root.querySelector('[data-atlas]');
  const fullscreen = root.querySelector('[data-map-fullscreen]');
  fullscreen.hidden = !atlas.requestFullscreen;
  fullscreen.addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await atlas.requestFullscreen(); } catch (_) { /* Browser may disallow fullscreen. */ }
  });
  stage.addEventListener('wheel', event => {
    event.preventDefault();
    const rect = stage.getBoundingClientRect();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1);
    zoom(Math.exp(-limit(delta, -320, 320) * (event.ctrlKey ? .008 : .003)),
      { x: (event.clientX - rect.left) / unit(), y: (event.clientY - rect.top) / unit() });
  }, { passive: false });
  stage.addEventListener('keydown', event => {
    if (event.target !== stage) return;
    if (['+', '='].includes(event.key)) zoom(1.6);
    else if (event.key === '-') zoom(1 / 1.6);
    else if (event.key === 'Home') moveTo(fit(data.places));
    else if (event.key.startsWith('Arrow')) moveTo({ ...target,
      x: target.x + (event.key === 'ArrowLeft' ? 60 : event.key === 'ArrowRight' ? -60 : 0) / unit(),
      y: target.y + (event.key === 'ArrowUp' ? 60 : event.key === 'ArrowDown' ? -60 : 0) / unit() });
    else return;
    event.preventDefault();
  });

  function startGesture() {
    const positions = [...pointers.values()];
    const a = positions[0];
    if (positions.length >= 2) {
      const b = positions[1], rect = stage.getBoundingClientRect();
      const mid = { x: ((a.x + b.x) / 2 - rect.left) / unit(), y: ((a.y + b.y) / 2 - rect.top) / unit() };
      gesture = { type: 'pinch', distance: Math.hypot(a.x - b.x, a.y - b.y), start: { ...view },
        world: { x: (mid.x - view.x) / view.k, y: (mid.y - view.y) / view.k } };
    } else if (a) gesture = { type: 'drag', point: a, start: { ...view } };
    else gesture = null;
  }
  stage.addEventListener('pointerdown', event => {
    const interactive = event.target.closest('button,a');
    if ((event.pointerType === 'mouse' && event.button !== 0) || (interactive && !(event.pointerType === 'touch' && interactive.matches('.rj-spark')))) return;
    cancelAnimationFrame(frame); frame = 0; target = { ...view };
    touchTapId = event.pointerType === 'touch' && !pointers.size ? interactive?.dataset.place : null;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    moved = false; stage.setPointerCapture(event.pointerId); stage.classList.add('is-dragging'); startGesture();
  });
  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const positions = [...pointers.values()], a = positions[0];
    if (gesture.type === 'pinch' && positions.length >= 2) {
      const b = positions[1], rect = stage.getBoundingClientRect();
      const k = limit(gesture.start.k * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, gesture.distance), MIN_ZOOM, MAX_ZOOM);
      moveTo({ k, x: ((a.x + b.x) / 2 - rect.left) / unit() - gesture.world.x * k,
        y: ((a.y + b.y) / 2 - rect.top) / unit() - gesture.world.y * k }, false);
      moved = true;
    } else {
      const dx = a.x - gesture.point.x, dy = a.y - gesture.point.y;
      if (Math.hypot(dx, dy) > 4) moved = true;
      moveTo({ ...gesture.start, x: gesture.start.x + dx / unit(), y: gesture.start.y + dy / unit() }, false);
    }
  });
  function endPointer(event) {
    if (!pointers.has(event.pointerId)) return;
    const tapped = event.type === 'pointerup' && pointers.size === 1 && !moved ? touchTapId : null;
    pointers.delete(event.pointerId); startGesture();
    if (!pointers.size) { stage.classList.remove('is-dragging'); touchTapId = null; }
    if (tapped) selectPlace(tapped);
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('lostpointercapture', endPointer);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motionOn = !reduced.matches;
  try { const saved = localStorage.getItem('rj-life-motion'); if (saved) motionOn = saved === 'on' && !reduced.matches; } catch (_) { /* Private browsing may disable storage. */ }
  function setMotion() {
    root.dataset.motion = motionOn ? 'on' : 'off';
    motion.setAttribute('aria-pressed', String(!motionOn));
    motion.setAttribute('aria-label', motionOn ? data.pause : data.play);
    motion.title = motionOn ? data.pause : data.play;
    motion.firstElementChild.textContent = motionOn ? 'Ⅱ' : '✧';
  }
  motion.addEventListener('click', () => {
    motionOn = !motionOn; setMotion();
    try { localStorage.setItem('rj-life-motion', motionOn ? 'on' : 'off'); } catch (_) { /* Works for this visit. */ }
  });
  reduced.addEventListener('change', () => { motionOn = !reduced.matches; setMotion(); });
  new ResizeObserver(resize).observe(stage);
  setMotion(); displayPlace(); highlightCountry();
  resize(); switchView(params.get('view'));
})();
