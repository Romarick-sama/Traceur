import { STYLE_CONFIGURATION } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { ASSET_KEYS } from '../common/asset-keys.js';
import { getLevelConfig } from '../data/levels-data.js';

const COACH_DIALOG_LINES = [
  'Merci de te cacher pour Nomade !',
  "Je voudrais une piste de 200m en faisant le plus tout droit pour que Nomade prenne encore confiance en l'activité !",
];

/**
 * Visual-novel style scene shown between the level choice and the actual
 * game: the coach explains the goal of the hide and shows the dog's
 * profile. The dialog text is revealed word by word.
 */
export class CoachScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.COACH);
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
    this.cameras.main.setBackgroundColor(STYLE_CONFIGURATION.COACH_BACKGROUND_COLOR);
    this.levelConfig = getLevelConfig(this.levelNumber);

    this._createCoachPortrait();
    this._createDogProfile();
    this._createDialogBox();

    this.words = COACH_DIALOG_LINES.join(' ').split(' ');
    this.wordIndex = 0;
    this.dialogText.setText('');

    this.typingTimer = this.time.addEvent({
      delay: STYLE_CONFIGURATION.COACH_DIALOG_WORD_DELAY,
      callback: this._revealNextWord,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Draws the coach's circular portrait in the top-left corner.
   * @return {void}
   */
  _createCoachPortrait() {
    const CENTER_X = 110;
    const CENTER_Y = 110;
    const RADIUS = STYLE_CONFIGURATION.COACH_PORTRAIT_RADIUS;

    this.add.circle(
      CENTER_X,
      CENTER_Y,
      RADIUS + 4,
      STYLE_CONFIGURATION.COACH_PORTRAIT_BORDER_COLOR,
    );

    const PORTRAIT = this.add.image(
      CENTER_X,
      CENTER_Y,
      ASSET_KEYS.COACH_PORTRAIT,
    );
    PORTRAIT.setDisplaySize(
      RADIUS * 2,
      RADIUS * 2,
    );

    const MASK_SHAPE = this.make.graphics({
      x: 0,
      y: 0,
    });
    MASK_SHAPE.fillCircle(
      CENTER_X,
      CENTER_Y,
      RADIUS,
    );
    PORTRAIT.setMask(MASK_SHAPE.createGeometryMask());
  }

  /**
   * Draws the dog's sprite and identity card below the coach portrait.
   * @return {void}
   */
  _createDogProfile() {
    const CENTER_X = 110;
    const DOG_Y = 260;

    this.add.image(
      CENTER_X,
      DOG_Y,
      ASSET_KEYS.DOG,
    ).setDisplaySize(
      90,
      90,
    );

    this.add.text(
      CENTER_X,
      DOG_Y + 60,
      this.levelConfig.dog.prenom,
      {
        fontSize: STYLE_CONFIGURATION.COACH_DOG_LABEL_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.COACH_DOG_LABEL_FONT_FAMILY,
        color: STYLE_CONFIGURATION.COACH_DOG_LABEL_COLOR,
      },
    ).setOrigin(0.5);

    const INFO_LINES = [
      'Age : ',
      'Race : ',
      'Experience : ',
    ].join('\n');

    this.add.text(
      CENTER_X,
      DOG_Y + 95,
      INFO_LINES,
      {
        fontSize: STYLE_CONFIGURATION.COACH_DOG_INFO_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.COACH_DOG_INFO_FONT_FAMILY,
        color: STYLE_CONFIGURATION.COACH_DOG_INFO_COLOR,
        align: 'left',
        lineSpacing: 6,
      },
    ).setOrigin(0.5, 0);
  }

  /**
   * Draws the dialog box (with the "Coach" tab) where the text is revealed.
   * @return {void}
   */
  _createDialogBox() {
    const BOX_X = 220;
    const BOX_Y = 40;
    const BOX_WIDTH = this.scale.width - BOX_X - 40;
    const BOX_HEIGHT = 380;

    this.add.rectangle(
      BOX_X,
      BOX_Y,
      120,
      40,
      STYLE_CONFIGURATION.COACH_DIALOG_BACKGROUND_COLOR,
    ).setOrigin(0).setStrokeStyle(
      2,
      0x000000,
    );

    this.add.text(
      BOX_X + 16,
      BOX_Y + 10,
      'Coach',
      {
        fontSize: STYLE_CONFIGURATION.COACH_NAME_LABEL_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.COACH_NAME_LABEL_FONT_FAMILY,
        color: STYLE_CONFIGURATION.COACH_NAME_LABEL_COLOR,
      },
    );

    this.add.rectangle(
      BOX_X,
      BOX_Y + 40,
      BOX_WIDTH,
      BOX_HEIGHT,
      STYLE_CONFIGURATION.COACH_DIALOG_BACKGROUND_COLOR,
    ).setOrigin(0).setStrokeStyle(
      2,
      0x000000,
    );

    this.dialogText = this.add.text(
      BOX_X + 24,
      BOX_Y + 70,
      '',
      {
        fontSize: STYLE_CONFIGURATION.COACH_DIALOG_TEXT_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.COACH_DIALOG_TEXT_FONT_FAMILY,
        color: STYLE_CONFIGURATION.COACH_DIALOG_TEXT_COLOR,
        wordWrap: {
          width: BOX_WIDTH - 48,
        },
      },
    );
  }

  /**
   * Appends the next word of the dialog to the text box. Once every word
   * has been revealed, the typing timer is stopped and the continue button
   * is shown.
   * @return {void}
   */
  _revealNextWord() {
    this.dialogText.setText(
      this.words.slice(0, this.wordIndex + 1).join(' '),
    );
    this.wordIndex += 1;

    if (this.wordIndex >= this.words.length) {
      this.typingTimer.remove();
      this._createContinueButton();
    };
  }

  /**
   * Shows the button that lets the player move on to the game once the
   * coach has finished talking.
   * @return {void}
   */
  _createContinueButton() {
    const BUTTON = this.add.text(
      this.scale.width - 40,
      this.scale.height - 40,
      'Continuer',
      {
        fontSize: STYLE_CONFIGURATION.COACH_CONTINUE_BUTTON_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.COACH_CONTINUE_BUTTON_FONT_FAMILY,
        color: STYLE_CONFIGURATION.COACH_CONTINUE_BUTTON_FONT_COLOR,
        backgroundColor: '#fb9339',
        padding: {
          x: 16,
          y: 8,
        },
      },
    ).setOrigin(1).setInteractive({
      useHandCursor: true,
    });

    BUTTON.on('pointerover', () => {
      BUTTON.setBackgroundColor('#fbc739');
    });
    BUTTON.on('pointerout', () => {
      BUTTON.setBackgroundColor('#fb9339');
    });
    BUTTON.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.MAP, {
        level: this.levelNumber,
      });
    });
  }
}
