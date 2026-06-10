/**
 * Clés des textures Phaser, à utiliser partout au lieu de chaînes en dur.
 */
export const ASSET_KEYS = {
  HUMAN: 'human',
  DOG: 'dog',
};

/**
 * Liste des sprites à charger au PreloadScene.
 * Pour ajouter un sprite : ajouter une entrée { key, path } ici (et la clé correspondante ci-dessus).
 */
export const SPRITE_ASSETS = [
  { key: ASSET_KEYS.HUMAN, path: 'assets/images/human.png' },
  { key: ASSET_KEYS.DOG, path: 'assets/images/dog.png' },
];
