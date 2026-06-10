import { ASSET_KEYS } from '../../common/asset-keys.js';

export class Bush extends Phaser.Physics.Arcade.Image {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} [profile.texture=ASSET_KEYS.BUSH]
   */
  constructor(scene, x, y, texture = ASSET_KEYS.BUSH) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    this.setScale(0.1)
    scene.physics.add.existing(this);
  }
}
