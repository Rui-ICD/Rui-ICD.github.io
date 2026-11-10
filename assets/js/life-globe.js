import Globe from 'globe.gl';
import { AmbientLight, DirectionalLight, Color, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } from 'three';

export function createLifeGlobe({ root, data, onSelect, reduced }) {
  const host = root.querySelector('[data-atlas-layer]');
  const stage = root.querySelector('[data-atlas-stage]');
  const overlay = root.querySelector('[data-atlas-points]');
  const loading = root.querySelector('[data-globe-loading]');
  const list = root.querySelector('[data-globe-list]');
  const search = root.querySelector('[data-globe-search]');
  const zh = data.language === 'zh';
  const byId = new Map(data.places.map(p => [p.id, p]));
  const europe = new Set(['Austria', 'Czechia', 'Germany', 'France', 'United Kingdom', 'Spain']);
  const presets = {
    all: { lat: 27, lng: 68, altitude: 2.05 },
    china: { lat: 34, lng: 106, altitude: .62 },
    asia: { lat: 23, lng: 106, altitude: .96 },
    europe: { lat: 49, lng: 9, altitude: .52 },
  };
  const markers = new Map(), listButtons = new Map(), countryLabels = [];
  const visiblePoints = [];
  let globe, selected = byId.get(data.initial), region = 'all', hovered, visible = true, destroyed = false;
  let frame = 0, down, pinching = false;
  const pointers = new Set();
  const light = new DirectionalLight(0xffffff, 1.3);
  const belongs = p => region === 'all' || (region === 'china' ? p.countryKey === 'China' : region === 'europe' ? europe.has(p.countryKey) : !europe.has(p.countryKey));
  const preset = name => ({ ...presets[name], altitude: presets[name].altitude * (name === 'all' && host.clientWidth / host.clientHeight < .9 ? 1.5 : 1) });

  root.dataset.globe = 'loading'; loading.hidden = false;
  overlay.replaceChildren(); list.replaceChildren(); host.replaceChildren();
  for (const [index, place] of data.places.entries()) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'rj-spark is-' + place.marker;
    button.dataset.place = place.id;
    button.style.setProperty('--spark-delay', (-index * .61) + 's');
    button.style.setProperty('--spark-speed', (2.8 + index % 5 * .3) + 's');
    button.setAttribute('aria-label', place.name + ' · ' + place.country + (place.marker === 'capital' ? ' · ' + data.capital : ''));
    for (const className of ['rj-spark-halo', 'rj-spark-star', 'rj-spark-core', 'rj-spark-glint']) {
      const span = document.createElement('span'); span.className = className; span.setAttribute('aria-hidden', 'true'); button.append(span);
    }
    const label = document.createElement('span'); label.className = 'rj-spark-label'; label.textContent = place.name; button.append(label);
    button.addEventListener('click', () => onSelect(place.id));
    button.addEventListener('focus', () => { hovered = place.id; project(); });
    button.addEventListener('blur', () => { hovered = null; project(); });
    overlay.append(button); markers.set(place.id, button);
  }

  const groups = new Map();
  for (const place of data.places) {
    if (!groups.has(place.country)) groups.set(place.country, []);
    groups.get(place.country).push(place);
  }
  for (const [country, places] of groups) {
    const section = document.createElement('section'); section.className = 'rj-globe-country-group';
    const heading = document.createElement('h4'); heading.textContent = country; section.append(heading);
    for (const place of places) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.globePlace = place.id;
      const name = document.createElement('span'); name.textContent = place.name;
      const dot = document.createElement('span'); dot.className = 'rj-globe-list-dot is-' + place.marker; dot.setAttribute('aria-hidden', 'true');
      button.append(dot, name); button.addEventListener('click', () => onSelect(place.id));
      section.append(button); listButtons.set(place.id, button);
    }
    list.append(section);
  }

  function filterList() {
    const query = search.value.trim().toLocaleLowerCase();
    for (const place of data.places) listButtons.get(place.id).hidden = !belongs(place) || !place.search.toLocaleLowerCase().includes(query);
    for (const section of list.children) section.hidden = ![...section.querySelectorAll('button')].some(button => !button.hidden);
    root.querySelector('[data-globe-list-empty]').hidden = [...listButtons.values()].some(button => !button.hidden);
    list.scrollTop = 0;
  }
  search.addEventListener('input', filterList);
  search.addEventListener('keydown', event => {
    if (event.key === 'Enter') { const button = [...listButtons.values()].find(b => !b.hidden); if (button) onSelect(button.dataset.globePlace); }
  });

  // One BufferGeometry per boundary layer: geographic lines retain their width,
  // with no SVG gradients or CSS transforms involved in drawing the Earth.
  function addBoundaries(lines, color, opacity) {
    const positions = [];
    for (const line of lines) for (let i = 1; i < line.length; i++) {
      const a = line[i - 1], b = line[i];
      let delta = b[0] - a[0]; if (delta > 180) delta -= 360; if (delta < -180) delta += 360;
      const count = Math.max(1, Math.ceil(Math.max(Math.abs(delta), Math.abs(b[1] - a[1]))));
      for (let step = 0; step < count; step++) for (const t of [step / count, (step + 1) / count]) {
        const p = globe.getCoords(a[1] + (b[1] - a[1]) * t, a[0] + delta * t, .0011);
        positions.push(p.x, p.y, p.z);
      }
    }
    const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    globe.scene().add(new LineSegments(geometry, material));
  }

  function screenPoint(lat, lng, altitude = .006) {
    const p = globe.getCoords(lat, lng), c = globe.camera().position, r = globe.getGlobeRadius();
    // A point on the far side or beyond the horizon never floats over the globe.
    if (p.x * c.x + p.y * c.y + p.z * c.z <= r * r * 1.003) return null;
    const xy = globe.getScreenCoords(lat, lng, altitude);
    if (xy.x < 6 || xy.x > host.clientWidth - 6 || xy.y < 6 || xy.y > host.clientHeight - 6) return null;
    return xy;
  }

  function project() {
    frame = 0;
    if (!globe || !visible || !host.clientWidth || destroyed) return;
    const pov = globe.pointOfView();
    const zoom = Math.max(1, presets.all.altitude / Math.max(.001, pov.altitude));
    root.style.setProperty('--map-k', zoom);
    root.querySelector('[data-zoom-level]').textContent = zoom < 10 ? zoom.toFixed(1) + '×' : Math.round(zoom) + '×';
    root.dataset.globeLat = pov.lat.toFixed(4); root.dataset.globeLng = pov.lng.toFixed(4);
    light.position.copy(globe.camera().position).multiplyScalar(1.5);
    light.position.y += 140; light.position.x -= 80;
    visiblePoints.length = 0;
    for (const place of data.places) {
      const button = markers.get(place.id), xy = screenPoint(...place.coordinates);
      button.hidden = !xy;
      button.classList.toggle('is-selected', place.id === selected.id);
      button.classList.toggle('is-hover', place.id === hovered);
      button.classList.remove('has-label'); button.setAttribute('aria-pressed', String(place.id === selected.id));
      if (!xy) continue;
      button.style.left = xy.x + 'px'; button.style.top = xy.y + 'px';
      button.classList.toggle('is-low', xy.y > host.clientHeight - 80);
      button.classList.toggle('is-right', xy.x > host.clientWidth - 145);
      visiblePoints.push({ ...xy, place, button });
    }
    const boxes = [];
    const priority = p => p.place.id === hovered ? 110 : p.place.id === selected.id ? 100 : p.place.marker === 'capital' ? 90 : p.place.marker === 'featured' ? 80 : ['london', 'paris', 'vienna', 'doha', 'shanghai'].includes(p.place.id) ? 50 : 0;
    for (const point of [...visiblePoints].sort((a, b) => priority(b) - priority(a))) {
      if (!priority(point) && pov.altitude > .48) continue;
      const label = point.button.querySelector('.rj-spark-label'), width = label.offsetWidth;
      const options = [
        { x: point.x + 16, y: point.y - 12 },
        { x: point.x - width - 16, y: point.y - 12 },
        { x: point.x - width / 2, y: point.y - 43 },
        { x: point.x - width / 2, y: point.y + 20 },
      ].map(p => ({ ...p, width: width + 6, height: 30 }));
      const box = options.find(p => p.x >= 5 && p.x + p.width < host.clientWidth - 5 && p.y >= 5 && p.y + p.height < host.clientHeight - 40 && !boxes.some(b => p.x < b.x + b.width && p.x + p.width > b.x && p.y < b.y + b.height && p.y + p.height > b.y)) || (priority(point) >= 100 ? options[0] : null);
      if (box) {
        label.style.left = box.x - point.x + 15 + 'px'; label.style.top = box.y - point.y + 15 + 'px';
        label.style.right = 'auto'; label.style.bottom = 'auto';
        point.button.classList.add('has-label'); boxes.push(box);
      }
    }
    for (const label of countryLabels) {
      const xy = screenPoint(label.lat, label.lng, .0015);
      label.element.hidden = !xy || pov.altitude < .15 || boxes.some(b => xy.x + 35 > b.x && xy.x - 35 < b.x + b.width && xy.y + 10 > b.y && xy.y - 10 < b.y + b.height);
      if (xy) { label.element.style.left = xy.x + 'px'; label.element.style.top = xy.y + 'px'; }
    }
  }

  function schedule() { if (!frame) frame = requestAnimationFrame(project); }
  function resize() {
    if (!globe || !host.clientWidth || !visible) return;
    globe.width(host.clientWidth).height(host.clientHeight);
    globe.renderer().setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    schedule();
  }
  function focus(place, fly = true) {
    selected = place;
    if (listButtons.get(place.id).hidden) {
      search.value = '';
      if (!belongs(place)) {
        region = 'all';
        root.querySelectorAll('[data-region]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.region === 'all')));
      }
      filterList();
    }
    for (const p of data.places) listButtons.get(p.id).setAttribute('aria-current', String(p.id === place.id));
    const button = listButtons.get(place.id), top = button.offsetTop - list.offsetTop;
    if (fly && (top < list.scrollTop || top + button.offsetHeight > list.scrollTop + list.clientHeight)) list.scrollTop = Math.max(0, top - list.clientHeight * .4);
    if (globe && fly) globe.pointOfView({ lat: place.coordinates[0], lng: place.coordinates[1], altitude: Math.min(1.15, Math.max(.18, globe.pointOfView().altitude)) }, reduced.matches ? 0 : 1100);
    schedule();
  }
  function setRegion(name) {
    region = name in presets ? name : 'all'; filterList();
    if (globe) globe.pointOfView(preset(region), reduced.matches ? 0 : 1200);
  }
  function nearest(event) {
    const rect = host.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
    return visiblePoints.filter(p => Math.hypot(x - p.x, y - p.y) < 22).sort((a, b) => Math.hypot(x - a.x, y - a.y) - Math.hypot(x - b.x, y - b.y))[0];
  }

  try {
    globe = new Globe(host, { animateIn: false, rendererConfig: { antialias: true, alpha: true, powerPreference: 'high-performance' } })
      .backgroundColor('rgba(0,0,0,0)').globeImageUrl(data.earth).bumpImageUrl(data.topography)
      .showAtmosphere(true).atmosphereColor('#7bbcf1').atmosphereAltitude(.075)
      .globeCurvatureResolution(2).showGraticules(false).enablePointerInteraction(false)
      .onZoom(schedule).onGlobeReady(() => { root.dataset.globe = 'ready'; loading.hidden = true; resize(); });
    globe.renderer().setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const material = globe.globeMaterial();
    material.bumpScale = .36; material.shininess = 8;
    material.specular = new Color('#153544'); material.emissive = new Color('#10212b'); material.emissiveIntensity = .23;
    globe.lights([new AmbientLight(0xffffff, 1.35), light]);
    const controls = globe.controls(), radius = globe.getGlobeRadius();
    controls.enablePan = false; controls.enableDamping = !reduced.matches;
    controls.dampingFactor = .12; controls.rotateSpeed = .5; controls.zoomSpeed = .7;
    controls.minDistance = radius * 1.001; controls.maxDistance = radius * 6;
    controls.zoomToCursor = false; controls.autoRotate = false;
    addBoundaries(data.boundaries.borders, '#bad7e7', .42);
    addBoundaries(data.boundaries.coasts, '#93bfc9', .24);
    for (const country of data.countryLabels) {
      const element = document.createElement('span'); element.className = 'rj-globe-country-label'; element.textContent = country.name;
      overlay.prepend(element); countryLabels.push({ ...country, element });
    }
    resize(); globe.pointOfView(preset('all'), 0); focus(selected, false);
  } catch (_) {
    root.dataset.globe = 'unavailable'; loading.textContent = data.unavailable;
  }

  host.addEventListener('pointerdown', event => {
    pointers.add(event.pointerId); if (pointers.size > 1) pinching = true;
    down = { x: event.clientX, y: event.clientY }; stage.classList.add('is-dragging');
  }, true);
  host.addEventListener('pointermove', event => {
    if (pointers.size) return;
    const hit = nearest(event); hovered = hit?.place.id;
    host.style.cursor = hit ? 'pointer' : 'grab'; schedule();
  }, true);
  host.addEventListener('pointerleave', () => { hovered = null; schedule(); });
  function release(event) {
    if (!pointers.has(event.pointerId)) return;
    const click = !pinching && down && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 6;
    pointers.delete(event.pointerId);
    if (click && event.type === 'pointerup') { const hit = nearest(event); if (hit) onSelect(hit.place.id); }
    if (!pointers.size) { down = null; pinching = false; stage.classList.remove('is-dragging'); }
  }
  host.addEventListener('pointerup', release, true); host.addEventListener('pointercancel', release, true);
  host.addEventListener('lostpointercapture', release, true);
  const zoom = factor => {
    if (!globe) return;
    const pov = globe.pointOfView(); globe.pointOfView({ ...pov, altitude: Math.max(.0011, Math.min(5, pov.altitude * factor)) }, reduced.matches ? 0 : 220);
  };
  root.querySelector('[data-zoom="in"]').addEventListener('click', () => zoom(.66));
  root.querySelector('[data-zoom="out"]').addEventListener('click', () => zoom(1 / .66));
  root.querySelector('[data-world]').addEventListener('click', () => setRegion('all'));
  stage.addEventListener('keydown', event => {
    if (event.target !== stage || !globe) return;
    const pov = globe.pointOfView();
    if (['+', '='].includes(event.key)) zoom(.66);
    else if (event.key === '-') zoom(1 / .66);
    else if (event.key === 'Home') setRegion('all');
    else if (event.key.startsWith('Arrow')) globe.pointOfView({ ...pov, lng: pov.lng + (event.key === 'ArrowLeft' ? -10 : event.key === 'ArrowRight' ? 10 : 0), lat: Math.max(-85, Math.min(85, pov.lat + (event.key === 'ArrowUp' ? 8 : event.key === 'ArrowDown' ? -8 : 0))) }, reduced.matches ? 0 : 200);
    else return;
    event.preventDefault();
  });
  const observer = new ResizeObserver(resize); observer.observe(host);
  document.addEventListener('visibilitychange', () => { if (!globe) return; if (document.hidden || !visible) globe.pauseAnimation(); else globe.resumeAnimation(); });
  return {
    focus, setRegion, resize,
    setVisible(value) { visible = value; if (!globe) return; if (value) { globe.resumeAnimation(); resize(); } else globe.pauseAnimation(); },
    destroy() { destroyed = true; observer.disconnect(); cancelAnimationFrame(frame); if (globe) globe._destructor(); },
  };
}
