const STORAGE_KEY = "dragon-draw-defense-audio-enabled";

export class GameAudio {
  constructor(config, controls = {}) {
    this.config = config;
    this.button = controls.button ?? null;
    this.audioFactory = controls.audioFactory ?? ((path) => new Audio(path));
    this.storage = controls.storage ?? window.localStorage;
    this.enabled = loadEnabledPreference(this.storage);
    this.unlocked = false;
    this.music = this.createMusic();
    this.updateButton();
  }

  createMusic() {
    const music = this.audioFactory(this.config.AUDIO.MUSIC);
    music.loop = true;
    music.volume = this.config.AUDIO.VOLUMES.MUSIC;
    music.preload = "auto";
    return music;
  }

  unlock() {
    this.unlocked = true;
    this.playMusic();
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      this.storage.setItem(STORAGE_KEY, this.enabled ? "true" : "false");
    } catch {
      // Ignore storage failures; audio should still work for this session.
    }

    if (this.enabled) {
      this.play("click");
      this.playMusic();
    } else {
      this.music.pause();
    }

    this.updateButton();
  }

  play(name) {
    if (!this.enabled || !this.config.AUDIO.SFX[name]) {
      return;
    }

    const sound = this.audioFactory(this.config.AUDIO.SFX[name]);
    sound.volume = this.config.AUDIO.VOLUMES[name.toUpperCase()] ?? this.config.AUDIO.VOLUMES.SFX;
    sound.play().catch(() => {});
  }

  playStrike() {
    this.play("strike");
    window.setTimeout(() => this.play("burst"), this.config.AUDIO.STRIKE_BURST_DELAY_MS);
  }

  playMusic() {
    if (!this.enabled || !this.unlocked || !this.music.paused) {
      return;
    }

    this.music.play().catch(() => {});
  }

  updateButton() {
    if (!this.button) {
      return;
    }

    this.button.textContent = this.enabled ? "Audio On" : "Audio Off";
    this.button.setAttribute("aria-pressed", String(this.enabled));
  }
}

function loadEnabledPreference(storage) {
  try {
    return storage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}
