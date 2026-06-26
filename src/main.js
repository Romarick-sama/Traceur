import { STYLE_CONFIGURATION } from './common/style-config.js';
import { buildMapTiledJson } from './common/tmx-loader.js';
import { PreloadScene } from './scenes/preload-scene.js';
import { IntroScene } from './scenes/intro-scene.js';
import { DogChoiceScene } from './scenes/dog-choice-scene.js';
import { LevelChoiceScene } from './scenes/level-choice-scene.js';
import { CoachScene } from './scenes/coach-scene.js';
import { MapScene } from './scenes/map-scene.js';
import { CorrectionScene } from './scenes/correction-scene.js';
import { SolutionScene } from './scenes/solution-scene.js';

/**
 * Converts the Tiled map live (map1.tmx -> JSON) before the game boots, so
 * editing the map in Tiled is reflected in-game without a manual build
 * step. The HTML "#loading" overlay covers this fetch/parse in case it
 * takes a noticeable amount of time.
 * @return {Promise<void>}
 */
async function start() {
  const LOADING_EL = document.getElementById('loading');
  LOADING_EL.style.display = 'flex';

  const { mapJson: MAP_JSON, decorationAssets: DECORATION_ASSETS } = await buildMapTiledJson();

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
        debug: false,
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
    callbacks: {
      preBoot: (game) => {
        game.registry.set('mapJson', MAP_JSON);
        game.registry.set('decorationAssets', DECORATION_ASSETS);
      },
    },
  };

  new Phaser.Game(CONFIG);
  LOADING_EL.style.display = 'none';
}

start();
