import { STYLECONFIG } from './StyleConfig.js';
import Map from './scenes/map.js';
import IntroScene from './scenes/introScene.js';

const CONFIG = {
  type: Phaser.AUTO,
  width: STYLECONFIG.WIDTH,
  height: STYLECONFIG.HEIGHT,
  backgroundColor: STYLECONFIG.MAIN_BACKGROUND_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [IntroScene, LevelChoiceScene, Map],
};

new Phaser.Game(CONFIG);
