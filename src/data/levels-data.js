/**
 * Per-level configuration: starting positions, environment layout, the
 * minimum trace length expected, and the ideal "solution" trace shown
 * during the correction.
 */
export const LEVELS_DATA = {
  1: {
    human: {
      x: 400,
      y: 400,
    },
    dog: {
      x: 560,
      y: 300,
      prenom: 'Nomade',
    },
    environment: [],
    targetDistance: 300,
    solutions: [
      {
        waypoints: [
          { x: 1200, y: 2800 },
          { x: 400, y: 2800 },
          { x: 400, y: 200 },
        ],
      },
      {
        waypoints: [
          { x: 1200, y: 2800 },
          { x: 1200, y: 200 },
        ],
      },
      {
        waypoints: [
          { x: 1200, y: 2800 },
          { x: 2000, y: 2800 },
          { x: 2000, y: 200 },
        ],
      },
    ],
  },
};

/**
 * Returns the configuration for the given level, falling back to level 1.
 * @param {number} levelNumber
 * @return {object}
 */
export function getLevelConfig(levelNumber) {
  let levelConfig;
  if (LEVELS_DATA[levelNumber] !== undefined && LEVELS_DATA[levelNumber] !== null) {
    levelConfig = LEVELS_DATA[levelNumber];
  } else {
    levelConfig = LEVELS_DATA[1];
  }
  return levelConfig;
}
