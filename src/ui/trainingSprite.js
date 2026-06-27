import { phaseImages } from '../assets/evolutionImages.js';
import { phase1TrainingFrames } from '../assets/phase1TrainingFrames.js';
import { phase2TrainingFrames } from '../assets/phase2TrainingFrames.js';
import { phase3TrainingFrames } from '../assets/phase3TrainingFrames.js';
import { phase4TrainingFrames } from '../assets/phase4TrainingFrames.js';
import { phase5TrainingFrames } from '../assets/phase5TrainingFrames.js';
import { phase6TrainingFrames } from '../assets/phase6TrainingFrames.js';
import { EVOLUTIONS } from '../config/evolutions.js';

let root;
let overlay;
let frontLayer;
let unit;
let image;
let afterimages = [];
let dummies = [];
let stageIndex = 0;
let target = null;
let position = { x: 0, y: 0 };
let velocityFlip = 1;
let lastFrame = 0;
let rafId = 0;
let resizeObserver;
let currentSrc = '';
let activeMotion = 'roam';
let actionUntil = 0;
let nextActionAt = 0;
let activeSpriteFrames = null;
let spriteFrameIndex = 0;
let nextSpriteFrameAt = 0;
let solidPhase1Frames = null;
let solidPhase1Promise = null;
let fallbackLocked = false;

const repairedFrameCache = new Map();
const repairedFramePromises = new Map();

const SPEED = 54;
const TARGET_REACHED_DISTANCE = 8;
const SPRITE_FRAME_INTERVAL = 120;
const FLOAT_FRAME_INTERVAL = 155;
const FILL_COLOR = [224, 235, 248, 255];
const PHASE_6_STAGE_INDEX = 5;

const TRAINING_FRAMES_BY_STAGE = [
  phase1TrainingFrames,
  phase2TrainingFrames,
  phase3TrainingFrames,
  phase4TrainingFrames,
  phase5TrainingFrames,
  phase6TrainingFrames
];

const ACTION_DURATIONS = {
  roam: 520,
  focus: 780,
  dash: 520,
  float: 960
};

export function initTrainingSprite(initialStageIndex = 0) {
  root = document.querySelector('#game-root');
  if (!root) return;

  overlay = root.querySelector('.training-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'training-overlay';
    root.appendChild(overlay);
  }

  ensureOverlayStructure();

  unit = overlay.querySelector('.training-pet-unit');
  image = overlay.querySelector('.training-pet-img');
  frontLayer = overlay.querySelector('.training-layer--front');
  afterimages = [...overlay.querySelectorAll('.training-afterimage')];
  dummies = [...overlay.querySelectorAll('.training-dummy')];
  image.onerror = handleSpriteError;

  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      clampPosition();
      pickTarget();
    });
    resizeObserver.observe(root);
  }

  schedulePhase6FrameRepair();
  stageIndex = normalizeStage(initialStageIndex);
  centerPosition();
  setTrainingStage(stageIndex, { force: true });
  startLoop();
}

