import { STYLE_CONFIGURATION, BRAND_COLORS } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { Level } from '../game-objects/gameplay/level.js';
import { getLevelConfig } from '../data/levels-data.js';
import { generateLevel } from '../game-objects/gameplay/environment-generator.js';

export class MapScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MAP);
  }

  init(data) {
    let levelNumber;
    if (data && data.level !== undefined && data.level !== null) {
      levelNumber = data.level;
    } else {
      levelNumber = 1;
    }
    this.levelNumber = levelNumber;
  }

  create() {
    this.cameras.main.setBackgroundColor(STYLE_CONFIGURATION.MAIN_BACKGROUND_COLOR);
    this.levelConfig = getLevelConfig(this.levelNumber);

    this._showLoading();

    // Defer to the next tick so the loading text has a chance to render
    // before the (synchronous) generation runs.
    this.time.delayedCall(
      0,
      () => {
        this._buildLevel();
      },
    );
  }

  /**
   * Displays a "level generation in progress" message while the random
   * environment is computed.
   * @return {void}
   */
  _showLoading() {
    this.loadingText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'Génération du niveau en cours...',
      {
        fontSize: STYLE_CONFIGURATION.STEP_HUD_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.STEP_HUD_FONT_FAMILY,
        color: STYLE_CONFIGURATION.STEP_HUD_COLOR,
      },
    ).setOrigin(0.5);
  }

  /**
   * Generates a random, finishable environment layout, builds the level
   * (without the dog, which only appears during the correction) and sets
   * up the controls and UI.
   * @return {void}
   */
  _buildLevel() {
    const GENERATED = generateLevel(this.levelConfig);
    this.generatedEnvironment = GENERATED.environment;
    this.generatedSolution = GENERATED.solution;

    this.loadingText.destroy();

    this.level = new Level(
      this,
      {
        ...this.levelConfig,
        environment: this.generatedEnvironment,
        dog: null,
      },
    );
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
    const BUTTON = this.add.text(
      this.scale.width - 16,
      16,
      'Se cacher',
      {
        fontSize: STYLE_CONFIGURATION.HIDE_BUTTON_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.HIDE_BUTTON_FONT_FAMILY,
        color: STYLE_CONFIGURATION.HIDE_BUTTON_FONT_COLOR,
        fontStyle: STYLE_CONFIGURATION.HIDE_BUTTON_FONT_STYLE,
        backgroundColor: STYLE_CONFIGURATION.HIDE_BUTTON_COLOR,
        padding: {
          x: 16,
          y: 8,
        },
      },
    ).setOrigin(
      1,
      0,
    ).setInteractive({
      useHandCursor: true,
    });

    BUTTON.on('pointerover', () => {
      BUTTON.setBackgroundColor(STYLE_CONFIGURATION.HIDE_BUTTON_HOVER_COLOR);
    });
    BUTTON.on('pointerout', () => {
      BUTTON.setBackgroundColor(STYLE_CONFIGURATION.HIDE_BUTTON_COLOR);
    });
    BUTTON.on('pointerdown', () => {
      this._goToCorrection();
    });
  }

  /**
   * Stops the level and starts the correction scene with the player's trace.
   * @return {void}
   */
  _goToCorrection() {
    let tracePoints;
    if (this.level.human && this.level.human.trace.points !== undefined && this.level.human.trace.points !== null) {
      tracePoints = this.level.human.trace.points;
    } else {
      tracePoints = [];
    }
    const TRACE_POINTS = tracePoints;

    this.scene.start(SCENE_KEYS.CORRECTION, {
      level: this.levelNumber,
      trace: TRACE_POINTS,
      redFlags: this.level.getRedFlags(),
      environment: this.generatedEnvironment,
      solution: this.generatedSolution,
    });
  }

  update() {
    if (this.level) {
      this.level.update(this.cursors);
    };
  }
}
