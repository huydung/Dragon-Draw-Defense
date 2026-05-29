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
    this.backgroundImage = this.loadImage(this.config.RENDER.BACKGROUND_IMAGE_PATH);
    this.resizeObserver = new ResizeObserver(this.resizeCanvas);
  }

  start() {
    this.resizeObserver.observe(this.canvas);
    this.resizeCanvas();
  }

  render(state, trailState, nowMs) {
    this.renderHud(state);
    this.renderWaveBanner();
    this.renderGameOver(state);
    this.clear();
    this.drawBackground();
    this.drawDamageFlash(state, nowMs);
    this.drawDefenseLine();
    this.drawDragons(state.activeElements, state.lasers, nowMs);
    this.drawShips(state.ships, nowMs);
    this.drawLasers(state.lasers, nowMs);
    this.drawExplosions(state.explosions, nowMs);
    this.drawTrail(trailState, nowMs);
    this.drawWaveSelectionDialog(state, nowMs);
    this.renderFeedback(state.feedback);
  }

  loadShipImages() {
    return this.config.RENDER.SHIP_VARIANT_PATHS.map((path) => {
      const image = new Image();
      image.src = path;
      return image;
    });
  }

  loadImage(path) {
    const image = new Image();
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

  resizeCanvas = () => {
    const { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } = this.config.PLAYFIELD;
    const pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = VIRTUAL_WIDTH * pixelRatio;
    this.canvas.height = VIRTUAL_HEIGHT * pixelRatio;
    this.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  renderHud(state) {
    this.hudElements.health.textContent = `${this.config.RENDER.HUD_HEART.repeat(state.health)}`;
    this.hudElements.wave.textContent = `WAVE ${String(state.wave).padStart(2, "0")}`;
    this.hudElements.score.textContent = `SCORE: ${String(state.score).padStart(6, "0")}`;
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

  renderGameOver(state) {
    if (!this.hudElements.gameOver || !this.hudElements.finalScore) {
      return;
    }

    this.hudElements.gameOver.hidden = !state.gameOver;
    if (!state.gameOver) {
      return;
    }

    const defeatedShips = state.defeatedShipCount ?? 0;
    const survivedWaves = Math.max(0, state.wave - 1);
    const highScores = state.highScores ?? [];
    const bestScore = highScores[0]?.score ?? state.score;

    this.hudElements.gameOverTitle.textContent = "Stand Tall, Sentry";
    this.hudElements.finalSummary.textContent = `You defeated ${defeatedShips} ships and survived ${survivedWaves} waves.`;
    this.hudElements.finalScore.textContent = `Final Score: ${String(state.score).padStart(6, "0")}`;
    this.hudElements.finalHighScore.textContent = `High Score: ${String(bestScore).padStart(6, "0")}`;
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
        score.textContent = String(entry.score).padStart(6, "0");
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
    const colors = this.config.RENDER.COLORS;
    const width = this.config.PLAYFIELD.VIRTUAL_WIDTH;
    const height = this.config.PLAYFIELD.VIRTUAL_HEIGHT;

    if (this.backgroundImage?.complete && this.backgroundImage.naturalWidth > 0) {
      this.drawCoverImage(this.backgroundImage, 0, 0, width, height);
      this.ctx.fillStyle = "rgba(5, 13, 23, 0.58)";
      this.ctx.fillRect(0, 0, width, height);
    } else {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, colors.PLAYFIELD_TOP);
      gradient.addColorStop(1, colors.PLAYFIELD_BOTTOM);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, width, height);
    }

    this.ctx.strokeStyle = colors.GRID_LINE;
    this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH;
    for (let x = 0; x <= width; x += this.config.RENDER.BACKGROUND_GRID_STEP) {
      this.drawLine({ x, y: 0 }, { x, y: height });
    }
    for (let y = 0; y <= height; y += this.config.RENDER.BACKGROUND_GRID_STEP) {
      this.drawLine({ x: 0, y }, { x: width, y });
    }
  }

  drawCoverImage(image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;
    this.ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  drawDefenseLine() {
    this.ctx.save();
    this.ctx.strokeStyle = this.config.RENDER.COLORS.DEFENSE_LINE;
    this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH + this.config.RENDER.CANVAS_BORDER_WIDTH;
    this.ctx.setLineDash(this.config.RENDER.DEFENSE_LINE_DASH);
    this.drawLine(
      { x: this.config.PLAYFIELD.DAMAGE_PERIMETER_X, y: this.config.PLAYFIELD.SAFE_TOP_PADDING },
      { x: this.config.PLAYFIELD.DAMAGE_PERIMETER_X, y: this.config.PLAYFIELD.VIRTUAL_HEIGHT }
    );
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = this.config.RENDER.COLORS.DEFENSE_LINE;
    this.ctx.font = `${this.config.UI.PANEL_RADIUS_PX + this.config.UI.BUTTON_RADIUS_PX}px ${this.config.UI.FONT_FAMILY}`;
    this.ctx.fillText("DEFENSE LINE", this.config.PLAYFIELD.DAMAGE_PERIMETER_X + this.config.UI.HUD_GAP_PX, this.config.RENDER.DEFENSE_LABEL_Y);
    this.ctx.restore();
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

  drawDragons(activeElements = [], lasers = [], nowMs = 0) {
    activeElements.forEach((name, index) => {
      const element = this.config.ELEMENTS[name];
      const position = this.config.PLAYFIELD.ACTIVE_DRAGON_POSITIONS[index];

      if (!element || !position) {
        return;
      }

      const idle = this.getDragonIdleMotion(index, nowMs);
      const attack = this.getDragonAttackMotion(position, lasers, nowMs);
      const attackPulse = attack?.pulse ?? 0;
      const drawX = position.x + idle.x + attackPulse * this.config.RENDER.DRAGON_ATTACK_LUNGE_PX;
      const drawY = position.y + idle.y - attackPulse * this.config.RENDER.DRAGON_ATTACK_LIFT_PX;
      const scale = 1 + attackPulse * this.config.RENDER.DRAGON_ATTACK_SCALE;
      const rotation = idle.rotation + attackPulse * 0.12;

      this.ctx.save();
      this.ctx.translate(drawX, drawY);
      this.ctx.rotate(rotation);
      this.ctx.scale(scale, scale);
      this.drawDragonAttackAura(element.color, attackPulse);
      this.drawDragonPortrait(name, 0, 0, this.config.RENDER.DRAGON_IMAGE_SIZE, element.color);
      this.ctx.restore();

      this.ctx.save();
      this.ctx.font = `${this.config.UI.PANEL_RADIUS_PX + this.config.RENDER.CANVAS_BORDER_WIDTH}px ${this.config.UI.FONT_FAMILY}`;
      this.ctx.fillStyle = this.config.RENDER.COLORS.MUTED_TEXT;
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

  getDragonIdleMotion(index, nowMs) {
    const phase = nowMs * 0.0024 + index * 1.37;
    return {
      x: Math.sin(phase * 0.8) * 1.2,
      y: Math.sin(phase) * this.config.RENDER.DRAGON_IDLE_BOB_PX,
      rotation: Math.sin(phase * 0.7) * this.config.RENDER.DRAGON_IDLE_SWAY_RADIANS
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
    ships.filter((ship) => ship.active).forEach((ship) => this.drawShip(ship, nowMs));
  }

  drawShip(ship, nowMs) {
    const left = ship.x - this.config.PLAYFIELD.SHIP_WIDTH / 2;
    const top = ship.y - this.config.PLAYFIELD.SHIP_HEIGHT / 2;
    const variantIndex = ship.variantIndex ?? 0;
    const image = this.shipImages[variantIndex % this.shipImages.length];

    this.ctx.save();
    if (image?.complete && image.naturalWidth > 0) {
      this.ctx.drawImage(image, left, top, this.config.PLAYFIELD.SHIP_WIDTH, this.config.PLAYFIELD.SHIP_HEIGHT);
    } else {
      this.drawFallbackShip(left, top, ship.y);
    }
    this.drawShipFlagGlyph(ship, nowMs);
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

      this.ctx.save();
      this.ctx.globalCompositeOperation = "lighter";
      this.ctx.lineCap = "round";
      this.ctx.strokeStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 18 + pulse * 18;
      this.ctx.globalAlpha = 0.18 + pulse * 0.36;
      this.ctx.lineWidth = this.config.RENDER.LASER_GLOW_WIDTH + pulse * this.config.UI.HUD_GAP_PX;
      this.drawLine(laser.from, laser.to);
      this.ctx.strokeStyle = color;
      this.ctx.globalAlpha = 0.72;
      this.ctx.lineWidth = this.config.RENDER.LASER_WIDTH + pulse * this.config.RENDER.CANVAS_BORDER_WIDTH * 3;
      this.drawLine(laser.from, laser.to);
      this.ctx.strokeStyle = this.config.RENDER.COLORS.LASER_CORE;
      this.ctx.globalAlpha = 0.92;
      this.ctx.lineWidth = Math.max(2, this.config.RENDER.LASER_WIDTH * 0.45 + pulse * 2);
      this.drawLine(laser.from, laser.to);
      this.drawMuzzleFlash(laser.from, color, pulse);
      this.drawImpactBurst(laser, progress, pulse, color);
      this.ctx.restore();
    });
  }

  drawDragonAttackAura(color, pulse) {
    if (pulse <= 0) {
      return;
    }

    const radius = this.config.RENDER.DRAGON_ATTACK_AURA_RADIUS * (0.7 + pulse * 0.45);
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, this.config.RENDER.COLORS.LASER_CORE);
    gradient.addColorStop(0.35, color);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    this.ctx.save();
    this.ctx.globalCompositeOperation = "lighter";
    this.ctx.globalAlpha = 0.18 + pulse * 0.38;
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
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
    const radius = this.config.RENDER.LASER_MUZZLE_RADIUS * (0.55 + pulse * 0.45);
    const gradient = this.ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    gradient.addColorStop(0, this.config.RENDER.COLORS.LASER_CORE);
    gradient.addColorStop(0.45, color);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    this.ctx.fillStyle = gradient;
    this.ctx.globalAlpha = 0.74;
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawImpactBurst(laser, progress, pulse, color) {
    const radius = this.config.RENDER.LASER_IMPACT_RADIUS * (0.35 + progress * 0.95);

    this.ctx.strokeStyle = color;
    this.ctx.globalAlpha = Math.max(0, 1 - progress) * 0.78;
    this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH * 3;
    this.ctx.beginPath();
    this.ctx.arc(laser.to.x, laser.to.y, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    for (let index = 0; index < this.config.RENDER.LASER_PARTICLE_COUNT; index += 1) {
      const angle = seededAngle(laser.id, index);
      const distance = this.config.RENDER.LASER_PARTICLE_DISTANCE * progress * (0.45 + (index % 5) * 0.12);
      const sparkLength = this.config.UI.HUD_GAP_PX * (0.5 + pulse * 0.7);
      const x = laser.to.x + Math.cos(angle) * distance;
      const y = laser.to.y + Math.sin(angle) * distance;
      this.ctx.strokeStyle = index % 3 === 0 ? this.config.RENDER.COLORS.LASER_CORE : color;
      this.ctx.globalAlpha = Math.max(0, 1 - progress) * 0.95;
      this.drawLine(
        { x, y },
        {
          x: x + Math.cos(angle) * sparkLength,
          y: y + Math.sin(angle) * sparkLength
        }
      );
    }
  }

  drawExplosions(explosions = [], nowMs) {
    explosions.forEach((explosion) => {
      const ageMs = nowMs - explosion.createdAtMs;
      const progress = Math.max(0, Math.min(1, ageMs / this.config.RENDER.EXPLOSION_DURATION_MS));
      const pulse = Math.sin(progress * Math.PI);
      const fade = Math.max(0, 1 - progress);
      const color = explosion.color ?? this.config.RENDER.COLORS.LASER_CORE;
      const ringRadius = this.config.RENDER.EXPLOSION_RING_RADIUS * (0.22 + progress);

      this.ctx.save();
      this.ctx.globalCompositeOperation = "lighter";
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 20 * fade + 10;

      const gradient = this.ctx.createRadialGradient(explosion.x, explosion.y, 0, explosion.x, explosion.y, ringRadius);
      gradient.addColorStop(0, this.config.RENDER.COLORS.LASER_CORE);
      gradient.addColorStop(0.36, color);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      this.ctx.globalAlpha = 0.42 * fade + pulse * 0.2;
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, ringRadius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = color;
      this.ctx.globalAlpha = fade * 0.88;
      this.ctx.lineWidth = 4 + pulse * 3;
      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, ringRadius * 0.72, 0, Math.PI * 2);
      this.ctx.stroke();

      for (let index = 0; index < this.config.RENDER.EXPLOSION_PARTICLE_COUNT; index += 1) {
        const angle = seededAngle(explosion.id, index);
        const distance =
          this.config.RENDER.EXPLOSION_PARTICLE_DISTANCE * progress * (0.45 + ((index * 7) % 11) * 0.055);
        const sparkLength = this.config.UI.HUD_GAP_PX * (0.7 + pulse * 1.2);
        const x = explosion.x + Math.cos(angle) * distance;
        const y = explosion.y + Math.sin(angle) * distance;
        this.ctx.strokeStyle = index % 4 === 0 ? this.config.RENDER.COLORS.LASER_CORE : color;
        this.ctx.globalAlpha = fade * (0.5 + (index % 3) * 0.15);
        this.ctx.lineWidth = index % 5 === 0 ? 3 : 2;
        this.drawLine(
          { x, y },
          {
            x: x + Math.cos(angle) * sparkLength,
            y: y + Math.sin(angle) * sparkLength
          }
        );
      }

      this.ctx.restore();
    });
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
}

function toPoint(point) {
  return { x: point[0], y: point[1] };
}

function seededAngle(seed, index) {
  let hash = 0;
  const value = `${seed}-${index}`;

  for (let characterIndex = 0; characterIndex < value.length; characterIndex += 1) {
    hash = (hash * 31 + value.charCodeAt(characterIndex)) >>> 0;
  }

  return ((hash % 6283) / 1000) % (Math.PI * 2);
}
