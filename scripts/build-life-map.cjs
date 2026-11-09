/* Generate a local, tile-free atlas from Natural Earth public-domain geography.
 * Run from the repository root: node scripts/build-life-map.cjs
 * The pinned build-time tools are ISC-licensed; no map library runs in the browser.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');

async function text(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response.text();
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const life = JSON.parse(await fs.readFile(path.join(root, 'data/life.json'), 'utf8'));
  const context = vm.createContext({});
  for (const url of [
    'https://cdn.jsdelivr.net/npm/d3-array@3.2.4/dist/d3-array.min.js',
    'https://cdn.jsdelivr.net/npm/d3-geo@3.1.1/dist/d3-geo.min.js',
    'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js',
  ]) vm.runInContext(await text(url), context, { timeout: 10000 });

  const topology = JSON.parse(await text('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json'));
  const countries = context.topojson.feature(topology, topology.objects.countries);
  const projection = context.d3.geoNaturalEarth1().fitExtent([[20, 16], [1020, 524]], { type: 'Sphere' });
  const geoPath = context.d3.geoPath(projection).digits(2);
  const ids = {
    China: '156', Philippines: '608', Malaysia: '458', Thailand: '764', Cambodia: '116',
    Singapore: '702', Austria: '040', Czechia: '203', Germany: '276', France: '250',
    'United Kingdom': '826', Spain: '724', Qatar: '634', Indonesia: '360',
  };
  const visited = new Set(life.places.map((place) => {
    if (!ids[place.country.en]) throw new Error(`Unmapped country: ${place.country.en}`);
    return ids[place.country.en];
  }));
  const paths = countries.features.map((country) => {
    const id = String(country.id).padStart(3, '0');
    return `<path class="rj-land${visited.has(id) ? ' is-visited' : ''}" data-country="${id}" d="${geoPath(country)}"/>`;
  }).join('');
  const sphere = geoPath({ type: 'Sphere' });
  const graticule = geoPath(context.d3.geoGraticule10());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 540" class="rj-world-svg" aria-hidden="true"><defs><linearGradient id="rj-visited-land" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe8bc"/><stop offset="1" stop-color="#efd4ac"/></linearGradient></defs><path class="rj-ocean" d="${sphere}"/><path class="rj-graticule" d="${graticule}"/>${paths}</svg>`;
  const points = Object.fromEntries(life.places.map((place) => {
    const [latitude, longitude] = place.coordinates;
    const [x, y] = projection([longitude, latitude]);
    return [place.id, { x: +x.toFixed(4), y: +y.toFixed(4), country: ids[place.country.en] }];
  }));
  await fs.mkdir(path.join(root, 'assets/maps'), { recursive: true });
  await fs.writeFile(path.join(root, 'assets/maps/world.svg'), svg);
  await fs.writeFile(path.join(root, 'data/life-map.json'), JSON.stringify({ width: 1040, height: 540, points }, null, 2) + '\n');
  const licenseSources = {
    'world-atlas': 'https://raw.githubusercontent.com/topojson/world-atlas/v2.0.2/LICENSE',
    'd3-geo': 'https://raw.githubusercontent.com/d3/d3-geo/v3.1.1/LICENSE',
    'd3-array': 'https://raw.githubusercontent.com/d3/d3-array/v3.2.4/LICENSE',
    'topojson-client': 'https://raw.githubusercontent.com/topojson/topojson-client/v3.1.0/LICENSE',
  };
  for (const [name, url] of Object.entries(licenseSources)) {
    await fs.writeFile(path.join(root, `assets/maps/${name}-LICENSE.txt`), await text(url));
  }
  console.log(`Atlas ready: ${countries.features.length} countries; ${points ? Object.keys(points).length : 0} places; ${visited.size} visited countries.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
