import { STYLE_CONFIGURATION } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';

export class LevelChoiceScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.LEVEL_CHOICE);
  }

  create() {
    this.cameras.main.setBackgroundColor(STYLE_CONFIGURATION.SELECT_LEVEL_BACKGROUND_COLOR);

    this.add.text(
      this.scale.width / 2,
      60,
      'Choix du niveau',
      {
        fontSize: STYLE_CONFIGURATION.SELECT_LEVEL_TITLE_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.SELECT_LEVEL_TITLE_FONT_FAMILY,
        color: STYLE_CONFIGURATION.SELECT_LEVEL_TITLE_COLOR,
        fontStyle: STYLE_CONFIGURATION.SELECT_LEVEL_TITLE_FONT_STYLE,
      },
    ).setOrigin(0.5);

    const PLAY_BUTTON = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'Niveau 1',
      {
        fontSize: STYLE_CONFIGURATION.CARD_PLAY_BUTTON_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.CARD_PLAY_BUTTON_FONT_FAMILY,
        color: STYLE_CONFIGURATION.CARD_PLAY_BUTTON_FONT_COLOR,
        backgroundColor: '#fb9339',
        padding: {
          x: 16,
          y: 8,
        },
      },
    ).setOrigin(0.5).setInteractive({
      useHandCursor: true,
    });

    PLAY_BUTTON.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.COACH, {
        level: 1,
      });
    });
  }
}
