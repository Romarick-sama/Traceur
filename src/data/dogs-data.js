/**
 * Selectable dog profiles. `redFlags` lists the situations this dog reacts
 * badly to, as plain labels (used to flavor the coach/correction text and,
 * later, to make a dog's sensitivities affect gameplay difficulty).
 */
export const DOGS_DATA = {
  1: {
    id: 1,
    prenom: 'Nomade',
    age: 5,
    race: 'Croisé berger',
    experience: 'debutant',
    petitChien: false,
    redFlags: [
      'Groupement de 4 buissons et +',
      'Groupement de 3 ronces et +',
      'Demi-tour',
      'Traversé de chemin contaminé',
      'Contamination chien/humain (tracé d\'autres individus, niveau avancé)',
    ],
    clusterThresholds: {
      BUSH: 4,
      THORN_BUSH: 3,
    },
  },
  2: {
    id: 2,
    prenom: 'Azure',
    age: 3,
    race: 'Teckel',
    experience: 'moyen',
    petitChien: true,
    redFlags: [
      'Groupement de 3 buissons et +',
      'Groupement de 2 ronces et +',
      '2 branches au sol et +',
      'Contamination chien',
      'Demi-tour',
    ],
    clusterThresholds: {
      BUSH: 3,
      THORN_BUSH: 2,
    },
  },
};

/**
 * Returns the profile for the given dog id, falling back to dog 1.
 * @param {number} dogId
 * @return {object}
 */
export function getDogProfile(dogId) {
  let dogProfile;
  if (DOGS_DATA[dogId] !== undefined && DOGS_DATA[dogId] !== null) {
    dogProfile = DOGS_DATA[dogId];
  } else {
    dogProfile = DOGS_DATA[1];
  }
  return dogProfile;
}
