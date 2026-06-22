import { STYLE_CONFIGURATION } from './common/style-config.js';
import { PreloadScene } from './scenes/preload-scene.js';
import { IntroScene } from './scenes/intro-scene.js';
import { DogChoiceScene } from './scenes/dog-choice-scene.js';
import { LevelChoiceScene } from './scenes/level-choice-scene.js';
import { CoachScene } from './scenes/coach-scene.js';
import { MapScene } from './scenes/map-scene.js';
import { CorrectionScene } from './scenes/correction-scene.js';
import { SolutionScene } from './scenes/solution-scene.js';

const CONFIG = {
  type: Phaser.AUTO,
  width: STYLE_CONFIGURATION.WIDTH,
  height: STYLE_CONFIGURATION.HEIGHT,
  backgroundColor: STYLE_CONFIGURATION.MAIN_BACKGROUND_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 0,
      },
      debug: true,
    },
  },
  scene: [
    PreloadScene,
    IntroScene,
    DogChoiceScene,
    LevelChoiceScene,
    CoachScene,
    MapScene,
    CorrectionScene,
    SolutionScene,
  ],
};

new Phaser.Game(CONFIG);
