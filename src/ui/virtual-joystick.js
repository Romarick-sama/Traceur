const DEAD_ZONE = 0.3;

/**
 * On-screen joystick pad fixed at the bottom-center of the game view.
 * Exposes a cursors-like API ({ left, right, up, down }, each with `.isDown`)
 * so it can be merged with Phaser's keyboard CursorKeys without touching
 * the code that consumes them.
 */
export class VirtualJoystick {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} [radius=55] - base pad radius in px
   */
  constructor(scene, radius = 55) {
    this.scene = scene;
    this.radius = radius;
    this.knobRadius = radius * 0.45;
    this.direction = { x: 0, y: 0 };
    this.pointerId = null;

    const X = scene.scale.width / 2;
    const Y = scene.scale.height - radius - 24;
    this.centerX = X;
    this.centerY = Y;

    this.base = scene.add.circle(X, Y, radius, 0xffffff, 0.18)
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    this.knob = scene.add.circle(X, Y, this.knobRadius, 0xffffff, 0.55)
      .setScrollFactor(0)
      .setDepth(1001);

    scene.input.on('pointerdown', this._onPointerDown, this);
    scene.input.on('pointermove', this._onPointerMove, this);
    scene.input.on('pointerup', this._onPointerUp, this);
    scene.input.on('pointerupoutside', this._onPointerUp, this);

    this.left = { isDown: false };
    this.right = { isDown: false };
    this.up = { isDown: false };
    this.down = { isDown: false };
  }

  /**
   * @param {Phaser.Input.Pointer} pointer
   * @return {void}
   */
  _onPointerDown(pointer) {
    if (this.pointerId !== null) {
      return;
    };
    const DIST = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.centerX, this.centerY);
    if (DIST > this.radius) {
      return;
    };
    this.pointerId = pointer.id;
    this._updateFromPointer(pointer);
  }

  /**
   * @param {Phaser.Input.Pointer} pointer
   * @return {void}
   */
  _onPointerMove(pointer) {
    if (pointer.id !== this.pointerId) {
      return;
    };
    this._updateFromPointer(pointer);
  }

  /**
   * @param {Phaser.Input.Pointer} pointer
   * @return {void}
   */
  _onPointerUp(pointer) {
    if (pointer.id !== this.pointerId) {
      return;
    };
    this.pointerId = null;
    this.direction.x = 0;
    this.direction.y = 0;
    this.knob.setPosition(this.centerX, this.centerY);
    this._updateDownStates();
  }

  /**
   * Moves the knob toward the pointer, clamped to the pad radius, and
   * recomputes the normalized direction and isDown states.
   * @param {Phaser.Input.Pointer} pointer
   * @return {void}
   */
  _updateFromPointer(pointer) {
    const DX = pointer.x - this.centerX;
    const DY = pointer.y - this.centerY;
    const DIST = Math.min(Math.sqrt(DX * DX + DY * DY), this.radius);
    const ANGLE = Math.atan2(DY, DX);
    const KNOB_X = this.centerX + Math.cos(ANGLE) * DIST;
    const KNOB_Y = this.centerY + Math.sin(ANGLE) * DIST;
    this.knob.setPosition(KNOB_X, KNOB_Y);

    this.direction.x = (KNOB_X - this.centerX) / this.radius;
    this.direction.y = (KNOB_Y - this.centerY) / this.radius;
    this._updateDownStates();
  }

  /** @return {void} */
  _updateDownStates() {
    this.left.isDown = this.direction.x < -DEAD_ZONE;
    this.right.isDown = this.direction.x > DEAD_ZONE;
    this.up.isDown = this.direction.y < -DEAD_ZONE;
    this.down.isDown = this.direction.y > DEAD_ZONE;
  }

  /** @return {void} */
  destroy() {
    this.scene.input.off('pointerdown', this._onPointerDown, this);
    this.scene.input.off('pointermove', this._onPointerMove, this);
    this.scene.input.off('pointerup', this._onPointerUp, this);
    this.scene.input.off('pointerupoutside', this._onPointerUp, this);
    this.base.destroy();
    this.knob.destroy();
  }
}
