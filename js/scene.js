import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from './config.js';
import { Plot } from './plot.js';
import { state, loadGame } from './state.js';

export class GameScene {
  constructor(container, onMessage) {
    this.container = container; this.onMessage = onMessage;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, CONFIG.world.fogNear, CONFIG.world.fogFar);
    
    this._createCamera(); 
    this._createRenderer(); 
    this._createControls();
    this._createLights(); 
    this._createEnvironment(); 
    this._createFarmPlots();
  }

  _createCamera() {
    const c = CONFIG.camera;
    this.camera = new THREE.PerspectiveCamera(c.fov, window.innerWidth / window.innerHeight, c.near, c.far);
    this.camera.position.set(...c.position);
  }

  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: CONFIG.renderer.antialias, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = CONFIG.renderer.toneMappingExposure;
    this.container.appendChild(this.renderer.domElement);
  }

  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = CONFIG.camera.maxPolarAngle;
    this.controls.minDistance = CONFIG.camera.minDistance;
    this.controls.maxDistance = CONFIG.camera.maxDistance;
    this.controls.enablePan = true;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  }

  _createLights() {
    this.ambient = new THREE.AmbientLight(0xffffff, 0.45); this.scene.add(this.ambient);
    this.sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
    this.sun.position.set(20, 30, 15); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(CONFIG.renderer.shadowMapSize, CONFIG.renderer.shadowMapSize);
    this.sun.shadow.camera.near = 1; this.sun.shadow.camera.far = 80;
    this.sun.shadow.camera.left = -35; this.sun.shadow.camera.right = 35;
    this.sun.shadow.camera.top = 35; this.sun.shadow.camera.bottom = -35;
    this.sun.shadow.bias = -0.001; this.scene.add(this.sun);
    this.scene.add(new THREE.HemisphereLight(0x87CEEB, 0x3d7a37, 0.35));
  }

  _createEnvironment() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(CONFIG.world.groundSize, CONFIG.world.groundSize),
      new THREE.MeshStandardMaterial({ color: 0x3d8b40, roughness: 0.95, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.scene.add(ground);

    const path = new THREE.Mesh(new THREE.PlaneGeometry(4, 70), new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9 }));
    path.rotation.x = -Math.PI / 2; path.position.y = 0.01; path.receiveShadow = true; this.scene.add(path);

    this._createFence(); this._createTrees(); this._createBarn();
  }

  _createFence() {
    const g = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x6b4423 });
    for (let i = -16; i <= 16; i += 2) {
      for (const z of [-16, 16]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), postMat);
        p.position.set(i, 0.6, z); p.castShadow = true; g.add(p);
      }
      for (const x of [-16, 16]) {
        if (Math.abs(i) === 16) continue;
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), postMat);
        p.position.set(x, 0.6, i); p.castShadow = true; g.add(p);
      }
    }
    for (const z of [-16, 16]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(32.3, 0.1, 0.08), railMat);
      r.position.set(0, 0.9, z); g.add(r);
      const r2 = r.clone(); r2.position.y = 0.5; g.add(r2);
    }
    for (const x of [-16, 16]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 32.3), railMat);
      r.position.set(x, 0.9, 0); g.add(r);
      const r2 = r.clone(); r2.position.y = 0.5; g.add(r2);
    }
    this.scene.add(g);
  }

  _createTrees() {
    [[-20,-14],[-20,12],[20,-14],[20,12],[-14,-20],[12,-20],[-12,20],[14,20]].forEach(([x,z]) => {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
      trunk.position.y = 0.9; trunk.castShadow = true; g.add(trunk);
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), new THREE.MeshStandardMaterial({ color: 0x2d6b2d }));
      leaves.position.y = 2.4; leaves.castShadow = true; g.add(leaves);
      g.position.set(x, 0, z); this.scene.add(g);
    });
  }

  _createBarn() {
    const barn = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 4), new THREE.MeshStandardMaterial({ color: 0xb33a3a }));
    body.position.y = 1.75; body.castShadow = true; body.receiveShadow = true; barn.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 2, 4), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
    roof.position.y = 4.5; roof.rotation.y = Math.PI / 4; roof.castShadow = true; barn.add(roof);
    barn.position.set(-12, 0, -12); this.scene.add(barn);
  }

  _createFarmPlots() {
    this.plotsGroup = new THREE.Group(); this.scene.add(this.plotsGroup);
    const { gridSize, plotSize } = CONFIG.farm;
    const offset = (gridSize - 1) * plotSize / 2;
    for (let iz = 0; iz < gridSize; iz++) {
      for (let ix = 0; ix < gridSize; ix++) {
        const x = ix * plotSize - offset;
        const z = iz * plotSize - offset;
        const plot = new Plot(x, z, ix, iz, plotSize, this.plotsGroup, this.onMessage);
        state.plots.push(plot);
      }
    }

    const loaded = loadGame();
    if (loaded && loaded.plotsData) {
      loaded.plotsData.forEach(pData => {
        const plot = state.plots.find(p => p.ix === pData.ix && p.iz === pData.iz);
        if (plot) plot.restoreState(pData, loaded.elapsedSeconds);
      });
    }
  }

  updateDayNight(t) {
    const sunAngle = t * Math.PI * 2 - Math.PI / 2;
    this.sun.position.x = Math.cos(sunAngle) * 30;
    this.sun.position.y = Math.sin(sunAngle) * 35 + 5;
    this.sun.position.z = 15;
    const intensity = Math.max(0.15, Math.sin(sunAngle) * 0.9 + 0.3);
    this.sun.intensity = intensity;
    this.ambient.intensity = 0.25 + intensity * 0.3;
    const dayColor = new THREE.Color(0x87CEEB);
    const nightColor = new THREE.Color(0x0a1628);
    const sky = dayColor.clone().lerp(nightColor, 1 - Math.max(0, Math.sin(sunAngle)));
    this.scene.background.copy(sky);
    this.scene.fog.color.copy(sky);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() { this.controls.update(); this.renderer.render(this.scene, this.camera); }
  get domElement() { return this.renderer.domElement; }
}