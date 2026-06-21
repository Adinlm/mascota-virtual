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
  root.innerHTML = evolutionSvg(stageIndex, false);
}

function renderEvolutions(stageIndex, coreData) {
  const root = document.querySelector('#evolution-list');
  if (!root) return;

  root.innerHTML = EVOLUTIONS.map((evolution, index) => {
    const locked = coreData < evolution.threshold;
    const classes = ['evolution-card', index === stageIndex ? 'current' : '', locked ? 'locked' : ''].filter(Boolean).join(' ');
    return `
      <article class="${classes}">
        ${evolutionSvg(index, locked)}
        <strong>${locked ? '???' : evolution.name}</strong>
        <span>${locked ? `Requiere ${evolution.threshold}` : `Fase ${index + 1}`}</span>
      </article>
    `;
  }).join('');
}

function evolutionSvg(stageIndex, locked) {
  const evolution = EVOLUTIONS[stageIndex];
  const primary = colorToHex(evolution.palette.primary);
  const secondary = colorToHex(evolution.palette.secondary);
  const accent = colorToHex(evolution.palette.accent);
  const bodyWidth = 72 + stageIndex * 9;
  const tail = stageIndex >= 1
    ? `<path d="M${164 + stageIndex * 3} 158 q${34 + stageIndex * 5} ${-36 - stageIndex * 6} ${62 + stageIndex * 6} 8" fill="none" stroke="${primary}" stroke-width="8" stroke-linecap="round"/><circle cx="${224 + stageIndex * 7}" cy="${164 - stageIndex * 5}" r="${9 + stageIndex}" fill="${accent}"/>`
    : '';
  const halo = stageIndex >= 4
    ? `<circle cx="150" cy="155" r="${72 + stageIndex * 5}" fill="none" stroke="#ffffff" stroke-opacity=".32" stroke-width="4"/>`
    : '';

  return `
    <svg viewBox="0 0 300 300" role="img" aria-label="${locked ? 'Forma bloqueada' : evolution.name}">
      <defs>
        <radialGradient id="g-${stageIndex}-${locked ? 'l' : 'u'}">
          <stop offset="0" stop-color="${primary}" stop-opacity=".9"/>
          <stop offset="1" stop-color="#06101c"/>
        </radialGradient>
      </defs>
      <rect width="300" height="300" rx="24" fill="#050a13"/>
      <circle cx="150" cy="150" r="${94 + stageIndex * 10}" fill="url(#g-${stageIndex}-${locked ? 'l' : 'u'})" opacity=".22"/>
      ${halo}
      <path d="M${150 - bodyWidth} ${190 - stageIndex * 3} Q150 ${92 - stageIndex * 8} ${150 + bodyWidth} ${190 - stageIndex * 3} Q150 ${230 - stageIndex * 2} ${150 - bodyWidth} ${190 - stageIndex * 3}Z" fill="#111b2c" stroke="${primary}" stroke-width="6"/>
      <circle cx="${132 - stageIndex}" cy="164" r="${8 + stageIndex * 0.7}" fill="${primary}"/>
      <circle cx="${168 + stageIndex}" cy="164" r="${8 + stageIndex * 0.7}" fill="${primary}"/>
      <path d="M118 ${130 - stageIndex * 4} l${-18 - stageIndex * 3} ${-30 - stageIndex * 2} M182 ${130 - stageIndex * 4} l${18 + stageIndex * 3} ${-30 - stageIndex * 2}" stroke="${secondary}" stroke-width="7" stroke-linecap="round"/>
      ${tail}
      <text x="150" y="270" fill="#dff" font-size="19" text-anchor="middle" font-family="system-ui">${locked ? 'LOCKED' : `Fase ${stageIndex + 1}`}</text>
    </svg>
  `;
}

function colorToHex(value) {
  return `#${value.toString(16).padStart(6, '0')}`;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}
