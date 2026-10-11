import * as THREE from 'three';
import { CROPS } from './config.js';
import { spendMoney, addMoney, incrementHarvested, saveGame } from './state.js';

const plotMatEmpty = new THREE.MeshStandardMaterial({ color: 0x6b4e31, roughness: 0.85 });
const plotMatWatered = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 });

export class Plot {
  constructor(x, z, ix, iz, plotSize, parentGroup, onMessage) {
    this.ix = ix; this.iz = iz; this.x = x; this.z = z;
    this.plotSize = plotSize; this.onMessage = onMessage;
    this.state = 'empty'; this.cropType = null;
    this.growProgress = 0; this.stage = 0; this.watered = false;

    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(plotSize - 0.15, 0.25, plotSize - 0.15),
      plotMatEmpty.clone()
    );
    this.mesh.position.set(x, 0.12, z);
    this.mesh.receiveShadow = true; this.mesh.castShadow = true;
    this.mesh.userData = { type: 'plot', plot: this };
    parentGroup.add(this.mesh);

    this.cropGroup = new THREE.Group();
    this.cropGroup.position.set(x, 0.25, z);
    parentGroup.add(this.cropGroup);
  }

  plant(cropType) {
    if (this.state !== 'empty') { this.onMessage('Ô đất đã có cây!'); return false; }
    const crop = CROPS[cropType];
    if (!crop) return false;
    if (!spendMoney(crop.cost)) { this.onMessage('Không đủ tiền! 💸'); return false; }
    this.state = 'planted'; this.cropType = cropType;
    this.growProgress = 0; this.stage = 0; this.watered = false;
    this.updateCropVisual();
    this.onMessage(`Đã trồng ${crop.name}!`);
    saveGame();
    return true;
  }

  water() {
    if (this.state === 'planted' && !this.watered) {
      this.watered = true;
      this.mesh.material = plotMatWatered.clone();
      this.onMessage('Đã tưới nước! 💧');
      saveGame();
      return true;
    }
    if (this.state === 'empty') this.onMessage('Ô đất trống!');
    else if (this.watered) this.onMessage('Đã tưới rồi!');
    else if (this.state === 'grown') this.onMessage('Cây đã chín, hãy thu hoạch!');
    return false;
  }

  harvest() {
    if (this.state !== 'grown') {
      if (this.state === 'planted') this.onMessage('Cây chưa chín!');
      else this.onMessage('Không có gì để thu!');
      return false;
    }
    const crop = CROPS[this.cropType];
    addMoney(crop.sell); incrementHarvested();
    this.onMessage(`+${crop.sell}$ từ ${crop.name}! 🎉`);
    this.reset();
    saveGame();
    return true;
  }

  reset() {
    this.state = 'empty'; this.cropType = null;
    this.growProgress = 0; this.stage = 0; this.watered = false;
    this.mesh.material = plotMatEmpty.clone();
    this.clearCropVisual();
  }

  update(dt) {
    if (this.state !== 'planted' || !this.watered) return;
    const crop = CROPS[this.cropType];
    this.growProgress += dt;
    const progress = Math.min(1, this.growProgress / crop.growTime);
    const newStage = Math.floor(progress * crop.stages);
    if (newStage !== this.stage) { this.stage = newStage; this.updateCropVisual(); }
    if (progress >= 1) { this.state = 'grown'; this.updateCropVisual(); }
  }

  restoreState(data, elapsedSeconds) {
    this.state = data.state;
    this.cropType = data.cropType;
    this.growProgress = data.growProgress;
    this.stage = data.stage;
    this.watered = data.watered;

    if (this.state === 'planted' && this.watered && this.cropType) {
      const crop = CROPS[this.cropType];
      if (crop) {
        this.growProgress += elapsedSeconds;
        const progress = Math.min(1, this.growProgress / crop.growTime);
        this.stage = Math.floor(progress * crop.stages);
        if (progress >= 1) this.state = 'grown';
      }
    }

    this.mesh.material = this.watered ? plotMatWatered.clone() : plotMatEmpty.clone();
    this.updateCropVisual();
  }

  clearCropVisual() {
    while (this.cropGroup.children.length) {
      const c = this.cropGroup.children[0];
      this.cropGroup.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
  }

  updateCropVisual() {
    this.clearCropVisual();
    if (!this.cropType) return;
    const crop = CROPS[this.cropType];
    const color = new THREE.Color(crop.color);
    const stage = this.stage, maxStage = crop.stages;

    if (stage === 0) {
      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 5), new THREE.MeshStandardMaterial({ color: 0x4a7c3f }));
      sprout.position.y = 0.12; sprout.castShadow = true;
      this.cropGroup.add(sprout);
    } else if (stage < maxStage - 1) {
      const height = 0.3 + stage * 0.35;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, height, 6), new THREE.MeshStandardMaterial({ color: 0x3d7a37 }));
      stem.position.y = height / 2; stem.castShadow = true;
      this.cropGroup.add(stem);
      for (let i = 0; i < stage; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18 + i * 0.05, 6, 4), new THREE.MeshStandardMaterial({ color: 0x4a9c4a }));
        leaf.position.set(Math.sin(i * 2.1) * 0.25, height * 0.4 + i * 0.15, Math.cos(i * 2.1) * 0.25);
        leaf.scale.y = 0.5; leaf.castShadow = true;
        this.cropGroup.add(leaf);
      }
    } else {
      this._createMature(crop, color, maxStage);
    }
  }

  _createMature(crop, color, maxStage) {
    const height = 0.9 + (maxStage > 4 ? 0.3 : 0);
    if (crop.id === 'wheat') {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, height, 6), new THREE.MeshStandardMaterial({ color: 0x3d7a37 }));
      stem.position.y = height / 2; stem.castShadow = true; this.cropGroup.add(stem);
      for (let i = 0; i < 5; i++) {
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 5), new THREE.MeshStandardMaterial({ color }));
        head.position.set(Math.sin(i * 1.2) * 0.15, height + 0.1, Math.cos(i * 1.2) * 0.15);
        head.castShadow = true; this.cropGroup.add(head);
      }
    } else if (crop.id === 'carrot') {
      const root = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), new THREE.MeshStandardMaterial({ color }));
      root.position.y = 0.15; root.rotation.x = Math.PI; root.castShadow = true; this.cropGroup.add(root);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), new THREE.MeshStandardMaterial({ color: 0x4a9c4a }));
      top.position.y = 0.45; top.scale.y = 0.6; this.cropGroup.add(top);
    } else if (crop.id === 'tomato') {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, height, 6), new THREE.MeshStandardMaterial({ color: 0x3d7a37 }));
      stem.position.y = height / 2; stem.castShadow = true; this.cropGroup.add(stem);
      for (let i = 0; i < 4; i++) {
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshStandardMaterial({ color }));
        fruit.position.set(Math.sin(i * 1.6) * 0.22, height * 0.6 + (i % 2) * 0.2, Math.cos(i * 1.6) * 0.22);
        fruit.castShadow = true; this.cropGroup.add(fruit);
      }
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 4), new THREE.MeshStandardMaterial({ color: 0x3d8b3d }));
      leaf.position.y = height + 0.1; leaf.scale.y = 0.4; this.cropGroup.add(leaf);
    } else if (crop.id === 'pumpkin') {
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), new THREE.MeshStandardMaterial({ color }));
      fruit.position.y = 0.4; fruit.scale.y = 0.8; fruit.castShadow = true; this.cropGroup.add(fruit);
      const stemTop = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.2, 5), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
      stemTop.position.y = 0.75; this.cropGroup.add(stemTop);
    }
  }
}
