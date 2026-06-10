import { STYLECONFIG } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.INTRO);
  }

  create() {
    this.cameras.main.setBackgroundColor(STYLECONFIG.INTRO_BACKGROUND_COLOR);

    this.add.text(this.scale.width / 2, this.scale.height / 2 - 60, 'Traceur', {
      fontSize: STYLECONFIG.INTRO_SCENE_TITLE_FONT_SIZE,
      fontFamily: STYLECONFIG.INTRO_SCENE_TITLE_FONT_FAMILY,
      color: STYLECONFIG.INTRO_SCENE_TITLE_COLOR,
      fontStyle: STYLECONFIG.INTRO_SCENE_TITLE_FONT_STYLE,
    }).setOrigin(0.5);

    const START_BUTTON = this.add.text(this.scale.width / 2, this.scale.height / 2 + 40, 'Jouer', {
      fontSize: STYLECONFIG.START_BUTTON_FONT_SIZE,
      fontFamily: STYLECONFIG.START_BUTTON_FONT_FAMILY,
      color: STYLECONFIG.START_BUTTON_FONT_COLOR,
      fontStyle: STYLECONFIG.START_BUTTON_FONT_STYLE,
      backgroundColor: STYLECONFIG.START_BUTTON_COLOR.toString(16).padStart(6, '0').replace(/^/, '#'),
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    START_BUTTON.on('pointerover', () => START_BUTTON.setColor(STYLECONFIG.START_BUTTON_HOVER_COLOR));
    START_BUTTON.on('pointerout', () => START_BUTTON.setColor(STYLECONFIG.START_BUTTON_FONT_COLOR));
    START_BUTTON.on('pointerdown', () => this.scene.start(SCENE_KEYS.LEVEL_CHOICE));
  }
}
