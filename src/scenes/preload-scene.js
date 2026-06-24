import { SCENE_KEYS } from '../common/scene-keys.js';
import { SPRITE_ASSETS, ASSET_KEYS } from '../common/asset-keys.js';

/**
 * Simple shape/color used in place of a sprite whose file failed to load
 * (eg. missing from public/assets), instead of Phaser's default "?" texture.
 */
const FALLBACK_STYLES = {
  [ASSET_KEYS.HUMAN]: { color: 0x3a7bd5, shape: 'circle', size: 48 },
  [ASSET_KEYS.DOG]: { color: 0xb5651d, shape: 'circle', size: 48 },
  [ASSET_KEYS.THORN_BUSH]: { color: 0x6b3e26, shape: 'square', size: 80 },
};
const DEFAULT_FALLBACK_STYLE = { color: 0x888888, shape: 'square', size: 64 };

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.PRELOAD);
  }

  preload() {
    this.failedKeys = [];
    this.load.on('loaderror', (file) => {
      this.failedKeys.push(file.key);
    });

    SPRITE_ASSETS.forEach(({
      key,
      path,
    }) => {
      this.load.image(
        key,
        path,
      );
    });

    this.load.image(
      ASSET_KEYS.MAP_TILES,
      'public/assets/images/map/gfx/Overworld.png',
    );
    this.load.tilemapTiledJSON(
      ASSET_KEYS.MAP_TILEMAP,
      'public/assets/images/map/map.json',
    );
  }

  create() {
    this.failedKeys.forEach((key) => {
      this._createFallbackTexture(key);
    });

    this.scene.start(SCENE_KEYS.INTRO);
  }

  /**
   * Generates a simple colored placeholder texture under `key`, so code
   * referencing a sprite whose file is missing still has something
   * coherent to draw instead of Phaser's default missing-texture sprite.
   * @param {string} key
   * @return {void}
   */
  _createFallbackTexture(key) {
    const STYLE = FALLBACK_STYLES[key] || DEFAULT_FALLBACK_STYLE;
    const GRAPHICS = this.make.graphics({
      x: 0,
      y: 0,
      add: false,
    });

    GRAPHICS.fillStyle(STYLE.color, 1);
    if (STYLE.shape === 'circle') {
      GRAPHICS.fillCircle(
        STYLE.size / 2,
        STYLE.size / 2,
        STYLE.size / 2,
      );
    } else {
      GRAPHICS.fillRect(
        0,
        0,
        STYLE.size,
        STYLE.size,
      );
    };

    GRAPHICS.generateTexture(
      key,
      STYLE.size,
      STYLE.size,
    );
    GRAPHICS.destroy();
  }
}
