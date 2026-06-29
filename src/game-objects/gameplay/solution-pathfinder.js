const CELL_SIZE = 20;

/**
 * Marks every grid cell overlapping an obstacle (inflated by `margin`) as
 * blocked, over a grid covering the whole map.
 * @param {number} mapWidthPx
 * @param {number} mapHeightPx
 * @param {Array<{x: number, y: number, width: number, height: number}>} obstacles
 * @param {number} margin
 * @return {{cols: number, rows: number, blocked: Uint8Array}}
 */
function buildGrid(mapWidthPx, mapHeightPx, obstacles, margin) {
  const COLS = Math.ceil(mapWidthPx / CELL_SIZE);
  const ROWS = Math.ceil(mapHeightPx / CELL_SIZE);
  const BLOCKED = new Uint8Array(COLS * ROWS);

  obstacles.forEach((rect) => {
    const MIN_COL = Math.max(0, Math.floor((rect.x - margin) / CELL_SIZE));
    const MAX_COL = Math.min(COLS - 1, Math.floor((rect.x + rect.width + margin) / CELL_SIZE));
    const MIN_ROW = Math.max(0, Math.floor((rect.y - margin) / CELL_SIZE));
    const MAX_ROW = Math.min(ROWS - 1, Math.floor((rect.y + rect.height + margin) / CELL_SIZE));

    for (let row = MIN_ROW; row <= MAX_ROW; row++) {
      for (let col = MIN_COL; col <= MAX_COL; col++) {
        BLOCKED[row * COLS + col] = 1;
      }
    }
  });

  return {
    cols: COLS,
    rows: ROWS,
    blocked: BLOCKED,
  };
}

/**
 * BFS from `start` to `end` over the obstacle grid. Always returns the
 * best route it found: the exact target if reachable, otherwise the route
 * to whichever visited cell ended up closest to the target - so a route
 * that can't fully reach the target never degrades into a straight line
 * cutting through every obstacle in between.
 * @return {{cellPath: Array<number>, cols: number}}
 */
function bfsClosestApproach(start, end, cols, rows, blocked) {
  const cellIndex = (col, row) => row * cols + col;
  const toCell = (point) => ({
    col: Phaser.Math.Clamp(Math.floor(point.x / CELL_SIZE), 0, cols - 1),
    row: Phaser.Math.Clamp(Math.floor(point.y / CELL_SIZE), 0, rows - 1),
  });

  const START_CELL = toCell(start);
  const END_CELL = toCell(end);

  const VISITED = new Uint8Array(cols * rows);
  const PREV = new Int32Array(cols * rows).fill(-1);
  const QUEUE = [START_CELL];
  VISITED[cellIndex(START_CELL.col, START_CELL.row)] = 1;

  const DIRECTIONS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  let bestIdx = cellIndex(START_CELL.col, START_CELL.row);
  let bestDistance = Math.hypot(START_CELL.col - END_CELL.col, START_CELL.row - END_CELL.row);
  let found = false;

  while (QUEUE.length > 0) {
    const CURRENT = QUEUE.shift();
    const CURRENT_IDX = cellIndex(CURRENT.col, CURRENT.row);

    const DISTANCE_TO_END = Math.hypot(CURRENT.col - END_CELL.col, CURRENT.row - END_CELL.row);
    if (DISTANCE_TO_END < bestDistance) {
      bestDistance = DISTANCE_TO_END;
      bestIdx = CURRENT_IDX;
    };

    if (CURRENT.col === END_CELL.col && CURRENT.row === END_CELL.row) {
      found = true;
      break;
    };

    DIRECTIONS.forEach(([deltaCol, deltaRow]) => {
      const NEXT_COL = CURRENT.col + deltaCol;
      const NEXT_ROW = CURRENT.row + deltaRow;
      if (NEXT_COL < 0 || NEXT_COL >= cols || NEXT_ROW < 0 || NEXT_ROW >= rows) {
        return;
      };

      const IDX = cellIndex(NEXT_COL, NEXT_ROW);
      if (VISITED[IDX] || blocked[IDX]) {
        return;
      };

      VISITED[IDX] = 1;
      PREV[IDX] = CURRENT_IDX;
      QUEUE.push({
        col: NEXT_COL,
        row: NEXT_ROW,
      });
    });
  }

  const TARGET_IDX = found ? cellIndex(END_CELL.col, END_CELL.row) : bestIdx;
  const CELL_PATH = [];
  let cursor = TARGET_IDX;
  while (cursor !== -1) {
    CELL_PATH.push(cursor);
    cursor = PREV[cursor];
  }
  CELL_PATH.reverse();

  return {
    cellPath: CELL_PATH,
    reachedEnd: found,
  };
}

