import { NOTE_DURATION, SOUND_FONT } from './tools.js';

export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.instrumentCache = new Map();
    this.trackGainNodes = new Map();
    this.activeVoices = [];
    this.previewVoice = null;
    this.previewTool = null;
    this.stopToken = 0;
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

  getSustainLevel(tool) {
    return typeof tool?.sustainLevel === 'number' ? tool.sustainLevel : 1;
  }

  getCurrentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }

  getTrackGain(track) {
    const volume = Number.isFinite(track?.volume) ? track.volume : 66;
    return Math.max(0, Math.min(1, volume / 100));
  }

  getStackGain(track, stepEventCount) {
    return 1 / Math.max(1, Math.min(stepEventCount, 3));
  }

  getEnvelopeOptions(tool, gain) {
    return {
      gain,
      attack: this.getAttackTime(tool),
      release: this.getReleaseTail(tool),
      sustain: this.getSustainLevel(tool)
    };
  }

  getNoteOffset(tool) {
    return Number.isInteger(tool?.transpose) ? tool.transpose : 0;
  }

  transposeNote(note, semitones) {
    if (!semitones || typeof note !== 'string') {
      return note;
    }

    const match = note.match(/^([A-G])(#?)(-?\d+)$/);
    if (!match) {
      return note;
    }

    const pitchClasses = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const pitchClass = `${match[1]}${match[2]}`;
    const octave = Number(match[3]);
    const pitchIndex = pitchClasses.indexOf(pitchClass);
    if (pitchIndex === -1 || !Number.isFinite(octave)) {
      return note;
    }

    const midiNumber = (octave + 1) * 12 + pitchIndex + semitones;
    const nextOctave = Math.floor(midiNumber / 12) - 1;
    const nextPitchClass = pitchClasses[((midiNumber % 12) + 12) % 12];
    return `${nextPitchClass}${nextOctave}`;
  }

  getPlayableNote(tool, note) {
    return this.transposeNote(note, this.getNoteOffset(tool));
  }

  getInstrumentCacheKey(tool) {
    return `${tool.id}:${tool.toneId || 'default'}:${tool.sampleInstrument}:${tool.destinationId || 'main'}`;
  }

  getTrackGainNode(track) {
    if (!this.audioContext || !track?.id) {
      return null;
    }

    if (!this.trackGainNodes.has(track.id)) {
      const gainNode = this.audioContext.createGain();
      gainNode.destinationId = track.id;
      gainNode.gain.value = this.getTrackGain(track);
      gainNode.connect(this.audioContext.destination);
      this.trackGainNodes.set(track.id, gainNode);
    }

    const gainNode = this.trackGainNodes.get(track.id);
    this.setAudioParam(gainNode.gain, this.getTrackGain(track), 0.02);
    return gainNode;
  }

  getMatchingKey(tool, stepEvent) {
    if (!stepEvent || typeof stepEvent !== 'object' || !Array.isArray(tool?.keys)) {
      return null;
    }

    return tool.keys.find((key) => key.label === stepEvent.label)
      || tool.keys.find((key) => (
        key.note === stepEvent.note
        && (
          typeof stepEvent.sampleInstrument !== 'string'
          || key.sampleInstrument === stepEvent.sampleInstrument
        )
      ))
      || null;
  }

  getEventTool(tool, stepEvent) {
    if (!stepEvent || typeof stepEvent !== 'object') {
      return tool;
    }

    const matchingKey = this.getMatchingKey(tool, stepEvent);
    const soundSource = matchingKey || stepEvent;

    return {
      ...tool,
      sampleInstrument: typeof soundSource.sampleInstrument === 'string'
        ? soundSource.sampleInstrument
        : tool.sampleInstrument,
      noteDuration: typeof soundSource.noteDuration === 'number' ? soundSource.noteDuration : tool.noteDuration,
      releaseTail: typeof soundSource.releaseTail === 'number' ? soundSource.releaseTail : tool.releaseTail,
      attackTime: typeof soundSource.attackTime === 'number' ? soundSource.attackTime : tool.attackTime,
      sustainLevel: typeof soundSource.sustainLevel === 'number' ? soundSource.sustainLevel : tool.sustainLevel,
      transpose: Number.isInteger(soundSource.transpose) ? soundSource.transpose : tool.transpose
    };
  }

  getEventNote(tool, stepEvent) {
    const matchingKey = this.getMatchingKey(tool, stepEvent);
    return typeof matchingKey?.note === 'string' ? matchingKey.note : stepEvent.note;
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

  async getInstrument(tool, destination = null) {
    if (!tool?.id || typeof tool.sampleInstrument !== 'string') {
      throw new Error('Invalid instrument');
    }

    await this.ensureAudioContext();
    const instrumentTool = destination ? { ...tool, destinationId: destination.destinationId } : tool;
    const cacheKey = this.getInstrumentCacheKey(instrumentTool);

    if (!this.instrumentCache.has(cacheKey)) {
      const instrument = await window.Soundfont.instrument(this.audioContext, tool.sampleInstrument, {
        soundfont: SOUND_FONT,
        format: 'mp3',
        ...(destination ? { destination } : {})
      });
      this.instrumentCache.set(cacheKey, instrument);
    }

    return this.instrumentCache.get(cacheKey);
  }

  stopPreviewVoice(tool = null, releaseTail = this.getReleaseTail(tool || this.previewTool)) {
    const previewTool = tool || this.previewTool;
    if (this.previewVoice && typeof this.previewVoice.stop === 'function') {
      const stopAt = this.audioContext ? this.audioContext.currentTime + releaseTail : undefined;
      this.previewVoice.stop(stopAt);
    }
    this.previewVoice = null;
    this.previewTool = null;
  }

  stopActiveVoices(releaseTail = 0.08) {
    this.activeVoices.forEach(({ voice }) => {
      if (voice && typeof voice.stop === 'function') {
        const stopAt = this.audioContext ? this.audioContext.currentTime + releaseTail : undefined;
        voice.stop(stopAt);
      }
    });
    this.activeVoices = [];
  }

  stopAllVoicesImmediately() {
    this.stopToken += 1;
    this.stopActiveVoices(0);
    this.stopPreviewVoice(null, 0);

    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend().catch(() => {});
    }
  }

  setAudioParam(audioParam, value, timeConstant = 0.01) {
    if (!audioParam) {
      return;
    }

    if (typeof audioParam.setTargetAtTime === 'function' && this.audioContext) {
      audioParam.setTargetAtTime(value, this.audioContext.currentTime, timeConstant);
      return;
    }

    if (typeof audioParam.setValueAtTime === 'function' && this.audioContext) {
      audioParam.setValueAtTime(value, this.audioContext.currentTime);
      return;
    }

    if (typeof audioParam.value === 'number') {
      audioParam.value = value;
    }
  }

  updateActiveTrackVolume(trackId, volume) {
    const gainNode = this.trackGainNodes.get(trackId);
    if (gainNode) {
      this.setAudioParam(gainNode.gain, this.getTrackGain({ volume }), 0.02);
    }
  }

  async preloadInstruments(tracks, getTool) {
    await this.ensureAudioContext();
    const instruments = tracks.flatMap((track) => {
      const tool = getTool(track.toolId, track.toneId);
      if (!tool) {
        return [];
      }

      const destination = this.getTrackGainNode(track);
      const keyTools = Array.isArray(tool.keys)
        ? tool.keys.map((key) => this.getEventTool(tool, key))
        : [];
      return [tool, ...keyTools].map((instrumentTool) => ({
        destination,
        tool: instrumentTool
      }));
    });

    await Promise.all(instruments.map(({ tool, destination }) => this.getInstrument(tool, destination)));
  }

  async previewKey(tool, key) {
    const playToken = this.stopToken;
    const note = typeof key === 'string' ? key : key?.note;
    if (typeof note !== 'string') {
      return;
    }

    const eventTool = this.getEventTool(tool, key);
    const instrument = await this.getInstrument(eventTool);
    if (playToken !== this.stopToken) {
      return;
    }

    const noteDuration = this.getNoteDuration(eventTool);
    const releaseTail = this.getReleaseTail(eventTool);

    this.stopPreviewVoice(eventTool);
    this.previewTool = eventTool;
    this.previewVoice = instrument.play(
      this.getPlayableNote(eventTool, note),
      this.audioContext.currentTime,
      noteDuration,
      this.getEnvelopeOptions(eventTool, 0.7)
    );

    window.setTimeout(() => {
      if (this.previewVoice) {
        this.previewVoice = null;
        this.previewTool = null;
      }
    }, Math.ceil((noteDuration + releaseTail + 0.12) * 1000));
  }

  async triggerTrackStep(track, stepEvents, tool, options = {}) {
    if (!Array.isArray(stepEvents) || stepEvents.length === 0) {
      return;
    }

    const shouldPlay = typeof options.shouldPlay === 'function' ? options.shouldPlay : () => true;
    if (!shouldPlay()) {
      return;
    }

    const gain = this.getStackGain(track, stepEvents.length);

    await Promise.all(stepEvents
      .filter((stepEvent) => stepEvent && typeof stepEvent.note === 'string')
      .map(async (stepEvent) => {
        if (!shouldPlay()) {
          return;
        }

        const eventTool = this.getEventTool(tool, stepEvent);
        if (!eventTool) {
          return;
        }

        const destination = this.getTrackGainNode(track);
        const instrument = await this.getInstrument(eventTool, destination);
        if (!shouldPlay()) {
          return;
        }

        const noteDuration = this.getNoteDuration(eventTool);
        const releaseTail = this.getReleaseTail(eventTool);
        const startTime = typeof options.startTime === 'number'
          ? options.startTime
          : this.audioContext.currentTime;
        const voice = instrument.play(
          this.getPlayableNote(eventTool, this.getEventNote(tool, stepEvent)),
          startTime,
          noteDuration,
          this.getEnvelopeOptions(eventTool, gain)
        );

        this.activeVoices.push({
          voice,
          trackId: track.id,
          stepEventCount: stepEvents.length
        });
        window.setTimeout(() => {
          this.activeVoices = this.activeVoices.filter((entry) => entry.voice !== voice);
        }, Math.ceil((noteDuration + releaseTail + 0.12) * 1000));
      }));
  }
}
