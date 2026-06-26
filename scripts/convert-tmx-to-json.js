// One-off conversion: Tiled .tmx (XML) -> Tiled JSON, so map.json stays
// available as a static fallback. The live game converts map1.tmx itself on
// every launch (src/common/tmx-loader.js), this script is for manual/offline
// regeneration only.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseTiledMap } from '../src/common/tmx-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAP_DIR = path.join(__dirname, '..', 'public', 'assets', 'images', 'map');

const TMX = fs.readFileSync(path.join(MAP_DIR, 'map1.tmx'), 'utf8');
const TSX = fs.readFileSync(path.join(MAP_DIR, 'Overworld.tsx'), 'utf8');

const MAP_JSON = parseTiledMap(TMX, TSX);

fs.writeFileSync(
  path.join(MAP_DIR, 'map.json'),
  JSON.stringify(MAP_JSON),
);

console.log(`Wrote map.json: ${MAP_JSON.width}x${MAP_JSON.height} tiles, ${MAP_JSON.layers[0].data.length} cells`);
