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

    this.drawPointPath(
      points.map(([x, y]) => ({ x, y })),
      this.config.RENDER.COLORS.DEFENSE_LINE,
      this.config.GESTURES.TRAIL_WIDTH
    );
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

  drawLine(from, to) {
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }
}
