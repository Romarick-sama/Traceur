import { STYLE_CONFIGURATION } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { DOGS_DATA } from '../data/dogs-data.js';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 360;
const CARD_GAP = 30;

/**
 * Lets the player pick which dog to play the level with. Each card shows
 * the dog's name, age and red flags (situations it reacts badly to). Cards
 * are laid out based on the number of entries in DOGS_DATA.
 */
export class DogChoiceScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.DOG_CHOICE);
  }

  create() {
    this.cameras.main.setBackgroundColor(STYLE_CONFIGURATION.SELECT_LEVEL_BACKGROUND_COLOR);

    this.add.text(
      this.scale.width / 2,
      60,
      'Choix du chien',
      {
        fontSize: STYLE_CONFIGURATION.SELECT_LEVEL_TITLE_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.SELECT_LEVEL_TITLE_FONT_FAMILY,
        color: STYLE_CONFIGURATION.SELECT_LEVEL_TITLE_COLOR,
        fontStyle: STYLE_CONFIGURATION.SELECT_LEVEL_TITLE_FONT_STYLE,
      },
    ).setOrigin(0.5);

    const DOGS = Object.values(DOGS_DATA);
    const TOTAL_WIDTH = DOGS.length * CARD_WIDTH + (DOGS.length - 1) * CARD_GAP;
    const START_X = (this.scale.width - TOTAL_WIDTH) / 2 + CARD_WIDTH / 2;
    const CARD_Y = this.scale.height / 2;

    DOGS.forEach((dog, index) => {
      this._createDogCard(
        dog,
        START_X + index * (CARD_WIDTH + CARD_GAP),
        CARD_Y,
      );
    });
  }

  /**
   * Draws a single selectable dog card.
   * @param {object} dog
   * @param {number} x
   * @param {number} y
   * @return {void}
   */
  _createDogCard(dog, x, y) {
    const CARD = this.add.rectangle(
      x,
      y,
      CARD_WIDTH,
      CARD_HEIGHT,
      STYLE_CONFIGURATION.CARD_BACKGROUND_UNLOCKED,
    ).setStrokeStyle(
      3,
      STYLE_CONFIGURATION.CARD_BORDER_UNLOCKED,
    ).setInteractive({
      useHandCursor: true,
    });

    this.add.text(
      x,
      y - CARD_HEIGHT / 2 + 30,
      dog.prenom,
      {
        fontSize: STYLE_CONFIGURATION.CARD_TITLE_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.CARD_TITLE_FONT_FAMILY,
        color: STYLE_CONFIGURATION.CARD_TITLE_COLOR_UNLOCKED,
        fontStyle: 'bold',
      },
    ).setOrigin(0.5);

    this.add.text(
      x,
      y - CARD_HEIGHT / 2 + 60,
      `${dog.age} ans - ${dog.race}`,
      {
        fontSize: STYLE_CONFIGURATION.CARD_DESCRIPTION_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.CARD_DESCRIPTION_FONT_FAMILY,
        color: STYLE_CONFIGURATION.CARD_DESCRIPTION_COLOR_UNLOCKED,
      },
    ).setOrigin(0.5);

    const RED_FLAGS_TEXT = dog.redFlags.join('\n');

    this.add.text(
      x,
      y - CARD_HEIGHT / 2 + 100,
      `Red flags :\n${RED_FLAGS_TEXT}`,
      {
        fontSize: '11px',
        fontFamily: STYLE_CONFIGURATION.CARD_DESCRIPTION_FONT_FAMILY,
        color: STYLE_CONFIGURATION.CARD_DESCRIPTION_COLOR_UNLOCKED,
        align: 'center',
        lineSpacing: 4,
        wordWrap: {
          width: CARD_WIDTH - 24,
        },
      },
    ).setOrigin(0.5, 0);

    const SELECT_BUTTON = this.add.text(
      x,
      y + CARD_HEIGHT / 2 - 30,
      'Choisir',
      {
        fontSize: STYLE_CONFIGURATION.CARD_PLAY_BUTTON_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.CARD_PLAY_BUTTON_FONT_FAMILY,
        color: STYLE_CONFIGURATION.CARD_PLAY_BUTTON_FONT_COLOR,
        backgroundColor: '#fb9339',
        padding: {
          x: 12,
          y: 6,
        },
      },
    ).setOrigin(0.5).setInteractive({
      useHandCursor: true,
    });

    const SELECT_DOG = () => {
      this.scene.start(SCENE_KEYS.LEVEL_CHOICE, {
        dogId: dog.id,
      });
    };

    CARD.on('pointerdown', SELECT_DOG);
    SELECT_BUTTON.on('pointerdown', SELECT_DOG);
  }
}
