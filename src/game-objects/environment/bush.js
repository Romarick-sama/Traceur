import { ASSET_KEYS } from '../../common/asset-keys.js';

export class Bush extends Phaser.Physics.Arcade.Image {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} [profile.texture=ASSET_KEYS.BUSH]
   */
  constructor(
    scene,
    x,
    y,
    texture = ASSET_KEYS.BUSH,
  ) {
    super(
      scene,
      x,
      y,
      texture,
    );
    this.setScale(0.08);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.refreshBody();
  }
}
