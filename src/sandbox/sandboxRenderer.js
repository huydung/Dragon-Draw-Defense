import { GAME_CONFIG } from "../config.js";

export class SandboxRenderer {
  constructor(canvas, config = GAME_CONFIG) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.config = config;
    this.resizeObserver = new ResizeObserver(this.resizeCanvas);
  }

  start() {
    this.resizeObserver.observe(this.canvas);
    this.resizeCanvas();
  }

  render(stroke, selectedTemplate = []) {
    this.clear();
    this.drawBackground();
    this.drawTemplate(selectedTemplate);
    this.drawStroke(stroke);
  }

  renderTemplate(selectedTemplate = []) {
    this.clear();
    this.drawBackground();
    this.drawTemplate(selectedTemplate);
  }

  renderStroke(stroke = []) {
    this.clear();
    this.drawBackground();
    this.drawStroke(stroke);
  }

  resizeCanvas = () => {
    const pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = this.config.PLAYFIELD.VIRTUAL_WIDTH * pixelRatio;
    this.canvas.height = this.config.PLAYFIELD.VIRTUAL_HEIGHT * pixelRatio;
    this.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  clear() {
    this.ctx.clearRect(0, 0, this.config.PLAYFIELD.VIRTUAL_WIDTH, this.config.PLAYFIELD.VIRTUAL_HEIGHT);
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.PLAYFIELD.VIRTUAL_HEIGHT);
    gradient.addColorStop(0, this.config.RENDER.COLORS.PLAYFIELD_TOP);
    gradient.addColorStop(1, this.config.RENDER.COLORS.PLAYFIELD_BOTTOM);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.config.PLAYFIELD.VIRTUAL_WIDTH, this.config.PLAYFIELD.VIRTUAL_HEIGHT);

    this.ctx.strokeStyle = this.config.RENDER.COLORS.GRID_LINE;
    this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH;
    for (let x = 0; x <= this.config.PLAYFIELD.VIRTUAL_WIDTH; x += this.config.RENDER.BACKGROUND_GRID_STEP) {
      this.drawLine({ x, y: 0 }, { x, y: this.config.PLAYFIELD.VIRTUAL_HEIGHT });
    }
    for (let y = 0; y <= this.config.PLAYFIELD.VIRTUAL_HEIGHT; y += this.config.RENDER.BACKGROUND_GRID_STEP) {
      this.drawLine({ x: 0, y }, { x: this.config.PLAYFIELD.VIRTUAL_WIDTH, y });
    }
  }

  drawTemplate(points) {
    if (points.length < this.config.GESTURES.MIN_STROKE_POINTS) {
      return;
    }

    const path = points.map(([x, y]) => ({ x, y }));
    this.drawPointPath(path, this.config.RENDER.COLORS.DEFENSE_LINE, this.config.GESTURES.TRAIL_WIDTH);
    this.drawOrderMarkers(path);
  }

  drawStroke(points) {
    if (points.length < this.config.GESTURES.MIN_STROKE_POINTS) {
      return;
    }

    this.drawPointPath(points, this.config.GESTURES.TRAIL_COLOR, this.config.GESTURES.TRAIL_WIDTH);
  }

  drawPointPath(points, color, width) {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = width * this.config.UI.BUTTON_RADIUS_PX;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => this.ctx.lineTo(point.x, point.y));
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawOrderMarkers(points) {
    this.ctx.save();
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.font = `700 ${this.config.PLAYFIELD.SHIP_BADGE_RADIUS - this.config.UI.BUTTON_RADIUS_PX}px ${this.config.UI.FONT_FAMILY}`;

    points.forEach((point, index) => {
      const marker = this.getOffsetMarker(point, index, points);
      this.ctx.fillStyle = index === 0 ? this.config.GESTURES.TRAIL_COLOR : this.config.RENDER.COLORS.DEFENSE_LINE;
      this.ctx.beginPath();
      this.ctx.arc(marker.x, marker.y, this.config.PLAYFIELD.SHIP_BADGE_RADIUS - this.config.UI.BUTTON_RADIUS_PX, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = this.config.RENDER.COLORS.PAGE_BACKGROUND;
      this.ctx.fillText(String(index + 1), marker.x, marker.y);
      this.ctx.strokeStyle = this.config.RENDER.COLORS.DEFENSE_LINE;
      this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH;
      this.drawLine(point, marker);
    });

    const nextToLast = points[points.length - 2];
    const last = points[points.length - 1];
    this.drawEndArrow(nextToLast, last);
    this.ctx.restore();
  }

  getOffsetMarker(point, index, points) {
    const previous = points[index - 1] ?? point;
    const next = points[index + 1] ?? point;
    const tangent = {
      x: next.x - previous.x,
      y: next.y - previous.y
    };
    const length = Math.max(Number.EPSILON, Math.hypot(tangent.x, tangent.y));
    const normal = {
      x: -tangent.y / length,
      y: tangent.x / length
    };
    const offset = this.config.PLAYFIELD.SHIP_BADGE_RADIUS + this.config.UI.HUD_GAP_PX;

    return {
      x: clamp(point.x + normal.x * offset, offset, this.config.PLAYFIELD.VIRTUAL_WIDTH - offset),
      y: clamp(point.y + normal.y * offset, offset, this.config.PLAYFIELD.VIRTUAL_HEIGHT - offset)
    };
  }

  drawEndArrow(from, to) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const arrowLength = this.config.PLAYFIELD.SHIP_BADGE_RADIUS + this.config.UI.BUTTON_RADIUS_PX;
    const arrowSpread = Math.PI / 7;

    this.ctx.strokeStyle = this.config.GESTURES.TRAIL_COLOR;
    this.ctx.lineWidth = this.config.RENDER.CANVAS_BORDER_WIDTH + this.config.RENDER.CANVAS_BORDER_WIDTH;
    this.drawLine(to, {
      x: to.x - Math.cos(angle - arrowSpread) * arrowLength,
      y: to.y - Math.sin(angle - arrowSpread) * arrowLength
    });
    this.drawLine(to, {
      x: to.x - Math.cos(angle + arrowSpread) * arrowLength,
      y: to.y - Math.sin(angle + arrowSpread) * arrowLength
    });
  }

  drawLine(from, to) {
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
