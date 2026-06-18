/**
 * Phaser texture keys, use everywhere instead of hardcoded strings.
 */
export const ASSET_KEYS = {
  HUMAN: 'human',
  DOG: 'dog',
  BUSH: 'bush',
  TREE: 'tree',
  THORN_BUSH: 'thorn_bush',
  COACH_PORTRAIT: 'coach_portrait',
  COACH_TEXT_BG: 'coach_text_bg',
};

/**
 * List of sprites to load in PreloadScene.
 * To add a sprite: add an entry { key, path } here (and matching key above).
 */
export const SPRITE_ASSETS = [
  { key: ASSET_KEYS.HUMAN, path: 'public/assets/images/human.png' },
  { key: ASSET_KEYS.DOG, path: 'public/assets/images/dog.png' },
  { key: ASSET_KEYS.BUSH, path: 'public/assets/images/environment/vegetation/bush.png' },
  { key: ASSET_KEYS.TREE, path: 'public/assets/images/environment/vegetation/tree.png' },
  { key: ASSET_KEYS.THORN_BUSH, path: 'public/assets/images/environment/vegetation/thorn_bush.png' },
  { key: ASSET_KEYS.COACH_PORTRAIT, path: 'public/assets/images/coach/me_v2.png' },
  { key: ASSET_KEYS.COACH_TEXT_BG, path: 'public/assets/images/coach/04_traceur_coach_text_bg.png' },
];
