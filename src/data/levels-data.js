/**
 * Per-level configuration: starting positions, environment layout, the
 * minimum trace length expected, and the ideal "solution" trace shown
 * during the correction.
 */
export const LEVELS_DATA = {
  1: {
    human: {
      x: 400,
      y: 350,
    },
    dog: {
      x: 560,
      y: 300,
      prenom: 'Nomade',
    },
    environment: [],
    targetDistance: 300,
    solution: {
      waypoints: [
        {
          x: 400,
          y: 300,
        },
        {
          x: 400,
          y: 460,
        },
        {
          x: 600,
          y: 460,
        },
      ],
      explanations: [
        'Pars depuis ton point de départ.',
        "Avance tout droit, en évitant le plus possible les obstacles.",
        'Cache-toi ici, à bonne distance, pour que le chien doive vraiment chercher.',
      ],
    },
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
