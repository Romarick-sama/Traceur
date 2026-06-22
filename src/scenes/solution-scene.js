import { STYLE_CONFIGURATION, BRAND_COLORS } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { Human } from '../game-objects/characters/human.js';
import { RoomStage } from '../game-objects/gameplay/room-stage.js';
import {
  globalToRoom,
  globalToLocal,
  ROOM_WIDTH,
  ROOM_HEIGHT,
} from '../game-objects/gameplay/map.js';
import { getLevelConfig } from '../data/levels-data.js';

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

    let solutionData;
    if (data) {
      solutionData = data.solution;
    }
    this.solutionData = solutionData;
  }

  create() {
    this.levelConfig = getLevelConfig(this.levelNumber);
    this.cameras.main.setBackgroundColor(STYLE_CONFIGURATION.MAIN_BACKGROUND_COLOR);

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

    let solutionData;
    if (this.solutionData !== undefined && this.solutionData !== null) {
      solutionData = this.solutionData;
    } else {
      solutionData = this.levelConfig.solution;
    }
    this.solutionData = solutionData;

    this.roomStage = new RoomStage(this, this.mapData);
    this.solutionGraphics = this.add.graphics();

    const START = this.solutionData.waypoints[0];
    const START_ROOM = globalToRoom(
      START.x,
      START.y,
    );
    const START_LOCAL = globalToLocal(
      START.x,
      START.y,
    );

    this._showRoom(START_ROOM);

    this.tracer = new Human(
      this,
      START_LOCAL.x,
      START_LOCAL.y,
    );

    this._playStep(0);
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
   * Redraws the ideal trace, clipping every waypoint-to-waypoint segment to
   * the currently displayed room so straight runs crossing several rooms
   * still draw in each of them (not just the rooms containing a corner).
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

    for (let waypointIndex = 0; waypointIndex < WAYPOINTS.length - 1; waypointIndex++) {
      const CLIPPED = this._clipSegmentToRoom(
        WAYPOINTS[waypointIndex],
        WAYPOINTS[waypointIndex + 1],
        BOUNDS,
      );
      if (!CLIPPED) {
        continue;
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
    };
  }

  /**
   * Switches the displayed room and redraws the parts of the ideal trace
   * that belong to it.
   * @param {{col: number, row: number}} room
   * @return {void}
   */
  _showRoom(room) {
    this.roomStage.setRoom(
      room.col,
      room.row,
    );
    this._drawSolutionTrace();
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

    const WAYPOINT_ROOM = globalToRoom(
      WAYPOINT.x,
      WAYPOINT.y,
    );
    if (WAYPOINT_ROOM.col !== this.roomStage.currentRoom.col || WAYPOINT_ROOM.row !== this.roomStage.currentRoom.row) {
      this._showRoom(WAYPOINT_ROOM);
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
      () => {
        this._playStep(index + 1);
      },
    );
  }

  /**
   * Tweens the tracer from `from` to `to` (global coordinates), switching
   * rooms when the interpolated position crosses a room boundary.
   * @param {{x: number, y: number}} from
   * @param {{x: number, y: number}} to
   * @param {() => void} onComplete
   * @return {void}
   */
  _moveTracerTo(
    from,
    to,
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
