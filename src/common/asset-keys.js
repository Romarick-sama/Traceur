/**
 * Clés des textures Phaser, à utiliser partout au lieu de chaînes en dur.
 */
export const ASSET_KEYS = {
  HUMAN: 'human',
  DOG: 'dog',
  BUSH: 'bush',
  TREE: 'tree',
  THORN_BUSH: 'thorn_bush',
};

/**
 * Liste des sprites à charger au PreloadScene.
 * Pour ajouter un sprite : ajouter une entrée { key, path } ici (et la clé correspondante ci-dessus).
 */
export const SPRITE_ASSETS = [
  { key: ASSET_KEYS.HUMAN, path: 'public/assets/images/human.png' },
  { key: ASSET_KEYS.DOG, path: 'public/assets/images/dog.png' },
  { key: ASSET_KEYS.BUSH, path: 'public/assets/images/environment/vegetation/bush.png' },
  { key: ASSET_KEYS.TREE, path: 'public/assets/images/environment/vegetation/tree.png' },
  { key: ASSET_KEYS.THORN_BUSH, path: 'public/assets/images/environment/vegetation/thorn_bush.png' },
];