export function setTrainingStage(nextStageIndex, options = {}) {
  if (!root || !image) initTrainingSprite(nextStageIndex);
  if (!root || !image) return;

  const nextStage = normalizeStage(nextStageIndex);
  const evolution = EVOLUTIONS[nextStage];
  const waitingForCleanFrames = needsRuntimeBackgroundRepair(nextStage) && !repairedFrameCache.has(nextStage);
  const frameSet = getTrainingFramesForStage(nextStage);
  const nextSrc = waitingForCleanFrames ? '' : frameSet?.[0] ?? phaseImages[evolution.imageKey];
  const shouldAnimate = options.evolved || options.forceEvolution;
  const sourceChanged = waitingForCleanFrames || currentSrc !== nextSrc || activeSpriteFrames !== frameSet;

  fallbackLocked = false;
  activeSpriteFrames = waitingForCleanFrames ? null : frameSet;
  spriteFrameIndex = 0;
  nextSpriteFrameAt = performance.now() + getFrameInterval(nextStage);

  stageIndex = nextStage;
  const phaseNumber = stageIndex + 1;
  root.dataset.trainingStage = String(phaseNumber);
  overlay.dataset.trainingStage = String(phaseNumber);
  unit.dataset.stage = String(phaseNumber);
  unit.dataset.spriteMode = waitingForCleanFrames ? 'loading' : frameSet ? 'frames' : 'static';
  unit.dataset.spriteLoading = waitingForCleanFrames ? 'true' : 'false';
  unit.dataset.motion = stageIndex === PHASE_6_STAGE_INDEX ? 'float' : 'roam';
  unit.style.setProperty('--stage-color', getStageColorCss());
  unit.style.setProperty('--training-intensity', String(0.75 + stageIndex * 0.12));

  if (waitingForCleanFrames) {
    image.alt = evolution.name;
    hideSpriteFrame();
  } else if (sourceChanged || options.force) {
    image.alt = evolution.name;
    setSpriteFrame(nextSrc);
    preloadSpriteFrames(frameSet);
  }

  clampPosition();
  if (!target) pickTarget();

  if (shouldAnimate) {
    playEvolutionEffect();
    scheduleNextAction(140);
  } else if (sourceChanged && !waitingForCleanFrames) {
    pulseTrainingSprite('sync');
    scheduleNextAction(420);
  }
}

export function pulseTrainingSprite(action = 'pulse') {
  if (!unit) return;
  unit.classList.remove('training-react');
  unit.dataset.action = action;
  unit.dataset.motion = action === 'repair' ? 'focus' : stageIndex === PHASE_6_STAGE_INDEX ? 'float' : 'dash';
  activeMotion = unit.dataset.motion;
  actionUntil = performance.now() + 430;

  void unit.offsetWidth;
  unit.classList.add('training-react');
  spawnParticles(action === 'repair' ? 0x79ffd8 : getStageColor());
  spawnActionEffect(action === 'repair' ? 'focus' : activeMotion);
}

export function playEvolutionEffect() {
  if (!unit || !overlay) return;

  unit.classList.remove('training-evolving', 'training-react');
  unit.dataset.motion = 'focus';
  activeMotion = 'focus';
  actionUntil = performance.now() + 900;

  void unit.offsetWidth;
  unit.classList.add('training-evolving');
  spawnEvolutionRing();
  spawnSpeedLines(12);
  spawnParticles(getStageColor(), 26);

  window.setTimeout(() => {
    unit?.classList.remove('training-evolving');
  }, 860);
}

function getTrainingFramesForStage(nextStage) {
  if (nextStage === 0) {
    if (solidPhase1Frames) return solidPhase1Frames;
    prepareSolidPhase1Frames();
    return phase1TrainingFrames;
  }

  const frames = TRAINING_FRAMES_BY_STAGE[nextStage] ?? null;
  if (!frames) return null;

  if (needsRuntimeBackgroundRepair(nextStage)) {
    const repairedFrames = repairedFrameCache.get(nextStage);
    if (repairedFrames) return repairedFrames;
    prepareTransparentStageFrames(nextStage, frames);
  }

  return frames;
}

function needsRuntimeBackgroundRepair(nextStage) {
  return nextStage === PHASE_6_STAGE_INDEX;
}

function getFrameInterval(nextStage = stageIndex) {
  return nextStage === PHASE_6_STAGE_INDEX ? FLOAT_FRAME_INTERVAL : SPRITE_FRAME_INTERVAL;
}

function schedulePhase6FrameRepair() {
  const repair = () => prepareTransparentStageFrames(PHASE_6_STAGE_INDEX, phase6TrainingFrames);

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(repair, { timeout: 1800 });
  } else {
    window.setTimeout(repair, 420);
  }
}

function prepareSolidPhase1Frames() {
  if (solidPhase1Frames || solidPhase1Promise) return;

  solidPhase1Promise = Promise.all(phase1TrainingFrames.map(repairTransparentHoles))
    .then((frames) => {
      solidPhase1Frames = frames;
      if (stageIndex === 0 && unit && image) {
        activeSpriteFrames = solidPhase1Frames;
        spriteFrameIndex = 0;
        setSpriteFrame(solidPhase1Frames[0]);
        preloadSpriteFrames(solidPhase1Frames);
      }
    })
    .catch((error) => {
      console.warn('No se pudo reparar la transparencia de los sprites de fase 1.', error);
      solidPhase1Promise = null;
    });
}

