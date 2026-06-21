import { getNextEvolution, getStageIndex } from '../config/evolutions.js';

const STORAGE_KEY = 'cybernexo_prisma_phaser_tone_v2';

export const DEFAULT_STATE = {
  energy: 78,
  integrity: 75,
  sync: 74,
  coreData: 0,
  bornAt: Date.now(),
  lastTickAt: Date.now(),
  boostReadyAt: 0,
  repairReadyAt: 0,
  isDead: false
};

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  const state = { ...DEFAULT_STATE, bornAt: Date.now(), lastTickAt: Date.now() };
  saveState(state);
  return state;
}

export function getVitalsAverage(state) {
  return (state.energy + state.integrity + state.sync) / 3;
}

export function getHarmonyMultiplier(state) {
  const average = getVitalsAverage(state);
  const spread = Math.max(state.energy, state.integrity, state.sync) - Math.min(state.energy, state.integrity, state.sync);
  let multiplier = average >= 82 ? 1.65 : average >= 68 ? 1.28 : average >= 55 ? 1 : average >= 42 ? 0.72 : 0.45;

  if (spread <= 12) multiplier += 0.3;
  else if (spread <= 22) multiplier += 0.14;

  return Number(multiplier.toFixed(2));
}

export function applyOfflineDecay(state) {
  if (state.isDead) return { changed: false, reason: '' };

  const stageIndex = getStageIndex(state.coreData);
  const elapsedSteps = Math.floor((Date.now() - state.lastTickAt) / 8000);
  if (elapsedSteps <= 0) return { changed: false, reason: '' };

  for (let i = 0; i < elapsedSteps; i += 1) {
    state.energy = clamp(state.energy - (1.65 + stageIndex * 0.16));
    state.integrity = clamp(state.integrity - (1.35 + stageIndex * 0.14));
    state.sync = clamp(state.sync - (1.48 + stageIndex * 0.15));

    const reason = getFailureReason(state);
    if (reason) {
      state.isDead = true;
      state.lastTickAt = Date.now();
      saveState(state);
      return { changed: true, reason };
    }
  }

  state.lastTickAt += elapsedSteps * 8000;
  saveState(state);
  return { changed: true, reason: '' };
}

export function performAction(state, action) {
  const now = Date.now();
  const beforeStage = getStageIndex(state.coreData);
  const result = {
    ok: true,
    message: '',
    gained: 0,
    evolved: false,
    failureReason: ''
  };

  if (state.isDead) {
    return { ...result, ok: false, message: 'El nexo está caído. Reinicia para volver a intentarlo.' };
  }

  switch (action) {
    case 'feed':
      state.energy = clamp(state.energy + 18);
      state.sync = clamp(state.sync - 3);
      result.gained = 12;
      result.message = '⚡ Energía recargada. El núcleo absorbe fotones de datos.';
      break;
    case 'care':
      state.integrity = clamp(state.integrity + 19);
      state.energy = clamp(state.energy - 2);
      result.gained = 11;
      result.message = '🛡️ Integridad reparada. Los paquetes corruptos fueron aislados.';
      break;
    case 'train':
      state.sync = clamp(state.sync + 21);
      state.energy = clamp(state.energy - 7);
      state.integrity = clamp(state.integrity - 4);
      result.gained = 13;
      result.message = '◈ Entrenamiento ejecutado. La mascota predice mejor el campo.';
      break;
    case 'rest':
      state.integrity = clamp(state.integrity + 8);
      state.sync = clamp(state.sync + 5);
      state.energy = clamp(state.energy - 6);
      result.gained = 6;
      result.message = '☾ Suspensión estable. El nexo baja ruido y recupera coherencia.';
      break;
    case 'boost':
      if (now < state.boostReadyAt) {
        return { ...result, ok: false, message: cooldownMessage('Impulso', state.boostReadyAt) };
      }
      state.energy = clamp(state.energy + 10);
      state.integrity = clamp(state.integrity + 10);
      state.sync = clamp(state.sync + 10);
      state.boostReadyAt = now + 240000;
      result.gained = 15;
      result.message = '⬡ Impulso aplicado. La señal azul atraviesa todo el nexo.';
      break;
    case 'repair':
      if (now < state.repairReadyAt) {
        return { ...result, ok: false, message: cooldownMessage('Restauración', state.repairReadyAt) };
      }
      state.energy = clamp(state.energy + 16);
      state.integrity = clamp(state.integrity + 16);
      state.sync = clamp(state.sync + 16);
      state.repairReadyAt = now + 420000;
      result.gained = 5;
      result.message = '✚ Restauración aplicada. Los subsistemas vuelven a latir.';
      break;
    default:
      return { ...result, ok: false, message: 'Acción no reconocida.' };
  }

  const multiplier = getHarmonyMultiplier(state);
  const finalGain = Math.max(1, Math.round(result.gained * multiplier));
  state.coreData += finalGain;
  state.lastTickAt = Date.now();
  result.gained = finalGain;
  result.evolved = getStageIndex(state.coreData) > beforeStage;

  const failureReason = getFailureReason(state);
  if (failureReason) {
    state.isDead = true;
    result.failureReason = failureReason;
  }

  saveState(state);
  return result;
}

export function getFailureReason(state) {
  if (state.energy <= 0) return 'La Energía llegó a 0. El núcleo no pudo sostener la simulación.';
  if (state.integrity <= 0) return 'La Integridad llegó a 0. La carcasa digital colapsó.';
  if (state.sync <= 0) return 'La Sincronía llegó a 0. La mascota perdió conexión con el nexo.';
  return '';
}

export function getProgress(state) {
  const stageIndex = getStageIndex(state.coreData);
  const next = getNextEvolution(state.coreData);

  if (!next) {
    return { current: state.coreData, max: state.coreData, percent: 100, next: null };
  }

  const from = getThresholdForStage(stageIndex);
  const span = next.threshold - from;
  const current = state.coreData - from;

  return {
    current: Math.max(0, current),
    max: span,
    percent: clamp((current / span) * 100, 0, 100),
    next
  };
}

export function getThresholdForStage(stageIndex) {
  const thresholds = [0, 220, 520, 980, 2100, 4200];
  return thresholds[stageIndex] ?? 0;
}

export function formatTimeSince(timestamp) {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function cooldownMessage(label, readyAt) {
  const seconds = Math.max(1, Math.ceil((readyAt - Date.now()) / 1000));
  return `${label} recargando. Faltan ${seconds}s.`;
}
