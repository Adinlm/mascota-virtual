import { phaseImages } from '../assets/evolutionImages.js';
import { EVOLUTIONS } from '../config/evolutions.js';

export class PetScene extends Phaser.Scene {
  constructor() {
    super('PetScene');
    this.stageIndex = 0;
    this.pet = null;
    this.aura = null;
    this.stars = [];
    this.transitioning = false;
  }

  preload() {
    EVOLUTIONS.forEach((evolution, index) => {
      this.load.image(`phase-${index + 1}`, phaseImages[evolution.imageKey]);
    });
  }

  create() {
    this.cameras.main.setBackgroundColor('#02050d');
    this.createBackdrop();
    this.createPet();
    this.scale.on('resize', () => this.positionPet());
    this.game.events.emit('pet-scene-ready', this);
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
    this.drawPet();
  }

  update(time) {
    if (!this.pet || this.transitioning) return;

    const hover = Math.sin(time / 450) * 7;
    const pulse = 1 + Math.sin(time / 360) * 0.018;
    this.pet.y = this.scale.height * 0.54 + hover;
    this.pet.scaleX = this.pet.baseScale * pulse;
    this.pet.scaleY = this.pet.baseScale / pulse;

    this.stars.forEach((star, index) => {
      star.alpha = 0.2 + Math.sin(time / 600 + index) * 0.18;
    });
  }

  setStage(stageIndex) {
    if (this.stageIndex === stageIndex && this.pet) return;
    this.stageIndex = stageIndex;
    this.drawPet();
  }

  react(action) {
    if (!this.pet) return;
    const config = {
      feed: { y: -18, angle: -3 },
      care: { y: 0, angle: 0 },
      train: { y: -28, angle: 5 },
      rest: { y: 10, angle: 0 },
      boost: { y: -34, angle: -6 },
      repair: { y: -12, angle: 0 },
      pulse: { y: -22, angle: 0 }
    }[action] ?? { y: -10, angle: 0 };

    this.tweens.add({
      targets: this.pet,
      y: this.scale.height * 0.54 + config.y,
      angle: config.angle,
      duration: 140,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => { this.pet.angle = 0; }
    });

    this.emitParticles(action);
  }

  evolveTo(stageIndex) {
    this.transitioning = true;
    const { width, height } = this.scale;
    const flash = this.add.circle(width / 2, height * 0.54, 14, 0xffffff, 0.96);
    const ring = this.add.circle(width / 2, height * 0.54, 32, 0x7cf7ff, 0.46).setStrokeStyle(4, 0x7cf7ff, 0.9);

    this.tweens.add({
      targets: flash,
      scale: 24,
      alpha: 0,
      duration: 1050,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy()
    });

    this.tweens.add({
      targets: ring,
      scale: 8,
      alpha: 0,
      duration: 1100,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });

    this.tweens.add({
      targets: this.pet,
      scale: 0.18,
      alpha: 0,
      angle: 90,
      duration: 500,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.stageIndex = stageIndex;
        this.drawPet();
        this.pet.setScale(this.pet.baseScale * 1.28);
        this.pet.setAlpha(0);
        this.pet.angle = -12;
        this.tweens.add({
          targets: this.pet,
          scale: this.pet.baseScale,
          alpha: 1,
          angle: 0,
          duration: 650,
          ease: 'Back.easeOut',
          onComplete: () => { this.transitioning = false; }
        });
      }
    });
  }

  fail() {
    if (!this.pet) return;
    this.tweens.add({
      targets: this.pet,
      alpha: 0.16,
      y: this.scale.height * 0.68,
      angle: 18,
      duration: 900,
      ease: 'Sine.easeIn'
    });
  }

  drawPet() {
    if (!this.pet || !this.aura) return;

    const evolution = EVOLUTIONS[this.stageIndex];
    const primary = evolution.palette.primary;
    this.pet.setTexture(`phase-${this.stageIndex + 1}`);
    this.positionPet();

    this.aura.clear();
    this.aura.setDepth(1);
    this.aura.fillStyle(primary, 0.12);
    this.aura.fillCircle(this.scale.width / 2, this.scale.height * 0.54, Math.min(this.scale.height * 0.42, 180));
    this.aura.lineStyle(2, primary, 0.24);
    this.aura.strokeCircle(this.scale.width / 2, this.scale.height * 0.54, Math.min(this.scale.height * 0.48, 212));
  }

  positionPet() {
    if (!this.pet) return;

    const { width, height } = this.scale;
    const target = Math.min(width * 0.5, height * 0.76, 330);
    const source = Math.max(this.pet.width || 1, this.pet.height || 1);
    this.pet.baseScale = target / source;
    this.pet.setPosition(width / 2, height * 0.54);
    this.pet.setScale(this.pet.baseScale);
  }

  emitParticles(action) {
    const evolution = EVOLUTIONS[this.stageIndex];
    const color = action === 'repair' ? 0x79ffd8 : evolution.palette.primary;
    const { width, height } = this.scale;

    for (let i = 0; i < 14; i += 1) {
      const particle = this.add.circle(width / 2, height * 0.54, Phaser.Math.Between(2, 5), color, 0.88).setDepth(3);
      this.tweens.add({
        targets: particle,
        x: width / 2 + Phaser.Math.Between(-150, 150),
        y: height * 0.54 + Phaser.Math.Between(-120, 100),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(480, 920),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }
}
