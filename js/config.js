export const CONFIG = {
  camera: { fov: 50, near: 0.1, far: 200, position: [18, 16, 18], minDistance: 8, maxDistance: 40, maxPolarAngle: Math.PI / 2.2 },
  renderer: { antialias: true, shadowMapSize: 1024, toneMappingExposure: 1.1 },
  world: { groundSize: 60, fogNear: 40, fogFar: 90, dayLength: 120 },
  farm: { gridSize: 5, plotSize: 2.2 },
  start: { money: 100, harvested: 0, day: 1 },
};

export const CROPS = {
  wheat:   { id: 'wheat',   name: 'Lúa mì',  emoji: '🌾', cost: 15, sell: 35,  growTime: 25, color: 0xf4d03f, stages: 4 },
  carrot:  { id: 'carrot',  name: 'Cà rốt',  emoji: '🥕', cost: 20, sell: 50,  growTime: 35, color: 0xe67e22, stages: 4 },
  tomato:  { id: 'tomato',  name: 'Cà chua', emoji: '🍅', cost: 30, sell: 80,  growTime: 45, color: 0xe74c3c, stages: 5 },
  pumpkin: { id: 'pumpkin', name: 'Bí ngô',  emoji: '🎃', cost: 50, sell: 140, growTime: 60, color: 0xf39c12, stages: 5 },
};
