import { CONFIG } from './config.js';
import { state, saveGame } from './state.js';

export class GameTime {
  constructor(onNewDay) {
    this.onNewDay = onNewDay;
    this.dayLength = CONFIG.world.dayLength; // 3600 giây (1 giờ)
    this.saveIntervalTimer = 0;
  }

  update(dt, uiUpdateCallback) {
    state.time += dt;

    // Tự động lưu game định kỳ mỗi 10 giây
    this.saveIntervalTimer += dt;
    if (this.saveIntervalTimer > 10) {
      saveGame();
      this.saveIntervalTimer = 0;
    }

    // Tính toán ngày mới
    const dayProgress = (state.time % this.dayLength) / this.dayLength;
    const newDay = Math.floor(state.time / this.dayLength) + 1;
    
    if (newDay !== state.day) {
      state.day = newDay;
      if (uiUpdateCallback) uiUpdateCallback();
      if (this.onNewDay) this.onNewDay(state.day);
      saveGame();
    }

    return dayProgress;
  }
}