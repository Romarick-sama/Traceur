import { STYLECONFIG } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { Human } from '../game-objects/characters/human.js';
import { Dog } from '../game-objects/characters/dog.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GAME);
  }

  init(data) {
    this.level = data?.level ?? 1;
  }

  create() {
    this.cameras.main.setBackgroundColor(STYLECONFIG.MAIN_BACKGROUND_COLOR);

    this.human = new Human(this, this.scale.width / 2, this.scale.height / 2);
    this.dog = new Dog(this, this.scale.width / 2 + 60, this.scale.height / 2);

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    this.human.update(this.cursors);
  }
}
