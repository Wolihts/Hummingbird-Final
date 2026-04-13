import { NOTE_DURATION, SOUND_FONT } from './tools.js';

export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.instrumentCache = new Map();
    this.activeVoices = [];
    this.previewVoice = null;
    this.previewTool = null;
  }

  getNoteDuration(tool) {
    return typeof tool?.noteDuration === 'number' ? tool.noteDuration : NOTE_DURATION;
  }

  getReleaseTail(tool) {
    return typeof tool?.releaseTail === 'number' ? tool.releaseTail : 0.12;
  }

  getAttackTime(tool) {
    return typeof tool?.attackTime === 'number' ? tool.attackTime : 0.01;
  }

  getEnvelopeOptions(tool, gain) {
    return {
      gain,
      attack: this.getAttackTime(tool),
      release: this.getReleaseTail(tool),
      sustain: 1
    };
  }

  getInstrumentCacheKey(tool) {
    return `${tool.id}:${tool.toneId || tool.sampleInstrument}`;
  }

  async ensureAudioContext() {
    if (!window.Soundfont) {
      throw new Error('Audio library unavailable');
    }

    if (!this.audioContext) {
      const Context = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new Context();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async getInstrument(tool) {
    await this.ensureAudioContext();
    const cacheKey = this.getInstrumentCacheKey(tool);

    if (!this.instrumentCache.has(cacheKey)) {
      const instrument = await window.Soundfont.instrument(this.audioContext, tool.sampleInstrument, {
        soundfont: SOUND_FONT,
        format: 'mp3'
      });
      this.instrumentCache.set(cacheKey, instrument);
    }

    return this.instrumentCache.get(cacheKey);
  }

  stopPreviewVoice(tool = null) {
    const previewTool = tool || this.previewTool;
    if (this.previewVoice && typeof this.previewVoice.stop === 'function') {
      const stopAt = this.audioContext ? this.audioContext.currentTime + this.getReleaseTail(previewTool) : undefined;
      this.previewVoice.stop(stopAt);
    }
    this.previewVoice = null;
    this.previewTool = null;
  }

  stopActiveVoices(releaseTail = 0.08) {
    this.activeVoices.forEach((voice) => {
      if (voice && typeof voice.stop === 'function') {
        const stopAt = this.audioContext ? this.audioContext.currentTime + releaseTail : undefined;
        voice.stop(stopAt);
      }
    });
    this.activeVoices = [];
  }

  async preloadInstruments(tracks, getTool) {
    await this.ensureAudioContext();
    await Promise.all(tracks.map((track) => this.getInstrument(getTool(track.toolId, track.toneId))));
  }

  async previewKey(tool, note) {
    const instrument = await this.getInstrument(tool);
    const noteDuration = this.getNoteDuration(tool);
    const releaseTail = this.getReleaseTail(tool);

    this.stopPreviewVoice(tool);
    this.previewTool = tool;
    this.previewVoice = instrument.play(
      note,
      this.audioContext.currentTime,
      noteDuration,
      this.getEnvelopeOptions(tool, 0.7)
    );

    window.setTimeout(() => {
      if (this.previewVoice) {
        this.previewVoice = null;
        this.previewTool = null;
      }
    }, Math.ceil((noteDuration + releaseTail + 0.12) * 1000));
  }

  async triggerTrackStep(track, stepEvents, tool) {
    if (!Array.isArray(stepEvents) || stepEvents.length === 0) {
      return;
    }

    const instrument = await this.getInstrument(tool);
    const noteDuration = this.getNoteDuration(tool);
    const releaseTail = this.getReleaseTail(tool);
    const gain = Math.max(0.15, track.volume / 100) / Math.max(1, Math.min(stepEvents.length, 3));

    stepEvents
      .filter((stepEvent) => stepEvent && typeof stepEvent.note === 'string')
      .forEach((stepEvent) => {
        const voice = instrument.play(
          stepEvent.note,
          this.audioContext.currentTime,
          noteDuration,
          this.getEnvelopeOptions(tool, gain)
        );

        this.activeVoices.push(voice);
        window.setTimeout(() => {
          this.activeVoices = this.activeVoices.filter((entry) => entry !== voice);
        }, Math.ceil((noteDuration + releaseTail + 0.12) * 1000));
      });
  }
}
