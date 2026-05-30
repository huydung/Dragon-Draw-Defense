import { GAME_CONFIG } from "../config.js";
import { createAnimatedTemplatePath, getTemplateBounds, scaleTemplatePoint } from "./glyphTemplateAnimation.js";

export class CanvasRenderer {
  constructor(canvas, hudElements, config = GAME_CONFIG) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.hudElements = hudElements;
    this.config = config;
    this.shipImages = this.loadShipImages();
    this.dragonImages = this.loadDragonImages();
    this.habitatImages = this.loadHabitatImages();
    this.effectImages = this.loadEffectImages();
    this.tintedEffectCache = new Map();
    this.staticBackground = null;
    this.hudSnapshot = {};
    this.resizeObserver = new ResizeObserver(this.resizeCanvas);
  }

  start() {
    this.resizeObserver.observe(this.canvas);
    this.resizeCanvas();
  }

  render(state, trailState, nowMs) {
    this.renderHud(state);
    this.renderWaveBanner();
    this.renderGameOver(state, nowMs);
    this.clear();
    this.drawBackground();
    this.drawDamageFlash(state, nowMs);
    this.drawDragons(state.activeElements, state.lasers, nowMs, state.islandHitCount ?? 0);
    this.drawIslandFires(state.islandFires ?? [], nowMs);
    this.drawShips([...(state.dockedShips ?? []), ...state.ships], nowMs);
    this.drawLasers(state.lasers, nowMs);
    this.drawExplosions(state.explosions, nowMs);
    this.drawTrail(trailState, nowMs);
    if (!state.menuActive) {
      this.drawWaveSelectionDialog(state, nowMs);
    }
    this.renderFeedback(state.feedback);
    if (state.menuActive) {
      this.drawMainMenu(nowMs);
    }
  }

  loadShipImages() {
    return this.config.RENDER.SHIP_VARIANT_PATHS.map((path) => {
      const image = new Image();
      image.src = path;
      return image;
    });
  }

  loadImage(path, onLoad) {
    const image = new Image();
    if (onLoad) {
      image.addEventListener("load", onLoad, { once: true });
    }
    image.src = path;
    return image;
  }

  loadDragonImages() {
    return Object.fromEntries(
      Object.entries(this.config.RENDER.DRAGON_IMAGE_PATHS).map(([name, path]) => {
        const image = new Image();
        image.src = path;
        return [name, image];
      })
    );
  }

  loadHabitatImages() {
    const paths = this.config.RENDER.HABITAT_IMAGE_PATHS;
    return Object.fromEntries(
      Object.entries(paths).map(([name, path]) => [name, this.loadImage(path, () => this.invalidateStaticBackground())])
    );
  }

  loadEffectImages() {
    const paths = this.config.RENDER.EFFECT_IMAGE_PATHS;
    return {
      muzzle: this.loadImage(paths.muzzle),
      magicRing: this.loadImage(paths.magicRing),
      bolt: this.loadImage(paths.bolt),
      explosionFrames: paths.explosionFrames.map((path) => this.loadImage(path))
    };
  }

  resizeCanvas = () => {
    const { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } = this.config.PLAYFIELD;
    const pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = VIRTUAL_WIDTH * pixelRatio;
    this.canvas.height = VIRTUAL_HEIGHT * pixelRatio;
    this.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.invalidateStaticBackground();
  };

  invalidateStaticBackground() {
    this.staticBackground = null;
  }

  renderHud(state) {
    const menuActive = state.menuActive ?? false;
    const displayValue = menuActive ? "none" : "";
    this.hudElements.health.style.display = displayValue;
    this.hudElements.wave.style.display = displayValue;
    this.hudElements.score.style.display = displayValue;
    if (menuActive) {
      this.hudSnapshot = {};
      return;
    }

    const nextSnapshot = {
      health: `${this.config.RENDER.HUD_HEART.repeat(state.health)}`,
      wave: `WAVE ${String(state.wave).padStart(2, "0")}`,
      score: `SCORE: ${state.score}`
    };

    if (this.hudSnapshot.health !== nextSnapshot.health) {
      this.hudElements.health.textContent = nextSnapshot.health;
    }
    if (this.hudSnapshot.wave !== nextSnapshot.wave) {
      this.hudElements.wave.textContent = nextSnapshot.wave;
    }
    if (this.hudSnapshot.score !== nextSnapshot.score) {
      this.hudElements.score.textContent = nextSnapshot.score;
    }

    this.hudSnapshot = nextSnapshot;
  }

  renderFeedback(feedback) {
    const element = this.hudElements.feedback;
    element.textContent = feedback?.text ?? "";
    element.dataset.kind = feedback?.kind ?? "";
  }

  renderWaveBanner() {
    if (!this.hudElements.waveBanner) {
      return;
    }

    this.hudElements.waveBanner.textContent = "";
  }

  renderGameOver(state, nowMs) {
    if (!this.hudElements.gameOver || !this.hudElements.finalScore) {
      return;
    }

    const revealGameOver = state.gameOver && nowMs >= (state.gameOverDialogAtMs ?? 0);
    this.hudElements.gameOver.hidden = !revealGameOver;
    if (!revealGameOver) {
      return;
    }

    const defeatedShips = state.defeatedShipCount ?? 0;
    const survivedWaves = Math.max(0, state.wave - 1);
    const highScores = state.highScores ?? [];
    const bestScore = highScores[0]?.score ?? state.score;

    this.hudElements.gameOverTitle.textContent = "Stand Tall, Sentry";
    this.hudElements.finalSummary.textContent = `You defeated ${defeatedShips} ships and survived ${survivedWaves} waves.`;
    this.hudElements.finalScore.textContent = `Final Score: ${state.score}`;
    this.hudElements.finalHighScore.textContent = `High Score: ${bestScore}`;
    this.renderHighScores(highScores);
  }

  renderHighScores(highScores) {
    if (!this.hudElements.highScoreList) {
      return;
    }

    this.hudElements.highScoreList.replaceChildren(
      ...highScores.map((entry) => {
        const item = document.createElement("li");
        const score = document.createElement("strong");
        const meta = document.createElement("small");
        score.textContent = String(entry.score);
        meta.textContent = ` · ${entry.defeatedShips} ships · wave ${entry.reachedWave}`;
        item.append(score, meta);
        return item;
      })
    );
  }

  clear() {
    this.ctx.clearRect(0, 0, this.config.PLAYFIELD.VIRTUAL_WIDTH, this.config.PLAYFIELD.VIRTUAL_HEIGHT);
  }

  drawBackground() {
    this.ctx.drawImage(this.getStaticBackground(), 0, 0);
  }

  getStaticBackground() {
    if (this.staticBackground) {
      return this.staticBackground;
    }

    this.staticBackground = this.createStaticBackground();
    return this.staticBackground;
  }

  createStaticBackground() {
    const colors = this.config.RENDER.COLORS;
    const width = this.config.PLAYFIELD.VIRTUAL_WIDTH;
    const height = this.config.PLAYFIELD.VIRTUAL_HEIGHT;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    this.drawSeaBackground(context, width, height, colors);
    this.drawHabitat(context);

    context.strokeStyle = colors.GRID_LINE;
    context.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH;
    for (let x = 0; x <= width; x += this.config.RENDER.BACKGROUND_GRID_STEP) {
      drawLineOn(context, { x, y: 0 }, { x, y: height });
    }
    for (let y = 0; y <= height; y += this.config.RENDER.BACKGROUND_GRID_STEP) {
      drawLineOn(context, { x: 0, y }, { x: width, y });
    }

    return canvas;
  }

  drawSeaBackground(context, width, height, colors) {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors.PLAYFIELD_TOP);
    gradient.addColorStop(0.52, "#166f8f");
    gradient.addColorStop(1, colors.PLAYFIELD_BOTTOM);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.save();
    context.globalAlpha = 0.18;
    context.strokeStyle = "rgba(215, 250, 255, 0.72)";
    context.lineWidth = 2;
    for (let y = this.config.PLAYFIELD.SAFE_TOP_PADDING + 28; y < height; y += 42) {
      context.beginPath();
      for (let x = -40; x <= width + 40; x += 20) {
        const waveY = y + Math.sin((x + y * 1.7) / 26) * 4;
        if (x === -40) {
          context.moveTo(x, waveY);
        } else {
          context.lineTo(x, waveY);
        }
      }
      context.stroke();
    }
    context.restore();
  }

  drawHabitat(context) {
    const perimeterX = this.config.PLAYFIELD.DAMAGE_PERIMETER_X;
    const height = this.config.PLAYFIELD.VIRTUAL_HEIGHT;
    const top = Math.max(0, this.config.PLAYFIELD.SAFE_TOP_PADDING - 34);

    context.save();
    context.globalAlpha = 0.88;
    context.fillStyle = "#f2d996";
    context.beginPath();
    context.moveTo(0, top + 16);
    context.bezierCurveTo(38, top + 1, 62, top + 16, perimeterX, top + 4);
    context.lineTo(perimeterX, height);
    context.lineTo(0, height);
    context.closePath();
    context.fill();

    context.fillStyle = "#40b969";
    context.beginPath();
    context.moveTo(0, top + 40);
    context.bezierCurveTo(38, top + 26, 62, top + 40, perimeterX, top + 30);
    context.lineTo(perimeterX, height);
    context.lineTo(0, height);
    context.closePath();
    context.fill();

    this.drawImageOn(context, this.habitatImages.house, 7, top + 38, 58, 38, 0.72);
    this.drawImageOn(context, this.habitatImages.palm, 8, height - 138, 58, 69, 0.55);
    this.drawImageOn(context, this.habitatImages.tree, 82, height - 115, 28, 60, 0.64);
    context.restore();
  }

  drawImageOn(context, image, x, y, width, height, alpha = 1) {
    if (!image?.complete || image.naturalWidth <= 0) {
      return;
    }

    context.save();
    context.globalAlpha *= alpha;
    context.drawImage(image, x, y, width, height);
    context.restore();
  }

  drawDamageFlash(state, nowMs) {
    if (!state.damageFlashUntilMs || nowMs >= state.damageFlashUntilMs) {
      return;
    }

    const alpha = (state.damageFlashUntilMs - nowMs) / this.config.RENDER.DAMAGE_FLASH_DURATION_MS;
    this.ctx.save();
    this.ctx.globalAlpha = alpha * 0.36;
    this.ctx.fillStyle = this.config.RENDER.COLORS.FAILURE;
    this.ctx.fillRect(0, 0, this.config.PLAYFIELD.VIRTUAL_WIDTH, this.config.PLAYFIELD.VIRTUAL_HEIGHT);
    this.ctx.restore();
  }

  drawIslandFires(islandFires, nowMs) {
    islandFires.forEach((position, index) => {
      const cycle = Math.sin(nowMs * 0.008 + index * 1.43) * 0.12;
      const size = position.size * (1 + cycle);
      const image = position.variantIndex % 2 === 0 ? this.habitatImages.fire1 : this.habitatImages.fire2;
      this.drawSprite(image, position.x, position.y, size * 0.58, size, position.rotation, 0.92);
    });
  }

  drawDragons(activeElements = [], lasers = [], nowMs = 0, islandHitCount = 0) {
    const dragonsDefeated = islandHitCount >= this.config.HEALTH.INITIAL_HEALTH;
    activeElements.forEach((name, index) => {
      const element = this.config.ELEMENTS[name];
      const position = this.config.PLAYFIELD.ACTIVE_DRAGON_POSITIONS[index];

      if (!element || !position) {
        return;
      }

      const idle = dragonsDefeated ? { x: 0, y: 0, rotation: 0 } : this.getDragonIdleMotion(index, nowMs, islandHitCount);
      const attack = dragonsDefeated ? null : this.getDragonAttackMotion(position, lasers, nowMs);
      const attackPulse = attack?.pulse ?? 0;
      const drawX = position.x + idle.x + attackPulse * this.config.RENDER.DRAGON_ATTACK_LUNGE_PX;
      const drawY = position.y + idle.y - attackPulse * this.config.RENDER.DRAGON_ATTACK_LIFT_PX;
      const scale = 1 + attackPulse * this.config.RENDER.DRAGON_ATTACK_SCALE;
      const defeatRotation = this.config.RENDER.DRAGON_DEFEAT_ROTATIONS[name] ?? -Math.PI / 2;
      const rotation = dragonsDefeated ? defeatRotation : idle.rotation + attackPulse * 0.12;

      this.ctx.save();
      this.ctx.translate(drawX, drawY);
      this.ctx.rotate(rotation);
      this.ctx.scale(scale, scale);
      this.drawDragonAttackAura(element.color, attackPulse);
      this.drawDragonPortrait(name, 0, 0, this.config.RENDER.DRAGON_IMAGE_SIZE, element.color);
      this.ctx.restore();

      this.ctx.save();
      this.ctx.font = `${this.config.UI.PANEL_RADIUS_PX + this.config.RENDER.CANVAS_BORDER_WIDTH}px ${this.config.UI.FONT_FAMILY}`;
      this.ctx.fillStyle = "#111827";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(
        name,
        position.x + idle.x * 0.35,
        position.y + this.config.RENDER.DRAGON_IMAGE_SIZE / 2 + this.config.UI.HUD_GAP_PX + idle.y * 0.35
      );
      this.ctx.restore();
    });
  }

  getDragonIdleMotion(index, nowMs, islandHitCount = 0) {
    const urgency = islandHitCount >= 2 ? 2.2 : 1;
    const phase = nowMs * 0.0024 * urgency + index * 1.37;
    return {
      x: Math.sin(phase * 0.8) * 1.2 * urgency,
      y: Math.sin(phase) * this.config.RENDER.DRAGON_IDLE_BOB_PX * urgency,
      rotation: Math.sin(phase * 0.7) * this.config.RENDER.DRAGON_IDLE_SWAY_RADIANS * urgency
    };
  }

  getDragonAttackMotion(position, lasers, nowMs) {
    const laser = lasers.find((candidate) => {
      const deltaX = Math.abs(candidate.from.x - position.x);
      const deltaY = Math.abs(candidate.from.y - position.y);
      return candidate.expiresAtMs > nowMs && deltaX < 1 && deltaY < 1;
    });

    if (!laser) {
      return null;
    }

    const remainingMs = laser.expiresAtMs - nowMs;
    const progress = 1 - Math.max(0, Math.min(1, remainingMs / this.config.RENDER.LASER_DURATION_MS));
    return {
      progress,
      pulse: Math.sin(progress * Math.PI)
    };
  }

  drawShips(ships, nowMs) {
    ships.filter((ship) => ship.active || ship.docked || ship.frozen).forEach((ship) => this.drawShip(ship, nowMs));
  }

  drawShip(ship, nowMs) {
    const w = this.config.PLAYFIELD.SHIP_WIDTH;
    const h = this.config.PLAYFIELD.SHIP_HEIGHT;
    const variantIndex = ship.variantIndex ?? 0;
    const image = this.shipImages[variantIndex % this.shipImages.length];

    this.ctx.save();
    if (ship.docked) {
      this.ctx.translate(ship.x, ship.y);
      this.ctx.rotate(this.config.RENDER.DOCKED_SHIP_ROTATION);
      if (image?.complete && image.naturalWidth > 0) {
        this.ctx.drawImage(image, -w / 2, -h / 2, w, h);
      } else {
        this.drawFallbackShip(-w / 2, -h / 2, 0);
      }
    } else {
      const left = ship.x - w / 2;
      const top = ship.y - h / 2;
      if (image?.complete && image.naturalWidth > 0) {
        this.ctx.drawImage(image, left, top, w, h);
      } else {
        this.drawFallbackShip(left, top, ship.y);
      }
      if (!ship.frozen) {
        this.drawShipFlagGlyph(ship, nowMs);
      }
    }
    this.ctx.restore();
  }

  drawFallbackShip(left, top, centerY) {
    this.ctx.fillStyle = this.config.RENDER.COLORS.SHIP_FILL;
    this.ctx.strokeStyle = this.config.RENDER.COLORS.SHIP_STROKE;
    this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH;
    this.ctx.beginPath();
    this.ctx.roundRect(left, top, this.config.PLAYFIELD.SHIP_WIDTH, this.config.PLAYFIELD.SHIP_HEIGHT, this.config.UI.BUTTON_RADIUS_PX);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(left, top);
    this.ctx.lineTo(left - this.config.PLAYFIELD.SHIP_NOSE_WIDTH, centerY);
    this.ctx.lineTo(left, top + this.config.PLAYFIELD.SHIP_HEIGHT);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawShipFlagGlyph(ship, nowMs) {
    const element = this.config.ELEMENTS[ship.weakness];
    const template = this.config.GESTURES.TEMPLATES[ship.weakness];
    const variantIndex = ship.variantIndex ?? 0;
    const flagLeft = ship.x + this.config.RENDER.SHIP_FLAG_OFFSET_X - this.config.RENDER.SHIP_FLAG_WIDTH / 2;
    const flagTop = ship.y + this.config.RENDER.SHIP_FLAG_OFFSET_Y - this.config.RENDER.SHIP_FLAG_HEIGHT / 2;
    const contentRect = {
      x: flagLeft + this.config.RENDER.SHIP_FLAG_PADDING,
      y: flagTop + this.config.RENDER.SHIP_FLAG_PADDING,
      width: this.config.RENDER.SHIP_FLAG_WIDTH - this.config.RENDER.SHIP_FLAG_PADDING * 2,
      height: this.config.RENDER.SHIP_FLAG_HEIGHT - this.config.RENDER.SHIP_FLAG_PADDING * 2
    };
    const animationDuration = this.config.RENDER.SHIP_GLYPH_ANIMATION_MS + this.config.RENDER.SHIP_GLYPH_REST_MS;
    const animationTime = (nowMs + variantIndex * this.config.WAVES.WAVE_SELECTION_HIGHLIGHT_INTERVAL_MS) % animationDuration;
    const progress = Math.min(1, animationTime / this.config.RENDER.SHIP_GLYPH_ANIMATION_MS);

    this.ctx.save();
    this.ctx.fillStyle = this.config.RENDER.COLORS.SHIP_FLAG;
    this.ctx.strokeStyle = element.color;
    this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH + this.config.RENDER.CANVAS_BORDER_WIDTH;
    this.ctx.beginPath();
    this.ctx.roundRect(flagLeft, flagTop, this.config.RENDER.SHIP_FLAG_WIDTH, this.config.RENDER.SHIP_FLAG_HEIGHT, this.config.UI.BUTTON_RADIUS_PX);
    this.ctx.fill();
    this.ctx.stroke();

    if (template?.length >= this.config.GESTURES.MIN_STROKE_POINTS) {
      this.drawTemplateOnFlag(template, contentRect, progress, this.config.RENDER.COLORS.PAGE_BACKGROUND);
    }

    this.ctx.restore();
  }

  drawTemplateOnFlag(template, rect, progress, color) {
    const bounds = getTemplateBounds(template);
    const scaledPoints = template.map((point) => scaleTemplatePoint(point, bounds, rect));
    const animatedPath = createAnimatedTemplatePath(scaledPoints.map((point) => [point.x, point.y]), progress);

    this.ctx.save();
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = this.config.RENDER.COLORS.SHIP_FLAG_GUIDE;
    this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH;
    this.drawPolyline(scaledPoints);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.config.RENDER.SHIP_GLYPH_STROKE_WIDTH;
    animatedPath.completedSegments.forEach((segment) => {
      this.drawLine(toPoint(segment.from), toPoint(segment.to));
    });

    if (animatedPath.partialSegment) {
      this.drawLine(toPoint(animatedPath.partialSegment.from), toPoint(animatedPath.partialSegment.to));
    }

    scaledPoints.slice(0, animatedPath.revealedPointCount).forEach((point) => {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, this.config.RENDER.SHIP_GLYPH_DOT_RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  drawWaveSelectionDialog(state, nowMs) {
    if (state.phase !== "transition" || nowMs >= state.transitionUntilMs) {
      return;
    }

    const render = this.config.RENDER;
    const colors = render.COLORS;
    const left = (this.config.PLAYFIELD.VIRTUAL_WIDTH - render.SELECTION_DIALOG_WIDTH) / 2;
    const top = render.SELECTION_DIALOG_TOP;
    const remainingMs = state.transitionUntilMs - nowMs;
    const isLocked = remainingMs <= this.config.WAVES.WAVE_SELECTION_LOCK_IN_MS;

    this.ctx.save();
    this.ctx.fillStyle = colors.SELECTION_BACKDROP;
    this.ctx.fillRect(0, 0, this.config.PLAYFIELD.VIRTUAL_WIDTH, this.config.PLAYFIELD.VIRTUAL_HEIGHT);
    this.ctx.fillStyle = colors.SELECTION_PANEL;
    this.ctx.strokeStyle = this.config.GESTURES.TRAIL_COLOR;
    this.ctx.lineWidth = render.CANVAS_BORDER_WIDTH;
    this.ctx.beginPath();
    this.ctx.roundRect(left, top, render.SELECTION_DIALOG_WIDTH, render.SELECTION_DIALOG_HEIGHT, this.config.UI.PANEL_RADIUS_PX);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = colors.TEXT;
    this.ctx.font = `700 ${this.config.UI.HUD_HEIGHT_PX / 2}px ${this.config.UI.FONT_FAMILY}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(`Wave ${String(state.wave).padStart(2, "0")} Dragon Draw`, this.config.PLAYFIELD.VIRTUAL_WIDTH / 2, render.SELECTION_TITLE_Y);
    this.ctx.font = `${this.config.PLAYFIELD.DRAGON_RADIUS - this.config.RENDER.CANVAS_BORDER_WIDTH}px ${this.config.UI.FONT_FAMILY}`;
    this.ctx.fillStyle = colors.MUTED_TEXT;
    this.ctx.fillText(isLocked ? "Selected dragons are ready." : "The roster is spinning...", this.config.PLAYFIELD.VIRTUAL_WIDTH / 2, render.SELECTION_SUBTITLE_Y);

    Object.entries(this.config.ELEMENTS).forEach(([name, element], index) => {
      const column = index % render.SELECTION_GRID_COLUMNS;
      const row = Math.floor(index / render.SELECTION_GRID_COLUMNS);
      const tileLeft = left + this.config.UI.HUD_GAP_PX * 2 + column * (render.SELECTION_TILE_WIDTH + render.SELECTION_TILE_GAP);
      const tileTop = render.SELECTION_GRID_TOP + row * (render.SELECTION_TILE_HEIGHT + render.SELECTION_TILE_GAP);
      const selected = state.activeElements.includes(name);
      const scanned = this.isSelectionScanHighlighted(index, nowMs);
      const highlighted = isLocked ? selected : scanned;

      this.drawSelectionDragonTile(name, element, tileLeft, tileTop, highlighted, selected && isLocked);
    });

    this.ctx.restore();
  }

  isSelectionScanHighlighted(index, nowMs) {
    const scanStep = Math.floor(nowMs / this.config.WAVES.WAVE_SELECTION_HIGHLIGHT_INTERVAL_MS);
    const scanIndex = (scanStep * this.config.WAVES.WAVE_ELEMENT_COUNT + scanStep) % Object.keys(this.config.ELEMENTS).length;

    return index === scanIndex || index === (scanIndex + this.config.WAVES.WAVE_ELEMENT_COUNT) % Object.keys(this.config.ELEMENTS).length;
  }

  drawSelectionDragonTile(name, element, left, top, highlighted, locked) {
    const colors = this.config.RENDER.COLORS;
    const centerX = left + this.config.RENDER.SELECTION_TILE_WIDTH / 2;
    const iconY = top + this.config.PLAYFIELD.DRAGON_RADIUS + this.config.UI.BUTTON_RADIUS_PX;

    this.ctx.save();
    this.ctx.fillStyle = locked ? colors.SELECTION_ACTIVE : highlighted ? colors.SELECTION_SCAN : this.config.RENDER.COLORS.PANEL_BACKGROUND;
    this.ctx.strokeStyle = highlighted || locked ? element.color : this.config.GESTURES.TRAIL_COLOR;
    this.ctx.lineWidth = locked || highlighted ? this.config.RENDER.CANVAS_BORDER_WIDTH + this.config.RENDER.CANVAS_BORDER_WIDTH : this.config.RENDER.CANVAS_BORDER_WIDTH;
    this.ctx.beginPath();
    this.ctx.roundRect(left, top, this.config.RENDER.SELECTION_TILE_WIDTH, this.config.RENDER.SELECTION_TILE_HEIGHT, this.config.RENDER.SELECTION_TILE_RADIUS);
    this.ctx.fill();
    this.ctx.stroke();

    this.drawDragonPortrait(name, centerX, iconY, this.config.RENDER.DRAGON_SELECTION_IMAGE_SIZE, element.color);
    this.ctx.font = `${this.config.UI.PANEL_RADIUS_PX + this.config.RENDER.CANVAS_BORDER_WIDTH}px ${this.config.UI.FONT_FAMILY}`;
    this.ctx.fillStyle = colors.MUTED_TEXT;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(name, centerX, top + this.config.RENDER.SELECTION_TILE_HEIGHT - this.config.UI.BUTTON_RADIUS_PX * 2);
    this.ctx.restore();
  }

  drawLasers(lasers, nowMs) {
    lasers.forEach((laser) => {
      const remainingMs = laser.expiresAtMs - nowMs;
      const progress = 1 - Math.max(0, Math.min(1, remainingMs / this.config.RENDER.LASER_DURATION_MS));
      const pulse = Math.sin(progress * Math.PI);
      const color = laser.color ?? this.config.RENDER.COLORS.LASER_CORE;
      const angle = Math.atan2(laser.to.y - laser.from.y, laser.to.x - laser.from.x);
      const length = Math.hypot(laser.to.x - laser.from.x, laser.to.y - laser.from.y);
      const center = {
        x: (laser.from.x + laser.to.x) / 2,
        y: (laser.from.y + laser.to.y) / 2
      };

      this.ctx.save();
      this.ctx.globalCompositeOperation = "lighter";
      this.ctx.lineCap = "round";
      this.ctx.strokeStyle = color;
      this.ctx.globalAlpha = 0.28 + pulse * 0.16;
      this.ctx.lineWidth = this.config.RENDER.LASER_WIDTH + pulse * 2;
      this.drawLine(laser.from, laser.to);
      this.ctx.strokeStyle = this.config.RENDER.COLORS.LASER_CORE;
      this.ctx.globalAlpha = 0.74;
      this.ctx.lineWidth = 1.5 + pulse;
      this.drawLine(laser.from, laser.to);
      this.drawTintedSprite("bolt", color, center.x, center.y, 26 + pulse * 6, length * 0.88, angle - Math.PI / 2, 0.08 + pulse * 0.12);
      this.drawMuzzleFlash(laser.from, color, pulse);
      this.drawImpactBurst(laser, progress, pulse, color);
      this.ctx.restore();
    });
  }

  drawDragonAttackAura(color, pulse) {
    if (pulse <= 0) {
      return;
    }

    const size = this.config.RENDER.DRAGON_ATTACK_AURA_RADIUS * (1.3 + pulse * 0.9);
    this.drawTintedSprite("magicRing", color, 0, 0, size, size, pulse * Math.PI * 0.25, 0.2 + pulse * 0.4);
  }

  drawDragonPortrait(name, centerX, centerY, size) {
    const image = this.dragonImages[name];
    const halfSize = size / 2;

    this.ctx.save();

    if (image?.complete && image.naturalWidth > 0) {
      this.ctx.drawImage(image, centerX - halfSize, centerY - halfSize, size, size);
    } else {
      this.ctx.fillStyle = this.config.RENDER.COLORS.TEXT;
      this.ctx.font = `700 ${Math.round(size * 0.34)}px ${this.config.UI.FONT_FAMILY}`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(this.config.ELEMENTS[name]?.label ?? "?", centerX, centerY);
    }

    this.ctx.restore();
  }

  drawMuzzleFlash(point, color, pulse) {
    const size = this.config.RENDER.LASER_MUZZLE_RADIUS * (1.4 + pulse * 1.6);
    this.drawTintedSprite("muzzle", color, point.x, point.y, size, size, -Math.PI / 2, 0.42 + pulse * 0.36);
  }

  drawImpactBurst(laser, progress, pulse, color) {
    const fade = Math.max(0, 1 - progress);
    const radius = this.config.RENDER.LASER_IMPACT_RADIUS * (0.9 + pulse * 0.7);
    this.drawTintedSprite("magicRing", color, laser.to.x, laser.to.y, radius * 2.1, radius * 2.1, progress * Math.PI, 0.24 + fade * 0.3);
    this.drawTintedSprite("muzzle", color, laser.to.x, laser.to.y, radius * 1.35, radius * 1.35, Math.PI, 0.3 + pulse * 0.32);
  }

  drawExplosions(explosions = [], nowMs) {
    explosions.forEach((explosion) => {
      const ageMs = nowMs - explosion.createdAtMs;
      const progress = Math.max(0, Math.min(1, ageMs / this.config.RENDER.EXPLOSION_DURATION_MS));
      const pulse = Math.sin(progress * Math.PI);
      const fade = Math.max(0, 1 - progress);
      const color = explosion.color ?? this.config.RENDER.COLORS.LASER_CORE;
      const frameIndex = Math.min(
        this.effectImages.explosionFrames.length - 1,
        Math.floor(progress * this.effectImages.explosionFrames.length)
      );
      const frame = this.effectImages.explosionFrames[frameIndex];
      const ringSize = this.config.RENDER.EXPLOSION_RING_RADIUS * (1.1 + progress * 1.3);
      const blastSize = this.config.RENDER.EXPLOSION_RING_RADIUS * (1.15 + pulse * 1.1);

      this.drawTintedSprite("magicRing", color, explosion.x, explosion.y, ringSize, ringSize, progress * Math.PI * 0.8, 0.18 + fade * 0.28);
      this.drawSprite(frame, explosion.x, explosion.y, blastSize, blastSize, progress * Math.PI * 0.35, 0.72 + pulse * 0.2, "lighter");

      (explosion.sparks ?? []).forEach((spark, index) => {
        const distance = this.config.RENDER.EXPLOSION_PARTICLE_DISTANCE * progress * spark.distanceScale;
        const x = explosion.x + Math.cos(spark.angle) * distance;
        const y = explosion.y + Math.sin(spark.angle) * distance;
        const size = spark.size * (0.7 + pulse * 0.9);
        this.drawTintedSprite(
          index % 2 === 0 ? "bolt" : "muzzle",
          color,
          x,
          y,
          size,
          size * 1.8,
          spark.angle + spark.spin * progress,
          fade * 0.5
        );
      });
    });
  }

  drawTintedSprite(name, color, centerX, centerY, width, height, rotation = 0, alpha = 1) {
    this.drawSprite(this.getTintedEffect(name, color), centerX, centerY, width, height, rotation, alpha, "lighter");
  }

  getTintedEffect(name, color) {
    const image = this.effectImages[name];
    if (!image?.complete || image.naturalWidth <= 0) {
      return image;
    }

    const cacheKey = `${name}:${color}`;
    if (this.tintedEffectCache.has(cacheKey)) {
      return this.tintedEffectCache.get(cacheKey);
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    context.drawImage(image, 0, 0);
    context.globalCompositeOperation = "source-atop";
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "lighter";
    context.globalAlpha = 0.55;
    context.drawImage(image, 0, 0);
    this.tintedEffectCache.set(cacheKey, canvas);
    return canvas;
  }

  drawSprite(image, centerX, centerY, width, height, rotation = 0, alpha = 1, compositeOperation = "source-over") {
    if (!image?.complete && !(image instanceof HTMLCanvasElement)) {
      return;
    }

    this.ctx.save();
    this.ctx.globalCompositeOperation = compositeOperation;
    this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(rotation);
    this.ctx.drawImage(image, -width / 2, -height / 2, width, height);
    this.ctx.restore();
  }

  drawTrail(trailState, nowMs) {
    const trail = trailState?.points ?? [];
    if (trail.length < this.config.GESTURES.MIN_STROKE_POINTS) {
      return;
    }

    this.ctx.save();
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.shadowColor = this.config.GESTURES.TRAIL_COLOR;
    this.ctx.shadowBlur = this.config.GESTURES.TRAIL_WIDTH * this.config.UI.BUTTON_RADIUS_PX;

    for (let index = 1; index < trail.length; index += 1) {
      const ageMs = nowMs - trail[index].createdAtMs;
      const alpha = trailState.isDrawing ? 1 : Math.max(0, 1 - ageMs / this.config.GESTURES.TRAIL_FADE_DURATION_MS);
      this.ctx.globalAlpha = alpha;
      this.ctx.strokeStyle = this.config.GESTURES.TRAIL_COLOR;
      this.ctx.lineWidth = this.config.GESTURES.TRAIL_WIDTH;
      this.drawLine(trail[index - 1], trail[index]);
    }

    this.ctx.restore();
  }

  drawLine(from, to) {
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }

  drawPolyline(points) {
    if (points.length < this.config.GESTURES.MIN_STROKE_POINTS) {
      return;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => {
      this.ctx.lineTo(point.x, point.y);
    });
    this.ctx.stroke();
  }

  drawMainMenu(nowMs) {
    const { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } = this.config.PLAYFIELD;
    const colors = this.config.RENDER.COLORS;
    const gap = this.config.UI.HUD_GAP_PX;
    const accentColor = this.config.GESTURES.TRAIL_COLOR;
    const radius = this.config.UI.PANEL_RADIUS_PX;
    const borderWidth = this.config.RENDER.CANVAS_BORDER_WIDTH;
    const font = this.config.UI.FONT_FAMILY;
    const cx = VIRTUAL_WIDTH / 2;

    const panelW = 500;
    const panelH = 310;
    const panelX = (VIRTUAL_WIDTH - panelW) / 2;
    const panelY = (VIRTUAL_HEIGHT - panelH) / 2;

    this.ctx.save();

    this.ctx.fillStyle = "rgba(7, 11, 22, 0.9)";
    this.ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    this.ctx.fillStyle = colors.SELECTION_PANEL;
    this.ctx.strokeStyle = accentColor;
    this.ctx.lineWidth = borderWidth * 2;
    this.ctx.beginPath();
    this.ctx.roundRect(panelX, panelY, panelW, panelH, radius);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = accentColor;
    this.ctx.font = `900 22px ${font}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("Dragon Draw Defense", cx, panelY + 30);

    this.ctx.fillStyle = colors.MUTED_TEXT;
    this.ctx.font = `400 10px ${font}`;
    this.ctx.fillText("VIKING RAID SENTRY", cx, panelY + 50);

    this.ctx.strokeStyle = "rgba(170, 184, 199, 0.18)";
    this.ctx.lineWidth = borderWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(panelX + gap * 2, panelY + 66);
    this.ctx.lineTo(panelX + panelW - gap * 2, panelY + 66);
    this.ctx.stroke();

    this.ctx.fillStyle = colors.MUTED_TEXT;
    this.ctx.font = `700 10px ${font}`;
    this.ctx.textAlign = "left";
    this.ctx.fillText("HOW TO PLAY", panelX + gap * 2, panelY + 82);

    const tips = [
      "Ships come in waves — each wave grows harder",
      "Don't let 3 ships reach your island",
      "Draw the correct shape to command your dragon's attack",
      "Draw in the correct ORDER — not just the right shape"
    ];

    tips.forEach((tip, index) => {
      const tipY = panelY + 106 + index * 32;
      const iconX = panelX + gap * 2 + 9;

      this.ctx.fillStyle = colors.SELECTION_ACTIVE;
      this.ctx.beginPath();
      this.ctx.arc(iconX, tipY, 9, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = accentColor;
      this.ctx.font = `700 9px ${font}`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(String(index + 1), iconX, tipY);

      this.ctx.fillStyle = colors.TEXT;
      this.ctx.font = `400 12px ${font}`;
      this.ctx.textAlign = "left";
      this.ctx.fillText(tip, panelX + gap * 2 + 24, tipY);
    });

    const btnW = panelW - gap * 4;
    const btnH = 36;
    const btnX = panelX + gap * 2;
    const btnY = panelY + panelH - gap * 2 - btnH;
    const pulse = 0.78 + Math.sin(nowMs * 0.0024) * 0.22;

    this.ctx.globalAlpha = pulse;
    this.ctx.fillStyle = accentColor;
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, btnY, btnW, btnH, this.config.UI.BUTTON_RADIUS_PX);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;

    this.ctx.fillStyle = colors.PAGE_BACKGROUND;
    this.ctx.font = `900 13px ${font}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("TAP TO START", cx, btnY + btnH / 2);

    this.ctx.restore();
  }
}

function toPoint(point) {
  return { x: point[0], y: point[1] };
}

function drawLineOn(context, from, to) {
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
}
