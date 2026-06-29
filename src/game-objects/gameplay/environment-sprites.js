import { ROOM_WIDTH, ROOM_HEIGHT } from './map.js';

/**
 * Finds which tileset reference (Overworld vs the standalone
 * tree/bush/thornbush tilesets) a tile object's gid belongs to, based on
 * the highest firstgid not exceeding the gid.
 * @param {Array<{firstgid: number, source: string}>} tilesetRefs
 * @param {number} gid
 * @return {{firstgid: number, source: string}|undefined}
 */
export function getTilesetRefForGid(tilesetRefs, gid) {
  return [...tilesetRefs]
    .sort((a, b) => b.firstgid - a.firstgid)
    .find((ref) => gid >= ref.firstgid);
}

/**
 * Builds the decorative sprites for the given room from the Tiled
 * "WorldBorder"/"Environment" gid-based tile objects, which Phaser doesn't
 * auto-render (only the base tile layer is rendered automatically).
 * WorldBorder renders below Environment but above the base tile layer.
 * Overworld-tileset gids go through Phaser's own tileset frame slicing;
 * gids from the standalone tree/bush/thornbush tilesets fall back to their
 * single already-loaded sprite texture. Shared between MapScene,
 * CorrectionScene and SolutionScene so all three render the same decor.
 * @param {Phaser.Scene} scene
 * @param {{col: number, row: number}} room
 * @param {object} context
 * @param {Phaser.Tilemaps.Tilemap} context.tilemap
 * @param {Array<Phaser.Tilemaps.ObjectLayer>} context.gidObjectLayers
 * @param {Array<{firstgid: number, source: string}>} context.tilesetRefs
 * @param {object} context.decorationTilesByGid
 * @return {Array<Phaser.GameObjects.Image>}
 */
export function buildRoomEnvironmentSprites(scene, room, {
  tilemap,
  gidObjectLayers,
  tilesetRefs,
  decorationTilesByGid,
}) {
  const SPRITES = [];

  const ROOM_LEFT = room.col * ROOM_WIDTH;
  const ROOM_TOP = room.row * ROOM_HEIGHT;
  const ROOM_RIGHT = ROOM_LEFT + ROOM_WIDTH;
  const ROOM_BOTTOM = ROOM_TOP + ROOM_HEIGHT;

  gidObjectLayers.forEach((layer) => {
    const OVERWORLD_IDS = [];
    const DEPTH = layer.name === 'WorldBorder' ? -0.5 : 0;

    layer.objects.forEach((object) => {
      if (object.gid === undefined) {
        return;
      };

      if (object.x >= ROOM_RIGHT || object.x + object.width <= ROOM_LEFT
        || object.y - object.height >= ROOM_BOTTOM || object.y <= ROOM_TOP) {
        return;
      };

      const REF = getTilesetRefForGid(tilesetRefs, object.gid);
      if (!REF) {
        return;
      };

      if (REF.source === 'Overworld.tsx') {
        OVERWORLD_IDS.push(object.id);
        return;
      };

      const DECORATION_TILE = decorationTilesByGid[object.gid];
      if (!DECORATION_TILE) {
        return;
      };

      const SPRITE = scene.add.image(
        object.x + object.width / 2 - ROOM_LEFT,
        object.y - object.height / 2 - ROOM_TOP,
        DECORATION_TILE.key,
      ).setDisplaySize(object.width, object.height).setDepth(DEPTH);
      SPRITES.push(SPRITE);
    });

    if (OVERWORLD_IDS.length > 0) {
      const OVERWORLD_SPRITES = tilemap.createFromObjects(layer.name, { id: OVERWORLD_IDS });
      OVERWORLD_SPRITES.forEach((sprite) => {
        sprite.setPosition(
          sprite.x - ROOM_LEFT,
          sprite.y - ROOM_TOP,
        );
        sprite.setDepth(DEPTH);
        SPRITES.push(sprite);
      });
    };
  });

  return SPRITES;
}

/**
 * Returns the global, top-left bounding boxes of every gid-based decoration
 * object (in the given object layers) belonging to one of the given
 * tileset sources (eg. ['tree.tsx', 'thornbush.tsx']), across the whole
 * map - used to feed obstacle-avoiding pathfinding for the solution route.
 * @param {Array<Phaser.Tilemaps.ObjectLayer>} gidObjectLayers
 * @param {Array<{firstgid: number, source: string}>} tilesetRefs
 * @param {Array<string>} sources
 * @return {Array<{x: number, y: number, width: number, height: number}>}
 */
export function getObstacleRects(gidObjectLayers, tilesetRefs, sources) {
  const RECTS = [];

  gidObjectLayers.forEach((layer) => {
    layer.objects.forEach((object) => {
      if (object.gid === undefined) {
        return;
      };

      const REF = getTilesetRefForGid(tilesetRefs, object.gid);
      if (!REF || !sources.includes(REF.source)) {
        return;
      };

      RECTS.push({
        x: object.x,
        y: object.y - object.height,
        width: object.width,
        height: object.height,
      });
    });
  });

  return RECTS;
}

/**
 * Reads the tileset-classification data (tilesetRefs/decorationTilesByGid)
 * embedded in the tilemap JSON by the live tmx loader, plus the
 * WorldBorder/Environment object layers from the given tilemap, in the
 * shape `buildRoomEnvironmentSprites` expects.
 * @param {Phaser.Scene} scene
 * @param {Phaser.Tilemaps.Tilemap} tilemap
 * @param {string} tilemapCacheKey
 * @return {{tilesetRefs: Array<object>, decorationTilesByGid: object, gidObjectLayers: Array<object>}}
 */
export function getEnvironmentRenderContext(scene, tilemap, tilemapCacheKey) {
  const TILEMAP_DATA = scene.cache.tilemap.get(tilemapCacheKey).data;

  return {
    tilesetRefs: TILEMAP_DATA.tilesetRefs,
    decorationTilesByGid: TILEMAP_DATA.decorationTilesByGid,
    gidObjectLayers: ['WorldBorder', 'Environment']
      .map((name) => tilemap.getObjectLayer(name))
      .filter(Boolean),
  };
}
