import { STYLE_CONFIGURATION } from '../common/style-config.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { ASSET_KEYS } from '../common/asset-keys.js';
import { Human } from '../game-objects/characters/human.js';
import { VirtualJoystick } from '../ui/virtual-joystick.js';
import { RoomStage } from '../game-objects/gameplay/room-stage.js';
import {
  buildMapData,
  getRoomCollisionRects,
  ROOM_WIDTH,
  ROOM_HEIGHT,
  MAP_COLS,
  MAP_ROWS,
  PIXELS_PER_METER,
} from '../game-objects/gameplay/map.js';
import { getLevelConfig } from '../data/levels-data.js';

const TRACE_MIN_DISTANCE = 8;
const ROOM_TRANSITION_FLASH_DURATION = 120;

export class MapScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MAP);
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
  }

  create() {
    this.cameras.main.setBackgroundColor(STYLE_CONFIGURATION.MAIN_BACKGROUND_COLOR);
    this.levelConfig = getLevelConfig(this.levelNumber);

    this._showLoading();

    this.time.delayedCall(
      0,
      () => {
        this._buildLevel();
      },
    );
  }

  /**
   * Displays a loading message while the level is being built.
   * @return {void}
   */
  _showLoading() {
    this.loadingText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'Chargement du niveau...',
      {
        fontSize: STYLE_CONFIGURATION.STEP_HUD_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.STEP_HUD_FONT_FAMILY,
        color: STYLE_CONFIGURATION.STEP_HUD_COLOR,
      },
    ).setOrigin(0.5);
  }

  /**
   * Builds the static, dungeon-style level: a fixed grid of screen-sized
   * rooms (no camera scroll), the Tiled map as background, the human and
   * the level's fixed environment.
   * @return {void}
   */
  _buildLevel() {
    this.mapData = buildMapData(this.levelConfig);

    this.loadingText.destroy();

    this._createTilemap();

    this.roomStage = new RoomStage(this, this.mapData);
    this.roomStage.setRoom(
      this.mapData.startRoom.col,
      this.mapData.startRoom.row,
    );
    this._positionTilemapForRoom(this.mapData.startRoom);

    this.human = new Human(
      this,
      this.mapData.startLocal.x,
      this.mapData.startLocal.y,
      ASSET_KEYS.HUMAN,
      160,
      false,
    );
    this.roomStage.level.setupCollidersFor(this.human);
    this._buildRoomColliders(this.mapData.startRoom);
    this._buildRoomEnvironmentSprites(this.mapData.startRoom);

    this.globalTrace = [];
    this.distanceTraveledPx = 0;
    this._recordTracePoint();

    this.cursors = this.input.keyboard.createCursorKeys();
    if (this.sys.game.device.input.touch) {
      this.joystick = new VirtualJoystick(this);
    };

    this._createHideButton();
    this._createDistanceCounter();
  }

  /**
   * Builds the Tiled background map and places it behind everything else.
   * @return {void}
   */
  _createTilemap() {
    const TILEMAP = this.make.tilemap({ key: ASSET_KEYS.MAP_TILEMAP });
    const TILESET = TILEMAP.addTilesetImage('Overworld', ASSET_KEYS.MAP_TILES);
    this.tilemapLayer = TILEMAP.createLayer(0, TILESET, 0, 0).setDepth(-1);
    this.tilemap = TILEMAP;

    const COLLISION_LAYER = TILEMAP.getObjectLayer('collision');
    this.collisionObjects = COLLISION_LAYER ? COLLISION_LAYER.objects : [];

    const TILEMAP_DATA = this.cache.tilemap.get(ASSET_KEYS.MAP_TILEMAP).data;
    this.tilesetRefs = TILEMAP_DATA.tilesetRefs;
    this.decorationTilesByGid = TILEMAP_DATA.decorationTilesByGid;
    this.gidObjectLayers = ['WorldBorder', 'Environment']
      .map((name) => TILEMAP.getObjectLayer(name))
      .filter(Boolean);
  }

  /**
   * Finds which tileset reference (Overworld vs the standalone
   * tree/bush/thornbush tilesets) a tile object's gid belongs to, based on
   * the highest firstgid not exceeding the gid.
   * @param {number} gid
   * @return {{firstgid: number, source: string}|undefined}
   */
  _getTilesetRefForGid(gid) {
    return [...this.tilesetRefs]
      .sort((a, b) => b.firstgid - a.firstgid)
      .find((ref) => gid >= ref.firstgid);
  }

  /**
   * (Re)builds the invisible static collider rectangles for the given room
   * from the Tiled "collision" object layer (hitboxes drawn by hand in
   * Tiled, instead of hardcoded pixel coords in JS), and sets up the
   * collider against the human.
   * @param {{col: number, row: number}} room
   * @return {void}
   */
  _buildRoomColliders(room) {
    if (this.roomColliders) {
      this.roomColliders.clear(true, true);
    };
    if (this.roomBushZones) {
      this.roomBushZones.forEach((zone) => zone.destroy());
    };

    this.roomColliders = this.physics.add.staticGroup();
    this.roomBushZones = [];

    const BUSH_RECTS = this._getBushRectsForRoom(room);
    const isInsideBush = (rect) => {
      const CENTER_X = rect.x + rect.width / 2;
      const CENTER_Y = rect.y + rect.height / 2;
      return BUSH_RECTS.some((bush) => CENTER_X >= bush.x && CENTER_X <= bush.x + bush.width
        && CENTER_Y >= bush.y && CENTER_Y <= bush.y + bush.height);
    };

    getRoomCollisionRects(this.collisionObjects, room.col, room.row).forEach((rect) => {
      if (isInsideBush(rect)) {
        return;
      };

      const BODY = this.add.rectangle(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        rect.width,
        rect.height,
      ).setVisible(false);
      this.physics.add.existing(BODY, true);
      this.roomColliders.add(BODY);
    });

    BUSH_RECTS.forEach((bush) => {
      const BODY = this.add.rectangle(
        bush.x + bush.width / 2,
        bush.y + bush.height / 2,
        bush.width,
        bush.height,
      ).setVisible(false);
      this.physics.add.existing(BODY, true);
      BODY.type = 'BUSH';
      this.roomBushZones.push(BODY);

      if (this.human) {
        this.physics.add.overlap(this.human, BODY, () => {
          this.human.collidedWithGameObject(BODY);
        });
      };
    });

    if (this.human) {
      this.physics.add.collider(this.human, this.roomColliders);
    };
  }

  /**
   * Returns the room-local bounding boxes of every bush-tileset
   * (bush.tsx) decoration object in the given room, derived straight from
   * the sprite's own gid/position - so every bush drawn in Tiled is
   * automatically walk-through (overlap, not collider) with a hitbox
   * matching its own artwork, no manual tagging needed in Tiled.
   * @param {{col: number, row: number}} room
   * @return {Array<{x: number, y: number, width: number, height: number}>}
   */
  _getBushRectsForRoom(room) {
    const ROOM_LEFT = room.col * ROOM_WIDTH;
    const ROOM_TOP = room.row * ROOM_HEIGHT;
    const ROOM_RIGHT = ROOM_LEFT + ROOM_WIDTH;
    const ROOM_BOTTOM = ROOM_TOP + ROOM_HEIGHT;
    const RECTS = [];

    this.gidObjectLayers.forEach((layer) => {
      layer.objects.forEach((object) => {
        if (object.gid === undefined) {
          return;
        };

        if (object.x >= ROOM_RIGHT || object.x + object.width <= ROOM_LEFT
          || object.y - object.height >= ROOM_BOTTOM || object.y <= ROOM_TOP) {
          return;
        };

        const REF = this._getTilesetRefForGid(object.gid);
        if (!REF || REF.source !== 'bush.tsx') {
          return;
        };

        RECTS.push({
          x: object.x - ROOM_LEFT,
          y: object.y - object.height - ROOM_TOP,
          width: object.width,
          height: object.height,
        });
      });
    });

    return RECTS;
  }

  /**
   * (Re)builds the decorative sprites for the given room from the Tiled
   * "WorldBorder"/"Environment" gid-based tile objects, which Phaser
   * doesn't auto-render (only the base tile layer is rendered
   * automatically). WorldBorder renders below Environment but above the
   * base tile layer. Overworld-tileset gids go through Phaser's own
   * tileset frame slicing; gids from the standalone tree/bush/thornbush
   * tilesets fall back to their single already-loaded sprite texture.
   * @param {{col: number, row: number}} room
   * @return {void}
   */
  _buildRoomEnvironmentSprites(room) {
    if (this.roomEnvironmentSprites) {
      this.roomEnvironmentSprites.forEach((sprite) => sprite.destroy());
    };
    this.roomEnvironmentSprites = [];

    const ROOM_LEFT = room.col * ROOM_WIDTH;
    const ROOM_TOP = room.row * ROOM_HEIGHT;
    const ROOM_RIGHT = ROOM_LEFT + ROOM_WIDTH;
    const ROOM_BOTTOM = ROOM_TOP + ROOM_HEIGHT;

    this.gidObjectLayers.forEach((layer) => {
      const OVERWORLD_IDS = [];
      const DEPTH = layer.name === 'WorldBorder' ? -0.5 : 0;

      layer.objects.forEach((object) => {
        if (object.gid === undefined) {
          return;
        };

        if (object.x >= ROOM_RIGHT || object.x + object.width <= ROOM_LEFT
          || object.y - object.height >= ROOM_BOTTOM || object.y <= ROOM_TOP) {
          return;
        };

        const REF = this._getTilesetRefForGid(object.gid);
        if (!REF) {
          return;
        };

        if (REF.source === 'Overworld.tsx') {
          OVERWORLD_IDS.push(object.id);
          return;
        };

        const DECORATION_TILE = this.decorationTilesByGid[object.gid];
        if (!DECORATION_TILE) {
          return;
        };

        const SPRITE = this.add.image(
          object.x + object.width / 2 - ROOM_LEFT,
          object.y - object.height / 2 - ROOM_TOP,
          DECORATION_TILE.key,
        ).setDisplaySize(object.width, object.height).setDepth(DEPTH);
        this.roomEnvironmentSprites.push(SPRITE);
      });

      if (OVERWORLD_IDS.length > 0) {
        const SPRITES = this.tilemap.createFromObjects(layer.name, { id: OVERWORLD_IDS });
        SPRITES.forEach((sprite) => {
          sprite.setPosition(
            sprite.x - ROOM_LEFT,
            sprite.y - ROOM_TOP,
          );
          sprite.setDepth(DEPTH);
          this.roomEnvironmentSprites.push(sprite);
        });
      };
    });
  }

  /**
   * Jump-cuts the background (camera itself never moves/follows) to the
   * slice of the Tiled map matching the given room, so each dungeon screen
   * shows its own distinct part of the map instead of always the same
   * corner. The human/environment stay in room-local coordinates (0..
   * ROOM_WIDTH/HEIGHT), so it's the tilemap layer that is shifted under
   * them by the opposite offset, rather than scrolling the camera.
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
   * Records the human's current global position in the trace if it is far
   * enough from the last recorded point, accumulating the walked distance.
   * @return {void}
   */
  _recordTracePoint() {
    const ROOM = this.roomStage.currentRoom;
    const GLOBAL_X = ROOM.col * ROOM_WIDTH + this.human.x;
    const GLOBAL_Y = ROOM.row * ROOM_HEIGHT + this.human.y;

    const LAST = this.globalTrace[this.globalTrace.length - 1];
    if (LAST) {
      const DIST = Phaser.Math.Distance.Between(
        LAST.x,
        LAST.y,
        GLOBAL_X,
        GLOBAL_Y,
      );
      if (DIST < TRACE_MIN_DISTANCE) {
        return;
      };
      this.distanceTraveledPx += DIST;
      this._updateDistanceCounter();
    };

    this.globalTrace.push({
      x: GLOBAL_X,
      y: GLOBAL_Y,
    });
  }

  /**
   * Checks whether the human has walked off one of the room's edges and, if
   * so, either switches to the neighboring room (repositioning the human on
   * the opposite edge) or clamps the human back inside the room when there
   * is no room in that direction (outer wall of the map).
   * @return {void}
   */
  _checkRoomTransition() {
    const ROOM = this.roomStage.currentRoom;
    let targetCol = ROOM.col;
    let targetRow = ROOM.row;

    if (this.human.x < 0) {
      targetCol -= 1;
    } else if (this.human.x > ROOM_WIDTH) {
      targetCol += 1;
    };

    if (this.human.y < 0) {
      targetRow -= 1;
    } else if (this.human.y > ROOM_HEIGHT) {
      targetRow += 1;
    };

    if (targetCol === ROOM.col && targetRow === ROOM.row) {
      return;
    };

    if (targetCol < 0 || targetCol >= MAP_COLS || targetRow < 0 || targetRow >= MAP_ROWS) {
      this.human.x = Phaser.Math.Clamp(
        this.human.x,
        0,
        ROOM_WIDTH,
      );
      this.human.y = Phaser.Math.Clamp(
        this.human.y,
        0,
        ROOM_HEIGHT,
      );
      return;
    };

    if (this.human.x < 0) {
      this.human.x = ROOM_WIDTH;
    } else if (this.human.x > ROOM_WIDTH) {
      this.human.x = 0;
    };

    if (this.human.y < 0) {
      this.human.y = ROOM_HEIGHT;
    } else if (this.human.y > ROOM_HEIGHT) {
      this.human.y = 0;
    };

    this.roomStage.setRoom(
      targetCol,
      targetRow,
    );
    this._positionTilemapForRoom({
      col: targetCol,
      row: targetRow,
    });
    this.roomStage.level.setupCollidersFor(this.human);
    this._buildRoomColliders({
      col: targetCol,
      row: targetRow,
    });
    this._buildRoomEnvironmentSprites({
      col: targetCol,
      row: targetRow,
    });
    this.human.trace.clear();
    this.cameras.main.flash(
      ROOM_TRANSITION_FLASH_DURATION,
      0,
      0,
      0,
    );
  }

  /**
   * Creates the "Se cacher" button that validates the player's trace and
   * moves on to the correction.
   * @return {void}
   */
  _createHideButton() {
    const BUTTON = this.add.text(
      this.scale.width - 16,
      16,
      'Se cacher',
      {
        fontSize: STYLE_CONFIGURATION.HIDE_BUTTON_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.HIDE_BUTTON_FONT_FAMILY,
        color: STYLE_CONFIGURATION.HIDE_BUTTON_FONT_COLOR,
        fontStyle: STYLE_CONFIGURATION.HIDE_BUTTON_FONT_STYLE,
        backgroundColor: STYLE_CONFIGURATION.HIDE_BUTTON_COLOR,
        padding: {
          x: 16,
          y: 8,
        },
      },
    ).setOrigin(
      1,
      0,
    ).setInteractive({
      useHandCursor: true,
    });
    BUTTON.setDepth(10);
    BUTTON.setScrollFactor(0);

    BUTTON.on('pointerover', () => {
      BUTTON.setBackgroundColor(STYLE_CONFIGURATION.HIDE_BUTTON_HOVER_COLOR);
    });
    BUTTON.on('pointerout', () => {
      BUTTON.setBackgroundColor(STYLE_CONFIGURATION.HIDE_BUTTON_COLOR);
    });
    BUTTON.on('pointerdown', () => {
      this._goToCorrection();
    });
  }

  /**
   * Creates the live meter counter below the "Se cacher" button, tracking
   * the human's actual walked distance against the level's target.
   * @return {void}
   */
  _createDistanceCounter() {
    this.distanceText = this.add.text(
      this.scale.width - 16,
      54,
      this._formatDistanceText(),
      {
        fontSize: STYLE_CONFIGURATION.STEP_HUD_FONT_SIZE,
        fontFamily: STYLE_CONFIGURATION.STEP_HUD_FONT_FAMILY,
        color: STYLE_CONFIGURATION.STEP_HUD_COLOR,
        backgroundColor: STYLE_CONFIGURATION.STEP_HUD_BACKGROUND_COLOR,
        padding: {
          x: 8,
          y: 4,
        },
      },
    ).setOrigin(
      1,
      0,
    );
    this.distanceText.setDepth(10);
    this.distanceText.setScrollFactor(0);
  }

  /**
   * Returns the current distance/target label, in meters.
   * @return {string}
   */
  _formatDistanceText() {
    const METERS = Math.round(this.distanceTraveledPx / PIXELS_PER_METER);
    return `${METERS}m / ${this.levelConfig.targetDistance}m`;
  }

  /**
   * Refreshes the meter counter's text to match the distance walked so far.
   * @return {void}
   */
  _updateDistanceCounter() {
    if (!this.distanceText) {
      return;
    };

    this.distanceText.setText(this._formatDistanceText());
  }

  /**
   * Stops the level and starts the correction scene with the player's
   * (multi-room) trace.
   * @return {void}
   */
  _goToCorrection() {
    this.scene.start(SCENE_KEYS.CORRECTION, {
      level: this.levelNumber,
      dogId: this.dogId,
      trace: this.globalTrace,
      redFlags: this.roomStage.level.getRedFlags(this.human),
      environment: this.mapData,
      solution: this.mapData.solution,
    });
  }

  update() {
    if (!this.human) {
      return;
    };

    this.human.update({
      left: { isDown: this.cursors.left.isDown || !!this.joystick?.left.isDown },
      right: { isDown: this.cursors.right.isDown || !!this.joystick?.right.isDown },
      up: { isDown: this.cursors.up.isDown || !!this.joystick?.up.isDown },
      down: { isDown: this.cursors.down.isDown || !!this.joystick?.down.isDown },
    });
    this._checkRoomTransition();
    this._recordTracePoint();
  }
}