function prepareTransparentStageFrames(targetStage, frames) {
  if (repairedFrameCache.has(targetStage) || repairedFramePromises.has(targetStage)) return;

  const promise = Promise.all(frames.map(removeExteriorBackground))
    .then((transparentFrames) => {
      repairedFrameCache.set(targetStage, transparentFrames);
      repairedFramePromises.delete(targetStage);

      if (stageIndex === targetStage && unit && image) {
        activeSpriteFrames = transparentFrames;
        spriteFrameIndex = 0;
        nextSpriteFrameAt = performance.now() + getFrameInterval(targetStage);
        unit.dataset.spriteLoading = 'false';
        unit.dataset.spriteMode = 'frames';
        setSpriteFrame(transparentFrames[0]);
        preloadSpriteFrames(transparentFrames);
      }
    })
    .catch((error) => {
      console.warn(`No se pudo limpiar el fondo de los sprites de fase ${targetStage + 1}.`, error);
      repairedFramePromises.delete(targetStage);
    });

  repairedFramePromises.set(targetStage, promise);
}

async function removeExteriorBackground(src) {
  const sourceImage = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = sourceImage.naturalWidth || sourceImage.width;
  canvas.height = sourceImage.naturalHeight || sourceImage.height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  makeExteriorBackgroundTransparent(imageData);
  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

async function repairTransparentHoles(src) {
  const sourceImage = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = sourceImage.naturalWidth || sourceImage.width;
  canvas.height = sourceImage.naturalHeight || sourceImage.height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  fillInternalAlphaHoles(imageData);
  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/webp', 0.92);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const sourceImage = new Image();
    sourceImage.onload = () => resolve(sourceImage);
    sourceImage.onerror = reject;
    sourceImage.src = src;
  });
}

