import { STYLE_CONFIGURATION, BRAND_COLORS } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { Human } from '../game-objects/characters/human.js';
import { RoomStage } from '../game-objects/gameplay/room-stage.js';
import { globalToRoom, globalToLocal } from '../game-objects/gameplay/map.js';
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
   * Returns the waypoint in local coordinates relative to the given room, or
   * `null` if the waypoint does not belong to that room.
   * @param {{x: number, y: number}} point
   * @param {{col: number, row: number}} room
   * @return {{x: number, y: number}|null}
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
   * Redraws the ideal trace, keeping only the segments that belong to the
   * currently displayed room.
   * @return {void}
   */
  _drawSolutionTrace() {
    this.solutionGraphics.clear();

    const ROOM = this.roomStage.currentRoom;
    const WAYPOINTS = this.solutionData.waypoints;
    const LOCAL_POINTS = WAYPOINTS
      .map((point) => this._localPointForRoom(point, ROOM))
      .filter((point) => point !== null);

    if (LOCAL_POINTS.length < 2) {
      return;
    };

    this.solutionGraphics.lineStyle(
      SOLUTION_LINE_WIDTH,
      SOLUTION_LINE_COLOR,
      1,
    );
    this.solutionGraphics.beginPath();
    this.solutionGraphics.moveTo(
      LOCAL_POINTS[0].x,
      LOCAL_POINTS[0].y,
    );
    for (let pointIndex = 1; pointIndex < LOCAL_POINTS.length; pointIndex++) {
      this.solutionGraphics.lineTo(
        LOCAL_POINTS[pointIndex].x,
        LOCAL_POINTS[pointIndex].y,
      );
    };
    this.solutionGraphics.strokePath();
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
