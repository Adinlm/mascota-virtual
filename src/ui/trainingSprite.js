import { phaseImages } from '../assets/evolutionImages.js';
import { EVOLUTIONS } from '../config/evolutions.js';

let root;
let overlay;
let backLayer;
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

const SPEED = 54;
const TARGET_REACHED_DISTANCE = 8;
const STAGE_WITH_COMBAT_SPRITES = 1;

const ACTION_DURATIONS = {
  roam: 520,
  focus: 780,
  dash: 520,
  strike: 620,
  guard: 760,
  combo: 860,
  uppercut: 720
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
  backLayer = overlay.querySelector('.training-layer--back');
  frontLayer = overlay.querySelector('.training-layer--front');
  afterimages = [...overlay.querySelectorAll('.training-afterimage')];
  dummies = [...overlay.querySelectorAll('.training-dummy')];

  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      clampPosition();
      pickTarget();
    });
    resizeObserver.observe(root);
  }

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
  const nextSrc = phaseImages[evolution.imageKey];
  const shouldAnimate = options.evolved || options.forceEvolution;
  const sourceChanged = currentSrc !== nextSrc;

  stageIndex = nextStage;
  const phaseNumber = stageIndex + 1;
  root.dataset.trainingStage = String(phaseNumber);
  overlay.dataset.trainingStage = String(phaseNumber);
  unit.dataset.stage = String(phaseNumber);
  unit.style.setProperty('--stage-color', getStageColorCss());
  unit.style.setProperty('--training-intensity', String(0.75 + stageIndex * 0.12));

  if (sourceChanged || options.force) {
    currentSrc = nextSrc;
    image.src = nextSrc;
    image.alt = evolution.name;
    unit.style.setProperty('--training-sprite-image', `url("${nextSrc}")`);
    afterimages.forEach((ghost) => {
      ghost.style.backgroundImage = `url("${nextSrc}")`;
    });
  }

  clampPosition();
  if (!target) pickTarget();

  if (shouldAnimate) {
    playEvolutionEffect();
    scheduleNextAction(140);
  } else if (sourceChanged) {
    pulseTrainingSprite('sync');
    scheduleNextAction(420);
  }
}

export function pulseTrainingSprite(action = 'pulse') {
  if (!unit) return;
  unit.classList.remove('training-react');
  unit.dataset.action = action;
  unit.dataset.motion = action === 'repair' ? 'focus' : 'strike';
  activeMotion = unit.dataset.motion;
  actionUntil = performance.now() + 430;

  // Force animation restart.
  void unit.offsetWidth;
  unit.classList.add('training-react');
  spawnParticles(action === 'repair' ? 0x79ffd8 : getStageColor());
  spawnActionEffect(action === 'repair' ? 'focus' : 'strike');
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
    <div class="training-pet-unit" aria-hidden="true" data-motion="roam">
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
  updateMovement(delta / 1000, now);
  rafId = requestAnimationFrame(loop);
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

  const motionSpeed = activeMotion === 'dash' ? 2.2 : activeMotion === 'strike' ? 0.45 : 1;
  const stageSpeed = SPEED + stageIndex * 7;
  const step = Math.min(distance, stageSpeed * motionSpeed * deltaSeconds);
  position.x += (dx / distance) * step;
  position.y += (dy / distance) * step;
  velocityFlip = dx < 0 ? -1 : 1;

  const bob = Math.sin(now / 340) * (stageIndex >= STAGE_WITH_COMBAT_SPRITES ? 6 : 4);
  const tilt = Math.sin(now / 520) * (stageIndex >= STAGE_WITH_COMBAT_SPRITES ? 3.4 : 2.2);
  const strikeNudge = activeMotion === 'strike' || activeMotion === 'combo'
    ? Math.sin(now / 58) * 5
    : 0;
  const scale = activeMotion === 'guard' ? 0.96 : activeMotion === 'uppercut' ? 1.05 : 1;

  unit.style.transform = `translate3d(${position.x + strikeNudge}px, ${position.y + bob}px, 0) scale(${scale}) scaleX(${velocityFlip}) rotate(${tilt}deg)`;
}

