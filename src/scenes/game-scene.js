import { STYLECONFIG } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { Level } from '../game-objects/gameplay/level.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GAME);
  }

  init(data) {
    this.levelNumber = data?.level ?? 1;
  }

  create() {
    this.cameras.main.setBackgroundColor(STYLECONFIG.MAIN_BACKGROUND_COLOR);

    this.level = new Level(this, {
      human: { x: this.scale.width / 2, y: this.scale.height / 2 },
      dog: { x: this.scale.width / 2 + 160, y: this.scale.height / 2 },
      environment: [
        { type: 'BUSH', x: this.scale.width / 2 - 160, y: this.scale.height / 2 },
        { type: 'THORN_BUSH', x: this.scale.width / 2 + 160, y: this.scale.height / 2 - 160 },
        { type: 'TREE', x: this.scale.width / 2 - 160, y: this.scale.height / 2 - 160 },
      ],
    });
    this.level.create();

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    this.level.update(this.cursors);
  }
}
