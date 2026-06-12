import { Level } from './level.js';
import { getRoomEnvironment } from './map.js';


/* The RoomStage class manages the creation and destruction of levels for different rooms in a game
based on map data. */
export class RoomStage {
  /**
   * @param {Phaser.Scene} scene
   * @param {{rooms: Map<string, Array>}} mapData
   */
  constructor(
    scene,
    mapData,
  ) {
    this.scene = scene;
    this.mapData = mapData;
    this.level = null;
    this.currentRoom = null;
  }

  /**
   * Destroys the previous room's level (if any) and builds the level for
   * the given room.
   * @param {number} col
   * @param {number} row
   * @return {Level}
   */
  setRoom(
    col,
    row,
  ) {
    if (this.level) {
      this.level.destroy();
    };

    this.level = new Level(
      this.scene,
      {
        environment: getRoomEnvironment(
          this.mapData,
          col,
          row,
        ),
      },
    );
    this.level.create();
    this.currentRoom = {
      col,
      row,
    };

    return this.level;
  }
}
