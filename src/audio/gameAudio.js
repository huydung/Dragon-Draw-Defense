const STORAGE_KEY = "dragon-draw-defense-audio-enabled";

const ICON_SPEAKER_ON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
const ICON_SPEAKER_OFF = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;

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

    this.button.innerHTML = this.enabled ? ICON_SPEAKER_ON : ICON_SPEAKER_OFF;
    this.button.setAttribute("aria-label", this.enabled ? "Audio on" : "Audio off");
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
