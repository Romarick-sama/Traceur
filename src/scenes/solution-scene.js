import { STYLECONFIG, LGDT_COLORS } from '../common/style-config.js';
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
    this.levelNumber = data?.level ?? 1;
    this.environment = data?.environment;
    this.solutionData = data?.solution;
  }

  create() {
    this.levelConfig = getLevelConfig(this.levelNumber);
    this.cameras.main.setBackgroundColor(STYLECONFIG.MAIN_BACKGROUND_COLOR);

    this.level = new Level(this, {
      environment: this.environment ?? this.levelConfig.environment,
    });
    this.level.create();

    const SOLUTION_DATA = this.solutionData ?? this.levelConfig.solution;
    this.solution = new Solution(this, SOLUTION_DATA.waypoints);
    this.solution.draw();

    const START = SOLUTION_DATA.waypoints[0];
    this.tracer = new Human(this, START.x, START.y);
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
    const SOLUTION_DATA = this.solutionData ?? this.levelConfig.solution;
    const WAYPOINTS = SOLUTION_DATA.waypoints;
    const EXPLANATIONS = SOLUTION_DATA.explanations;
    const WAYPOINT = WAYPOINTS[index];

    this.bubble.show(WAYPOINT.x, WAYPOINT.y, EXPLANATIONS[index] ?? '');

    const NEXT = WAYPOINTS[index + 1];
    if (!NEXT) {
      this.time.delayedCall(1500, () => this._showReturnButton());
      return;
    };

    this.time.delayedCall(1500, () => {
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
        duration: Phaser.Math.Distance.Between(this.tracer.x, this.tracer.y, NEXT.x, NEXT.y) / 200 * 1000,
        ease: 'Linear',
        onComplete: () => this._playStep(index + 1),
      });
    });
  }

  /**
   * Shows a button to go back to the map for another attempt.
   * @return {void}
   */
  _showReturnButton() {
    const BUTTON = this.add.text(this.scale.width / 2, this.scale.height - 30, 'Retour', {
      fontSize: STYLECONFIG.RETRY_BUTTON_FONT_SIZE,
      fontFamily: STYLECONFIG.RETRY_BUTTON_FONT_FAMILY,
      color: STYLECONFIG.RETRY_BUTTON_FONT_COLOR,
      fontStyle: STYLECONFIG.RETRY_BUTTON_FONT_STYLE,
      backgroundColor: LGDT_COLORS.YELLOW,
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    BUTTON.on('pointerover', () => BUTTON.setBackgroundColor(LGDT_COLORS.ORANGE));
    BUTTON.on('pointerout', () => BUTTON.setBackgroundColor(LGDT_COLORS.YELLOW));
    BUTTON.on('pointerdown', () => this.scene.start(SCENE_KEYS.MAP, { level: this.levelNumber }));
  }
}
