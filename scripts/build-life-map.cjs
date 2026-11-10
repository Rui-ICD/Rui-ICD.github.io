/* Generate local geographic boundaries for the 3D Life globe.
 * Run from the repository root: node scripts/build-life-map.cjs
 * Adding a city only requires its latitude/longitude in data/life.json.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');

async function text(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(response.status + ': ' + url);
  return response.text();
}
async function main() {
  const root = path.resolve(__dirname, '..'), context = vm.createContext({});
  vm.runInContext(await text('https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js'), context, { timeout: 10000 });
  const topology = JSON.parse(await text('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json'));
  const mesh = filter => context.topojson.mesh(topology, topology.objects.countries, filter).coordinates.map(line => line.map(([lng, lat]) => [+lng.toFixed(4), +lat.toFixed(4)]));
  const boundaries = { source: 'Natural Earth 1:50m / world-atlas@2.0.2', borders: mesh((a, b) => a !== b), coasts: mesh((a, b) => a === b) };
  await fs.writeFile(path.join(root, 'assets/maps/globe-borders.json'), JSON.stringify(boundaries) + '\n');
  console.log('Globe boundaries: ' + boundaries.borders.length + ' border paths; ' + boundaries.coasts.length + ' coast paths.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
