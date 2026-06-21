import { phaseImages } from '../assets/evolutionImages.js';
import { EVOLUTIONS, STAT_META } from '../config/evolutions.js';
import { formatTimeSince, getHarmonyMultiplier, getProgress } from '../state/store.js';

export function renderDashboard(state, stageIndex) {
  const evolution = EVOLUTIONS[stageIndex];
  const progress = getProgress(state);

  setText('stage-label', `Fase ${stageIndex + 1}/${EVOLUTIONS.length}`);
  setText('pet-name', evolution.name);
  setText('pet-description', evolution.description);
  setText('core-data', state.coreData.toLocaleString('es-CL'));
  setText('online-time', formatTimeSince(state.bornAt));
  setText('next-stage', progress.next ? `${progress.next.threshold - state.coreData}` : 'Final');
  setText('multiplier', `x${getHarmonyMultiplier(state).toFixed(2)}`);
  setText('xp-stage', `Fase ${stageIndex + 1}/${EVOLUTIONS.length}`);
  setText('xp-text', progress.next ? `${progress.current} / ${progress.max}` : `${state.coreData} / MAX`);

  const xpFill = document.querySelector('#xp-fill');
  if (xpFill) xpFill.style.width = `${progress.percent}%`;

  renderStats(state);
  renderPortrait(stageIndex);
  renderEvolutions(stageIndex, state.coreData);
}

export function logLine(message) {
  setText('log-line', message);
}

export function showFailure(reason) {
  setText('failure-reason', reason);
  document.querySelector('#failure-modal')?.removeAttribute('hidden');
}

export function hideFailure() {
  document.querySelector('#failure-modal')?.setAttribute('hidden', '');
}

function renderStats(state) {
  const root = document.querySelector('#stats');
  if (!root) return;

  root.innerHTML = STAT_META.map((stat) => {
    const value = Math.round(state[stat.key]);
    return `
      <div class="stat-row">
        <div class="stat-row__top"><span>${stat.label}</span><strong>${value}%</strong></div>
        <div class="bar"><div class="bar__fill" style="width:${value}%"></div></div>
      </div>
    `;
  }).join('');
}

function renderPortrait(stageIndex) {
  const root = document.querySelector('#pet-portrait');
  if (!root) return;

  const evolution = EVOLUTIONS[stageIndex];
  const image = phaseImages[evolution.imageKey];
  root.innerHTML = `<img src="${image}" alt="${evolution.name}" loading="eager" />`;
}

function renderEvolutions(stageIndex, coreData) {
  const root = document.querySelector('#evolution-list');
  if (!root) return;

  root.innerHTML = EVOLUTIONS.map((evolution, index) => {
    const locked = coreData < evolution.threshold;
    const classes = ['evolution-card', index === stageIndex ? 'current' : '', locked ? 'locked' : ''].filter(Boolean).join(' ');
    const image = phaseImages[evolution.imageKey];

    return `
      <article class="${classes}">
        <img src="${image}" alt="${locked ? 'Forma bloqueada' : evolution.name}" loading="lazy" />
        <strong>${locked ? '???' : evolution.name}</strong>
        <span>${locked ? `Requiere ${evolution.threshold}` : `Fase ${index + 1}`}</span>
      </article>
    `;
  }).join('');
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}
