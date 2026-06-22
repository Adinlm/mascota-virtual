import { phaseImages } from '../assets/evolutionImages.js';
import { EVOLUTIONS } from '../config/evolutions.js';

const PIXEL_TEXTURE_SIZE = 72;

export class PetScene extends Phaser.Scene {
  constructor() {
    super('PetScene');
    this.stageIndex = 0;
    this.pet = null;
    this.aura = null;
    this.stars = [];
    this.transitioning = false;
    this.wanderTween = null;
    this.idleTween = null;
  }

  preload() {
    EVOLUTIONS.forEach((evolution, index) => {
      this.load.image(`phase-source-${index + 1}`, phaseImages[evolution.imageKey]);
    });
  }

  create() {
    this.stageIndex = window.__CYBERNEXO_STAGE__ ?? 0;
    this.cameras.main.setBackgroundColor('#02050d');
    this.createPixelTextures();
    this.createBackdrop();
    this.createPet();
    this.scale.on('resize', () => {
      this.positionPet(false);
      this.startWander();
    });

    window.__CYBERNEXO_PET_SCENE__ = this;
    window.__CYBERNEXO_ATTACH_SCENE__?.(this);
    window.dispatchEvent(new CustomEvent('cybernexo-pet-scene-ready', { detail: { scene: this } }));
    this.game.events.emit('pet-scene-ready', this);
  }

