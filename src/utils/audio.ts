/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmIntervalId: any = null;
  private bgmActive: boolean = false;
  private scaleNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // C4, D4, E4, G4, A4, C5, D5, E5 (C Pentatonic)

  constructor() {
    // Lazy initialize on first interaction
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('skudo_muted') === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('skudo_muted', String(muted));
    }
    if (muted) {
      this.stopBackgroundMusic();
    } else {
      if (this.bgmActive) {
        this.startBackgroundMusic();
      }
    }
  }

  getMuted() {
    return this.isMuted;
  }

  playClick() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // High-frequency short woodblock click
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio click error:', e);
    }
  }

  playPlacement(correct: boolean = true) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (correct) {
        // High soft chime sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); // C6

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        // Low brief double buzzer sound
        this.playError();
      }
    } catch (e) {
      console.warn('Audio placement error:', e);
    }
  }

  playError() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const playBuzz = (timeOffset: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime + timeOffset);
        osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + timeOffset + 0.15);

        gain.gain.setValueAtTime(0.08, ctx.currentTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.16);
      };

      // Play double-pop warning sound
      playBuzz(0);
      playBuzz(0.08);
    } catch (e) {
      console.warn('Audio error sound failed:', e);
    }
  }

  playWin() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Beautiful C Major Arpeggio
      const noteDelay = 0.08;

      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + (i * noteDelay));

        gain.gain.setValueAtTime(0.05, ctx.currentTime + (i * noteDelay));
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * noteDelay) + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + (i * noteDelay));
        osc.stop(ctx.currentTime + (i * noteDelay) + 0.55);
      });
    } catch (e) {
      console.warn('Audio win sound failed:', e);
    }
  }

  playLose() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [311.13, 293.66, 261.63, 220.00]; // Diminishing/sad cadence
      const noteDelay = 0.15;

      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + (i * noteDelay));

        gain.gain.setValueAtTime(0.06, ctx.currentTime + (i * noteDelay));
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * noteDelay) + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + (i * noteDelay));
        osc.stop(ctx.currentTime + (i * noteDelay) + 0.45);
      });
    } catch (e) {
      console.warn('Audio lose sound failed:', e);
    }
  }

  startBackgroundMusic() {
    this.bgmActive = true;
    if (this.isMuted) return;

    const ctx = this.initCtx();
    if (!ctx) return;

    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
    }

    // Play a single soft chord/drone note immediately
    this.tickBgm();

    // Schedule clean, airy notes periodically for offline relaxation
    this.bgmIntervalId = setInterval(() => {
      this.tickBgm();
    }, 4500);
  }

  private tickBgm() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      // Pick 2 notes from the C Pentatonic scale to play as ambient soft pads
      const n1 = this.scaleNotes[Math.floor(Math.random() * this.scaleNotes.length)];
      const n2 = this.scaleNotes[Math.floor(Math.random() * this.scaleNotes.length)] * 0.5; // lower octave

      // Node creator
      const playDroneNode = (freq: number, volume: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lowpass = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        lowpass.type = 'lowpass';
        lowpass.Q.setValueAtTime(1, ctx.currentTime);
        lowpass.frequency.setValueAtTime(400, ctx.currentTime); // filter out buzzing high harmonics

        // Slow attack and slow decay for soft pad feel
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5); // 1.5s attack
        gain.gain.setValueAtTime(volume, ctx.currentTime + duration - 2);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration); // 2s fade out

        osc.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      };

      // Gentle soft drones (very low volume to remain deeply in the background)
      playDroneNode(n1, 0.012, 4.0);
      playDroneNode(n2, 0.008, 4.0);
    } catch (e) {
      console.warn('Synthesized background tick failed:', e);
    }
  }

  stopBackgroundMusic() {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const gameAudio = new AudioSynthManager();
