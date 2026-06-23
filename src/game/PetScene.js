import { EVOLUTIONS } from '../config/evolutions.js';

export class PetScene extends Phaser.Scene {
  constructor() {
    super('PetScene');
    this.stageIndex = 0;
    this.stars = [];
    this.aura = null;
    this.stageSyncHandler = null;
    this.stageEvolvedHandler = null;
  }

  create() {
    this.stageIndex = window.__CYBERNEXO_STAGE__ ?? 0;
    this.cameras.main.setBackgroundColor('#02050d');
    this.createBackdrop();
    this.bindStageEvents();
    this.scale.on('resize', () => this.redrawBackdrop());

    window.__CYBERNEXO_PET_SCENE__ = this;
    window.__CYBERNEXO_ATTACH_SCENE__?.(this);
    window.dispatchEvent(new CustomEvent('cybernexo-pet-scene-ready', { detail: { scene: this } }));
    this.game.events.emit('pet-scene-ready', this);
  }

  bindStageEvents() {
    this.stageSyncHandler = (event) => {
      this.setStage(event.detail?.stageIndex ?? window.__CYBERNEXO_STAGE__ ?? 0);
    };

    this.stageEvolvedHandler = (event) => {
      this.evolveTo(event.detail?.stageIndex ?? window.__CYBERNEXO_STAGE__ ?? 0);
    };

    window.addEventListener('cybernexo-stage-sync', this.stageSyncHandler);
    window.addEventListener('cybernexo-stage-evolved', this.stageEvolvedHandler);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('cybernexo-stage-sync', this.stageSyncHandler);
      window.removeEventListener('cybernexo-stage-evolved', this.stageEvolvedHandler);
    });
  }

  createBackdrop() {
    const { width, height } = this.scale;

    this.grid = this.add.graphics();
    this.horizon = this.add.graphics();
    this.aura = this.add.graphics();

    this.drawGrid();
    this.drawHorizon();
    this.renderAura(width / 2, height * 0.54);

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

  redrawBackdrop() {
    this.drawGrid();
    this.drawHorizon();
    this.renderAura(this.scale.width / 2, this.scale.height * 0.54);
  }

  drawGrid() {
    const { width, height } = this.scale;
    this.grid.clear();
    this.grid.lineStyle(1, 0x7cf7ff, 0.08);

    for (let x = 0; x < width; x += 32) this.grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 32) this.grid.lineBetween(0, y, width, y);
  }

  drawHorizon() {
    const { width, height } = this.scale;
    this.horizon.clear();
    this.horizon.fillGradientStyle(0x7cf7ff, 0x8b7dff, 0x040711, 0x040711, 0.2, 0.2, 0.05, 0.05);
    this.horizon.fillRect(0, Math.floor(height * 0.58), width, Math.floor(height * 0.42));
  }

  update(time) {
    this.stars.forEach((star, index) => {
      star.alpha = 0.2 + Math.sin(time / 600 + index) * 0.18;
    });
  }

  setStage(stageIndex) {
    this.stageIndex = Phaser.Math.Clamp(stageIndex, 0, EVOLUTIONS.length - 1);
    window.__CYBERNEXO_STAGE__ = this.stageIndex;
    this.renderAura(this.scale.width / 2, this.scale.height * 0.54);
  }

  react(action) {
    const origin = this.getEffectOrigin();
    this.emitParticles(origin.x, origin.y, action);
  }

  evolveTo(stageIndex) {
    this.setStage(stageIndex);
    const origin = this.getEffectOrigin();
    const primary = EVOLUTIONS[this.stageIndex].palette.primary;

    const flash = this.add.circle(origin.x, origin.y, 16, 0xffffff, 0.9).setDepth(5);
    const ring = this.add.circle(origin.x, origin.y, 36, primary, 0.32).setStrokeStyle(4, primary, 0.9).setDepth(4);

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

    this.emitParticles(origin.x, origin.y, 'evolve', 28);
  }

  fail() {
    const origin = this.getEffectOrigin();
    this.emitParticles(origin.x, origin.y, 'failure', 18);
  }

  renderAura(x, y) {
    if (!this.aura) return;
    const primary = EVOLUTIONS[this.stageIndex].palette.primary;
    const radius = Math.min(this.scale.height * 0.18, 86);

    this.aura.clear();
    this.aura.setDepth(1);
    this.aura.fillStyle(primary, 0.08);
    this.aura.fillCircle(x, y, radius);
    this.aura.lineStyle(2, primary, 0.18);
    this.aura.strokeCircle(x, y, radius * 1.18);
  }

  getEffectOrigin() {
    const root = document.querySelector('.training-pet-unit');
    const gameRoot = document.querySelector('#game-root');

    if (root && gameRoot) {
      const spriteRect = root.getBoundingClientRect();
      const gameRect = gameRoot.getBoundingClientRect();
      return {
        x: spriteRect.left - gameRect.left + spriteRect.width / 2,
        y: spriteRect.top - gameRect.top + spriteRect.height / 2
      };
    }

    return { x: this.scale.width / 2, y: this.scale.height * 0.54 };
  }

  emitParticles(x, y, action, amount = 14) {
    const color = action === 'repair' ? 0x79ffd8 : EVOLUTIONS[this.stageIndex].palette.primary;

    for (let i = 0; i < amount; i += 1) {
      const particle = this.add.circle(x, y, Phaser.Math.Between(2, 5), color, 0.82).setDepth(3);
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-150, 150),
        y: y + Phaser.Math.Between(-120, 100),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(480, 920),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }
}
