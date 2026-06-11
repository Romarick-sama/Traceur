import { STYLE_CONFIGURATION, BRAND_COLORS } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { Level } from '../game-objects/gameplay/level.js';
import { Human } from '../game-objects/characters/human.js';
import { Solution } from '../game-objects/gameplay/solution.js';
import { SpeechBubble } from '../ui/speech-bubble.js';
import { getLevelConfig } from '../data/levels-data.js';

/**
 * Replays the level with a tracer following the ideal trace, showing
 * explanation bubbles ("what to do / not to do") at each waypoint.
 */
export class SolutionScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SOLUTION);
  }

  init(data) {
    let levelNumber;
    if (data && data.level !== undefined && data.level !== null) {
      levelNumber = data.level;
    } else {
      levelNumber = 1;
    }
    this.levelNumber = levelNumber;

    let environment;
    if (data) {
      environment = data.environment;
    }
    this.environment = environment;

    let solutionData;
    if (data) {
      solutionData = data.solution;
    }
    this.solutionData = solutionData;
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

    let solutionData;
    if (this.solutionData !== undefined && this.solutionData !== null) {
      solutionData = this.solutionData;
    } else {
      solutionData = this.levelConfig.solution;
    }
    const SOLUTION_DATA = solutionData;

    this.solution = new Solution(
      this,
      SOLUTION_DATA.waypoints,
    );
    this.solution.draw();

    const START = SOLUTION_DATA.waypoints[0];
    this.tracer = new Human(
      this,
      START.x,
      START.y,
    );
    this.bubble = new SpeechBubble(this);

    this._playStep(0);
  }

  /**
   * Shows the explanation for the waypoint at `index`, then moves the
   * tracer to the next waypoint and recurses, or shows the "Retour" button
   * once every waypoint has been explained.
   * @param {number} index
   * @return {void}
   */
  _playStep(index) {
    let solutionData;
    if (this.solutionData !== undefined && this.solutionData !== null) {
      solutionData = this.solutionData;
    } else {
      solutionData = this.levelConfig.solution;
    }
    const SOLUTION_DATA = solutionData;

    const WAYPOINTS = SOLUTION_DATA.waypoints;
    const EXPLANATIONS = SOLUTION_DATA.explanations;
    const WAYPOINT = WAYPOINTS[index];

    let explanation;
    if (EXPLANATIONS[index] !== undefined && EXPLANATIONS[index] !== null) {
      explanation = EXPLANATIONS[index];
    } else {
      explanation = '';
    }

    this.bubble.show(
      WAYPOINT.x,
      WAYPOINT.y,
      explanation,
    );

    const NEXT = WAYPOINTS[index + 1];
    if (!NEXT) {
      this.time.delayedCall(
        1500,
        () => {
          this._showReturnButton();
        },
      );
      return;
    };

    this.time.delayedCall(
      1500,
      () => {
        this.bubble.hide();

        if (NEXT.x < this.tracer.x) {
          this.tracer.setFlipX(true);
        } else if (NEXT.x > this.tracer.x) {
          this.tracer.setFlipX(false);
        };

        this.tweens.add({
          targets: this.tracer,
          x: NEXT.x,
          y: NEXT.y,
          duration: Phaser.Math.Distance.Between(
            this.tracer.x,
            this.tracer.y,
            NEXT.x,
            NEXT.y,
          ) / 200 * 1000,
          ease: 'Linear',
          onComplete: () => {
            this._playStep(index + 1);
          },
        });
      },
    );
  }

  /**
   * Shows a button to go back to the map for another attempt.
   * @return {void}
   */
  _showReturnButton() {
    const BUTTON = this.add.text(
      this.scale.width / 2,
      this.scale.height - 30,
      'Retour',
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
    BUTTON.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.MAP, {
        level: this.levelNumber,
      });
    });
  }
}
