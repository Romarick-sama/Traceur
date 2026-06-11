import { ASSET_KEYS } from '../../common/asset-keys.js';

export class ThornBush extends Phaser.Physics.Arcade.Image {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} [profile.texture=ASSET_KEYS.THORN_BUSH]
   */
  constructor(
    scene,
    x,
    y,
    texture = ASSET_KEYS.THORN_BUSH,
  ) {
    super(
      scene,
      x,
      y,
      texture,
    );
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }
}
