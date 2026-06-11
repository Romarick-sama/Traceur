import { STYLE_CONFIGURATION } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.INTRO);
  }

  create() {
    this.cameras.main.setBackgroundColor(STYLE_CONFIGURATION.INTRO_BACKGROUND_COLOR);

    this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 60,
      'Traceur',
      {
        fontSize: STYLE_CONFIGURATION.INTRO_SCENE_TITLE_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.INTRO_SCENE_TITLE_FONT_FAMILY,
        color: STYLE_CONFIGURATION.INTRO_SCENE_TITLE_COLOR,
        fontStyle: STYLE_CONFIGURATION.INTRO_SCENE_TITLE_FONT_STYLE,
      },
    ).setOrigin(0.5);

    const START_BUTTON = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 40,
      'Jouer',
      {
        fontSize: STYLE_CONFIGURATION.START_BUTTON_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.START_BUTTON_FONT_FAMILY,
        color: STYLE_CONFIGURATION.START_BUTTON_FONT_COLOR,
        fontStyle: STYLE_CONFIGURATION.START_BUTTON_FONT_STYLE,
        backgroundColor: STYLE_CONFIGURATION.START_BUTTON_COLOR.toString(16).padStart(6, '0').replace(/^/, '#'),
        padding: {
          x: 20,
          y: 10,
        },
      },
    ).setOrigin(0.5).setInteractive({
      useHandCursor: true,
    });

    START_BUTTON.on('pointerover', () => START_BUTTON.setColor(STYLE_CONFIGURATION.START_BUTTON_HOVER_COLOR));
    START_BUTTON.on('pointerout', () => START_BUTTON.setColor(STYLE_CONFIGURATION.START_BUTTON_FONT_COLOR));
    START_BUTTON.on('pointerdown', () => this.scene.start(SCENE_KEYS.LEVEL_CHOICE));
  }
}
