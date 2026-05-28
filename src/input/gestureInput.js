import { GAME_CONFIG } from "../config.js";

export class GestureInput {
  constructor(canvas, handlers, config = GAME_CONFIG) {
    this.canvas = canvas;
    this.handlers = handlers;
    this.config = config;
    this.activePointerId = null;
    this.isDrawing = false;
    this.points = [];
    this.trail = [];
    this.lastDrawLogMs = 0;
  }

  start() {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);
    this.canvas.addEventListener("pointercancel", this.handlePointerUp);
    this.canvas.addEventListener("contextmenu", this.preventContextMenu);
  }

  getTrail(nowMs) {
    const fadeMs = this.config.GESTURES.TRAIL_FADE_DURATION_MS;
    this.trail = this.trail.filter((point) => nowMs - point.createdAtMs <= fadeMs);
    return this.trail;
  }

  getCurrentStroke() {
    return this.points.map(({ x, y }) => [roundForExport(x), roundForExport(y)]);
  }

  handlePointerDown = (event) => {
    this.canvas.setPointerCapture(event.pointerId);
    this.activePointerId = event.pointerId;
    this.isDrawing = true;
    this.points = [];
    const point = this.toVirtualPoint(event);
    this.recordPoint(point, event.timeStamp);
  };

  handlePointerMove = (event) => {
    if (!this.isDrawing || event.pointerId !== this.activePointerId) {
      return;
    }

    const point = this.toVirtualPoint(event);
    this.recordPoint(point, event.timeStamp);

    if (event.timeStamp - this.lastDrawLogMs >= this.config.LOGGING.DRAW_LOG_SAMPLE_INTERVAL_MS) {
      this.lastDrawLogMs = event.timeStamp;
      console.log(`[INPUT:DRAW] Captured ${this.points.length} points. Latest: ${point.x.toFixed(1)},${point.y.toFixed(1)}.`);
    }
  };

  handlePointerUp = (event) => {
    if (!this.isDrawing || event.pointerId !== this.activePointerId) {
      return;
    }

    this.isDrawing = false;
    this.activePointerId = null;
    const finalPoint = this.toVirtualPoint(event);
    this.recordPoint(finalPoint, event.timeStamp);
    this.handlers.onCommit(this.points.map((point) => ({ x: point.x, y: point.y })));
  };

  preventContextMenu = (event) => {
    event.preventDefault();
  };

  recordPoint(point, nowMs) {
    this.points.push(point);
    this.trail.push({ ...point, createdAtMs: nowMs });
    this.handlers.onChange?.(this.points.map((strokePoint) => ({ x: strokePoint.x, y: strokePoint.y })));
  }

  toVirtualPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.config.PLAYFIELD.VIRTUAL_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * this.config.PLAYFIELD.VIRTUAL_HEIGHT;

    return {
      x: clamp(x, 0, this.config.PLAYFIELD.VIRTUAL_WIDTH),
      y: clamp(y, 0, this.config.PLAYFIELD.VIRTUAL_HEIGHT)
    };
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundForExport(value) {
  return Math.round(value * 100) / 100;
}
