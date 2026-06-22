import { STYLE_CONFIGURATION } from '../../common/style-config.js';
import { RED_FLAG_TYPES } from './red-flag.js';

export const CELL_SIZE = 100;
export const ROOM_COLS = STYLE_CONFIGURATION.WIDTH / CELL_SIZE;
export const ROOM_ROWS = STYLE_CONFIGURATION.HEIGHT / CELL_SIZE;
export const ROOM_WIDTH = STYLE_CONFIGURATION.WIDTH;
export const ROOM_HEIGHT = STYLE_CONFIGURATION.HEIGHT;
export const MAP_COLS = 3;
export const MAP_ROWS = 5;

const TOTAL_COLS = ROOM_COLS * MAP_COLS;
const TOTAL_ROWS = ROOM_ROWS * MAP_ROWS;

const BLOCKING_TYPES = ['TREE', 'THORN_BUSH'];
const RED_FLAG_ENVIRONMENT_TYPES = Object.keys(RED_FLAG_TYPES);

const MIN_HIDE_DISTANCE = 15;
const MAX_ATTEMPTS = 100;
const INITIAL_FILL_RATE = 0.22;
const CA_ITERATIONS = 2;
const CA_SURVIVAL_THRESHOLD = 0;
const CA_BIRTH_THRESHOLD = 3;

