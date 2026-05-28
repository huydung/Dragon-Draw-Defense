import { GAME_CONFIG } from "../config.js";

export class CanvasRenderer {
  constructor(canvas, hudElements, config = GAME_CONFIG) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.hudElements = hudElements;
    this.config = config;
    this.resizeObserver = new ResizeObserver(this.resizeCanvas);
  }

  start() {
    this.resizeObserver.observe(this.canvas);
    this.resizeCanvas();
  }

  render(state, trail, nowMs) {
    this.renderHud(state);
    this.clear();
    this.drawBackground();
    this.drawDefenseLine();
    this.drawDragons();
    this.drawShips(state.ships);
    this.drawLasers(state.lasers);
    this.drawTrail(trail, nowMs);
    this.renderFeedback(state.feedback);
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

  clear() {
    this.ctx.clearRect(0, 0, this.config.PLAYFIELD.VIRTUAL_WIDTH, this.config.PLAYFIELD.VIRTUAL_HEIGHT);
  }

  drawBackground() {
    const colors = this.config.RENDER.COLORS;
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.PLAYFIELD.VIRTUAL_HEIGHT);
    gradient.addColorStop(0, colors.PLAYFIELD_TOP);
    gradient.addColorStop(1, colors.PLAYFIELD_BOTTOM);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.config.PLAYFIELD.VIRTUAL_WIDTH, this.config.PLAYFIELD.VIRTUAL_HEIGHT);

    this.ctx.strokeStyle = colors.GRID_LINE;
    this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH;
    for (let x = 0; x <= this.config.PLAYFIELD.VIRTUAL_WIDTH; x += this.config.RENDER.BACKGROUND_GRID_STEP) {
      this.drawLine({ x, y: 0 }, { x, y: this.config.PLAYFIELD.VIRTUAL_HEIGHT });
    }
    for (let y = 0; y <= this.config.PLAYFIELD.VIRTUAL_HEIGHT; y += this.config.RENDER.BACKGROUND_GRID_STEP) {
      this.drawLine({ x: 0, y }, { x: this.config.PLAYFIELD.VIRTUAL_WIDTH, y });
    }
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

  drawDragons() {
    Object.entries(this.config.ELEMENTS).forEach(([name, element]) => {
      const y = this.config.PLAYFIELD.DRAGON_Y_POSITIONS[element.dragonIndex];
      this.ctx.save();
      this.ctx.fillStyle = this.config.RENDER.COLORS.DRAGON_FILL;
      this.ctx.strokeStyle = element.color;
      this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH + this.config.RENDER.CANVAS_BORDER_WIDTH;
      this.ctx.beginPath();
      this.ctx.arc(this.config.PLAYFIELD.DRAGON_X, y, this.config.PLAYFIELD.DRAGON_RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = this.config.RENDER.COLORS.TEXT;
      this.ctx.font = `700 ${this.config.PLAYFIELD.DRAGON_RADIUS}px ${this.config.UI.FONT_FAMILY}`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(element.label, this.config.PLAYFIELD.DRAGON_X, y);
      this.ctx.font = `${this.config.UI.PANEL_RADIUS_PX + this.config.UI.BUTTON_RADIUS_PX}px ${this.config.UI.FONT_FAMILY}`;
      this.ctx.fillStyle = this.config.RENDER.COLORS.MUTED_TEXT;
      this.ctx.fillText(name, this.config.PLAYFIELD.DRAGON_X, y + this.config.PLAYFIELD.DRAGON_RADIUS + this.config.UI.HUD_GAP_PX);
      this.ctx.restore();
    });
  }

  drawShips(ships) {
    ships.filter((ship) => ship.active).forEach((ship) => this.drawShip(ship));
  }

  drawShip(ship) {
    const element = this.config.ELEMENTS[ship.weakness];
    const left = ship.x - this.config.PLAYFIELD.SHIP_WIDTH / 2;
    const top = ship.y - this.config.PLAYFIELD.SHIP_HEIGHT / 2;

    this.ctx.save();
    this.ctx.fillStyle = this.config.RENDER.COLORS.SHIP_FILL;
    this.ctx.strokeStyle = this.config.RENDER.COLORS.SHIP_STROKE;
    this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH;
    this.ctx.beginPath();
    this.ctx.roundRect(left, top, this.config.PLAYFIELD.SHIP_WIDTH, this.config.PLAYFIELD.SHIP_HEIGHT, this.config.UI.BUTTON_RADIUS_PX);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(left + this.config.PLAYFIELD.SHIP_WIDTH, top);
    this.ctx.lineTo(left + this.config.PLAYFIELD.SHIP_WIDTH + this.config.PLAYFIELD.SHIP_NOSE_WIDTH, ship.y);
    this.ctx.lineTo(left + this.config.PLAYFIELD.SHIP_WIDTH, top + this.config.PLAYFIELD.SHIP_HEIGHT);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = this.config.RENDER.COLORS.SHIP_WINDOW;
    this.ctx.fillRect(left + this.config.UI.HUD_GAP_PX, top + this.config.UI.BUTTON_RADIUS_PX, this.config.PLAYFIELD.SHIP_WIDTH / 2, this.config.UI.HUD_HEIGHT_PX / 3);

    this.ctx.fillStyle = element.color;
    this.ctx.beginPath();
    this.ctx.arc(ship.x, ship.y - this.config.PLAYFIELD.SHIP_BADGE_OFFSET_Y, this.config.PLAYFIELD.SHIP_BADGE_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = this.config.RENDER.COLORS.PAGE_BACKGROUND;
    this.ctx.font = `700 ${this.config.PLAYFIELD.SHIP_BADGE_RADIUS}px ${this.config.UI.FONT_FAMILY}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(element.label, ship.x, ship.y - this.config.PLAYFIELD.SHIP_BADGE_OFFSET_Y);
    this.ctx.restore();
  }

  drawLasers(lasers) {
    lasers.forEach((laser) => {
      this.ctx.save();
      this.ctx.strokeStyle = this.config.RENDER.COLORS.LASER_GLOW;
      this.ctx.lineWidth = this.config.RENDER.LASER_GLOW_WIDTH;
      this.drawLine(laser.from, laser.to);
      this.ctx.strokeStyle = laser.color ?? this.config.RENDER.COLORS.LASER_CORE;
      this.ctx.lineWidth = this.config.RENDER.LASER_WIDTH;
      this.drawLine(laser.from, laser.to);
      this.ctx.restore();
    });
  }

  drawTrail(trail, nowMs) {
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
      const alpha = Math.max(0, 1 - ageMs / this.config.GESTURES.TRAIL_FADE_DURATION_MS);
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
}
