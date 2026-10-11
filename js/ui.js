import { CROPS } from './config.js';
import { state } from './state.js';

export class UI {
  constructor() {
    this.moneyEl = document.getElementById('money');
    this.harvestedEl = document.getElementById('harvested');
    this.dayEl = document.getElementById('day');
    this.levelEl = document.getElementById('level');
    this.expEl = document.getElementById('exp');
    this.messageEl = document.getElementById('message');
    this.seedListEl = document.getElementById('seed-list');
    this._buildSeeds(); 
    this._bindTools();
  }

  _buildSeeds() {
    this.seedListEl.innerHTML = '';
    Object.values(CROPS).forEach((crop, i) => {
      const btn = document.createElement('button');
      btn.className = 'seed-btn' + (i === 0 ? ' selected' : '');
      btn.dataset.crop = crop.id;
      btn.textContent = `${crop.emoji} ${crop.name} - ${crop.cost}$`;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.seed-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.selectedCrop = crop.id;
      });
      this.seedListEl.appendChild(btn);
    });
  }

  _bindTools() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.tool = btn.dataset.tool;
      });
    });
  }

  update() {
    this.moneyEl.textContent = state.money;
    this.harvestedEl.textContent = state.harvested;
    this.dayEl.textContent = state.day;
    if (this.levelEl) this.levelEl.textContent = state.level;
    if (this.expEl) this.expEl.textContent = `${state.exp}/${state.level * 100}`;
  }

  showMessage(text) {
    this.messageEl.textContent = text;
    this.messageEl.classList.add('show');
    clearTimeout(this._t);
    this._t = setTimeout(() => this.messageEl.classList.remove('show'), 2000);
  }

  hideLoading() { 
    document.getElementById('loading').classList.add('hidden'); 
  }
}