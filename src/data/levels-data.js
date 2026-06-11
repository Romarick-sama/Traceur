/**
 * Per-level configuration: starting positions, environment layout, the
 * minimum trace length expected, and the ideal "solution" trace shown
 * during the correction.
 */
export const LEVELS_DATA = {
  1: {
    human: { x: 400, y: 300 },
    dog: { x: 560, y: 300, prenom: 'Nomade' },
    environment: [
      { type: 'BUSH', x: 240, y: 300 },
      { type: 'THORN_BUSH', x: 560, y: 140 },
      { type: 'TREE', x: 240, y: 140 },
    ],
    targetDistance: 300,
    solution: {
      waypoints: [
        { x: 400, y: 300 },
        { x: 400, y: 460 },
        { x: 600, y: 460 },
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
  return LEVELS_DATA[levelNumber] ?? LEVELS_DATA[1];
}
