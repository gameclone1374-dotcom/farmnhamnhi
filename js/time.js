import { CONFIG } from './config.js';
import { state, saveGame } from './state.js';

export class GameTime {
  constructor(onNewDay) {
    this.onNewDay = onNewDay;
    this.dayLength = CONFIG.world.dayLength; // 3600 giây = 1 giờ thực tế = 24h trong game
    this.saveIntervalTimer = 0;
  }

  update(dt, uiUpdateCallback) {
    state.time += dt;

    this.saveIntervalTimer += dt;
    if (this.saveIntervalTimer > 10) {
      saveGame();
      this.saveIntervalTimer = 0;
    }

    const dayProgress = (state.time % this.dayLength) / this.dayLength;
    const newDay = Math.floor(state.time / this.dayLength) + 1;
    
    if (newDay !== state.day) {
      state.day = newDay;
      if (this.onNewDay) this.onNewDay(state.day);
      saveGame();
    }

    if (uiUpdateCallback) uiUpdateCallback(this.getFormattedTime(dayProgress));

    return dayProgress;
  }

  // Chuyển tiến trình ngày (0 đến 1) thành giờ:phút định dạng 24h (00:00 đến 23:59)
  getFormattedTime(progress) {
    const totalMinutes = Math.floor(progress * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}