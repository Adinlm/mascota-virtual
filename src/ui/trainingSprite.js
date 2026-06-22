import { phaseImages } from '../assets/evolutionImages.js';
import { EVOLUTIONS } from '../config/evolutions.js';

let root;
let overlay;
let unit;
let image;
let stageIndex = 0;
let target = null;
let position = { x: 0, y: 0 };
let velocityFlip = 1;
let lastFrame = 0;
let rafId = 0;
let resizeObserver;
let currentSrc = '';

const SPEED = 54;
const TARGET_REACHED_DISTANCE = 8;

export function initTrainingSprite(initialStageIndex = 0) {
  root = document.querySelector('#game-root');
  if (!root) return;

  overlay = root.querySelector('.training-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'training-overlay';
    overlay.innerHTML = `
      <div class="training-pet-unit" aria-hidden="true">
        <div class="training-pet-glow"></div>
        <img class="training-pet-img" alt="" draggable="false" />
      </div>
    `;
    root.appendChild(overlay);
  }

  unit = overlay.querySelector('.training-pet-unit');
  image = overlay.querySelector('.training-pet-img');

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
  root.dataset.trainingStage = String(stageIndex + 1);
  unit.dataset.stage = String(stageIndex + 1);

  if (sourceChanged || options.force) {
    currentSrc = nextSrc;
    image.src = nextSrc;
    image.alt = evolution.name;
  }

  clampPosition();
  if (!target) pickTarget();

  if (shouldAnimate) {
    playEvolutionEffect();
  } else if (sourceChanged) {
    pulseTrainingSprite('sync');
  }
}

export function pulseTrainingSprite(action = 'pulse') {
  if (!unit) return;
  unit.classList.remove('training-react');
  unit.dataset.action = action;
  // Force animation restart.
  void unit.offsetWidth;
  unit.classList.add('training-react');
  spawnParticles(action === 'repair' ? 0x79ffd8 : getStageColor());
}

export function playEvolutionEffect() {
  if (!unit || !overlay) return;

  unit.classList.remove('training-evolving', 'training-react');
  void unit.offsetWidth;
  unit.classList.add('training-evolving');
  spawnEvolutionRing();
  spawnParticles(getStageColor(), 26);

  window.setTimeout(() => {
    unit?.classList.remove('training-evolving');
  }, 860);
}

function startLoop() {
  if (rafId) return;
  lastFrame = performance.now();
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

  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const distance = Math.hypot(dx, dy);

  if (distance < TARGET_REACHED_DISTANCE) {
    pickTarget();
    return;
  }

  const step = Math.min(distance, SPEED * deltaSeconds);
  position.x += (dx / distance) * step;
  position.y += (dy / distance) * step;
  velocityFlip = dx < 0 ? -1 : 1;

  const bob = Math.sin(now / 340) * 5;
  const tilt = Math.sin(now / 520) * 2.5;
  unit.style.transform = `translate3d(${position.x}px, ${position.y + bob}px, 0) scaleX(${velocityFlip}) rotate(${tilt}deg)`;
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

function getStageColor() {
  return EVOLUTIONS[stageIndex]?.palette?.primary ?? 0x7cf7ff;
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
