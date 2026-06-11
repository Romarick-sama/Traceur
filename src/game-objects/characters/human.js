import { Trace } from '../gameplay/trace.js';
import { ASSET_KEYS } from '../../common/asset-keys.js';

/**
 * Player-controlled human. Moves in any direction and leaves a Trace behind it.
 * Collisions with non-traversable elements (eg. thorn bushes) are set up by the
 * scene via `scene.physics.add.collider(human, obstaclesGroup)`.
 */
export class Human extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} [texture=ASSET_KEYS.HUMAN]
   * @param {number} [speed=160] - movement speed in pixels per second
   */
  constructor(scene, x, y, texture = ASSET_KEYS.HUMAN, speed = 160) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.speed = speed;
    this.trace = new Trace(scene);
    this.collidedObjects = new Set();
  }

  /**
   * Records an environment object the human has touched or passed through,
   * kept for the whole level (used to check for red flags at correction time).
   * @param {object} gameObject
   * @return {void}
   */
  collidedWithGameObject(gameObject) {
    this.collidedObjects.add(gameObject);
  }

  /**
   * Moves the human according to the cursor keys and records the trace.
   * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors
   * @return {void}
   */
  update(cursors) {
    this.setVelocity(0);

    if (cursors.left.isDown) {
      this.setVelocityX(-this.speed);
    } else if (cursors.right.isDown) {
      this.setVelocityX(this.speed);
    };

    if (cursors.up.isDown) {
      this.setVelocityY(-this.speed);
    } else if (cursors.down.isDown) {
      this.setVelocityY(this.speed);
    };

    this.trace.addPoint(this.x, this.y);
  }
}
