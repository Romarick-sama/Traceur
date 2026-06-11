import { STYLECONFIG, LGDT_COLORS } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { Level } from '../game-objects/gameplay/level.js';

export class MapScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MAP);
  }

  init(data) {
    this.levelNumber = data?.level ?? 1;
  }

  create() {
    this.cameras.main.setBackgroundColor(STYLECONFIG.MAIN_BACKGROUND_COLOR);

    this.level = new Level(this, {
      human: { x: this.scale.width / 2, y: this.scale.height / 2 },
      dog: { x: this.scale.width / 2 + 160, y: this.scale.height / 2 },
      environment: [
        { type: 'BUSH', x: this.scale.width / 2 - 160, y: this.scale.height / 2 },
        { type: 'THORN_BUSH', x: this.scale.width / 2 + 160, y: this.scale.height / 2 - 160 },
        { type: 'TREE', x: this.scale.width / 2 - 160, y: this.scale.height / 2 - 160 },
      ],
    });
    this.level.create();

    this.cursors = this.input.keyboard.createCursorKeys();

    this._createHideButton();
  }

  /**
   * Creates the "Se cacher" button that validates the player's trace and
   * moves on to the correction.
   * @return {void}
   */
  _createHideButton() {
    const BUTTON = this.add.text(this.scale.width - 16, 16, 'Se cacher', {
      fontSize: STYLECONFIG.START_BUTTON_FONT_SIZE,
      fontFamily: STYLECONFIG.START_BUTTON_FONT_FAMILY,
      color: STYLECONFIG.START_BUTTON_FONT_COLOR,
      fontStyle: STYLECONFIG.START_BUTTON_FONT_STYLE,
      backgroundColor: LGDT_COLORS.BLUE,
      padding: { x: 16, y: 8 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    BUTTON.on('pointerover', () => BUTTON.setColor(STYLECONFIG.START_BUTTON_HOVER_COLOR));
    BUTTON.on('pointerout', () => BUTTON.setColor(STYLECONFIG.START_BUTTON_FONT_COLOR));
    BUTTON.on('pointerdown', () => this._goToCorrection());
  }

  /**
   * Stops the level and starts the correction scene with the player's trace.
   * @return {void}
   */
  _goToCorrection() {
    const TRACE_POINTS = this.level.human?.trace.points ?? [];

    this.scene.start(SCENE_KEYS.CORRECTION, {
      level: this.levelNumber,
      trace: TRACE_POINTS,
    });
  }

  update() {
    this.level.update(this.cursors);
  }
}
