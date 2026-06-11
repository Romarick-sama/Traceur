import { STYLECONFIG } from './common/style-config.js';
import { PreloadScene } from './scenes/preload-scene.js';
import { IntroScene } from './scenes/intro-scene.js';
import { LevelChoiceScene } from './scenes/level-choice-scene.js';
import { MapScene } from './scenes/map-scene.js';
import { CorrectionScene } from './scenes/correction-scene.js';
import { SolutionScene } from './scenes/solution-scene.js';

const CONFIG = {
  type: Phaser.AUTO,
  width: STYLECONFIG.WIDTH,
  height: STYLECONFIG.HEIGHT,
  backgroundColor: STYLECONFIG.MAIN_BACKGROUND_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: true,
    },
  },
  scene: [PreloadScene, IntroScene, LevelChoiceScene, MapScene, CorrectionScene, SolutionScene],
};

new Phaser.Game(CONFIG);