function fillInternalAlphaHoles(imageData) {
  const { data, width, height } = imageData;
  const total = width * height;
  const solid = new Uint8Array(total);
  const visited = new Uint8Array(total);
  const queue = [];
  let readIndex = 0;

  for (let index = 0; index < total; index += 1) {
    solid[index] = data[index * 4 + 3] > 8 ? 1 : 0;
  }

  const addExteriorPixel = (x, y) => {
    const index = y * width + x;
    if (!visited[index] && !solid[index]) {
      visited[index] = 1;
      queue.push(index);
    }
  };

  for (let x = 0; x < width; x += 1) {
    addExteriorPixel(x, 0);
    addExteriorPixel(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    addExteriorPixel(0, y);
    addExteriorPixel(width - 1, y);
  }

  while (readIndex < queue.length) {
    const index = queue[readIndex];
    readIndex += 1;
    const x = index % width;
    const y = Math.floor(index / width);

    if (x > 0) addNeighbour(index - 1);
    if (x < width - 1) addNeighbour(index + 1);
    if (y > 0) addNeighbour(index - width);
    if (y < height - 1) addNeighbour(index + width);
  }

  function addNeighbour(index) {
    if (!visited[index] && !solid[index]) {
      visited[index] = 1;
      queue.push(index);
    }
  }

  for (let index = 0; index < total; index += 1) {
    if (!solid[index] && !visited[index]) {
      const pixel = index * 4;
      data[pixel] = FILL_COLOR[0];
      data[pixel + 1] = FILL_COLOR[1];
      data[pixel + 2] = FILL_COLOR[2];
      data[pixel + 3] = FILL_COLOR[3];
    }
  }
}

function makeExteriorBackgroundTransparent(imageData) {
  const { data, width, height } = imageData;
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = [];
  let readIndex = 0;

  const addBackgroundPixel = (x, y) => {
    const index = y * width + x;
    if (!visited[index] && isBackgroundCandidate(data, index)) {
      visited[index] = 1;
      queue.push(index);
    }
  };

  for (let x = 0; x < width; x += 1) {
    addBackgroundPixel(x, 0);
    addBackgroundPixel(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    addBackgroundPixel(0, y);
    addBackgroundPixel(width - 1, y);
  }

  while (readIndex < queue.length) {
    const index = queue[readIndex];
    readIndex += 1;
    const x = index % width;
    const y = Math.floor(index / width);

    if (x > 0) addNeighbour(index - 1);
    if (x < width - 1) addNeighbour(index + 1);
    if (y > 0) addNeighbour(index - width);
    if (y < height - 1) addNeighbour(index + width);
  }

  function addNeighbour(index) {
    if (!visited[index] && isBackgroundCandidate(data, index)) {
      visited[index] = 1;
      queue.push(index);
    }
  }

  for (let index = 0; index < total; index += 1) {
    if (visited[index]) {
      data[index * 4 + 3] = 0;
    }
  }
}

function isBackgroundCandidate(data, index) {
  const pixel = index * 4;
  const r = data[pixel];
  const g = data[pixel + 1];
  const b = data[pixel + 2];
  const a = data[pixel + 3];

  if (a <= 10) return true;

  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  const lowSaturation = maxChannel - minChannel <= 38;
  const veryBright = r >= 236 && g >= 236 && b >= 236;
  const checkerGray = r >= 214 && g >= 214 && b >= 214 && lowSaturation;

  return veryBright || checkerGray;
}

function ensureOverlayStructure() {
  const hasSpriteRig = overlay.querySelector('.training-pet-shadow') && overlay.querySelector('.training-layer--front');
  if (hasSpriteRig) return;

  overlay.innerHTML = `
    <div class="training-layer training-layer--back" aria-hidden="true">
      <span class="training-track"></span>
      <span class="training-orb training-orb--one"></span>
      <span class="training-orb training-orb--two"></span>
      <span class="training-orb training-orb--three"></span>
      <span class="training-dummy training-dummy--left"></span>
      <span class="training-dummy training-dummy--center"></span>
      <span class="training-dummy training-dummy--right"></span>
    </div>
    <div class="training-pet-unit" aria-hidden="true" data-motion="roam" data-sprite-mode="static">
      <div class="training-pet-shadow"></div>
      <div class="training-pet-glow"></div>
      <span class="training-afterimage training-afterimage--one"></span>
      <span class="training-afterimage training-afterimage--two"></span>
      <img class="training-pet-img" alt="" draggable="false" />
      <span class="training-focus-core"></span>
    </div>
    <div class="training-layer training-layer--front" aria-hidden="true"></div>
  `;
}

function startLoop() {
  if (rafId) return;
  lastFrame = performance.now();
  scheduleNextAction(650);
  rafId = requestAnimationFrame(loop);
}

function loop(now) {
  const delta = Math.min(48, now - lastFrame);
  lastFrame = now;
  updateFrameAnimation(now);
  updateMovement(delta / 1000, now);
  rafId = requestAnimationFrame(loop);
}

function updateFrameAnimation(now) {
  if (!activeSpriteFrames || activeSpriteFrames.length < 2 || now < nextSpriteFrameAt) return;

  spriteFrameIndex = (spriteFrameIndex + 1) % activeSpriteFrames.length;
  setSpriteFrame(activeSpriteFrames[spriteFrameIndex]);
  nextSpriteFrameAt = now + getFrameInterval();
}

function setSpriteFrame(src) {
  currentSrc = src;
  image.style.opacity = '';
  image.src = src;
  unit.style.setProperty('--training-sprite-image', `url("${src}")`);
  afterimages.forEach((ghost) => {
    ghost.style.backgroundImage = `url("${src}")`;
  });
}

function hideSpriteFrame() {
  currentSrc = '';
  image.removeAttribute('src');
  image.style.opacity = '0';
  unit.style.removeProperty('--training-sprite-image');
  afterimages.forEach((ghost) => {
    ghost.style.backgroundImage = 'none';
  });
}

function handleSpriteError() {
  if (fallbackLocked) return;

  fallbackLocked = true;
  const fallbackSrc = phaseImages[EVOLUTIONS[stageIndex]?.imageKey];
  if (!fallbackSrc || currentSrc === fallbackSrc) return;

  console.warn('No se encontraron los sprites de entrenamiento. Usando imagen estática de la fase.', currentSrc);
  activeSpriteFrames = null;
  unit.dataset.spriteMode = 'static';
  setSpriteFrame(fallbackSrc);
}

function preloadSpriteFrames(frameSet) {
  if (!frameSet) return;
  frameSet.forEach((src) => {
    const preloader = new Image();
    preloader.src = src;
  });
}

function updateMovement(deltaSeconds, now) {
  if (!root || !unit || !target) return;

  updateAmbientAction(now);

  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const distance = Math.hypot(dx, dy);

  if (distance < TARGET_REACHED_DISTANCE) {
    pickTarget();
    return;
  }

  const isFinalPhase = stageIndex === PHASE_6_STAGE_INDEX;
  const motionSpeed = activeMotion === 'dash' ? (isFinalPhase ? 0.85 : 2.05) : activeMotion === 'float' ? 0.62 : 1;
  const stageSpeed = isFinalPhase ? SPEED * 0.6 : SPEED + stageIndex * 7;
  const step = Math.min(distance, stageSpeed * motionSpeed * deltaSeconds);
  position.x += (dx / distance) * step;
  position.y += (dy / distance) * step;
  velocityFlip = dx < 0 ? -1 : 1;

  const bobAmplitude = isFinalPhase ? 12 : 4 + stageIndex * 0.6;
  const bob = Math.sin(now / (isFinalPhase ? 520 : 340)) * bobAmplitude;
  const tilt = Math.sin(now / (isFinalPhase ? 740 : 520)) * (isFinalPhase ? 1.6 : 2.4);
  const scale = isFinalPhase ? 1 + Math.sin(now / 860) * 0.025 : 1;

  unit.style.transform = `translate3d(${position.x}px, ${position.y + bob}px, 0) scale(${scale}) scaleX(${velocityFlip}) rotate(${tilt}deg)`;
}

function updateAmbientAction(now) {
  if (activeMotion !== 'roam' && activeMotion !== 'float' && now > actionUntil) {
    activeMotion = stageIndex === PHASE_6_STAGE_INDEX ? 'float' : 'roam';
    unit.dataset.motion = activeMotion;
  }

  if (now < nextActionAt) return;

  const nextMotion = pickMotion();
  activeMotion = nextMotion;
  unit.dataset.motion = nextMotion;
  actionUntil = now + ACTION_DURATIONS[nextMotion];

  if (nextMotion !== 'roam' && nextMotion !== 'float') {
    spawnActionEffect(nextMotion);
  } else if (nextMotion === 'float') {
    spawnFocusPulse();
  }

  scheduleNextAction(ACTION_DURATIONS[nextMotion] + random(720, Math.max(1100, 2100 - stageIndex * 110)));
}

function pickMotion() {
  if (stageIndex === PHASE_6_STAGE_INDEX) {
    const motions = ['float', 'float', 'focus', 'dash'];
    return motions[Math.floor(Math.random() * motions.length)];
  }

  return Math.random() < 0.68 ? 'roam' : Math.random() < 0.55 ? 'dash' : 'focus';
}

function scheduleNextAction(delay = 1200) {
  nextActionAt = performance.now() + delay;
}

function spawnActionEffect(action) {
  if (!overlay || !unit) return;

  if (action === 'dash') {
    pickTarget();
    spawnSpeedLines(stageIndex === PHASE_6_STAGE_INDEX ? 5 : 4);
    return;
  }

  if (action === 'focus') {
    spawnFocusPulse();
    spawnParticles(getStageColor(), 12);
  }
}

function centerPosition() {
  const bounds = getBounds();
  position = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };
  target = null;
  pickTarget();
}

function clampPosition() {
  const bounds = getBounds();
  position.x = clamp(position.x, bounds.minX, bounds.maxX);
  position.y = clamp(position.y, bounds.minY, bounds.maxY);
}

function pickTarget() {
  const bounds = getBounds();
  const verticalBias = stageIndex === PHASE_6_STAGE_INDEX ? 0.42 : 0;

  target = {
    x: random(bounds.minX, bounds.maxX),
    y: random(bounds.minY, bounds.maxY - verticalBias * (bounds.maxY - bounds.minY))
  };
}

function getBounds() {
  const rect = root?.getBoundingClientRect();
  const width = rect?.width || 320;
  const height = rect?.height || 300;
  const spriteSize = getSpriteSize();
  const margin = Math.max(12, spriteSize * (stageIndex >= 3 ? 0.36 : 0.46));
  const isFinalPhase = stageIndex === PHASE_6_STAGE_INDEX;

  return {
    minX: margin,
    maxX: Math.max(margin, width - spriteSize - margin),
    minY: Math.max(margin, height * (isFinalPhase ? 0.08 : 0.16)),
    maxY: Math.max(margin, height * (isFinalPhase ? 0.62 : 0.76))
  };
}

function getSpriteSize() {
  if (!unit) return 96;
  const rect = unit.getBoundingClientRect();
  return rect.width || 96;
}

function spawnEvolutionRing() {
  const ring = document.createElement('span');
  ring.className = 'training-evolution-ring';
  ring.style.left = `${position.x + getSpriteSize() / 2}px`;
  ring.style.top = `${position.y + getSpriteSize() / 2}px`;
  overlay.appendChild(ring);
  window.setTimeout(() => ring.remove(), 900);
}

function spawnFocusPulse() {
  const center = getUnitCenter();
  const pulse = document.createElement('span');
  pulse.className = 'training-focus-pulse';
  pulse.style.left = `${center.x}px`;
  pulse.style.top = `${center.y}px`;
  pulse.style.setProperty('--stage-color', getStageColorCss());
  frontLayer.appendChild(pulse);
  window.setTimeout(() => pulse.remove(), 820);
}

function spawnSpeedLines(amount = 6) {
  if (!frontLayer) return;
  const center = getUnitCenter();
  const colorCss = getStageColorCss();

  for (let i = 0; i < amount; i += 1) {
    const line = document.createElement('span');
    line.className = 'training-speed-line';
    line.style.left = `${center.x + random(-28, 28)}px`;
    line.style.top = `${center.y + random(-34, 36)}px`;
    line.style.setProperty('--line-color', colorCss);
    line.style.setProperty('--line-angle', `${velocityFlip < 0 ? random(155, 202) : random(-22, 24)}deg`);
    line.style.setProperty('--line-distance', `${velocityFlip < 0 ? random(60, 130) : random(-130, -60)}px`);
    line.style.animationDelay = `${random(0, 110)}ms`;
    frontLayer.appendChild(line);
    window.setTimeout(() => line.remove(), 680);
  }
}

function spawnParticles(color = 0x7cf7ff, amount = 14) {
  if (!overlay) return;
  const spriteSize = getSpriteSize();
  const colorCss = `#${color.toString(16).padStart(6, '0')}`;

  for (let i = 0; i < amount; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'training-particle';
    particle.style.left = `${position.x + spriteSize / 2}px`;
    particle.style.top = `${position.y + spriteSize / 2}px`;
    particle.style.setProperty('--dx', `${random(-120, 120)}px`);
    particle.style.setProperty('--dy', `${random(-90, 90)}px`);
    particle.style.setProperty('--particle-color', colorCss);
    particle.style.animationDelay = `${random(0, 90)}ms`;
    overlay.appendChild(particle);
    window.setTimeout(() => particle.remove(), 900);
  }
}

function getUnitCenter() {
  return {
    x: position.x + getSpriteSize() / 2,
    y: position.y + getSpriteSize() / 2
  };
}

function getStageColor() {
  return EVOLUTIONS[stageIndex]?.palette?.primary ?? 0x7cf7ff;
}

function getStageColorCss() {
  return `#${getStageColor().toString(16).padStart(6, '0')}`;
}

function normalizeStage(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return clamp(Math.round(parsed), 0, EVOLUTIONS.length - 1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function random(min, max) {
  return min + Math.random() * (max - min);
}