/**
 * Simplifies a cell path down to its corner waypoints only, so the result
 * stays purely axis-aligned between consecutive waypoints (same
 * convention as the rest of the solution-trace rendering).
 * @param {Array<number>} cellPath
 * @param {number} cols
 * @param {{x: number, y: number}} start
 * @param {{x: number, y: number}} end
 * @return {Array<{x: number, y: number}>}
 */
function simplifyToWaypoints(cellPath, cols, start, end, reachedEnd) {
  const PIXELS = cellPath.map((idx) => ({
    x: (idx % cols) * CELL_SIZE + CELL_SIZE / 2,
    y: Math.floor(idx / cols) * CELL_SIZE + CELL_SIZE / 2,
  }));

  const WAYPOINTS = [start];
  for (let i = 1; i < PIXELS.length - 1; i++) {
    const PREVIOUS = PIXELS[i - 1];
    const CURRENT = PIXELS[i];
    const NEXT = PIXELS[i + 1];
    const DIRECTION_IN = `${Math.sign(CURRENT.x - PREVIOUS.x)},${Math.sign(CURRENT.y - PREVIOUS.y)}`;
    const DIRECTION_OUT = `${Math.sign(NEXT.x - CURRENT.x)},${Math.sign(NEXT.y - CURRENT.y)}`;
    if (DIRECTION_IN !== DIRECTION_OUT) {
      WAYPOINTS.push(CURRENT);
    };
  }
  if (PIXELS.length > 0) {
    WAYPOINTS.push(PIXELS[PIXELS.length - 1]);
  };
  if (reachedEnd) {
    WAYPOINTS.push(end);
  };

  return WAYPOINTS;
}

/**
 * Finds a 4-directional, obstacle-avoiding route between two global points
 * (BFS over a grid covering the whole map). Retries with a shrinking
 * safety margin if the full margin pinches off every route, and as a last
 * resort returns the route to the closest reachable approach point rather
 * than ever drawing a straight line through the obstacles in between.
 * @param {{x: number, y: number}} start
 * @param {{x: number, y: number}} end
 * @param {Array<{x: number, y: number, width: number, height: number}>} obstacles - top-left rects, global px
 * @param {number} mapWidthPx
 * @param {number} mapHeightPx
 * @param {number} [margin=12] - safety margin added around each obstacle, in px
 * @return {Array<{x: number, y: number}>}
 */
export function findAvoidingPath(
  start,
  end,
  obstacles,
  mapWidthPx,
  mapHeightPx,
  margin = 12,
) {
  const MARGINS_TO_TRY = [margin, Math.min(margin, 4), 0];

  let bestResult = null;
  for (let i = 0; i < MARGINS_TO_TRY.length; i++) {
    const { cols: COLS, rows: ROWS, blocked: BLOCKED } = buildGrid(
      mapWidthPx,
      mapHeightPx,
      obstacles,
      MARGINS_TO_TRY[i],
    );
    const RESULT = bfsClosestApproach(start, end, COLS, ROWS, BLOCKED);
    bestResult = { ...RESULT, cols: COLS };
    if (RESULT.reachedEnd) {
      break;
    };
  }

  return simplifyToWaypoints(bestResult.cellPath, bestResult.cols, start, end, bestResult.reachedEnd);
}
