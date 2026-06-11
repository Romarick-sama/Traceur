/**
 * Trail of points left behind a moving entity, drawn as a line.
 */
export class Trace {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} [options]
   * @param {number} [options.minDistance=8] - minimum distance between two recorded points
   * @param {number} [options.maxPoints=5000] - maximum number of points kept in the trace
   * @param {number} [options.color=0xff9060] - line color
   * @param {number} [options.lineWidth=2] - line width
   */
  constructor(
    scene,
    {
      minDistance = 8,
      maxPoints = 5000,
      color = 0xff9060,
      lineWidth = 10,
    } = {},
  ) {
    this.scene = scene;
    this.minDistance = minDistance;
    this.maxPoints = maxPoints;
    this.color = color;
    this.lineWidth = lineWidth;
    this.points = [];
    this.graphics = scene.add.graphics();
  }

  /**
   * Adds a point to the trace if it is far enough from the last one, then redraws.
   * @param {number} x
   * @param {number} y
   * @return {void}
   */
  addPoint(
    x,
    y,
  ) {
    const LAST = this.points[this.points.length - 1];
    if (LAST) {
      const DIST = Phaser.Math.Distance.Between(
        LAST.x,
        LAST.y,
        x,
        y,
      );
      if (DIST < this.minDistance) {
        return;
      };
    };

    this.points.push({
      x,
      y,
    });
    if (this.points.length > this.maxPoints) {
      this.points.shift();
    };
    this._draw();
  }

  /**
   * Redraws the trace line from the recorded points.
   * @return {void}
   */
  _draw() {
    this.graphics.clear();
    if (this.points.length < 2) {
      return;
    };

    this.graphics.lineStyle(
      this.lineWidth,
      this.color,
      1,
    );
    this.graphics.beginPath();
    this.graphics.moveTo(
      this.points[0].x,
      this.points[0].y,
    );
    for (let i = 1; i < this.points.length; i++) {
      this.graphics.lineTo(
        this.points[i].x,
        this.points[i].y,
      );
    };
    this.graphics.strokePath();
  }

  /**
   * Removes all recorded points and clears the drawn line.
   * @return {void}
   */
  clear() {
    this.points = [];
    this.graphics.clear();
  }

  /**
   * Destroys the underlying graphics object.
   * @return {void}
   */
  destroy() {
    this.graphics.destroy();
  }
}
