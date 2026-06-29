import { STYLE_CONFIGURATION, BRAND_COLORS } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { ASSET_KEYS } from '../common/asset-keys.js';
import { Human } from '../game-objects/characters/human.js';
import { RoomStage } from '../game-objects/gameplay/room-stage.js';
import {
  globalToRoom,
  globalToLocal,
  ROOM_WIDTH,
  ROOM_HEIGHT,
  MAP_COLS,
  MAP_ROWS,
} from '../game-objects/gameplay/map.js';
import {
  buildRoomEnvironmentSprites,
  getEnvironmentRenderContext,
  getObstacleRects,
} from '../game-objects/gameplay/environment-sprites.js';
import { findAvoidingPath } from '../game-objects/gameplay/solution-pathfinder.js';
import { getLevelConfig } from '../data/levels-data.js';

const OBSTACLE_TILESETS = ['tree.tsx', 'bush.tsx', 'thornbush.tsx'];

const SOLUTION_LINE_COLOR = 0x22cc70;
const SOLUTION_LINE_WIDTH = 4;
const TRACER_SPEED = 200;
const RETURN_BUTTON_DELAY = 800;

/**
 * Replays the level with a tracer following the ideal (multi-room) trace.
 */
export class SolutionScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SOLUTION);
  }

  init(data) {
    let levelNumber;
    if (data && data.level !== undefined && data.level !== null) {
      levelNumber = data.level;
    } else {
      levelNumber = 1;
    }
    this.levelNumber = levelNumber;

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
    this.solutionGraphics = this.add.graphics();
    this.solutionGraphics.setDepth(4);

    const SOLUTIONS = this.levelConfig.solutions;
    const PICKED = SOLUTIONS[Phaser.Math.Between(0, SOLUTIONS.length - 1)];
    this.solutionData = {
      ...PICKED,
      waypoints: this._buildAvoidingWaypoints(PICKED.waypoints),
    };

    const START = this.solutionData.waypoints[0];
    const START_ROOM = globalToRoom(
      START.x,
      START.y,
    );
    const START_LOCAL = globalToLocal(
      START.x,
      START.y,
    );

    this.tracer = new Human(
      this,
      START_LOCAL.x,
      START_LOCAL.y,
    );

    this.revealedIndex = 0;
    this.revealedPartial = null;
    this.roomEntryIndex = 0;

    this._showRoom(START_ROOM);

    this._playStep(0);
  }

  /**
   * Recomputes the route between a solution's first and last waypoint so it
   * avoids every tree/bush/thornbush decoration on the map, as well as the
   * hand-drawn "collision" walls the human can't walk through either
   * during gameplay - instead of potentially cutting straight through one.
   * @param {Array<{x: number, y: number}>} waypoints
   * @return {Array<{x: number, y: number}>}
   */
  _buildAvoidingWaypoints(waypoints) {
    const OBSTACLES = [
      ...getObstacleRects(this.gidObjectLayers, this.tilesetRefs, OBSTACLE_TILESETS),
      ...this.collisionObjects,
    ];
    return findAvoidingPath(
      waypoints[0],
      waypoints[waypoints.length - 1],
      OBSTACLES,
      MAP_COLS * ROOM_WIDTH,
      MAP_ROWS * ROOM_HEIGHT,
    );
  }

  /**
   * Clips an axis-aligned segment (the waypoints are always purely
   * horizontal or vertical between each other) to a room's bounds, in
   * global coordinates.
   * @param {{x: number, y: number}} from
   * @param {{x: number, y: number}} to
   * @param {{minX: number, maxX: number, minY: number, maxY: number}} bounds
   * @return {{from: {x: number, y: number}, to: {x: number, y: number}}|null}
   */
  _clipSegmentToRoom(
    from,
    to,
    bounds,
  ) {
    if (from.x === to.x) {
      const X = from.x;
      if (X < bounds.minX || X > bounds.maxX) {
        return null;
      };

      const MIN_Y = Math.max(Math.min(from.y, to.y), bounds.minY);
      const MAX_Y = Math.min(Math.max(from.y, to.y), bounds.maxY);
      if (MIN_Y > MAX_Y) {
        return null;
      };

      const ASCENDING = from.y <= to.y;
      return {
        from: { x: X, y: ASCENDING ? MIN_Y : MAX_Y },
        to: { x: X, y: ASCENDING ? MAX_Y : MIN_Y },
      };
    };

    const Y = from.y;
    if (Y < bounds.minY || Y > bounds.maxY) {
      return null;
    };

    const MIN_X = Math.max(Math.min(from.x, to.x), bounds.minX);
    const MAX_X = Math.min(Math.max(from.x, to.x), bounds.maxX);
    if (MIN_X > MAX_X) {
      return null;
    };

    const ASCENDING = from.x <= to.x;
    return {
      from: { x: ASCENDING ? MIN_X : MAX_X, y: Y },
      to: { x: ASCENDING ? MAX_X : MIN_X, y: Y },
    };
  }

  /**
   * Clips one segment to the currently displayed room and strokes it, if
   * any part of it falls inside that room.
   * @param {{x: number, y: number}} from
   * @param {{x: number, y: number}} to
   * @param {{minX: number, maxX: number, minY: number, maxY: number}} bounds
   * @return {void}
   */
  _drawClippedSegment(
    from,
    to,
    bounds,
  ) {
    const CLIPPED = this._clipSegmentToRoom(
      from,
      to,
      bounds,
    );
    if (!CLIPPED) {
      return;
    };

    const LOCAL_FROM = globalToLocal(
      CLIPPED.from.x,
      CLIPPED.from.y,
    );
    const LOCAL_TO = globalToLocal(
      CLIPPED.to.x,
      CLIPPED.to.y,
    );

    this.solutionGraphics.beginPath();
    this.solutionGraphics.moveTo(
      LOCAL_FROM.x,
      LOCAL_FROM.y,
    );
    this.solutionGraphics.lineTo(
      LOCAL_TO.x,
      LOCAL_TO.y,
    );
    this.solutionGraphics.strokePath();
  }

  /**
   * Redraws the trace walked since entering this room (every segment from
   * `roomEntryIndex` up to `revealedIndex`, plus the in-progress partial one
   * up to `revealedPartial`), clipped to the currently displayed room.
   * Rooms are swapped instantly here, with no camera pan, so segments
   * completed before this room was entered are excluded even if they
   * geometrically intersect it - otherwise an old leg that only transited
   * through this room long before (on the way elsewhere) would render in
   * full the instant we arrive, looking like it was drawn before we got
   * here. Limiting to walked-since-entry also keeps the visible line ending
   * exactly where the tracer is, even when the full route revisits this
   * same room later from a different direction.
   * @return {void}
   */
  _drawSolutionTrace() {
    this.solutionGraphics.clear();

    const ROOM = this.roomStage.currentRoom;
    const BOUNDS = {
      minX: ROOM.col * ROOM_WIDTH,
      maxX: ROOM.col * ROOM_WIDTH + ROOM_WIDTH,
      minY: ROOM.row * ROOM_HEIGHT,
      maxY: ROOM.row * ROOM_HEIGHT + ROOM_HEIGHT,
    };
    const WAYPOINTS = this.solutionData.waypoints;

    this.solutionGraphics.lineStyle(
      SOLUTION_LINE_WIDTH,
      SOLUTION_LINE_COLOR,
      1,
    );

    for (let waypointIndex = this.roomEntryIndex; waypointIndex < this.revealedIndex; waypointIndex++) {
      this._drawClippedSegment(
        WAYPOINTS[waypointIndex],
        WAYPOINTS[waypointIndex + 1],
        BOUNDS,
      );
    };

    if (this.revealedPartial) {
      this._drawClippedSegment(
        WAYPOINTS[this.revealedIndex],
        this.revealedPartial,
        BOUNDS,
      );
    };
  }

  /**
   * Switches the displayed room and redraws the parts of the ideal trace
   * that belong to it. No physics colliders are set up here: the tracer's
   * position is hard-set every tween frame (see _moveTracerTo), so any
   * collision separation would just get overwritten by the next frame and
   * drift the tracer off the line. The route itself is already guaranteed
   * obstacle/red-flag-free by `findAvoidingPath` (solution-pathfinder.js).
   * @param {{col: number, row: number}} room
   * @return {void}
   */
  _showRoom(room) {
    this.roomStage.setRoom(
      room.col,
      room.row,
    );
    this._positionTilemapForRoom(room);
    this._buildRoomEnvironmentSprites(room);
    this.roomEntryIndex = this.revealedIndex;
    this._drawSolutionTrace();
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

    const COLLISION_LAYER = TILEMAP.getObjectLayer('collision');
    this.collisionObjects = COLLISION_LAYER ? COLLISION_LAYER.objects : [];

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
   * Shifts the tilemap layer so the room-local viewport (0..ROOM_WIDTH/
   * HEIGHT) shows the slice of the map matching the given room, mirroring
   * MapScene's behaviour exactly.
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
   * Moves the tracer from the waypoint at `index` to the next one
   * (switching rooms along the way if needed) and recurses, or shows the
   * "Retour" button once the last waypoint is reached.
   * @param {number} index
   * @return {void}
   */
  _playStep(index) {
    const WAYPOINTS = this.solutionData.waypoints;
    const WAYPOINT = WAYPOINTS[index];

    this.revealedIndex = index;
    this.revealedPartial = null;

    const WAYPOINT_ROOM = globalToRoom(
      WAYPOINT.x,
      WAYPOINT.y,
    );
    if (WAYPOINT_ROOM.col !== this.roomStage.currentRoom.col || WAYPOINT_ROOM.row !== this.roomStage.currentRoom.row) {
      this._showRoom(WAYPOINT_ROOM);
    } else {
      this._drawSolutionTrace();
    };

    const LOCAL = globalToLocal(
      WAYPOINT.x,
      WAYPOINT.y,
    );
    this.tracer.setPosition(
      LOCAL.x,
      LOCAL.y,
    );

    const NEXT = WAYPOINTS[index + 1];
    if (!NEXT) {
      this.time.delayedCall(
        RETURN_BUTTON_DELAY,
        () => {
          this._showReturnButton();
        },
      );
      return;
    };

    this._moveTracerTo(
      WAYPOINT,
      NEXT,
      index,
      () => {
        this._playStep(index + 1);
      },
    );
  }

  /**
   * Tweens the tracer from `from` to `to` (global coordinates), switching
   * rooms when the interpolated position crosses a room boundary, and
   * keeping the revealed trace in sync with the tracer's live position.
   * @param {{x: number, y: number}} from
   * @param {{x: number, y: number}} to
   * @param {number} fromIndex - index of `from` in this.solutionData.waypoints
   * @param {() => void} onComplete
   * @return {void}
   */
  _moveTracerTo(
    from,
    to,
    fromIndex,
    onComplete,
  ) {
    if (to.x < from.x) {
      this.tracer.setFlipX(true);
    } else if (to.x > from.x) {
      this.tracer.setFlipX(false);
    };

    const DISTANCE = Phaser.Math.Distance.Between(
      from.x,
      from.y,
      to.x,
      to.y,
    );

    const PROGRESS = {
      value: 0,
    };
    this.tweens.add({
      targets: PROGRESS,
      value: 1,
      duration: DISTANCE / TRACER_SPEED * 1000,
      ease: 'Linear',
      onUpdate: () => {
        const GLOBAL_X = Phaser.Math.Linear(
          from.x,
          to.x,
          PROGRESS.value,
        );
        const GLOBAL_Y = Phaser.Math.Linear(
          from.y,
          to.y,
          PROGRESS.value,
        );

        this.revealedIndex = fromIndex;
        this.revealedPartial = {
          x: GLOBAL_X,
          y: GLOBAL_Y,
        };

        const ROOM = globalToRoom(
          GLOBAL_X,
          GLOBAL_Y,
        );
        if (ROOM.col !== this.roomStage.currentRoom.col || ROOM.row !== this.roomStage.currentRoom.row) {
          this._showRoom(ROOM);
        } else {
          this._drawSolutionTrace();
        };

        const LOCAL = globalToLocal(
          GLOBAL_X,
          GLOBAL_Y,
        );
        this.tracer.setPosition(
          LOCAL.x,
          LOCAL.y,
        );
      },
      onComplete,
    });
  }

  /**
   * Shows a button to go back to the map for another attempt.
   * @return {void}
   */
  _showReturnButton() {
    const BUTTON = this.add.text(
      this.scale.width / 2,
      this.scale.height - 30,
      'Retour',
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
    BUTTON.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.MAP, {
        level: this.levelNumber,
      });
    });
  }
}