function updateAmbientAction(now) {
  if (activeMotion !== 'roam' && now > actionUntil) {
    activeMotion = 'roam';
    unit.dataset.motion = 'roam';
  }

  if (now < nextActionAt) return;

  const nextMotion = pickMotion();
  activeMotion = nextMotion;
  unit.dataset.motion = nextMotion;
  actionUntil = now + ACTION_DURATIONS[nextMotion];

  if (nextMotion !== 'roam') {
    spawnActionEffect(nextMotion);
  }

  scheduleNextAction(ACTION_DURATIONS[nextMotion] + random(720, Math.max(1100, 2100 - stageIndex * 110)));
}

function pickMotion() {
  if (stageIndex < STAGE_WITH_COMBAT_SPRITES) {
    return Math.random() < 0.72 ? 'roam' : 'focus';
  }

  const motions = ['dash', 'strike', 'guard', 'combo', 'uppercut', 'focus'];
  return motions[Math.floor(Math.random() * motions.length)];
}

function scheduleNextAction(delay = 1200) {
  nextActionAt = performance.now() + delay;
}

function spawnActionEffect(action) {
  if (!overlay || !unit) return;

  if (action === 'dash') {
    pickTarget({ preferDummy: true });
    spawnSpeedLines(8);
    return;
  }

  if (action === 'focus' || action === 'guard') {
    spawnFocusPulse();
    spawnParticles(action === 'guard' ? 0xffd86b : getStageColor(), action === 'guard' ? 8 : 12);
    return;
  }

  const hitDelay = action === 'combo' ? 170 : action === 'uppercut' ? 210 : 130;
  pickTarget({ preferDummy: true });

  window.setTimeout(() => {
    if (!overlay || activeMotion === 'roam') return;
    const impactPoint = markRandomDummyHit(action) ?? getUnitCenter();
    spawnImpact(impactPoint.x, impactPoint.y, action);
    spawnSpeedLines(action === 'combo' ? 11 : 7);
    spawnParticles(getStageColor(), action === 'combo' ? 18 : 12);
  }, hitDelay);
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

function pickTarget(options = {}) {
  const bounds = getBounds();
  const dummyTarget = options.preferDummy || (stageIndex >= STAGE_WITH_COMBAT_SPRITES && Math.random() < 0.52);

  if (dummyTarget) {
    const point = getRandomDummyCenter();
    if (point) {
      const spriteSize = getSpriteSize();
      target = {
        x: clamp(point.x - spriteSize / 2 + random(-28, 28), bounds.minX, bounds.maxX),
        y: clamp(point.y - spriteSize / 2 + random(-18, 16), bounds.minY, bounds.maxY)
      };
      return;
    }
  }

  target = {
    x: random(bounds.minX, bounds.maxX),
    y: random(bounds.minY, bounds.maxY)
  };
}

function getBounds() {
  const rect = root?.getBoundingClientRect();
  const width = rect?.width || 320;
  const height = rect?.height || 300;
  const spriteSize = getSpriteSize();
  const margin = Math.max(16, spriteSize * 0.55);

  return {
    minX: margin,
    maxX: Math.max(margin, width - spriteSize - margin),
    minY: Math.max(margin, height * 0.18),
    maxY: Math.max(margin, height * 0.78)
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

function spawnImpact(x, y, action = 'strike') {
  const impact = document.createElement('span');
  impact.className = `training-impact training-impact--${action}`;
  impact.style.left = `${x}px`;
  impact.style.top = `${y}px`;
  impact.style.setProperty('--stage-color', getStageColorCss());
  frontLayer.appendChild(impact);
  window.setTimeout(() => impact.remove(), 620);
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

function markRandomDummyHit(action) {
  const dummy = getRandomDummy();
  if (!dummy) return null;

  dummy.dataset.hit = action;
  dummy.classList.remove('is-hit');
  void dummy.offsetWidth;
  dummy.classList.add('is-hit');

  window.setTimeout(() => {
    dummy.classList.remove('is-hit');
  }, 420);

  return getElementCenter(dummy);
}

function getRandomDummyCenter() {
  const dummy = getRandomDummy();
  return dummy ? getElementCenter(dummy) : null;
}

function getRandomDummy() {
  const available = dummies.filter((dummy) => dummy.isConnected);
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function getUnitCenter() {
  return {
    x: position.x + getSpriteSize() / 2,
    y: position.y + getSpriteSize() / 2
  };
}

function getElementCenter(element) {
  const rect = element.getBoundingClientRect();
  const overlayRect = overlay.getBoundingClientRect();

  return {
    x: rect.left - overlayRect.left + rect.width / 2,
    y: rect.top - overlayRect.top + rect.height / 2
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
