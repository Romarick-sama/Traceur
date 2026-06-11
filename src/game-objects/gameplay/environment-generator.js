import { STYLE_CONFIGURATION } from '../../common/style-config.js';

const CELL_SIZE = 100;
const COLS = Math.floor(STYLE_CONFIGURATION.WIDTH / CELL_SIZE);
const ROWS = Math.floor(STYLE_CONFIGURATION.HEIGHT / CELL_SIZE);

const OBSTACLE_TYPES = ['TREE', 'THORN_BUSH', 'BUSH'];
const BLOCKING_TYPES = ['TREE', 'THORN_BUSH'];

const OBSTACLE_COUNT = 6;
const MIN_HIDE_DISTANCE = 3;
const MAX_ATTEMPTS = 100;

const EXPLANATIONS = {
  FIRST: 'Pars depuis ton point de départ.',
  MIDDLE: 'Avance en évitant les ronces et les buissons.',
  LAST: 'Cache-toi ici, à bonne distance, pour que le chien doive vraiment chercher.',
};

function cellToPixel(
  col,
  row,
) {
  return {
    x: col * CELL_SIZE + CELL_SIZE / 2,
    y: row * CELL_SIZE + CELL_SIZE / 2,
  };
}

function pixelToCell(
  x,
  y,
) {
  return {
    col: Math.floor(x / CELL_SIZE),
    row: Math.floor(y / CELL_SIZE),
  };
}

function cellKey(
  col,
  row,
) {
  return `${col},${row}`;
}

function neighbors(
  col,
  row,
) {
  return [
    [col + 1, row],
    [col - 1, row],
    [col, row + 1],
    [col, row - 1],
  ].filter(([column, rowValue]) => column >= 0 && column < COLS && rowValue >= 0 && rowValue < ROWS);
}

/**
 * BFS from the start cell over non-blocked cells.
 * @return {Map<string, { distance: number, parent: string|null }>}
 */
function breadthFirstSearch(
  startCol,
  startRow,
  blocked,
) {
  const VISITED = new Map();
  VISITED.set(cellKey(
    startCol,
    startRow,
  ), {
    distance: 0,
    parent: null,
  });
  const QUEUE = [[startCol, startRow]];

  while (QUEUE.length > 0) {
    const [col, row] = QUEUE.shift();
    const CURRENT = VISITED.get(cellKey(
      col,
      row,
    ));

    neighbors(col, row).forEach(([neighborCol, neighborRow]) => {
      const KEY = cellKey(
        neighborCol,
        neighborRow,
      );
      if (VISITED.has(KEY) || blocked.has(KEY)) {
        return;
      };

      VISITED.set(KEY, {
        distance: CURRENT.distance + 1,
        parent: cellKey(
          col,
          row,
        ),
      });
      QUEUE.push([neighborCol, neighborRow]);
    });
  };

  return VISITED;
}

/**
 * Returns the reachable cell furthest from the start, used as the hiding spot.
 */
function pickFarthestCell(
  visited,
  startKey,
) {
  let best = null;
  visited.forEach((info, key) => {
    if (key === startKey) {
      return;
    };

    if (!best || info.distance > visited.get(best).distance) {
      best = key;
    };
  });
  return best;
}

/**
 * Reconstructs the path of cell keys from the start to the target cell.
 */
function reconstructPath(
  visited,
  targetKey,
) {
  const PATH = [];
  let key = targetKey;
  while (key) {
    PATH.unshift(key);
    key = visited.get(key).parent;
  };
  return PATH;
}

/**
 * Collapses a path of cells into waypoints, keeping only the start, end and
 * direction-change points.
 */
function simplifyPath(path) {
  const POINTS = path.map((key) => {
    const [col, row] = key.split(',').map(Number);
    return cellToPixel(
      col,
      row,
    );
  });

  if (POINTS.length <= 2) {
    return POINTS;
  };

  const SIMPLIFIED = [POINTS[0]];
  for (let i = 1; i < POINTS.length - 1; i++) {
    const PREV = POINTS[i - 1];
    const CURRENT = POINTS[i];
    const NEXT = POINTS[i + 1];

    const SAME_DIRECTION = Math.sign(CURRENT.x - PREV.x) === Math.sign(NEXT.x - CURRENT.x)
      && Math.sign(CURRENT.y - PREV.y) === Math.sign(NEXT.y - CURRENT.y);

    if (!SAME_DIRECTION) {
      SIMPLIFIED.push(CURRENT);
    };
  };
  SIMPLIFIED.push(POINTS[POINTS.length - 1]);

  return SIMPLIFIED;
}

/**
 * Generates a random environment layout for the level and a guaranteed
 * "ideal" path from the human's spawn to a hiding spot far enough away.
 * Obstacles are placed randomly, then a path is searched for; if none is
 * found (the human would be boxed in), the layout is regenerated.
 * @param {object} levelConfig
 * @return {{
 *   environment: Array<{type: string, x: number, y: number}>,
 *   solution: { waypoints: Array<{x: number, y: number}>, explanations: string[] },
 * }}
 */
export function generateLevel(levelConfig) {
  const START = pixelToCell(
    levelConfig.human.x,
    levelConfig.human.y,
  );
  const START_KEY = cellKey(
    START.col,
    START.row,
  );

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const ENVIRONMENT = [];
    const BLOCKED = new Set([START_KEY]);
    const OCCUPIED = new Set([START_KEY]);

    for (let i = 0; i < OBSTACLE_COUNT; i++) {
      const COL = Phaser.Math.Between(
        0,
        COLS - 1,
      );
      const ROW = Phaser.Math.Between(
        0,
        ROWS - 1,
      );
      const KEY = cellKey(
        COL,
        ROW,
      );

      if (OCCUPIED.has(KEY)) {
        continue;
      };

      const TYPE = Phaser.Utils.Array.GetRandom(OBSTACLE_TYPES);
      const { x, y } = cellToPixel(
        COL,
        ROW,
      );
      ENVIRONMENT.push({
        type: TYPE,
        x,
        y,
      });
      OCCUPIED.add(KEY);

      if (BLOCKING_TYPES.includes(TYPE)) {
        BLOCKED.add(KEY);
      };
    };

    const VISITED = breadthFirstSearch(
      START.col,
      START.row,
      BLOCKED,
    );
    const HIDE_KEY = pickFarthestCell(
      VISITED,
      START_KEY,
    );

    if (!HIDE_KEY || VISITED.get(HIDE_KEY).distance < MIN_HIDE_DISTANCE) {
      continue;
    };

    const PATH = reconstructPath(
      VISITED,
      HIDE_KEY,
    );
    const WAYPOINTS = simplifyPath(PATH);
    const TEXTS = WAYPOINTS.map((_, index) => {
      if (index === 0) {
        return EXPLANATIONS.FIRST;
      };
      if (index === WAYPOINTS.length - 1) {
        return EXPLANATIONS.LAST;
      };
      return EXPLANATIONS.MIDDLE;
    });

    return {
      environment: ENVIRONMENT,
      solution: {
        waypoints: WAYPOINTS,
        explanations: TEXTS,
      },
    };
  };

  return {
    environment: [],
    solution: {
      waypoints: [
        {
          x: levelConfig.human.x,
          y: levelConfig.human.y,
        },
      ],
      explanations: [EXPLANATIONS.FIRST],
    },
  };
}
