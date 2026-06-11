import { SCENE_KEYS } from '../common/scene-keys.js';
import { SPRITE_ASSETS } from '../common/asset-keys.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.PRELOAD);
  }

  preload() {
    SPRITE_ASSETS.forEach(({
      key,
      path,
    }) => {
      this.load.image(
        key,
        path,
      );
    });
  }

  create() {
    this.scene.start(SCENE_KEYS.INTRO);
  }
}
