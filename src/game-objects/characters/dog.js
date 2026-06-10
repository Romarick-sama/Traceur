import { ASSET_KEYS } from '../../common/asset-keys.js';

/**
 * Valid values for Dog.experience.
 */
export const DOG_EXPERIENCE_LEVELS = ['debutant', 'moyen', 'avance'];

/**
 * Dog accompanying the human, with profile data used by the gameplay/coaching scenes.
 */
export class Dog extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} [profile]
   * @param {string} [profile.texture=ASSET_KEYS.DOG]
   * @param {string} [profile.prenom='']
   * @param {number} [profile.age=0]
   * @param {string} [profile.race='']
   * @param {'debutant'|'moyen'|'avance'} [profile.experience='debutant']
   * @param {boolean} [profile.petitChien=false]
   */
  constructor(scene, x, y, {
    texture = ASSET_KEYS.DOG,
    prenom = '',
    age = 0,
    race = '',
    experience = 'debutant',
    petitChien = false,
  } = {}) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.prenom = prenom;
    this.age = age;
    this.race = race;
    this.experience = DOG_EXPERIENCE_LEVELS.includes(experience) ? experience : 'debutant';
    this.petitChien = petitChien;

    // Liste des red flags du chien, gérée par la classe RedFlag (pas encore implémentée).
    this.redFlags = [];
  }
}
