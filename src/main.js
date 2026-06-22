import { Soundscape } from './audio/soundscape.js';
import { EVOLUTIONS, getStageIndex } from './config/evolutions.js';
import { PetScene } from './game/PetScene.js';
import { registerServiceWorker } from './pwa.js';
import { applyOfflineDecay, loadState, performAction, resetState, saveState } from './state/store.js';
import { hideFailure, logLine, renderDashboard, showFailure } from './ui/dashboard.js';

let state = loadState();
let stageIndex = getStageIndex(state.coreData);
window.__CYBERNEXO_STAGE__ = stageIndex;
const soundscape = new Soundscape();
let game;
let petScene;

window.__CYBERNEXO_ATTACH_SCENE__ = attachPetScene;

bootstrap();

function bootstrap() {
  registerServiceWorker();
  initPhaser();
  bindEvents();

  const decay = applyOfflineDecay(state);
  stageIndex = getStageIndex(state.coreData);
  window.__CYBERNEXO_STAGE__ = stageIndex;
  renderDashboard(state, stageIndex);
  syncSceneStage();
  if (decay.reason) showFailure(decay.reason);

  setInterval(() => {
    const result = applyOfflineDecay(state);
    stageIndex = getStageIndex(state.coreData);
    window.__CYBERNEXO_STAGE__ = stageIndex;
    renderDashboard(state, stageIndex);
    syncSceneStage();
    if (result.reason) {
      soundscape.playFailure();
      petScene?.fail();
      showFailure(result.reason);
    }
  }, 5000);
}

function initPhaser() {
  if (!window.Phaser) {
    logLine('Phaser no cargó. Revisa conexión a internet la primera vez que abras la PWA.');
    return;
  }

  window.addEventListener('cybernexo-pet-scene-ready', (event) => {
    attachPetScene(event.detail?.scene);
  });

  game = new window.Phaser.Game({
    type: window.Phaser.AUTO,
    parent: 'game-root',
    backgroundColor: '#02050d',
    scale: {
      mode: window.Phaser.Scale.RESIZE,
      autoCenter: window.Phaser.Scale.CENTER_BOTH,
      width: 920,
      height: 420,
      min: { width: 320, height: 300 }
    },
    scene: [PetScene]
  });

  game.events.on('pet-scene-ready', attachPetScene);
  attachPetScene(window.__CYBERNEXO_PET_SCENE__);
}

function attachPetScene(scene) {
  if (!scene || petScene === scene) return;
  petScene = scene;
  syncSceneStage();
}

function bindEvents() {
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => handleAction(button.dataset.action));
  });

  document.querySelector('#pulse')?.addEventListener('click', async () => {
    await ensureAudio();
    syncSceneStage();
    soundscape.playPulse();
    petScene?.react('pulse');
    logLine('◌ Pulso emitido. La señal resonó en el campo de entrenamiento.');
  });

  document.querySelector('#audio-toggle')?.addEventListener('click', async () => {
    const enabled = await soundscape.toggle(stageIndex);
    document.querySelector('#audio-toggle').textContent = enabled ? 'Silenciar audio' : 'Activar audio';
  });

  document.querySelector('#reset-save')?.addEventListener('click', hardReset);
  document.querySelector('#new-run')?.addEventListener('click', hardReset);
}

async function handleAction(action) {
  await ensureAudio();

  const beforeStage = stageIndex;
  const result = performAction(state, action);

  stageIndex = getStageIndex(state.coreData);
  window.__CYBERNEXO_STAGE__ = stageIndex;
  renderDashboard(state, stageIndex);

  if (!result.ok) {
    syncSceneStage();
    logLine(result.message);
    return;
  }

  soundscape.playAction(action);

  if (result.evolved && stageIndex > beforeStage) {
    soundscape.setStage(stageIndex);
    soundscape.playEvolution();
    evolveSceneStage();
    logLine(`✦ Evolución desbloqueada: ${EVOLUTIONS[stageIndex].name}. +${result.gained} datos.`);
  } else {
    syncSceneStage();
    petScene?.react(action);
    logLine(`${result.message} +${result.gained} datos.`);
  }

  if (result.failureReason) {
    soundscape.playFailure();
    petScene?.fail();
    showFailure(result.failureReason);
  }

  saveState(state);
}

async function ensureAudio() {
  if (soundscape.enabled) return;
  const enabled = await soundscape.start(stageIndex);
  const button = document.querySelector('#audio-toggle');
  if (button) button.textContent = enabled ? 'Silenciar audio' : 'Activar audio';
}

function syncSceneStage() {
  window.__CYBERNEXO_STAGE__ = stageIndex;
  window.dispatchEvent(new CustomEvent('cybernexo-stage-sync', {
    detail: { stageIndex }
  }));
}

function evolveSceneStage() {
  window.__CYBERNEXO_STAGE__ = stageIndex;
  window.dispatchEvent(new CustomEvent('cybernexo-stage-evolved', {
    detail: { stageIndex }
  }));
}

function hardReset() {
  state = resetState();
  stageIndex = getStageIndex(state.coreData);
  window.__CYBERNEXO_STAGE__ = stageIndex;
  hideFailure();
  renderDashboard(state, stageIndex);
  soundscape.setStage(stageIndex);
  syncSceneStage();
  logLine('Nexo reiniciado. Nueva línea evolutiva preparada.');
}
