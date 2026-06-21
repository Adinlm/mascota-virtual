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

  create() {
    this.cameras.main.setBackgroundColor('#02050d');
    this.createBackdrop();
    this.createPet();
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
    this.pet = this.add.graphics();
    this.pet.setPosition(width / 2, height * 0.58);
    this.drawPet();
  }

  update(time) {
    if (!this.pet || this.transitioning) return;
    const hover = Math.sin(time / 450) * 7;
    const pulse = 1 + Math.sin(time / 360) * 0.025;
    this.pet.y = this.scale.height * 0.58 + hover;
    this.pet.scaleX = pulse;
    this.pet.scaleY = 1 / pulse;

    this.stars.forEach((star, index) => {
      star.alpha = 0.2 + Math.sin(time / 600 + index) * 0.18;
    });
  }

  setStage(stageIndex) {
    if (this.stageIndex === stageIndex) return;
    this.stageIndex = stageIndex;
    this.drawPet();
  }

  react(action) {
    if (!this.pet) return;
    const config = {
      feed: { y: -18, angle: -4 },
      care: { y: 0, angle: 0 },
      train: { y: -28, angle: 8 },
      rest: { y: 10, angle: 0 },
      boost: { y: -34, angle: -9 },
      repair: { y: -12, angle: 0 },
      pulse: { y: -22, angle: 0 }
    }[action] ?? { y: -10, angle: 0 };

    this.tweens.add({
      targets: this.pet,
      y: this.scale.height * 0.58 + config.y,
      angle: config.angle,
      duration: 140,
      yoyo: true,
      ease: 'Sine.easeOut'
    });

    this.emitParticles(action);
  }

  evolveTo(stageIndex) {
    this.transitioning = true;
    const { width, height } = this.scale;
    const flash = this.add.circle(width / 2, height * 0.58, 14, 0xffffff, 0.96);
    const ring = this.add.circle(width / 2, height * 0.58, 32, 0x7cf7ff, 0.46).setStrokeStyle(4, 0x7cf7ff, 0.9);

    this.tweens.add({
      targets: flash,
      scale: 20,
      alpha: 0,
      duration: 1050,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy()
    });

    this.tweens.add({
      targets: ring,
      scale: 7,
      alpha: 0,
      duration: 1100,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });

    this.tweens.add({
      targets: this.pet,
      scale: 0.2,
      alpha: 0,
      angle: 90,
      duration: 500,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.stageIndex = stageIndex;
        this.drawPet();
        this.pet.setScale(1.45);
        this.pet.setAlpha(0);
        this.pet.angle = -16;
        this.tweens.add({
          targets: this.pet,
          scale: 1,
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
    const evolution = EVOLUTIONS[this.stageIndex];
    const primary = evolution.palette.primary;
    const secondary = evolution.palette.secondary;
    const accent = evolution.palette.accent;
    const level = this.stageIndex;

    this.pet.clear();
    this.aura.clear();

    this.aura.fillStyle(primary, 0.09 + level * 0.012);
    this.aura.fillCircle(this.scale.width / 2, this.scale.height * 0.58, 108 + level * 12);
    this.aura.lineStyle(2, primary, 0.14);
    this.aura.strokeCircle(this.scale.width / 2, this.scale.height * 0.58, 138 + level * 12);

    this.pet.lineStyle(4, primary, 0.94);
    this.pet.fillStyle(0x111b2c, 1);

    const bodyW = 92 + level * 13;
    const bodyH = 78 + level * 11;
    this.pet.fillEllipse(0, 12, bodyW, bodyH);
    this.pet.strokeEllipse(0, 12, bodyW, bodyH);

    this.pet.lineStyle(4, secondary, 0.8);
    this.pet.beginPath();
    this.pet.moveTo(-bodyW * 0.36, -8);
    this.pet.lineTo(-bodyW * 0.55, -42 - level * 5);
    this.pet.moveTo(bodyW * 0.36, -8);
    this.pet.lineTo(bodyW * 0.55, -42 - level * 5);
    this.pet.strokePath();

    if (level >= 1) {
      this.pet.lineStyle(5, primary, 0.75);
      this.pet.beginPath();
      this.pet.moveTo(bodyW * 0.42, 18);
      this.pet.quadraticCurveTo(bodyW * 0.8, -10 - level * 8, bodyW * 1.02, 12 - level * 4);
      this.pet.strokePath();
      this.pet.fillStyle(accent, 0.86);
      this.pet.fillCircle(bodyW * 1.04, 12 - level * 4, 8 + level * 2);
    }

    if (level >= 3) {
      this.pet.lineStyle(4, accent, 0.72);
      this.pet.strokeTriangle(-bodyW * 0.24, 45, 0, 74 + level * 4, bodyW * 0.24, 45);
    }

    if (level >= 4) {
      this.pet.lineStyle(3, 0xffffff, 0.42);
      this.pet.strokeCircle(0, 12, bodyW * 0.62);
      this.pet.strokeCircle(0, 12, bodyW * 0.78);
    }

    this.pet.fillStyle(primary, 1);
    this.pet.fillCircle(-18 - level * 2, 7, 7 + level * 0.7);
    this.pet.fillCircle(18 + level * 2, 7, 7 + level * 0.7);

    this.pet.lineStyle(3, accent, 0.8);
    this.pet.lineBetween(-20, 32 + level, 20, 32 + level);

    this.pet.fillStyle(secondary, 0.7);
    for (let i = 0; i < 3 + level; i += 1) {
      const angle = (Math.PI * 2 * i) / (3 + level);
      this.pet.fillCircle(Math.cos(angle) * (bodyW * 0.56), Math.sin(angle) * (bodyH * 0.45) + 12, 3 + level * 0.4);
    }
  }

  emitParticles(action) {
    const evolution = EVOLUTIONS[this.stageIndex];
    const color = action === 'repair' ? 0x79ffd8 : evolution.palette.primary;
    const { width, height } = this.scale;

    for (let i = 0; i < 14; i += 1) {
      const particle = this.add.circle(width / 2, height * 0.58, Phaser.Math.Between(2, 5), color, 0.88);
      this.tweens.add({
        targets: particle,
        x: width / 2 + Phaser.Math.Between(-120, 120),
        y: height * 0.58 + Phaser.Math.Between(-100, 80),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(480, 920),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }
}
