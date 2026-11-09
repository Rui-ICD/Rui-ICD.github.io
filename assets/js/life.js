(() => {
  const root = document.querySelector('[data-life]');
  if (!root) return;
  const data = JSON.parse(document.getElementById('rj-life-data').textContent);
  const zh = data.language === 'zh';
  const stage = root.querySelector('[data-atlas-stage]');
  const layer = root.querySelector('[data-atlas-layer]');
  const points = root.querySelector('[data-atlas-points]');
  const chooser = root.querySelector('[data-place-select]');
  const image = root.querySelector('[data-life-photo]');
  const imageLink = root.querySelector('[data-life-photo-link]');
  const caption = root.querySelector('[data-photo-caption]');
  const source = root.querySelector('[data-photo-source]');
  const status = root.querySelector('[data-life-status]');
  const motion = root.querySelector('[data-life-motion]');
  const lightbox = document.querySelector('[data-life-lightbox]');
  const europe = new Set(['Austria', 'Czechia', 'Germany', 'France', 'United Kingdom', 'Spain']);
  const byId = new Map(data.places.map((place) => [place.id, place]));
  const params = new URLSearchParams(location.search);
  let selected = byId.get(params.get('place')) || byId.get(data.initial);
  let photoIndex = Math.max(0, Math.min(selected.photos.length - 1, Math.trunc(Number(params.get('photo'))) || 0));
  let view = { x: 0, y: 0, k: 1 };
  let activeRegion = 'all';
  let clusterMenu;
  let drag;
  let moved = false;
  const unit = () => stage.clientWidth / 1040;
  const limit = (number, minimum, maximum) => Math.max(minimum, Math.min(maximum, number));

  function closeCluster() {
    if (clusterMenu) clusterMenu.remove();
    clusterMenu = null;
  }

  function fit(places) {
    const xs = places.map((place) => place.point.x);
    const ys = places.map((place) => place.point.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const k = limit(Math.min(860 / Math.max(30, maxX - minX), 390 / Math.max(22, maxY - minY)), 1, 14);
    return { k, x: 520 - (minX + maxX) * k / 2, y: 270 - (minY + maxY) * k / 2 };
  }

  function showCluster(group, button) {
    closeCluster();
    clusterMenu = document.createElement('div');
    clusterMenu.className = 'rj-cluster-menu';
    clusterMenu.setAttribute('role', 'group');
    clusterMenu.setAttribute('aria-label', zh ? '选择地点' : 'Choose a place');
    for (const place of group.members) {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = place.name;
      item.addEventListener('click', () => { selectPlace(place.id); closeCluster(); });
      clusterMenu.append(item);
    }
    const bounds = button.getBoundingClientRect();
    const canvas = stage.getBoundingClientRect();
    clusterMenu.style.left = `${limit(bounds.left - canvas.left - 40, 10, canvas.width - 190)}px`;
    clusterMenu.style.top = `${limit(bounds.bottom - canvas.top + 5, 10, canvas.height - Math.min(180, group.members.length * 42 + 16))}px`;
    stage.append(clusterMenu);
    clusterMenu.querySelector('button').focus({ preventScroll: true });
  }

  function renderPoints() {
    const scale = unit();
    const groups = [];
    for (const place of data.places) {
      const existing = groups.find((group) => Math.hypot(group.x - place.point.x, group.y - place.point.y) * view.k * scale < 22);
      if (existing) {
        existing.x = (existing.x * existing.members.length + place.point.x) / (existing.members.length + 1);
        existing.y = (existing.y * existing.members.length + place.point.y) / (existing.members.length + 1);
        existing.members.push(place);
      } else groups.push({ x: place.point.x, y: place.point.y, members: [place] });
    }
    points.replaceChildren();
    groups.forEach((group, index) => {
      const single = group.members.length === 1;
      const chosen = group.members.some((place) => place.id === selected.id);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `rj-spark${chosen ? ' is-selected' : ''}${single ? '' : ' is-cluster'}`;
      if ((group.y * view.k + view.y) * scale + layer.offsetTop > stage.clientHeight - 65) button.classList.add('is-low');
      button.style.left = `${group.x / 1040 * 100}%`;
      button.style.top = `${group.y / 540 * 100}%`;
      button.style.setProperty('--spark-delay', `${-index * .53}s`);
      const label = single ? group.members[0].name : `${group.members.length}${zh ? ' 个地点' : ' places'}`;
      button.title = single ? `${label} · ${group.members[0].country}` : group.members.map((place) => place.name).join(' · ');
      button.setAttribute('aria-label', button.title);
      button.setAttribute('aria-pressed', String(chosen));
      if (single) button.dataset.place = group.members[0].id;
      const glow = document.createElement('span');
      glow.className = 'rj-spark-glow';
      glow.setAttribute('aria-hidden', 'true');
      const star = document.createElement('span');
      star.className = 'rj-spark-star';
      star.setAttribute('aria-hidden', 'true');
      button.append(glow, star);
      const name = document.createElement('span');
      name.className = 'rj-spark-label';
      name.textContent = single ? label : String(group.members.length);
      button.append(name);
      button.addEventListener('pointerdown', (event) => event.stopPropagation());
      button.addEventListener('click', () => {
        if (single) { selectPlace(group.members[0].id); return; }
        const next = fit(group.members);
        if (next.k > view.k + .4) { view = next; draw(); stage.focus({ preventScroll: true }); }
        else showCluster(group, button);
      });
      points.append(button);
    });
  }

  function draw() {
    closeCluster();
    const scale = unit();
    layer.style.transform = `translate(${view.x * scale}px, ${view.y * scale}px) scale(${view.k})`;
    root.style.setProperty('--map-k', view.k);
    renderPoints();
    root.querySelectorAll('.rj-land').forEach((land) => land.classList.toggle('is-active-country', land.dataset.country === selected.point.country));
  }

  function updateUrl() {
    const url = new URL(location.href);
    url.searchParams.set('place', selected.id);
    if (photoIndex) url.searchParams.set('photo', String(photoIndex));
    else url.searchParams.delete('photo');
    if (location.protocol !== 'file:') history.replaceState(null, '', url);
    document.querySelectorAll('[data-language]').forEach((link) => {
      const translated = new URL(link.href);
      translated.search = url.search;
      link.href = translated.href;
    });
  }

  function displayPhoto() {
    const photo = selected.photos[photoIndex];
    image.src = photo.url;
    image.width = photo.width;
    image.height = photo.height;
    image.alt = photo.alt;
    imageLink.href = photo.url;
    caption.textContent = photo.caption;
    source.href = photo.source;
    source.hidden = !photo.source;
    root.querySelector('[data-photo-credit]').textContent = photo.credit;
    root.querySelector('[data-photo-count]').textContent = `${photoIndex + 1} / ${selected.photos.length}`;
    root.querySelector('[data-photo-controls]').hidden = selected.photos.length < 2;
    updateUrl();
  }

  function selectPlace(id) {
    const place = byId.get(id);
    if (!place) return;
    selected = place;
    photoIndex = 0;
    chooser.value = id;
    root.querySelector('[data-place-name]').textContent = place.name;
    root.querySelector('[data-place-country]').textContent = place.country;
    const screenX = place.point.x * view.k + view.x;
    const screenY = place.point.y * view.k + view.y;
    if (screenX < 60 || screenX > 980 || screenY < 45 || screenY > 495) {
      view.x = 520 - place.point.x * view.k;
      view.y = 270 - place.point.y * view.k;
    }
    displayPhoto();
    draw();
    status.textContent = `${place.name} · ${place.country}`;
  }

  chooser.addEventListener('change', () => selectPlace(chooser.value));
  root.querySelectorAll('[data-region]').forEach((button) => button.addEventListener('click', () => {
    activeRegion = button.dataset.region;
    const subset = data.places.filter((place) => activeRegion === 'all' || (activeRegion === 'europe' ? europe.has(place.countryKey) : !europe.has(place.countryKey)));
    view = fit(subset);
    root.querySelectorAll('[data-region]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    draw();
  }));

  function zoom(multiplier) {
    const k = limit(view.k * multiplier, 1, 14);
    const ratio = k / view.k;
    view = { k, x: 520 - (520 - view.x) * ratio, y: 270 - (270 - view.y) * ratio };
    draw();
  }
  root.querySelector('[data-zoom="in"]').addEventListener('click', () => zoom(1.45));
  root.querySelector('[data-zoom="out"]').addEventListener('click', () => zoom(1 / 1.45));
  root.querySelector('[data-world]').addEventListener('click', () => { view = { x: 0, y: 0, k: 1 }; draw(); });
  stage.addEventListener('keydown', (event) => {
    if (event.target !== stage) return;
    if (event.key === '+' || event.key === '=') zoom(1.45);
    else if (event.key === '-') zoom(1 / 1.45);
    else if (event.key === 'Home') { view = fit(data.places); draw(); }
    else if (event.key.startsWith('Arrow')) {
      view.x += event.key === 'ArrowLeft' ? 50 : event.key === 'ArrowRight' ? -50 : 0;
      view.y += event.key === 'ArrowUp' ? 50 : event.key === 'ArrowDown' ? -50 : 0;
      draw();
    } else return;
    event.preventDefault();
  });
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button,a')) return;
    drag = { x: event.clientX, y: event.clientY, startX: view.x, startY: view.y };
    moved = false;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) moved = true;
    view.x = limit(drag.startX + dx / unit(), -1040 * view.k, 1040 * view.k);
    view.y = limit(drag.startY + dy / unit(), -540 * view.k, 540 * view.k);
    draw();
  });
  function endDrag() { drag = null; stage.classList.remove('is-dragging'); }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('click', (event) => { if (!moved && !event.target.closest('.rj-cluster-menu,button')) closeCluster(); });

  let motionOn = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { const saved = localStorage.getItem('rj-life-motion'); if (saved) motionOn = saved === 'on'; } catch (_) { /* Browser privacy settings may disable storage. */ }
  function setMotion() {
    root.dataset.motion = motionOn ? 'on' : 'off';
    motion.setAttribute('aria-pressed', String(!motionOn));
    motion.setAttribute('aria-label', motionOn ? data.pause : data.play);
    motion.title = motionOn ? data.pause : data.play;
    motion.firstElementChild.textContent = motionOn ? 'Ⅱ' : '✦';
  }
  motion.addEventListener('click', () => {
    motionOn = !motionOn; setMotion();
    try { localStorage.setItem('rj-life-motion', motionOn ? 'on' : 'off'); } catch (_) { /* Preference still works for this visit. */ }
  });
  root.querySelector('[data-photo-prev]').addEventListener('click', () => { photoIndex = (photoIndex - 1 + selected.photos.length) % selected.photos.length; displayPhoto(); });
  root.querySelector('[data-photo-next]').addEventListener('click', () => { photoIndex = (photoIndex + 1) % selected.photos.length; displayPhoto(); });
  imageLink.addEventListener('click', (event) => {
    if (typeof lightbox.showModal !== 'function') return;
    event.preventDefault();
    const photo = selected.photos[photoIndex];
    const enlarged = lightbox.querySelector('[data-lightbox-photo]');
    enlarged.src = photo.url; enlarged.alt = photo.alt;
    lightbox.querySelector('[data-lightbox-caption]').textContent = `${photo.caption} · ${photo.author}`;
    lightbox.showModal();
  });
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });
  addEventListener('resize', draw);
  setMotion();
  chooser.value = selected.id;
  root.querySelector('[data-place-name]').textContent = selected.name;
  root.querySelector('[data-place-country]').textContent = selected.country;
  displayPhoto();
  view = fit(data.places);
  draw();
})();
