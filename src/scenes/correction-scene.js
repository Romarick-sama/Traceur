import { STYLE_CONFIGURATION, BRAND_COLORS } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { Level } from '../game-objects/gameplay/level.js';
import { Dog } from '../game-objects/characters/dog.js';
import { Human } from '../game-objects/characters/human.js';
import { getLevelConfig } from '../data/levels-data.js';

/**
 * Replays the player's trace with the dog: the dog starts where the human
 * started and follows the recorded trace.
 */
export class CorrectionScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.CORRECTION);
  }

  init(data) {
    let levelNumber;
    if (data && data.level !== undefined && data.level !== null) {
      levelNumber = data.level;
    } else {
      levelNumber = 1;
    }
    this.levelNumber = levelNumber;

    let playerTrace;
    if (data && data.trace !== undefined && data.trace !== null) {
      playerTrace = data.trace;
    } else {
      playerTrace = [];
    }
    this.playerTrace = playerTrace;

    let redFlags;
    if (data && data.redFlags !== undefined && data.redFlags !== null) {
      redFlags = data.redFlags;
    } else {
      redFlags = [];
    }
    this.redFlags = redFlags;

    let environment;
    if (data) {
      environment = data.environment;
    }
    this.environment = environment;

    let solution;
    if (data) {
      solution = data.solution;
    }
    this.solution = solution;
  }

  create() {
    this.levelConfig = getLevelConfig(this.levelNumber);
    this.cameras.main.setBackgroundColor(STYLE_CONFIGURATION.MAIN_BACKGROUND_COLOR);

    let environment;
    if (this.environment !== undefined && this.environment !== null) {
      environment = this.environment;
    } else {
      environment = this.levelConfig.environment;
    }

    this.level = new Level(
      this,
      {
        environment: environment,
      },
    );
    this.level.create();

    this._drawPlayerTrace();
    this._createActors();

    if (this.redFlags.length > 0 || this.playerTrace.length < 2) {
      this._showResult(false);
      return;
    };

    this._playDogTrace(() => {
      this._showResult(true);
    });
  }

  /**
   * Draws the player's recorded trace as a faint reference line.
   * @return {void}
   */
  _drawPlayerTrace() {
    const GRAPHICS = this.add.graphics();
    if (this.playerTrace.length < 2) {
      return;
    };

    GRAPHICS.lineStyle(
      4,
      0xffffff,
      0.25,
    );
    GRAPHICS.beginPath();
    GRAPHICS.moveTo(
      this.playerTrace[0].x,
      this.playerTrace[0].y,
    );
    for (let pointIndex = 1; pointIndex < this.playerTrace.length; pointIndex++) {
      GRAPHICS.lineTo(
        this.playerTrace[pointIndex].x,
        this.playerTrace[pointIndex].y,
      );
    };
    GRAPHICS.strokePath();
  }

  /**
   * Places the dog at the human's starting position and the (hidden) human
   * at the end of the player's trace.
   * @return {void}
   */
  _createActors() {
    let start;
    if (this.playerTrace[0] !== undefined && this.playerTrace[0] !== null) {
      start = this.playerTrace[0];
    } else {
      start = this.levelConfig.human;
    }
    const START = start;

    let end;
    if (this.playerTrace[this.playerTrace.length - 1] !== undefined && this.playerTrace[this.playerTrace.length - 1] !== null) {
      end = this.playerTrace[this.playerTrace.length - 1];
    } else {
      end = this.levelConfig.human;
    }
    const END = end;

    this.human = new Human(
      this,
      END.x,
      END.y,
    );
    this.human.setAlpha(0.6);

    this.dog = new Dog(
      this,
      START.x,
      START.y,
      this.levelConfig.dog,
    );
  }

  /**
   * Animates the dog along the player's trace.
   * @param {() => void} onComplete
   * @return {void}
   */
  _playDogTrace(onComplete) {
    const POINTS = this.playerTrace;
    const DISTANCES = [0];
    for (let pointIndex = 1; pointIndex < POINTS.length; pointIndex++) {
      DISTANCES.push(DISTANCES[pointIndex - 1] + Phaser.Math.Distance.Between(
        POINTS[pointIndex - 1].x,
        POINTS[pointIndex - 1].y,
        POINTS[pointIndex].x,
        POINTS[pointIndex].y,
      ));
    };
    const TOTAL_DISTANCE = DISTANCES[DISTANCES.length - 1];
    const DOG_SPEED = 200;

    const PROGRESS = {
      value: 0,
    };
    this.tweens.add({
      targets: PROGRESS,
      value: 1,
      duration: (TOTAL_DISTANCE / DOG_SPEED) * 1000,
      ease: 'Linear',
      onUpdate: () => {
        this._moveDogAlong(
          POINTS,
          DISTANCES,
          TOTAL_DISTANCE,
          PROGRESS.value,
        );
      },
      onComplete,
    });
  }

  /**
   * Positions the dog at the point of the trace corresponding to the given
   * progress (0 to 1), and flips it to face its movement direction.
   * @param {Array<{x: number, y: number}>} points
   * @param {number[]} distances
   * @param {number} totalDistance
   * @param {number} progress
   * @return {void}
   */
  _moveDogAlong(
    points,
    distances,
    totalDistance,
    progress,
  ) {
    const TARGET_DISTANCE = totalDistance * progress;

    let index = 0;
    while (index < distances.length - 2 && distances[index + 1] < TARGET_DISTANCE) {
      index++;
    };

    const SEGMENT_START = points[index];

    let segmentEnd;
    if (points[index + 1] !== undefined && points[index + 1] !== null) {
      segmentEnd = points[index + 1];
    } else {
      segmentEnd = SEGMENT_START;
    }
    const SEGMENT_END = segmentEnd;

    const SEGMENT_LENGTH = distances[index + 1] - distances[index] || 1;
    const SEGMENT_PROGRESS = (TARGET_DISTANCE - distances[index]) / SEGMENT_LENGTH;

    const X = Phaser.Math.Linear(
      SEGMENT_START.x,
      SEGMENT_END.x,
      SEGMENT_PROGRESS,
    );
    const Y = Phaser.Math.Linear(
      SEGMENT_START.y,
      SEGMENT_END.y,
      SEGMENT_PROGRESS,
    );

    if (X < this.dog.x) {
      this.dog.setFlipX(true);
    } else if (X > this.dog.x) {
      this.dog.setFlipX(false);
    };

    this.dog.setPosition(
      X,
      Y,
    );
  }

  /**
   * Shows the result panel: failure (red flag, dog stays in place) or
   * success (dog reached the human).
   * @param {boolean} success
   * @return {void}
   */
  _showResult(success) {
    let title;
    if (success) {
      title = 'Bravo, le chien a réussi à retrouver l\'humain caché grâce à un tracé qui correspond au chien !';
    } else {
      title = `Oups, le tracé comprend ${this.redFlags.map((flag) => flag.message).join(' ')} donc le chien n'a pas réussi à trouver l'humain.`;
    }
    const TITLE = title;

    let color;
    if (success) {
      color = STYLE_CONFIGURATION.END_SCENE_SUCCESS_COLOR;
    } else {
      color = STYLE_CONFIGURATION.END_SCENE_FAIL_COLOR;
    }
    const COLOR = color;

    const CONTAINER = this.add.container(
      0,
      0,
    );

    const TITLE_TEXT = this.add.text(
      this.scale.width / 2,
      this.scale.height - 150,
      TITLE,
      {
        fontSize: STYLE_CONFIGURATION.MAIN_MESSAGE_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.MAIN_MESSAGE_FONT_FAMILY,
        color: COLOR,
        align: 'center',
        wordWrap: {
          width: this.scale.width - 80,
        },
      },
    ).setOrigin(0.5);
    CONTAINER.add(TITLE_TEXT);

    const BUTTON_Y = this.scale.height - 70;
    const BUTTONS = [];

    BUTTONS.push(this._createButton(
      0,
      BUTTON_Y,
      'Recommencer',
      () => {
        this.scene.start(SCENE_KEYS.MAP, {
          level: this.levelNumber,
        });
      },
    ));

    BUTTONS.push(this._createButton(
      0,
      BUTTON_Y,
      'Voir la solution',
      () => {
        this.scene.start(SCENE_KEYS.SOLUTION, {
          level: this.levelNumber,
          environment: this.environment,
          solution: this.solution,
        });
      },
    ));

    if (success) {
      BUTTONS.push(this._createButton(
        0,
        BUTTON_Y,
        'Chien suivant !',
        () => {
          this.scene.start(SCENE_KEYS.COACH, {
            level: this.levelNumber + 1,
          });
        },
      ));
    };

    const SPACING = (this.scale.width - 40) / BUTTONS.length;
    BUTTONS.forEach((
      button,
      index,
    ) => {
      button.setPosition(
        40 + SPACING * (index + 0.5),
        BUTTON_Y,
      );
      CONTAINER.add(button);
    });
  }

  /**
   * Creates a simple text button.
   * @param {number} x
   * @param {number} y
   * @param {string} label
   * @param {() => void} onClick
   * @return {Phaser.GameObjects.Text}
   */
  _createButton(
    x,
    y,
    label,
    onClick,
  ) {
    const BUTTON = this.add.text(
      x,
      y,
      label,
      {
        fontSize: STYLE_CONFIGURATION.RETRY_BUTTON_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.RETRY_BUTTON_FONT_FAMILY,
        color: STYLE_CONFIGURATION.RETRY_BUTTON_FONT_COLOR,
        fontStyle: STYLE_CONFIGURATION.RETRY_BUTTON_FONT_STYLE,
        backgroundColor: BRAND_COLORS.YELLOW,
        padding: {
          x: 12,
          y: 8,
        },
        align: 'center',
      },
    ).setOrigin(0.5).setInteractive({
      useHandCursor: true,
    });

    BUTTON.on('pointerover', () => {
      BUTTON.setBackgroundColor(BRAND_COLORS.ORANGE);
    });
    BUTTON.on('pointerout', () => {
      BUTTON.setBackgroundColor(BRAND_COLORS.YELLOW);
    });
    BUTTON.on('pointerdown', onClick);

    return BUTTON;
  }
}
