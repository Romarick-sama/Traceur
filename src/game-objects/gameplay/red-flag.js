/**
 * Red flags: environment types (or actions) that, if encountered on the
 * player's trace, prevent the dog from completing the track. Keyed by the
 * environment layout type (see ENVIRONMENT_CLASSES in level.js).
 */
export const RED_FLAG_TYPES = {
  BUSH: {
    id: 'BUSH',
    message: 'Le tracé passe à travers un buisson, le chien risque de s\'y agiter.',
  },
  THORN_BUSH: {
    id: 'THORN_BUSH',
    message: 'Le tracé passe à travers des ronces, le chien risque de s\'y faire mal.',
  },
  RIVER: {
    id: 'RIVER',
    message: 'Le tracé passe à travers une rivière, le chien risque de s\'agiter.',
  },
};

/**
 * Returns the red flags triggered by the given set of objects the human
 * has collided with (or passed through) during the level.
 * @param {Iterable<{type?: string}>} collidedObjects
 * @return {Array<{id: string, message: string}>}
 */
export function getRedFlags(collidedObjects) {
  const FLAGS = [];
  for (const OBJECT of collidedObjects) {
    const FLAG = RED_FLAG_TYPES[OBJECT.type];
    if (FLAG && !FLAGS.includes(FLAG)) {
      FLAGS.push(FLAG);
    };
  };
  return FLAGS;
}
