import { Trace } from './trace.js';

/**
 * Base class for a level's ideal solution: the trace the player should have
 * drawn, replayed during the correction with explanations. Each level
 * should extend this class and provide its own waypoints (and optionally
 * its own explanations) since the ideal trace differs from one level to
 * another.
 */
export class Solution {
  /**
   * @param {Phaser.Scene} scene
   * @param {Array<{x: number, y: number}>} [waypoints=[]] - ordered points of the ideal trace
   * @param {object} [options]
   * @param {number} [options.color=0x22cc70] - color of the ideal trace
   * @param {number} [options.lineWidth=4] - line width of the ideal trace
   */
  constructor(
    scene,
    waypoints = [],
    {
      color = 0x22cc70,
      lineWidth = 4,
    } = {},
  ) {
    this.scene = scene;
    this.waypoints = waypoints;
    this.trace = new Trace(scene, {
      color,
      lineWidth,
    });
  }

  /**
   * Draws the whole ideal trace at once.
   * @return {void}
   */
  draw() {
    this.trace.clear();
    this.waypoints.forEach(({
      x,
      y,
    }) => this.trace.addPoint(
      x,
      y,
    ));
  }

  /**
   * Returns the explanation to display for the given waypoint index.
   * Levels override this to provide their own texts.
   * @param {number} index
   * @return {string}
   */
  getExplanation(index) {
    return '';
  }

  /**
   * Removes the drawn trace.
   * @return {void}
   */
  clear() {
    this.trace.clear();
  }

  /**
   * Destroys the underlying trace.
   * @return {void}
   */
  destroy() {
    this.trace.destroy();
  }
}
