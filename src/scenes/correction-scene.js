import { STYLE_CONFIGURATION, BRAND_COLORS } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { ASSET_KEYS } from '../common/asset-keys.js';
import { Dog } from '../game-objects/characters/dog.js';
import { Human } from '../game-objects/characters/human.js';
import { RoomStage } from '../game-objects/gameplay/room-stage.js';
import {
  globalToRoom,
  globalToLocal,
  ROOM_WIDTH,
  ROOM_HEIGHT,
  PIXELS_PER_METER,
} from '../game-objects/gameplay/map.js';
import { buildRoomEnvironmentSprites, getEnvironmentRenderContext } from '../game-objects/gameplay/environment-sprites.js';
import { getLevelConfig } from '../data/levels-data.js';
import { getDogProfile } from '../data/dogs-data.js';

/**
 * Replays the player's trace with the dog: the dog starts where the human
 * started and follows the recorded (multi-room) trace.
 */
export class CorrectionScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.CORRECTION);
  }

  init(data) {
    let levelNumber;
    if (data && data.level !== undefined && data.level !== null) {
      levelNumber = data.level;
    } else {
      levelNumber = 1;
    }
    this.levelNumber = levelNumber;

    let dogId;
    if (data && data.dogId !== undefined && data.dogId !== null) {
      dogId = data.dogId;
    } else {
      dogId = 1;
    }
    this.dogId = dogId;

    let playerTrace;
    if (data && data.trace !== undefined && data.trace !== null) {
      playerTrace = data.trace;
    } else {
      playerTrace = [];
    }
    this.playerTrace = playerTrace;

    let redFlags;
    if (data && data.redFlags !== undefined && data.redFlags !== null) {
      redFlags = data.redFlags;
    } else {
      redFlags = [];
    }
    this.redFlags = redFlags;

    let mapData;
    if (data) {
      mapData = data.environment;
    }
    this.mapData = mapData;
  }

  create() {
    this.levelConfig = getLevelConfig(this.levelNumber);
    this.cameras.main.setBackgroundColor(STYLE_CONFIGURATION.MAIN_BACKGROUND_COLOR);

    this.roomEnvironmentSprites = undefined;

    let mapData;
    if (this.mapData !== undefined && this.mapData !== null) {
      mapData = this.mapData;
    } else {
      mapData = {
        startRoom: {
          col: 0,
          row: 0,
        },
        rooms: new Map([['0,0', this.levelConfig.environment]]),
      };
    }
    this.mapData = mapData;

    this.roomStage = new RoomStage(this, this.mapData);
    this._createTilemap();
    this.traceGraphics = this.add.graphics();

    this._createActors();

    if (this.redFlags.length > 0 || !this._hasReachedTargetDistance()) {
      this._showResult(false);
      return;
    };

    this._playDogTrace(() => {
      this._showResult(true);
    });
  }

  /**
   * The _localPointForRoom function converts a global point to a local point within a specified room.
   * @param point - The `point` parameter represents a coordinate point in a global coordinate system.
   * @param room - The `room` parameter in the `_localPointForRoom` function represents a specific room
   * in a grid system. It likely contains information about the column (`col`) and row (`row`) of the
   * room within the grid.
   * @returns If the `POINT_ROOM` column and row do not match the `room` column and row, `null` is
   * being returned. Otherwise, the result of `globalToLocal(point.x, point.y)` is being returned.
   */
  _localPointForRoom(
    point,
    room,
  ) {
    const POINT_ROOM = globalToRoom(
      point.x,
      point.y,
    );
    if (POINT_ROOM.col !== room.col || POINT_ROOM.row !== room.row) {
      return null;
    };

    return globalToLocal(
      point.x,
      point.y,
    );
  }

  /**
   * The function _drawPlayerTrace() draws a trace line connecting points in the playerTrace array on a
   * graphics object in a game room.
   * @returns If the `this.playerTrace` array has less than 2 points or if after converting the points
   * to local coordinates there are less than 2 valid points, then the function will return early
   * without drawing anything. If the conditions are met and the trace is successfully drawn, then
   * nothing is explicitly returned from the function (implicitly `undefined` is returned).
   */
  _drawPlayerTrace() {
    this.traceGraphics.clear();
    if (this.playerTrace.length < 2) {
      return;
    };

    const ROOM = this.roomStage.currentRoom;
    const LOCAL_POINTS = this.playerTrace
      .map((point) => this._localPointForRoom(point, ROOM))
      .filter((point) => point !== null);

    if (LOCAL_POINTS.length < 2) {
      return;
    };

    this.traceGraphics.lineStyle(
      4,
      0xffffff,
      0.25,
    );
    this.traceGraphics.beginPath();
    this.traceGraphics.moveTo(
      LOCAL_POINTS[0].x,
      LOCAL_POINTS[0].y,
    );
    for (let pointIndex = 1; pointIndex < LOCAL_POINTS.length; pointIndex++) {
      this.traceGraphics.lineTo(
        LOCAL_POINTS[pointIndex].x,
        LOCAL_POINTS[pointIndex].y,
      );
    };
    this.traceGraphics.strokePath();
  }

  /**
   * The _showRoom function sets the room stage, draws the player trace, and synchronizes the ghost and
   * human elements.
   * @param room - The `room` parameter seems to represent a room object with properties `col` and
   * `row`. The `showRoom` function sets the room stage with the specified column and row values from
   * the `room` object, draws the player trace, and synchronizes the ghost and human elements.
   */
  _showRoom(room) {
    this.roomStage.setRoom(
      room.col,
      room.row,
    );
    this._positionTilemapForRoom(room);
    this._buildRoomEnvironmentSprites(room);
    this._drawPlayerTrace();
    this._syncGhostHuman();
  }

  /**
   * Builds the Tiled background map once, same as MapScene.
   * @return {void}
   */
  _createTilemap() {
    const TILEMAP = this.make.tilemap({ key: ASSET_KEYS.MAP_TILEMAP });
    const TILESET = TILEMAP.addTilesetImage('Overworld', ASSET_KEYS.MAP_TILES);
    this.tilemapLayer = TILEMAP.createLayer(0, TILESET, 0, 0).setDepth(-1);
    this.tilemap = TILEMAP;

    const CONTEXT = getEnvironmentRenderContext(this, TILEMAP, ASSET_KEYS.MAP_TILEMAP);
    this.tilesetRefs = CONTEXT.tilesetRefs;
    this.decorationTilesByGid = CONTEXT.decorationTilesByGid;
    this.gidObjectLayers = CONTEXT.gidObjectLayers;
  }

  /**
   * (Re)builds the Environment/WorldBorder decoration sprites for the
   * given room, same rendering as MapScene's gameplay.
   * @param {{col: number, row: number}} room
   * @return {void}
   */
  _buildRoomEnvironmentSprites(room) {
    if (this.roomEnvironmentSprites) {
      this.roomEnvironmentSprites.forEach((sprite) => sprite.destroy());
    };

    this.roomEnvironmentSprites = buildRoomEnvironmentSprites(this, room, {
      tilemap: this.tilemap,
      gidObjectLayers: this.gidObjectLayers,
      tilesetRefs: this.tilesetRefs,
      decorationTilesByGid: this.decorationTilesByGid,
    });
  }

  /**
   * Shifts the tilemap layer so the room-local viewport shows the slice of
   * the map matching the given room, mirroring MapScene's behaviour.
   * @param {{col: number, row: number}} room
   * @return {void}
   */
  _positionTilemapForRoom(room) {
    this.tilemapLayer.setPosition(
      -room.col * ROOM_WIDTH,
      -room.row * ROOM_HEIGHT,
    );
  }

  /**
   * The _syncGhostHuman function creates or updates a Human object based on the position of a
   * ghostGlobal object within a room.
   * @returns If the `ghostGlobal` property is falsy, the function will return early without performing
   * any further actions. If the local point for the ghostGlobal in the current room is not found
   * (`LOCAL` is falsy), and there is an existing `ghostHuman`, it will be destroyed and set to null
   * before returning. Otherwise, if `ghostHuman` doesn't exist, a new `Human`
   */
  _syncGhostHuman() {
    if (!this.ghostGlobal) {
      return;
    };

    const ROOM = this.roomStage.currentRoom;
    const LOCAL = this._localPointForRoom(this.ghostGlobal, ROOM);

    if (!LOCAL) {
      if (this.ghostHuman) {
        this.ghostHuman.destroy();
        this.ghostHuman = null;
      };
      return;
    };

    if (!this.ghostHuman) {
      this.ghostHuman = new Human(
        this,
        LOCAL.x,
        LOCAL.y,
      );
      this.ghostHuman.setAlpha(0.6);
    } else {
      this.ghostHuman.setPosition(
        LOCAL.x,
        LOCAL.y,
      );
    };
  }

  /**
   * Checks the player's actual displacement: the straight-line distance
   * (in meters) between where the trace started and where it ended, in
   * global coordinates - so it's measured correctly whether the human
   * stayed in the spawn room or wandered into a completely different one.
   * Walking back and forth without net distance, or hiding too close to
   * the spawn point, doesn't satisfy the level's targetDistance even with
   * zero red flags.
   * @return {boolean}
   */
  _hasReachedTargetDistance() {
    if (this.playerTrace.length < 2) {
      return false;
    };

    const START = this.playerTrace[0];
    const END = this.playerTrace[this.playerTrace.length - 1];
    const DISPLACEMENT_METERS = Phaser.Math.Distance.Between(
      START.x,
      START.y,
      END.x,
      END.y,
    ) / PIXELS_PER_METER;

    return DISPLACEMENT_METERS >= this.levelConfig.targetDistance;
  }

  /**
   * The function `_createActors` initializes actors in a game, such as a player character and a dog,
   * based on certain conditions and configurations.
   */
  _createActors() {
    let start;
    if (this.playerTrace[0] !== undefined && this.playerTrace[0] !== null) {
      start = this.playerTrace[0];
    } else {
      start = this.levelConfig.human;
    }
    const START = start;

    let end;
    if (this.playerTrace[this.playerTrace.length - 1] !== undefined && this.playerTrace[this.playerTrace.length - 1] !== null) {
      end = this.playerTrace[this.playerTrace.length - 1];
    } else {
      end = this.levelConfig.human;
    }
    this.ghostGlobal = end;

    const START_ROOM = globalToRoom(
      START.x,
      START.y,
    );
    const START_LOCAL = globalToLocal(
      START.x,
      START.y,
    );

    this._showRoom(START_ROOM);

    this.dog = new Dog(
      this,
      START_LOCAL.x,
      START_LOCAL.y,
      getDogProfile(this.dogId),
    );
  }

  /**
   * Animates the dog along the player's (multi-room) trace.
   * @param {() => void} onComplete
   * @return {void}
   */
  _playDogTrace(onComplete) {
    const POINTS = this.playerTrace;
    const DISTANCES = [0];
    for (let pointIndex = 1; pointIndex < POINTS.length; pointIndex++) {
      DISTANCES.push(DISTANCES[pointIndex - 1] + Phaser.Math.Distance.Between(
        POINTS[pointIndex - 1].x,
        POINTS[pointIndex - 1].y,
        POINTS[pointIndex].x,
        POINTS[pointIndex].y,
      ));
    };
    const TOTAL_DISTANCE = DISTANCES[DISTANCES.length - 1];
    const DOG_SPEED = 200;

    const PROGRESS = {
      value: 0,
    };
    this.tweens.add({
      targets: PROGRESS,
      value: 1,
      duration: (TOTAL_DISTANCE / DOG_SPEED) * 1000,
      ease: 'Linear',
      onUpdate: () => {
        this._moveDogAlong(
          POINTS,
          DISTANCES,
          TOTAL_DISTANCE,
          PROGRESS.value,
        );
      },
      onComplete,
    });
  }

  /**
   * Positions the dog at the point of the trace corresponding to the given
   * progress (0 to 1), switching rooms if needed, and flips it to face its
   * movement direction.
   * @param {Array<{x: number, y: number}>} points
   * @param {number[]} distances
   * @param {number} totalDistance
   * @param {number} progress
   * @return {void}
   */
  _moveDogAlong(
    points,
    distances,
    totalDistance,
    progress,
  ) {
    const TARGET_DISTANCE = totalDistance * progress;

    let index = 0;
    while (index < distances.length - 2 && distances[index + 1] < TARGET_DISTANCE) {
      index++;
    };

    const SEGMENT_START = points[index];

    let segmentEnd;
    if (points[index + 1] !== undefined && points[index + 1] !== null) {
      segmentEnd = points[index + 1];
    } else {
      segmentEnd = SEGMENT_START;
    }
    const SEGMENT_END = segmentEnd;

    const SEGMENT_LENGTH = distances[index + 1] - distances[index] || 1;
    const SEGMENT_PROGRESS = (TARGET_DISTANCE - distances[index]) / SEGMENT_LENGTH;

    const GLOBAL_X = Phaser.Math.Linear(
      SEGMENT_START.x,
      SEGMENT_END.x,
      SEGMENT_PROGRESS,
    );
    const GLOBAL_Y = Phaser.Math.Linear(
      SEGMENT_START.y,
      SEGMENT_END.y,
      SEGMENT_PROGRESS,
    );

    const ROOM = globalToRoom(
      GLOBAL_X,
      GLOBAL_Y,
    );
    if (ROOM.col !== this.roomStage.currentRoom.col || ROOM.row !== this.roomStage.currentRoom.row) {
      this._showRoom(ROOM);
    };

    const LOCAL = globalToLocal(
      GLOBAL_X,
      GLOBAL_Y,
    );

    if (LOCAL.x < this.dog.x) {
      this.dog.setFlipX(true);
    } else if (LOCAL.x > this.dog.x) {
      this.dog.setFlipX(false);
    };

    this.dog.setPosition(
      LOCAL.x,
      LOCAL.y,
    );
  }

  /**
   * Shows the result panel: failure (red flag, dog stays in place) or
   * success (dog reached the human).
   * @param {boolean} success
   * @return {void}
   */
  _showResult(success) {
    let title;
    if (success) {
      title = 'Bravo, le chien a réussi à retrouver l\'humain caché grâce à un tracé qui correspond au chien !';
    } else if (this.redFlags.length > 0) {
      title = `Oups, le tracé comprend ${this.redFlags.map((flag) => flag.message).join(' ')} donc le chien n'a pas réussi à trouver l'humain.`;
    } else {
      title = 'Oups, le tracé est trop court pour donner au chien une piste claire à suivre.';
    }
    const TITLE = title;

    let color;
    if (success) {
      color = STYLE_CONFIGURATION.END_SCENE_SUCCESS_COLOR;
    } else {
      color = STYLE_CONFIGURATION.END_SCENE_FAIL_COLOR;
    }
    const COLOR = color;

    const CONTAINER = this.add.container(
      0,
      0,
    );

    const TITLE_TEXT = this.add.text(
      this.scale.width / 2,
      this.scale.height - 150,
      TITLE,
      {
        fontSize: STYLE_CONFIGURATION.MAIN_MESSAGE_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.MAIN_MESSAGE_FONT_FAMILY,
        color: COLOR,
        align: 'center',
        wordWrap: {
          width: this.scale.width - 80,
        },
      },
    ).setOrigin(0.5);
    CONTAINER.add(TITLE_TEXT);

    const BUTTON_Y = this.scale.height - 70;
    const BUTTONS = [];

    BUTTONS.push(this._createButton(
      0,
      BUTTON_Y,
      'Recommencer',
      () => {
        this.scene.start(SCENE_KEYS.MAP, {
          level: this.levelNumber,
          dogId: this.dogId,
        });
      },
    ));

    BUTTONS.push(this._createButton(
      0,
      BUTTON_Y,
      'Voir la solution',
      () => {
        this.scene.start(SCENE_KEYS.SOLUTION, {
          level: this.levelNumber,
          environment: this.mapData,
        });
      },
    ));

    if (success) {
      BUTTONS.push(this._createButton(
        0,
        BUTTON_Y,
        'Chien suivant !',
        () => {
          this.scene.start(SCENE_KEYS.COACH, {
            level: this.levelNumber + 1,
            dogId: this.dogId,
          });
        },
      ));
    };

    const SPACING = (this.scale.width - 40) / BUTTONS.length;
    BUTTONS.forEach((
      button,
      index,
    ) => {
      button.setPosition(
        40 + SPACING * (index + 0.5),
        BUTTON_Y,
      );
      CONTAINER.add(button);
    });
  }

  /**
   * Creates a simple text button.
   * @param {number} x
   * @param {number} y
   * @param {string} label
   * @param {() => void} onClick
   * @return {Phaser.GameObjects.Text}
   */
  _createButton(
    x,
    y,
    label,
    onClick,
  ) {
    const BUTTON = this.add.text(
      x,
      y,
      label,
      {
        fontSize: STYLE_CONFIGURATION.RETRY_BUTTON_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.RETRY_BUTTON_FONT_FAMILY,
        color: STYLE_CONFIGURATION.RETRY_BUTTON_FONT_COLOR,
        fontStyle: STYLE_CONFIGURATION.RETRY_BUTTON_FONT_STYLE,
        backgroundColor: BRAND_COLORS.YELLOW,
        padding: {
          x: 12,
          y: 8,
        },
        align: 'center',
      },
    ).setOrigin(0.5).setInteractive({
      useHandCursor: true,
    });

    BUTTON.on('pointerover', () => {
      BUTTON.setBackgroundColor(BRAND_COLORS.ORANGE);
    });
    BUTTON.on('pointerout', () => {
      BUTTON.setBackgroundColor(BRAND_COLORS.YELLOW);
    });
    BUTTON.on('pointerdown', onClick);

    return BUTTON;
  }
}
