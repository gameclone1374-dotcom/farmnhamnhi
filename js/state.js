import { CONFIG } from './config.js';

export const state = {
  money: CONFIG.start.money,
  harvested: CONFIG.start.harvested,
  day: CONFIG.start.day,
  level: CONFIG.start.level,
  exp: CONFIG.start.exp,
  tool: 'plant', // 'plant', 'hoe', 'water', 'harvest'
  selectedCrop: 'wheat',
  plots: [],
  time: 0,
  dayLength: CONFIG.world.dayLength,
};

export function spendMoney(amount) {
  if (state.money < amount) return false;
  state.money -= amount;
  saveGame();
  return true;
}

export function addMoney(amount) { 
  state.money += amount; 
  saveGame();
}

export function addExp(amount) {
  state.exp += amount;
  const nextLevelExp = state.level * 100;
  if (state.exp >= nextLevelExp) {
    state.exp -= nextLevelExp;
    state.level += 1;
    return true; // Báo hiệu lên cấp
  }
  saveGame();
  return false;
}

export function incrementHarvested() { 
  state.harvested += 1; 
  saveGame();
}

export function saveGame() {
  const saveData = {
    money: state.money,
    harvested: state.harvested,
    day: state.day,
    level: state.level,
    exp: state.exp,
    time: state.time,
    timestamp: Date.now(),
    plots: state.plots.map(p => ({
      ix: p.ix,
      iz: p.iz,
      unlocked: p.unlocked,
      state: p.state, // 'locked', 'normal', 'hoed', 'planted', 'grown', 'withered'
      cropType: p.cropType,
      growProgress: p.growProgress,
      stage: p.stage,
      watered: p.watered,
      dryTimer: p.dryTimer
    }))
  };
  localStorage.setItem('farm3d_save_data', JSON.stringify(saveData));
}

export function loadGame() {
  const raw = localStorage.getItem('farm3d_save_data');
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    state.money = data.money ?? CONFIG.start.money;
    state.harvested = data.harvested ?? CONFIG.start.harvested;
    state.day = data.day ?? CONFIG.start.day;
    state.level = data.level ?? CONFIG.start.level;
    state.exp = data.exp ?? CONFIG.start.exp;
    state.time = data.time ?? 0;

    const elapsedSeconds = data.timestamp ? (Date.now() - data.timestamp) / 1000 : 0;
    state.time += elapsedSeconds;

    return { plotsData: data.plots || [], elapsedSeconds };
  } catch (e) {
    console.error('Lỗi khi tải dữ liệu game:', e);
    return null;
  }
}