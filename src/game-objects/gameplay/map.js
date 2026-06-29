import { STYLE_CONFIGURATION } from '../../common/style-config.js';

/**
 * Dungeon-like static level: a fixed grid of screen-sized "rooms" (no
 * camera scroll/follow, screens swap with a flash cut), holding the
 * level's fixed environment, no randomness.
 */
export const ROOM_WIDTH = STYLE_CONFIGURATION.WIDTH;
export const ROOM_HEIGHT = STYLE_CONFIGURATION.HEIGHT;
export const MAP_COLS = 3;
export const MAP_ROWS = 5;
export const PIXELS_PER_METER = 5;

/**
 * The globalToRoom function converts global coordinates to room coordinates within a grid-based map.
 * @param x - The `x` parameter represents the global x-coordinate of a point in a game world. This
 * function `globalToRoom` is used to convert global coordinates to room coordinates based on the room
 * width and height.
 * @param y - The `y` parameter represents the vertical position in the global coordinate system.
 * @returns The function `globalToRoom` returns an object with two properties: `col` and `row`, which
 * represent the column and row of a given global position `(x, y)` within a room grid.
 */
export function globalToRoom(
  x,
  y,
) {
  const COL = Phaser.Math.Clamp(
    Math.floor(x / ROOM_WIDTH),
    0,
    MAP_COLS - 1,
  );
  const ROW = Phaser.Math.Clamp(
    Math.floor(y / ROOM_HEIGHT),
    0,
    MAP_ROWS - 1,
  );
  return {
    col: COL,
    row: ROW,
  };
}

/**
 * The globalToLocal function converts global coordinates to local coordinates within a room.
 * @param x - The `x` parameter in the `globalToLocal` function represents the global x-coordinate that
 * you want to convert to a local x-coordinate within a specific room.
 * @param y - The `y` parameter in the `globalToLocal` function represents the vertical position of a
 * point in a global coordinate system. This function is used to convert global coordinates to local
 * coordinates within a specific room.
 * @returns The `globalToLocal` function returns an object with the properties `x` and `y`, which
 * represent the coordinates converted from global coordinates to local coordinates within a room. The
 * `x` and `y` values are calculated by subtracting the column and row offsets of the room multiplied
 * by the room width and height, respectively.
 */
export function globalToLocal(
  x,
  y,
) {
  const ROOM = globalToRoom(
    x,
    y,
  );
  return {
    x: x - ROOM.col * ROOM_WIDTH,
    y: y - ROOM.row * ROOM_HEIGHT,
  };
}

/**
 * The `roomKey` function takes in a column and row value and returns a string concatenating both
 * values separated by a comma.
 * @param col - Column number of the room
 * @param row - The `row` parameter in the `roomKey` function represents the row number of a room in a
 * grid or matrix.
 * @returns The `roomKey` function returns a string that concatenates the `col` and `row` parameters
 * separated by a comma.
 */
function roomKey(
  col,
  row,
) {
  return `${col},${row}`;
}

/**
 * The function `getRoomEnvironment` retrieves the environment data for a specific room in a map based
 * on its column and row coordinates.
 * @param mapData - Map data containing information about the rooms in the environment.
 * @param col - The `col` parameter represents the column index of a specific location in a map grid.
 * @param row - The `row` parameter in the `getRoomEnvironment` function represents the row index of a
 * specific location in a map.
 * @returns The function `getRoomEnvironment` returns the room environment data for the specified
 * column and row from the `mapData`. If the room data is found in the `mapData`, it returns the
 * environment data for that room. Otherwise, it returns an empty array `[]`.
 */
export function getRoomEnvironment(
  mapData,
  col,
  row,
) {
  return mapData.rooms.get(roomKey(
    col,
    row,
  )) || [];
}

/**
 * Filters the map's "collision" object layer (hitboxes drawn by hand in
 * Tiled, in global pixel coordinates) down to the rectangles overlapping
 * the given room, converted to that room's local coordinates.
 * @param {Array<{x: number, y: number, width: number, height: number}>} collisionObjects
 * @param {number} col
 * @param {number} row
 * @return {Array<{x: number, y: number, width: number, height: number}>}
 */
export function getRoomCollisionRects(
  collisionObjects,
  col,
  row,
) {
  const ROOM_LEFT = col * ROOM_WIDTH;
  const ROOM_TOP = row * ROOM_HEIGHT;
  const ROOM_RIGHT = ROOM_LEFT + ROOM_WIDTH;
  const ROOM_BOTTOM = ROOM_TOP + ROOM_HEIGHT;

  return collisionObjects
    .filter((object) => object.x < ROOM_RIGHT
      && object.x + object.width > ROOM_LEFT
      && object.y < ROOM_BOTTOM
      && object.y + object.height > ROOM_TOP)
    .map((object) => ({
      x: object.x - ROOM_LEFT,
      y: object.y - ROOM_TOP,
      width: object.width,
      height: object.height,
    }));
}

/**
 * Builds the static mapData for a level: a fixed grid of dungeon rooms,
 * with the level's fixed environment placed in the starting room only
 * (every other room is just the bare tilemap), no randomness.
 * @param levelConfig
 * @return {{startRoom: {col: number, row: number}, startLocal: {x: number, y: number}, rooms: Map<string, Array>}}
 */
export function buildMapData(levelConfig) {
  const START_ROOM = {
    col: 1,
    row: MAP_ROWS - 1,
  };

  return {
    startRoom: START_ROOM,
    startLocal: {
      x: levelConfig.human.x,
      y: levelConfig.human.y,
    },
    rooms: new Map([[roomKey(START_ROOM.col, START_ROOM.row), levelConfig.environment || []]]),
  };
}
