/**
 * Pure Tiled .tmx (XML) -> Tiled JSON parsing, shared between the Node
 * one-off conversion script (scripts/convert-tmx-to-json.js) and the
 * in-browser live loader (src/common/tmx-loader.js), so the parsing rules
 * can't drift between the two.
 */

function attr(xml, tag, name) {
  const TAG_MATCH = xml.match(new RegExp(`<${tag}\\b[^>]*>`));
  const VALUE_MATCH = TAG_MATCH[0].match(new RegExp(`${name}="([^"]*)"`));
  return VALUE_MATCH[1];
}

/**
 * Parses every Tiled <objectgroup> (eg. the "collision" layer drawn by hand
 * in Tiled) into Phaser's expected objectgroup layer shape, so hitboxes can
 * be defined visually in Tiled instead of hardcoded pixel coords in JS.
 */
function parseObjectGroups(xml) {
  const GROUPS = [];
  const GROUP_REGEX = /<objectgroup\b([^>]*)>([\s\S]*?)<\/objectgroup>/g;
  let groupMatch;
  while ((groupMatch = GROUP_REGEX.exec(xml)) !== null) {
    const [, groupAttrs, groupBody] = groupMatch;
    const ID = Number(groupAttrs.match(/\bid="([^"]*)"/)[1]);
    const NAME = groupAttrs.match(/\bname="([^"]*)"/)[1];

    const OBJECTS = [];
    const OBJECT_REGEX = /<object\b([^>]*?)\/?>/g;
    let objectMatch;
    while ((objectMatch = OBJECT_REGEX.exec(groupBody)) !== null) {
      const OBJECT_ATTRS = objectMatch[1];
      const GID_MATCH = OBJECT_ATTRS.match(/\bgid="([^"]*)"/);
      OBJECTS.push({
        id: Number(OBJECT_ATTRS.match(/\bid="([^"]*)"/)[1]),
        x: Number(OBJECT_ATTRS.match(/\bx="([^"]*)"/)[1]),
        y: Number(OBJECT_ATTRS.match(/\by="([^"]*)"/)[1]),
        width: Number((OBJECT_ATTRS.match(/\bwidth="([^"]*)"/) || [, 0])[1]),
        height: Number((OBJECT_ATTRS.match(/\bheight="([^"]*)"/) || [, 0])[1]),
        gid: GID_MATCH ? Number(GID_MATCH[1]) : undefined,
      });
    }

    GROUPS.push({
      id: ID,
      name: NAME,
      type: 'objectgroup',
      x: 0,
      y: 0,
      visible: true,
      opacity: 1,
      objects: OBJECTS,
    });
  }
  return GROUPS;
}

/**
 * Extracts the firstgid/source of every top-level <tileset> reference in
 * the .tmx, so gid-based tile objects (eg. the decorative bushes/trees in
 * the "Environment" object layer) can be classified back to the tileset
 * they belong to (Overworld vs the standalone tree/bush/thornbush
 * tilesets), since Phaser only auto-renders the tile *layer*, not gid-based
 * objects.
 */
function parseTilesetRefs(xml) {
  const REFS = [];
  const REF_REGEX = /<tileset\s+firstgid="(\d+)"\s+source="([^"]+)"\s*\/>/g;
  let match;
  while ((match = REF_REGEX.exec(xml)) !== null) {
    REFS.push({
      firstgid: Number(match[1]),
      source: match[2],
    });
  }
  return REFS;
}

/**
 * Parses an "image collection" tileset (.tsx with columns="0", one
 * standalone image per tile, eg. tree.tsx/bush.tsx/thornbush.tsx) into its
 * per-tile gid/image/size, so each Tiled-authored decoration object can
 * render with its own actual artwork instead of a single shared texture.
 * @param {string} tsxText
 * @param {number} firstgid - this tileset's firstgid, as declared in the .tmx
 * @return {Array<{gid: number, source: string, width: number, height: number}>}
 */
export function parseDecorationTiles(tsxText, firstgid) {
  const TILES = [];
  const TILE_REGEX = /<tile\s+id="(\d+)">\s*<image\s+source="([^"]+)"\s+width="(\d+)"\s+height="(\d+)"\s*\/>\s*<\/tile>/g;
  let match;
  while ((match = TILE_REGEX.exec(tsxText)) !== null) {
    TILES.push({
      gid: firstgid + Number(match[1]),
      source: match[2],
      width: Number(match[3]),
      height: Number(match[4]),
    });
  }
  return TILES;
}

/**
 * Builds a Tiled-JSON-shaped map object (the shape Phaser's
 * tilemapTiledJSON loader / tilemap cache expects) from the raw .tmx and
 * .tsx XML text.
 * @param {string} tmxText
 * @param {string} tsxText
 * @return {object}
 */
export function parseTiledMap(tmxText, tsxText) {
  const MAP_WIDTH = Number(attr(tmxText, 'map', 'width'));
  const MAP_HEIGHT = Number(attr(tmxText, 'map', 'height'));
  const TILE_WIDTH = Number(attr(tmxText, 'map', 'tilewidth'));
  const TILE_HEIGHT = Number(attr(tmxText, 'map', 'tileheight'));
  const FIRST_GID = Number(attr(tmxText, 'tileset', 'firstgid'));
  const LAYER_ID = Number(attr(tmxText, 'layer', 'id'));
  const LAYER_NAME = attr(tmxText, 'layer', 'name');

  const CSV = tmxText.match(/<data encoding="csv">([\s\S]*?)<\/data>/)[1];
  const TILE_DATA = CSV.split(',').map((value) => Number(value.trim()));

  const TILESET_COLUMNS = Number(attr(tsxText, 'tileset', 'columns'));
  const TILESET_TILECOUNT = Number(attr(tsxText, 'tileset', 'tilecount'));
  const TILESET_NAME = attr(tsxText, 'tileset', 'name');
  const IMAGE_SOURCE = attr(tsxText, 'image', 'source');
  const IMAGE_WIDTH = Number(attr(tsxText, 'image', 'width'));
  const IMAGE_HEIGHT = Number(attr(tsxText, 'image', 'height'));

  return {
    tilesetRefs: parseTilesetRefs(tmxText),
    type: 'map',
    version: '1.10',
    tiledversion: '1.11.2',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tilewidth: TILE_WIDTH,
    tileheight: TILE_HEIGHT,
    infinite: false,
    nextlayerid: 2,
    nextobjectid: 1,
    layers: [
      {
        id: LAYER_ID,
        name: LAYER_NAME,
        type: 'tilelayer',
        x: 0,
        y: 0,
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        visible: true,
        opacity: 1,
        data: TILE_DATA,
      },
      ...parseObjectGroups(tmxText),
    ],
    tilesets: [
      {
        firstgid: FIRST_GID,
        name: TILESET_NAME,
        image: IMAGE_SOURCE,
        imagewidth: IMAGE_WIDTH,
        imageheight: IMAGE_HEIGHT,
        columns: TILESET_COLUMNS,
        tilecount: TILESET_TILECOUNT,
        tilewidth: TILE_WIDTH,
        tileheight: TILE_HEIGHT,
        margin: 0,
        spacing: 0,
      },
    ],
  };
}
