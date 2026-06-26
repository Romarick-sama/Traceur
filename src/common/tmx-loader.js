import { parseTiledMap, parseDecorationTiles } from './tmx-parser.js';

const MAP_DIR = 'public/assets/images/map';

/**
 * Resolves a .tsx-relative image source (eg. "../environment/vegetation/
 * bush1.png") against the map directory it was referenced from.
 * @param {string} relativePath
 * @return {string}
 */
function resolveAssetPath(relativePath) {
  const BASE_PARTS = MAP_DIR.split('/');
  const REL_PARTS = relativePath.split('/');
  while (REL_PARTS[0] === '..') {
    REL_PARTS.shift();
    BASE_PARTS.pop();
  }
  return [...BASE_PARTS, ...REL_PARTS].join('/');
}

/**
 * Derives a unique, collision-free texture key for a decoration image from
 * its filename (eg. ".../bush1.png" -> "decoration:bush1").
 * @param {string} path
 * @return {string}
 */
function keyFromPath(path) {
  const FILENAME = path.split('/').pop();
  return `decoration:${FILENAME.replace(/\.[^.]+$/, '')}`;
}

/**
 * Fetches map1.tmx and every tileset it references, and converts them into
 * the Tiled-JSON shape live, in the browser, so editing the map in Tiled is
 * reflected in-game without a manual build step. Standalone "image
 * collection" tilesets (tree/bush/thornbush, one real image per tile) are
 * resolved into a gid -> texture lookup (`decorationTilesByGid`, embedded in
 * the returned map JSON) plus the deduplicated list of images to preload,
 * so decoration objects render with their actual Tiled artwork.
 * @return {Promise<{mapJson: object, decorationAssets: Array<{key: string, path: string}>}>}
 */
export async function buildMapTiledJson() {
  const [tmxText, overworldTsxText] = await Promise.all([
    fetch(`${MAP_DIR}/map1.tmx`).then((response) => response.text()),
    fetch(`${MAP_DIR}/Overworld.tsx`).then((response) => response.text()),
  ]);

  const MAP_JSON = parseTiledMap(tmxText, overworldTsxText);

  const DECORATION_REFS = MAP_JSON.tilesetRefs.filter((ref) => ref.source !== 'Overworld.tsx');
  const DECORATION_TSX_TEXTS = await Promise.all(
    DECORATION_REFS.map((ref) => fetch(`${MAP_DIR}/${ref.source}`).then((response) => response.text())),
  );

  const DECORATION_TILES_BY_GID = {};
  const DECORATION_ASSETS_BY_KEY = new Map();

  DECORATION_REFS.forEach((ref, index) => {
    parseDecorationTiles(DECORATION_TSX_TEXTS[index], ref.firstgid).forEach((tile) => {
      const PATH = resolveAssetPath(tile.source);
      const KEY = keyFromPath(PATH);

      DECORATION_TILES_BY_GID[tile.gid] = {
        key: KEY,
        width: tile.width,
        height: tile.height,
      };
      DECORATION_ASSETS_BY_KEY.set(KEY, {
        key: KEY,
        path: PATH,
      });
    });
  });

  MAP_JSON.decorationTilesByGid = DECORATION_TILES_BY_GID;

  return {
    mapJson: MAP_JSON,
    decorationAssets: [...DECORATION_ASSETS_BY_KEY.values()],
  };
}
