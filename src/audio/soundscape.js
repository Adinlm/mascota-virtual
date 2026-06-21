import { EVOLUTIONS } from '../config/evolutions.js';

const ROOT_NOTES = ['C3', 'Eb3', 'G3', 'Bb3', 'C4', 'D4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5', 'G5'];

export class Soundscape {
  constructor() {
    this.started = false;
    this.enabled = false;
    this.loop = null;
    this.synth = null;
    this.bass = null;
    this.chime = null;
    this.fx = null;
    this.stageIndex = 0;
    this.step = 0;
  }

  async start(stageIndex = 0) {
    if (!window.Tone) return false;

    await window.Tone.start();
    this.stageIndex = stageIndex;

    if (!this.started) {
      const Tone = window.Tone;
      const reverb = new Tone.Reverb({ decay: 5.2, wet: 0.42 }).toDestination();
      const delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.34, wet: 0.22 }).connect(reverb);
      const filter = new Tone.Filter({ frequency: 1400, type: 'lowpass', rolloff: -12 }).connect(delay);

      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsine' },
        envelope: { attack: 0.035, decay: 0.32, sustain: 0.34, release: 1.45 }
      }).connect(filter);

      this.bass = new Tone.MonoSynth({
        oscillator: { type: 'triangle' },
        filter: { Q: 2, type: 'lowpass', rolloff: -24 },
        envelope: { attack: 0.02, decay: 0.35, sustain: 0.2, release: 0.95 },
        filterEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.15, release: 1.1, baseFrequency: 80, octaves: 2.4 }
      }).connect(reverb);

      this.chime = new Tone.MetalSynth({
        frequency: 180,
        envelope: { attack: 0.001, decay: 0.7, release: 0.25 },
        harmonicity: 5.1,
        modulationIndex: 18,
        resonance: 900,
        octaves: 1.8,
        volume: -26
      }).toDestination();

      this.fx = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.02, release: 0.7 },
        volume: -28
      }).toDestination();

      this.loop = new Tone.Loop((time) => this.tick(time), '8n');
      Tone.Transport.bpm.value = 86;
      Tone.Transport.start();
      this.loop.start(0);
      this.started = true;
    }

    this.enabled = true;
    this.setMuted(false);
    return true;
  }

  setStage(stageIndex) {
    this.stageIndex = stageIndex;
    if (window.Tone?.Transport) {
      window.Tone.Transport.bpm.rampTo(86 + stageIndex * 5, 1.5);
    }
  }

  setMuted(muted) {
    if (!window.Tone) return;
    window.Tone.Destination.mute = muted;
    this.enabled = !muted;
  }

  toggle(stageIndex = this.stageIndex) {
    if (!this.started) return this.start(stageIndex);
    this.setMuted(this.enabled);
    return Promise.resolve(!this.enabled);
  }

  playAction(action) {
    if (!this.started || !this.enabled) return;
    const Tone = window.Tone;
    const now = Tone.now();
    const notes = {
      feed: ['C5', 'G4'],
      care: ['Eb5', 'Bb4'],
      train: ['G5', 'D5'],
      rest: ['C4', 'G3'],
      boost: ['C5', 'Eb5', 'G5'],
      repair: ['G4', 'Bb4', 'D5']
    }[action] ?? ['C5'];

    this.synth.triggerAttackRelease(notes, '16n', now, 0.18);
    if (action === 'boost' || action === 'repair') this.chime.triggerAttackRelease('8n', now + 0.04, 0.16);
  }

  playPulse() {
    if (!this.started || !this.enabled) return;
    const now = window.Tone.now();
    this.chime.triggerAttackRelease('8n', now, 0.22);
    this.synth.triggerAttackRelease(['C5', 'G5'], '16n', now + 0.05, 0.12);
  }

  playEvolution() {
    if (!this.started || !this.enabled) return;
    const Tone = window.Tone;
    const now = Tone.now();
    this.fx.triggerAttackRelease('1n', now, 0.5);
    this.synth.triggerAttackRelease(['C4', 'Eb4', 'G4', 'C5'], '2n', now + 0.05, 0.26);
    this.synth.triggerAttackRelease(['D4', 'F4', 'A4', 'D5'], '2n', now + 0.65, 0.2);
    this.chime.triggerAttackRelease('4n', now + 0.25, 0.2);
  }

  playFailure() {
    if (!this.started || !this.enabled) return;
    const now = window.Tone.now();
    this.bass.triggerAttackRelease('C2', '1n', now, 0.4);
    this.fx.triggerAttackRelease('1n', now, 0.35);
  }

  tick(time) {
    if (!this.enabled) return;
    const evolution = EVOLUTIONS[this.stageIndex];
    const motif = evolution.motif;
    const motifNote = ROOT_NOTES[motif[this.step % motif.length] + Math.floor(this.stageIndex / 2)] ?? 'C4';

    if (this.step % 2 === 0) {
      this.synth.triggerAttackRelease(motifNote, '8n.', time, 0.09 + this.stageIndex * 0.006);
    }

    if (this.step % 8 === 0) {
      const bassNote = this.stageIndex >= 3 ? 'C2' : 'C3';
      this.bass.triggerAttackRelease(bassNote, '4n', time, 0.18);
    }

    if (this.step % 16 === 10) {
      this.chime.triggerAttackRelease('16n', time, 0.08);
    }

    this.step = (this.step + 1) % 64;
  }
}