const EXPLANATIONS = {
  FIRST: 'Pars depuis ton point de départ.',
  MIDDLE: 'Avance en évitant les ronces et les buissons.',
  LAST: 'Cache-toi ici, à bonne distance, pour que le chien doive vraiment chercher.',
};

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
export function roomKey(
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
 * The function cellToPixel converts cell coordinates to pixel coordinates by centering them within
 * each cell.
 * @param col - The `col` parameter represents the column index of a cell in a grid.
 * @param row - The `row` parameter in the `cellToPixel` function represents the row index of a cell in
 * a grid. It is used to calculate the y-coordinate of the center of the cell in pixel units.
 * @returns An object with properties `x` and `y` representing the pixel coordinates of the center of a
 * cell in a grid, calculated based on the input column (`col`) and row (`row`) values.
 */
function cellToPixel(
  col,
  row,
) {
  return {
    x: col * CELL_SIZE + CELL_SIZE / 2,
    y: row * CELL_SIZE + CELL_SIZE / 2,
  };
}

/**
 * The pixelToCell function converts pixel coordinates to cell coordinates based on a specified cell
 * size.
 * @param x - The `x` parameter in the `pixelToCell` function represents the x-coordinate of a pixel on
 * a screen or canvas.
 * @param y - The `y` parameter in the `pixelToCell` function represents the vertical position of a
 * pixel on the screen. It is used to calculate the row of the cell that the pixel belongs to when
 * converting pixel coordinates to cell coordinates.
 * @returns The function `pixelToCell` returns an object with two properties: `col` and `row`, which
 * represent the column and row of a cell based on the given pixel coordinates `x` and `y`. The `col`
 * property is calculated by dividing the x-coordinate by the `CELL_SIZE` and flooring the result,
 * while the `row` property is calculated by dividing the y-coordinate by
 */
function pixelToCell(
  x,
  y,
) {
  return {
    col: Math.floor(x / CELL_SIZE),
    row: Math.floor(y / CELL_SIZE),
  };
}

/**
 * The `cellKey` function takes in a column and row number and returns a string combining them with a
 * comma.
 * @param col - Column number of the cell
 * @param row - The `row` parameter in the `cellKey` function represents the row number of a cell in a
 * table or grid. It is used to uniquely identify a cell within the table/grid by its position along
 * the vertical axis.
 * @returns The `cellKey` function returns a string that concatenates the `col` and `row` parameters
 * separated by a comma.
 */
function cellKey(
  col,
  row,
) {
  return `${col},${row}`;
}

/**
 * The `neighbors` function in JavaScript returns an array of neighboring cell coordinates based on the
 * input column and row values within specified boundaries.
 * @param col - The `col` parameter represents the column index of a cell in a grid.
 * @param row - The `row` parameter in the `neighbors` function represents the current row position in
 * a grid. The function calculates and returns an array of neighboring cell positions based on the
 * given `col` and `row` parameters.
 * @returns The `neighbors` function returns an array of neighboring cell coordinates based on the
 * input `col` and `row` values. The function filters out any coordinates that are outside the bounds
 * defined by `TOTAL_COLS` and `TOTAL_ROWS`.
 */
function neighbors(
  col,
  row,
) {
  return [
    [col + 1, row],
    [col - 1, row],
    [col, row + 1],
    [col, row - 1],
  ].filter(([column, rowValue]) => column >= 0 && column < TOTAL_COLS && rowValue >= 0 && rowValue < TOTAL_ROWS);
}

/**
 * The function `breadthFirstSearch` performs a breadth-first search algorithm starting from a
 * specified cell while considering blocked cells.
 * @param startCol - The `startCol` parameter in the `breadthFirstSearch` function represents the
 * starting column index for the search algorithm. This is the column index from which the search will
 * begin exploring neighboring cells.
 * @param startRow - The `startRow` parameter in the `breadthFirstSearch` function represents the
 * starting row index from where the breadth-first search algorithm will begin traversing the grid. It
 * is used to specify the row coordinate of the starting cell for the search algorithm to start
 * exploring neighboring cells.
 * @param blocked - The `blocked` parameter in the `breadthFirstSearch` function is a set that contains
 * the coordinates of cells that are blocked or inaccessible in the grid. These blocked cells are
 * locations that cannot be visited during the breadth-first search traversal.
 * @returns The function `breadthFirstSearch` returns a Map containing information about visited cells
 * during the breadth-first search traversal. Each key in the Map represents a cell in the grid, and
 * the corresponding value is an object with properties `distance` (distance from the starting cell)
 * and `parent` (key of the parent cell in the traversal path).
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
 * The function `pickFarthestCell` selects the cell with the farthest distance from a starting cell in
 * a grid based on the information stored in a Map data structure.
 * @param visited - Visited is a Map data structure that contains information about each cell in a
 * grid. The keys in the map represent the cell coordinates, and the values are objects containing
 * information about the cell, such as its distance from a starting cell.
 * @param startKey - The `startKey` parameter is the key representing the starting cell from which you
 * want to find the farthest cell in the `visited` map.
 * @returns The function `pickFarthestCell` returns the key of the cell that is farthest away from the
 * `startKey` in the `visited` map.
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
 * The function `reconstructPath` reconstructs a path by tracing back from a target key using a map of
 * visited nodes with parent references.
 * @param visited - Visited is a map data structure that stores information about visited nodes during
 * a traversal. Each key in the map represents a node, and the corresponding value is an object
 * containing information about the node's parent node and possibly other properties.
 * @param targetKey - The `targetKey` parameter is the key of the node that you are trying to reach or
 * reconstruct the path to in a graph traversal algorithm.
 * @returns The function `reconstructPath` returns an array representing the path from the starting
 * node to the target node.
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
 * The `simplifyPath` function takes an array of points, removes intermediate points that do not change
 * direction, and returns a simplified path.
 * @param path - It seems like the code snippet you provided is a function named `simplifyPath` that
 * takes a `path` as input and processes it to simplify the path based on certain conditions. However,
 * the `path` variable is not defined in the code snippet you provided. Could you please provide the
 * definition
 * @returns The function `simplifyPath` returns an array of points that represent a simplified version
 * of the input path.
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
 * Fills the grid randomly then smooths it with a cellular automaton to
 * produce natural-looking obstacle clusters instead of uniform noise.
 * Cells with fewer neighbors than CA_SURVIVAL_THRESHOLD are pruned;
 * empty cells with enough filled neighbors grow to fill in gaps.
 * @param {string} startKey - cell key that must remain free
 * @return {Set<string>} set of obstacle cell keys
 */
function generateClusteredGrid(startKey) {
  const grid = new Set();

  for (let col = 0; col < TOTAL_COLS; col++) {
    for (let row = 0; row < TOTAL_ROWS; row++) {
      const key = cellKey(col, row);
      if (key === startKey) {
        continue;
      }
      if (Math.random() < INITIAL_FILL_RATE) {
        grid.add(key);
      }
    }
  }

  for (let iteration = 0; iteration < CA_ITERATIONS; iteration++) {
    const nextGrid = new Set();

    for (let col = 0; col < TOTAL_COLS; col++) {
      for (let row = 0; row < TOTAL_ROWS; row++) {
        const key = cellKey(col, row);
        if (key === startKey) {
          continue;
        }

        const neighborObstacleCount = neighbors(col, row).filter(([neighborCol, neighborRow]) => {
          return grid.has(cellKey(neighborCol, neighborRow));
        }).length;

        if (grid.has(key)) {
          if (neighborObstacleCount >= CA_SURVIVAL_THRESHOLD) {
            nextGrid.add(key);
          }
        } else {
          if (neighborObstacleCount >= CA_BIRTH_THRESHOLD) {
            nextGrid.add(key);
          }
        }
      }
    }

    grid.clear();
    nextGrid.forEach((key) => {
      grid.add(key);
    });
  }

  return grid;
}

/**
 * Converts a set of obstacle cell keys into typed obstacle objects.
 * Type is determined by how many obstacle neighbors each cell has:
 * dense cluster centers become TREE, cluster edges become THORN_BUSH,
 * isolated cells become BUSH (traversable, not blocking).
 * @param {Set<string>} grid
 * @return {{ obstacles: Array, blocked: Set<string> }}
 */
function assignObstacleTypes(grid) {
  const obstacles = [];
  const blocked = new Set();

  grid.forEach((key) => {
    const [col, row] = key.split(',').map(Number);

    const neighborObstacleCount = neighbors(col, row).filter(([neighborCol, neighborRow]) => {
      return grid.has(cellKey(neighborCol, neighborRow));
    }).length;

    let type;
    if (neighborObstacleCount >= 3) {
      type = 'TREE';
    } else if (neighborObstacleCount >= 1) {
      type = 'THORN_BUSH';
    } else {
      type = 'BUSH';
    }

    obstacles.push({
      col,
      row,
      type,
    });

    if (BLOCKING_TYPES.includes(type)) {
      blocked.add(key);
    }
  });

  return {
    obstacles,
    blocked,
  };
}

/**
 * The function `generateMap` creates a game map with obstacles and a hidden location, along with a
 * solution path for a game level.
 * @param levelConfig - levelConfig is an object containing configuration data for the level, such as
 * the position of the human player (levelConfig.human.x and levelConfig.human.y). This data is used to
 * generate the game map with obstacles and a path for the player to follow. The function generates a
 * map with a
 * @returns The `generateMap` function returns an object that contains information about the generated
 * map. The returned object includes the following properties:
 */
export function generateMap(levelConfig) {
  const START_ROOM = {
    col: 1,
    row: MAP_ROWS - 1,
  };
  const START_LOCAL = {
    x: levelConfig.human.x,
    y: levelConfig.human.y,
  };
  const START_COL = START_ROOM.col * ROOM_COLS + pixelToCell(
    START_LOCAL.x,
    START_LOCAL.y,
  ).col;
  const START_ROW = START_ROOM.row * ROOM_ROWS + pixelToCell(
    START_LOCAL.x,
    START_LOCAL.y,
  ).row;
  const START_KEY = cellKey(
    START_COL,
    START_ROW,
  );

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const clusteredGrid = generateClusteredGrid(START_KEY);
    const OBSTACLES = assignObstacleTypes(clusteredGrid);

    if (Math.random() < RED_FLAG_PATTERN_CHANCE) {
      growClusterToTarget(
        OBSTACLES,
        clusteredGrid,
        'BUSH',
        BUSH_CLUSTER_TARGET,
        START_KEY,
      );
    };
    if (Math.random() < RED_FLAG_PATTERN_CHANCE) {
      growClusterToTarget(
        OBSTACLES,
        clusteredGrid,
        'THORN_BUSH',
        THORN_BUSH_CLUSTER_TARGET,
        START_KEY,
      );
    };

    const BLOCKED = new Set([START_KEY]);
    OBSTACLES.forEach(({ col, row, type }) => {
      if (BLOCKING_TYPES.includes(type)) {
        BLOCKED.add(cellKey(col, row));
      };
    });

    // The ideal/solution path must also dodge red-flag-triggering cells
    // (eg. BUSH) even though the player can physically walk through them.
    const AVOIDED_FOR_SOLUTION = new Set(BLOCKED);
    OBSTACLES.forEach(({ col, row, type }) => {
      if (RED_FLAG_ENVIRONMENT_TYPES.includes(type)) {
        AVOIDED_FOR_SOLUTION.add(cellKey(col, row));
      };
    });

    const VISITED = breadthFirstSearch(
      START_COL,
      START_ROW,
      AVOIDED_FOR_SOLUTION,
    );
    const HIDE_KEY = pickFarthestCell(
      VISITED,
      START_KEY,
    );

    if (!HIDE_KEY || VISITED.get(HIDE_KEY).distance < MIN_HIDE_DISTANCE) {
      continue;
    };

    const [HIDE_COL, HIDE_ROW] = HIDE_KEY.split(',').map(Number);
    const HIDE_ROOM = {
      col: Math.floor(HIDE_COL / ROOM_COLS),
      row: Math.floor(HIDE_ROW / ROOM_ROWS),
    };

    const PATH = reconstructPath(
      VISITED,
      HIDE_KEY,
    );
    const WAYPOINTS = simplifyPath(PATH);
    const EXPLANATION_TEXTS = WAYPOINTS.map((_, index) => {
      if (index === 0) {
        return EXPLANATIONS.FIRST;
      };
      if (index === WAYPOINTS.length - 1) {
        return EXPLANATIONS.LAST;
      };
      return EXPLANATIONS.MIDDLE;
    });

    const ROOMS = new Map();
    OBSTACLES.forEach(({
      col,
      row,
      type,
    }) => {
      const ROOM_COL = Math.floor(col / ROOM_COLS);
      const ROOM_ROW = Math.floor(row / ROOM_ROWS);
      const LOCAL = cellToPixel(
        col % ROOM_COLS,
        row % ROOM_ROWS,
      );
      const KEY = roomKey(
        ROOM_COL,
        ROOM_ROW,
      );

      if (!ROOMS.has(KEY)) {
        ROOMS.set(KEY, []);
      };
      ROOMS.get(KEY).push({
        type,
        x: LOCAL.x,
        y: LOCAL.y,
      });
    });

    return {
      startRoom: START_ROOM,
      startLocal: START_LOCAL,
      hideRoom: HIDE_ROOM,
      rooms: ROOMS,
      solution: {
        waypoints: WAYPOINTS,
        explanations: EXPLANATION_TEXTS,
      },
    };
  };

  return {
    startRoom: START_ROOM,
    startLocal: START_LOCAL,
    hideRoom: START_ROOM,
    rooms: new Map(),
    solution: {
      waypoints: [
        {
          x: START_COL * CELL_SIZE + CELL_SIZE / 2,
          y: START_ROW * CELL_SIZE + CELL_SIZE / 2,
        },
      ],
      explanations: [EXPLANATIONS.FIRST],
    },
  };
}