  createPixelTextures() {
    EVOLUTIONS.forEach((_, index) => {
      const sourceKey = `phase-source-${index + 1}`;
      const pixelKey = `phase-${index + 1}`;
      const sourceImage = this.textures.get(sourceKey)?.getSourceImage();

      if (!sourceImage) return;

      if (this.textures.exists(pixelKey)) {
        this.textures.remove(pixelKey);
      }

      const texture = this.textures.createCanvas(pixelKey, PIXEL_TEXTURE_SIZE, PIXEL_TEXTURE_SIZE);
      const ctx = texture.getContext();
      const sourceSize = Math.min(sourceImage.width, sourceImage.height);
      const sx = Math.floor((sourceImage.width - sourceSize) / 2);
      const sy = Math.floor((sourceImage.height - sourceSize) / 2);

      ctx.clearRect(0, 0, PIXEL_TEXTURE_SIZE, PIXEL_TEXTURE_SIZE);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        sourceImage,
        sx,
        sy,
        sourceSize,
        sourceSize,
        0,
        0,
        PIXEL_TEXTURE_SIZE,
        PIXEL_TEXTURE_SIZE
      );

      this.posterizeCanvas(ctx, PIXEL_TEXTURE_SIZE, PIXEL_TEXTURE_SIZE);
      texture.refresh();
      this.textures.get(pixelKey)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    });
  }

  posterizeCanvas(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;
    const step = 24;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / step) * step;
      data[i + 1] = Math.round(data[i + 1] / step) * step;
      data[i + 2] = Math.round(data[i + 2] / step) * step;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  createBackdrop() {
    const { width, height } = this.scale;
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x7cf7ff, 0.08);

    for (let x = 0; x < width; x += 32) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 32) grid.lineBetween(0, y, width, y);

    const horizon = this.add.graphics();
    horizon.fillGradientStyle(0x7cf7ff, 0x8b7dff, 0x040711, 0x040711, 0.2, 0.2, 0.05, 0.05);
    horizon.fillRect(0, Math.floor(height * 0.58), width, Math.floor(height * 0.42));

    for (let i = 0; i < 42; i += 1) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, Math.floor(height * 0.56)),
        Phaser.Math.FloatBetween(0.8, 2.2),
        0x7cf7ff,
        Phaser.Math.FloatBetween(0.15, 0.62)
      );
      this.stars.push(star);
    }
  }

  createPet() {
    const { width, height } = this.scale;
    this.aura = this.add.graphics();
    this.pet = this.add.image(width / 2, height * 0.54, `phase-${this.stageIndex + 1}`);
    this.pet.setOrigin(0.5);
    this.pet.setDepth(2);
    this.pet.setSmooth(false);
    this.drawPet(false);
    this.startWander();
  }

  update(time) {
    if (!this.pet || this.transitioning) return;

    const pulse = 1 + Math.sin(time / 360) * 0.025;
    this.pet.scaleX = this.pet.baseScale * pulse;
    this.pet.scaleY = this.pet.baseScale / pulse;

    this.stars.forEach((star, index) => {
      star.alpha = 0.2 + Math.sin(time / 600 + index) * 0.18;
    });
  }

  setStage(stageIndex) {
    const nextStage = Phaser.Math.Clamp(stageIndex, 0, EVOLUTIONS.length - 1);
    const textureKey = `phase-${nextStage + 1}`;
    const alreadySynced = this.stageIndex === nextStage && this.pet?.texture?.key === textureKey;

    this.stageIndex = nextStage;
    window.__CYBERNEXO_STAGE__ = this.stageIndex;

    if (alreadySynced) {
      this.positionPet(false);
      if (!this.wanderTween && !this.transitioning) this.startWander();
      return;
    }

    this.drawPet(true);
  }

  react(action) {
    if (!this.pet) return;
    const config = {
      feed: { y: -18, angle: -3 },
      care: { y: 0, angle: 0 },
      train: { y: -24, angle: 4 },
      rest: { y: 8, angle: 0 },
      boost: { y: -28, angle: -5 },
      repair: { y: -10, angle: 0 },
      pulse: { y: -18, angle: 0 }
    }[action] ?? { y: -10, angle: 0 };

    this.stopWander();
    this.tweens.add({
      targets: this.pet,
      y: this.pet.y + config.y,
      angle: config.angle,
      duration: 140,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.pet.angle = 0;
        this.startWander();
      }
    });

    this.emitParticles(action);
  }

  evolveTo(stageIndex) {
    this.transitioning = true;
    this.stopWander();
    this.stageIndex = Phaser.Math.Clamp(stageIndex, 0, EVOLUTIONS.length - 1);
    window.__CYBERNEXO_STAGE__ = this.stageIndex;

    const { width, height } = this.scale;
    const primary = EVOLUTIONS[this.stageIndex].palette.primary;
    const flash = this.add.circle(width / 2, height * 0.54, 16, 0xffffff, 0.9).setDepth(5);
    const ring = this.add.circle(width / 2, height * 0.54, 36, primary, 0.32).setStrokeStyle(4, primary, 0.9).setDepth(4);

    this.tweens.add({
      targets: flash,
      scale: 18,
      alpha: 0,
      duration: 760,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy()
    });

    this.tweens.add({
      targets: ring,
      scale: 6,
      alpha: 0,
      duration: 880,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });

    this.tweens.add({
      targets: this.pet,
      alpha: 0,
      scale: this.pet.baseScale * 0.35,
      angle: 180,
      duration: 260,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.drawPet(false);
        this.pet.setPosition(width / 2, height * 0.54);
        this.pet.setAlpha(0);
        this.pet.setScale(this.pet.baseScale * 1.55);
        this.pet.angle = -18;
        this.tweens.add({
          targets: this.pet,
          alpha: 1,
          scale: this.pet.baseScale,
          angle: 0,
          duration: 520,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.transitioning = false;
            this.startWander();
          }
        });
      }
    });
  }

  fail() {
    if (!this.pet) return;
    this.stopWander();
    this.tweens.add({
      targets: this.pet,
      alpha: 0.16,
      y: this.scale.height * 0.68,
      angle: 18,
      duration: 900,
      ease: 'Sine.easeIn'
    });
  }

  drawPet(restartWander = true) {
    if (!this.pet || !this.aura) return;

    const evolution = EVOLUTIONS[this.stageIndex];
    const primary = evolution.palette.primary;
    this.tweens.killTweensOf(this.pet);
    this.pet.setTexture(`phase-${this.stageIndex + 1}`);
    this.pet.setAlpha(1);
    this.pet.setAngle(0);
    this.positionPet(false);

    this.aura.clear();
    this.aura.setDepth(1);
    this.aura.fillStyle(primary, 0.12);
    this.aura.fillCircle(this.scale.width / 2, this.scale.height * 0.54, Math.min(this.scale.height * 0.26, 112));
    this.aura.lineStyle(2, primary, 0.24);
    this.aura.strokeCircle(this.scale.width / 2, this.scale.height * 0.54, Math.min(this.scale.height * 0.31, 138));

    if (restartWander && !this.transitioning) this.startWander();
  }

  positionPet(centerIfNeeded = true) {
    if (!this.pet) return;

    const { width, height } = this.scale;
    const nativeSize = Math.max(this.pet.width || 1, this.pet.height || 1);
    const target = Math.min(width * 0.16, height * 0.22, 112);
    this.pet.baseScale = target / nativeSize;
    this.pet.setScale(this.pet.baseScale);

    const bounds = this.getWanderBounds();
    const shouldCenter = centerIfNeeded || !Number.isFinite(this.pet.x) || !Number.isFinite(this.pet.y);

    if (shouldCenter) {
      this.pet.setPosition(width / 2, height * 0.54);
      return;
    }

    this.pet.setPosition(
      Phaser.Math.Clamp(this.pet.x, bounds.minX, bounds.maxX),
      Phaser.Math.Clamp(this.pet.y, bounds.minY, bounds.maxY)
    );
  }

  getWanderBounds() {
    const { width, height } = this.scale;
    const margin = Math.max(26, this.pet?.displayWidth ? this.pet.displayWidth * 0.65 : 40);

    return {
      minX: margin,
      maxX: Math.max(margin, width - margin),
      minY: Math.max(margin, height * 0.24),
      maxY: Math.max(margin, height * 0.82)
    };
  }

  randomWanderPoint() {
    const bounds = this.getWanderBounds();
    return {
      x: Phaser.Math.Between(Math.floor(bounds.minX), Math.floor(bounds.maxX)),
      y: Phaser.Math.Between(Math.floor(bounds.minY), Math.floor(bounds.maxY))
    };
  }

  startWander() {
    if (!this.pet || this.transitioning) return;
    this.stopWander();
    this.positionPet(false);

    const move = () => {
      if (!this.pet || this.transitioning) return;
      const next = this.randomWanderPoint();
      const duration = Phaser.Math.Between(1600, 3000);

      this.wanderTween = this.tweens.add({
        targets: this.pet,
        x: next.x,
        y: next.y,
        angle: Phaser.Math.Between(-4, 4),
        duration,
        ease: 'Sine.easeInOut',
        onComplete: move
      });
    };

    move();
  }

  stopWander() {
    if (this.wanderTween) {
      this.wanderTween.stop();
      this.wanderTween = null;
    }
    if (this.pet) this.tweens.killTweensOf(this.pet);
  }

  emitParticles(action) {
    const evolution = EVOLUTIONS[this.stageIndex];
    const color = action === 'repair' ? 0x79ffd8 : evolution.palette.primary;
    const { width, height } = this.scale;

    for (let i = 0; i < 14; i += 1) {
      const particle = this.add.circle(this.pet?.x ?? width / 2, this.pet?.y ?? height * 0.54, Phaser.Math.Between(2, 5), color, 0.88).setDepth(3);
      this.tweens.add({
        targets: particle,
        x: (this.pet?.x ?? width / 2) + Phaser.Math.Between(-150, 150),
        y: (this.pet?.y ?? height * 0.54) + Phaser.Math.Between(-120, 100),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(480, 920),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }
}
