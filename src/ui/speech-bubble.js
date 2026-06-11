import { STYLECONFIG } from '../common/style-config.js';

/**
 * Small text bubble shown above a game object, used to display
 * "what to do / what not to do" explanations during the solution replay.
 */
export class SpeechBubble {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.text = scene.add.text(0, 0, '', {
      fontSize: STYLECONFIG.SPEECH_BUBBLE_FONT_SIZE,
      fontFamily: STYLECONFIG.SPEECH_BUBBLE_FONT_FAMILY,
      color: STYLECONFIG.SPEECH_BUBBLE_COLOR,
      backgroundColor: STYLECONFIG.SPEECH_BUBBLE_BACKGROUND_COLOR,
      padding: { x: 10, y: 6 },
      align: 'center',
      wordWrap: { width: 220 },
    }).setOrigin(0.5, 1).setDepth(10).setVisible(false);
  }

  /**
   * Shows the bubble with the given message above the given position.
   * @param {number} x
   * @param {number} y
   * @param {string} message
   * @return {void}
   */
  show(x, y, message) {
    this.text.setText(message);
    this.text.setPosition(x, y - 40);
    this.text.setVisible(true);
  }

  /**
   * Hides the bubble.
   * @return {void}
   */
  hide() {
    this.text.setVisible(false);
  }

  /**
   * Destroys the underlying text object.
   * @return {void}
   */
  destroy() {
    this.text.destroy();
  }
}
