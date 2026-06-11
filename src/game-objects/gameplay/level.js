import { Human } from '../characters/human.js';
import { Dog } from '../characters/dog.js';
import { Bush } from '../environment/bush.js';
import { ThornBush } from '../environment/thorn-bush.js';
import { Tree } from '../environment/tree.js';
import { getRedFlags } from './red-flag.js';

/**
 * Maps environment layout types to their game-object class.
 */
const ENVIRONMENT_CLASSES = {
  TREE: Tree,
  BUSH: Bush,
  THORN_BUSH: ThornBush,
};

/**
 * Base class holding the common setup of a level: human, dog and environment
 * objects. Specific levels can extend this class to override `create()` or
 * add their own specificities (red flags, target distance, etc).
 */
export class Level {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} [config]
   * @param {{x: number, y: number, texture?: string}} [config.human]
   * @param {{x: number, y: number} & object} [config.dog] - dog spawn position and profile
   * @param {Array<{type: keyof typeof ENVIRONMENT_CLASSES, x: number, y: number}>} [config.environment]
   * @param {number} [config.targetDistance=0] - minimum trace length expected for this level
   */
  constructor(
    scene,
    {
      human = null,
      dog = null,
      environment = [],
      targetDistance = 0,
    } = {},
  ) {
    this.scene = scene;
    this.humanConfig = human;
    this.dogConfig = dog;
    this.environmentConfig = environment;
    this.targetDistance = targetDistance;

    this.human = null;
    this.dog = null;
    this.environment = [];
    this.obstacles = scene.physics.add.staticGroup();
  }

  /**
   * Creates the human, the dog and the environment objects, then sets up
   * the colliders between the human and the non-traversable obstacles.
   * @return {void}
   */
  create() {
    this._createHuman();
    this._createDog();
    this._createEnvironment();
    this._setupColliders();
  }

  /**
   * Instantiates the player-controlled human at its configured position.
   * @return {void}
   */
  _createHuman() {
    if (!this.humanConfig) {
      return;
    };

    const { x, y, texture } = this.humanConfig;
    let human;
    if (texture) {
      human = new Human(
        this.scene,
        x,
        y,
        texture,
      );
    } else {
      human = new Human(
        this.scene,
        x,
        y,
      );
    }
    this.human = human;
  }

  /**
   * Instantiates the dog accompanying the human at its configured position.
   * @return {void}
   */
  _createDog() {
    if (!this.dogConfig) {
      return;
    };

    const { x, y, ...profile } = this.dogConfig;
    this.dog = new Dog(
      this.scene,
      x,
      y,
      profile,
    );
  }

  /**
   * Instantiates every environment object described in the layout. Trees
   * and thorn bushes are added to the obstacles group as they are not
   * traversable, bushes are not (they can be crossed).
   * @return {void}
   */
  _createEnvironment() {
    this.environmentConfig.forEach(({
      type,
      x,
      y,
    }) => {
      const ENVIRONMENT_CLASS = ENVIRONMENT_CLASSES[type];
      if (!ENVIRONMENT_CLASS) {
        return;
      };

      const OBJECT = new ENVIRONMENT_CLASS(
        this.scene,
        x,
        y,
      );
      OBJECT.type = type;
      this.environment.push(OBJECT);

      if (ENVIRONMENT_CLASS !== Bush) {
        this.obstacles.add(OBJECT);
      };
    });
  }

  /**
   * Sets up the collider between the human and the non-traversable
   * environment objects (trees, thorn bushes), and an overlap with the
   * traversable ones (eg. bushes) so they are recorded even if the human
   * walks straight through them.
   * @return {void}
   */
  _setupColliders() {
    if (!this.human) {
      return;
    };

    this.scene.physics.add.collider(
      this.human,
      this.obstacles,
    );

    this.environment.forEach((object) => {
      if (this.obstacles.contains(object)) {
        return;
      };

      this.scene.physics.add.overlap(
        this.human,
        object,
        () => {
          this.human.collidedWithGameObject(object);
        },
      );
    });
  }

  /**
   * Returns the red flags triggered by the objects the human has touched
   * or passed through during the level.
   * @return {Array<{id: string, message: string}>}
   */
  getRedFlags() {
    if (!this.human) {
      return [];
    };

    return getRedFlags(this.human.collidedObjects);
  }

  /**
   * Updates the human according to the cursor input.
   * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors
   * @return {void}
   */
  update(cursors) {
    if (this.human) {
      this.human.update(cursors);
    }
  }

  /**
   * Returns every environment object of the given type.
   * @param {keyof typeof ENVIRONMENT_CLASSES} type
   * @return {Phaser.Physics.Arcade.Image[]}
   */
  getEnvironmentByType(type) {
    const ENVIRONMENT_CLASS = ENVIRONMENT_CLASSES[type];
    return this.environment.filter((object) => object instanceof ENVIRONMENT_CLASS);
  }

  /**
   * Destroys the human, the dog and every environment object of the level.
   * @return {void}
   */
  destroy() {
    if (this.human) {
      this.human.trace.destroy();
      this.human.destroy();
    }
    if (this.dog) {
      this.dog.destroy();
    }
    this.environment.forEach((object) => object.destroy());
    this.environment = [];
    this.obstacles.clear(true, true);
  }
}
