const CELL_SIZE = 40;

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
 * Finds a 4-directional, obstacle-avoiding route between two global points
 * (BFS over a coarse grid covering the whole map), then simplifies it down
 * to the corner waypoints only, so the result stays purely axis-aligned
 * between consecutive waypoints (same convention as the rest of the
 * solution-trace rendering).
 * @param {{x: number, y: number}} start
 * @param {{x: number, y: number}} end
 * @param {Array<{x: number, y: number, width: number, height: number}>} obstacles - top-left rects, global px
 * @param {number} mapWidthPx
 * @param {number} mapHeightPx
 * @param {number} [margin=24] - safety margin added around each obstacle, in px
 * @return {Array<{x: number, y: number}>}
 */
export function findAvoidingPath(
  start,
  end,
  obstacles,
  mapWidthPx,
  mapHeightPx,
  margin = 24,
) {
  const { cols: COLS, rows: ROWS, blocked: BLOCKED } = buildGrid(
    mapWidthPx,
    mapHeightPx,
    obstacles,
    margin,
  );

  const toCell = (point) => ({
    col: Phaser.Math.Clamp(Math.floor(point.x / CELL_SIZE), 0, COLS - 1),
    row: Phaser.Math.Clamp(Math.floor(point.y / CELL_SIZE), 0, ROWS - 1),
  });
  const cellIndex = (col, row) => row * COLS + col;

  const START_CELL = toCell(start);
  const END_CELL = toCell(end);

  const VISITED = new Uint8Array(COLS * ROWS);
  const PREV = new Int32Array(COLS * ROWS).fill(-1);
  const QUEUE = [START_CELL];
  VISITED[cellIndex(START_CELL.col, START_CELL.row)] = 1;

  const DIRECTIONS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  let found = false;

  while (QUEUE.length > 0) {
    const CURRENT = QUEUE.shift();
    if (CURRENT.col === END_CELL.col && CURRENT.row === END_CELL.row) {
      found = true;
      break;
    };

    DIRECTIONS.forEach(([deltaCol, deltaRow]) => {
      const NEXT_COL = CURRENT.col + deltaCol;
      const NEXT_ROW = CURRENT.row + deltaRow;
      if (NEXT_COL < 0 || NEXT_COL >= COLS || NEXT_ROW < 0 || NEXT_ROW >= ROWS) {
        return;
      };

      const IDX = cellIndex(NEXT_COL, NEXT_ROW);
      if (VISITED[IDX] || BLOCKED[IDX]) {
        return;
      };

      VISITED[IDX] = 1;
      PREV[IDX] = cellIndex(CURRENT.col, CURRENT.row);
      QUEUE.push({
        col: NEXT_COL,
        row: NEXT_ROW,
      });
    });
  }

  if (!found) {
    return [start, end];
  };

  const CELL_PATH = [];
  let cursor = cellIndex(END_CELL.col, END_CELL.row);
  while (cursor !== -1) {
    CELL_PATH.push(cursor);
    cursor = PREV[cursor];
  }
  CELL_PATH.reverse();

  const PIXELS = CELL_PATH.map((idx) => ({
    x: (idx % COLS) * CELL_SIZE + CELL_SIZE / 2,
    y: Math.floor(idx / COLS) * CELL_SIZE + CELL_SIZE / 2,
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
  WAYPOINTS.push(end);

  return WAYPOINTS;
}
