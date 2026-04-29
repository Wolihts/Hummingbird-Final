export const INITIAL_STEP_COUNT = 8;
export const STEP_MS = 420;
export const NOTE_DURATION = 0.36;
export const SOUND_FONT = 'FluidR3_GM';
export const STORAGE_KEY = 'hummingbird-session-v1';

function createTone(id, name, sampleInstrument, overrides = {}) {
  return {
    id,
    name,
    sampleInstrument,
    ...overrides
  };
}

export const tools = [
  {
    id: 'drums',
    name: 'Drums',
    icon: 'D',
    badge: 'D',
    addable: true,
    sampleInstrument: 'synth_drum',
    clipFill: 'rgba(74, 222, 128, 0.24)',
    clipLine: '#4ade80',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.32), rgba(74,222,128,0.12))',
    panelTitle: 'Drum Machine',
    panelText: 'Tap pads to preview sounds, then click timeline cells to place steps for the beat.',
    tone: 'Punchy',
    output: 'Stereo',
    noteDuration: 0.28,
    releaseTail: 0.08,
    attackTime: 0.002,
    tones: [
      createTone('punchy', 'Punchy', 'synth_drum', {
        noteDuration: 0.18,
        releaseTail: 0.04,
        attackTime: 0.001,
        keyOverrides: {
          Kick: { sampleInstrument: 'synth_drum', note: 'C2', noteDuration: 0.18, releaseTail: 0.04 },
          Snr: { sampleInstrument: 'taiko_drum', note: 'D2', noteDuration: 0.2, releaseTail: 0.05 },
          '808': { sampleInstrument: 'synth_bass_1', note: 'C3', noteDuration: 0.72, releaseTail: 0.18 }
        }
      }),
      createTone('arena', 'Arena', 'taiko_drum', {
        noteDuration: 0.38,
        releaseTail: 0.16,
        attackTime: 0.004,
        keyOverrides: {
          Kick: { sampleInstrument: 'taiko_drum', note: 'C2', noteDuration: 0.38, releaseTail: 0.16 },
          Snr: { sampleInstrument: 'melodic_tom', note: 'D3', noteDuration: 0.34, releaseTail: 0.14 },
          Crash: { sampleInstrument: 'reverse_cymbal', note: 'C4', noteDuration: 0.5, releaseTail: 0.22 },
          Ride: { sampleInstrument: 'reverse_cymbal', note: 'A3', noteDuration: 0.44, releaseTail: 0.2 },
          Perc: { sampleInstrument: 'taiko_drum', note: 'G3', noteDuration: 0.3, releaseTail: 0.12 },
          '808': { sampleInstrument: 'synth_bass_1', note: 'C3', noteDuration: 0.82, releaseTail: 0.24 }
        }
      }),
      createTone('metallic', 'Metallic', 'steel_drums', {
        noteDuration: 0.3,
        releaseTail: 0.18,
        attackTime: 0.012,
        keyOverrides: {
          Kick: { sampleInstrument: 'synth_drum', note: 'G2', noteDuration: 0.22, releaseTail: 0.08 },
          Snr: { sampleInstrument: 'steel_drums', note: 'D4', noteDuration: 0.28, releaseTail: 0.14 },
          Clp: { sampleInstrument: 'woodblock', note: 'C6', noteDuration: 0.16, releaseTail: 0.08 },
          Hat: { sampleInstrument: 'agogo', note: 'C7', noteDuration: 0.14, releaseTail: 0.08 },
          Rim: { sampleInstrument: 'woodblock', note: 'G6', noteDuration: 0.16, releaseTail: 0.08 },
          Shkr: { sampleInstrument: 'agogo', note: 'G6', noteDuration: 0.16, releaseTail: 0.08 },
          '808': { sampleInstrument: 'synth_bass_2', note: 'C3', noteDuration: 0.64, releaseTail: 0.2 }
        }
      })
    ],
    trackName: 'Drum Kit',
    instrumentLabel: 'Pad Kit',
    instrumentGlyph: '🥁',
    keyRange: '12 drum triggers',
    keys: [
      { label: 'Kick', type: 'white', active: true, note: 'C2', sampleInstrument: 'synth_drum' },
      { label: 'Snr', type: 'black', note: 'D2', sampleInstrument: 'taiko_drum' },
      { label: 'Clp', type: 'white', note: 'C5', sampleInstrument: 'woodblock' },
      { label: 'Hat', type: 'black', active: true, note: 'C6', sampleInstrument: 'agogo' },
      { label: 'Tom', type: 'white', note: 'G2', sampleInstrument: 'melodic_tom' },
      { label: 'Ride', type: 'black', note: 'A3', sampleInstrument: 'reverse_cymbal' },
      { label: 'Crash', type: 'white', active: true, note: 'C4', sampleInstrument: 'reverse_cymbal' },
      { label: 'FX', type: 'black', note: 'C3', sampleInstrument: 'gunshot' },
      { label: '808', type: 'white', note: 'C3', sampleInstrument: 'synth_bass_1', noteDuration: 0.72, releaseTail: 0.18, attackTime: 0.001 },
      { label: 'Rim', type: 'black', note: 'G5', sampleInstrument: 'woodblock' },
      { label: 'Perc', type: 'white', note: 'G3', sampleInstrument: 'taiko_drum' },
      { label: 'Shkr', type: 'black', note: 'G5', sampleInstrument: 'agogo' }
    ],
    stepNotes: ['C2', 'C6', 'D2', 'C6', 'C2', 'A3', 'D2', 'C4']
  },
  {
    id: 'guitar',
    name: 'Guitar',
    icon: 'G',
    badge: 'G',
    addable: true,
    sampleInstrument: 'electric_guitar_clean',
    clipFill: 'rgba(251, 191, 36, 0.24)',
    clipLine: '#fbbf24',
    gradient: 'linear-gradient(135deg, rgba(249,115,22,0.32), rgba(251,191,36,0.12))',
    panelTitle: 'Guitar Controls',
    panelText: 'Preview the strings, then lay down clips on the timeline to hear them loop in time.',
    tone: 'Warm',
    output: 'Stereo',
    noteDuration: 0.48,
    releaseTail: 0.12,
    attackTime: 0.01,
    tones: [
      createTone('warm', 'Warm', 'electric_guitar_clean', { noteDuration: 0.5, releaseTail: 0.16, attackTime: 0.014, transpose: -12 }),
      createTone('bright', 'Bright', 'acoustic_guitar_steel', { noteDuration: 0.62, releaseTail: 0.18, attackTime: 0.004 }),
      createTone('driven', 'Driven', 'overdriven_guitar', { noteDuration: 0.34, releaseTail: 0.08, attackTime: 0.001, transpose: 7 })
    ],
    trackName: 'Electric Guitar',
    instrumentLabel: 'Electric Guitar',
    instrumentGlyph: '🎸',
    keyRange: '8 strings and leads',
    keys: [
      { label: 'E', type: 'white', active: true, note: 'E3' },
      { label: 'A', type: 'white', note: 'A3' },
      { label: 'D', type: 'white', note: 'D4' },
      { label: 'G', type: 'white', active: true, note: 'G4' },
      { label: 'B', type: 'white', note: 'B4' },
      { label: 'E', type: 'white', note: 'E5' },
      { label: 'A', type: 'white', note: 'A5' },
      { label: 'D', type: 'white', note: 'D6' }
    ],
    stepNotes: ['E3', 'A3', 'D4', 'G4', 'B4', 'E5', 'G4', 'D4']
  },
  {
    id: 'keys',
    name: 'Keys',
    icon: 'K',
    badge: 'K',
    addable: true,
    sampleInstrument: 'acoustic_grand_piano',
    clipFill: 'rgba(129, 140, 248, 0.24)',
    clipLine: '#818cf8',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.32), rgba(129,140,248,0.12))',
    panelTitle: 'Keyboard Studio',
    panelText: 'Click any piano key to audition it, then paint steps onto the grid to sequence the part.',
    tone: 'Dreamy',
    output: 'Stereo',
    noteDuration: 0.52,
    releaseTail: 0.14,
    attackTime: 0.018,
    tones: [
      createTone('dreamy', 'Dreamy', 'acoustic_grand_piano', { noteDuration: 0.72, releaseTail: 0.28, attackTime: 0.028 }),
      createTone('electric', 'Electric', 'electric_piano_1', { noteDuration: 0.42, releaseTail: 0.1, attackTime: 0.006, transpose: 12 }),
      createTone('organ', 'Organ', 'drawbar_organ', { noteDuration: 0.82, releaseTail: 0.24, attackTime: 0.035, transpose: -12 })
    ],
    trackName: 'Stage Piano',
    instrumentLabel: 'Stage Piano',
    instrumentGlyph: '🎹',
    keyRange: 'C4 to B5',
    keys: [
      { label: 'C', type: 'white', active: true, note: 'C4' },
      { label: 'C#', type: 'black', note: 'C#4' },
      { label: 'D', type: 'white', note: 'D4' },
      { label: 'D#', type: 'black', note: 'D#4' },
      { label: 'E', type: 'white', note: 'E4' },
      { label: 'F', type: 'white', note: 'F4' },
      { label: 'F#', type: 'black', active: true, note: 'F#4' },
      { label: 'G', type: 'white', note: 'G4' },
      { label: 'G#', type: 'black', note: 'G#4' },
      { label: 'A', type: 'white', note: 'A4' },
      { label: 'A#', type: 'black', note: 'A#4' },
      { label: 'B', type: 'white', note: 'B4' },
      { label: 'C', type: 'white', note: 'C5' },
      { label: 'C#', type: 'black', note: 'C#5' },
      { label: 'D', type: 'white', note: 'D5' },
      { label: 'D#', type: 'black', note: 'D#5' },
      { label: 'E', type: 'white', note: 'E5' },
      { label: 'F', type: 'white', note: 'F5' },
      { label: 'F#', type: 'black', active: true, note: 'F#5' },
      { label: 'G', type: 'white', note: 'G5' },
      { label: 'G#', type: 'black', note: 'G#5' },
      { label: 'A', type: 'white', note: 'A5' },
      { label: 'A#', type: 'black', note: 'A#5' },
      { label: 'B', type: 'white', note: 'B5' }
    ],
    stepNotes: ['C4', 'E4', 'G4', 'B4', 'A4', 'G4', 'E4', 'D4']
  },
  {
    id: 'vocals',
    name: 'Vocals',
    icon: 'V',
    badge: 'V',
    addable: true,
    sampleInstrument: 'choir_aahs',
    clipFill: 'rgba(34, 211, 238, 0.24)',
    clipLine: '#22d3ee',
    gradient: 'linear-gradient(135deg, rgba(14,165,233,0.32), rgba(34,211,238,0.12))',
    panelTitle: 'Vocal Lane',
    panelText: 'Use the vocal triggers to preview the texture, then place clips where you want the loop to sing.',
    tone: 'Bright',
    output: 'Mono',
    noteDuration: 1.25,
    releaseTail: 0.5,
    attackTime: 0.09,
    sustainLevel: 0.82,
    tones: [
      createTone('bright', 'Bright', 'choir_aahs', {
        noteDuration: 1.18,
        releaseTail: 0.46,
        attackTime: 0.07,
        sustainLevel: 0.86
      }),
      createTone('airy', 'Airy', 'voice_oohs', {
        noteDuration: 1.55,
        releaseTail: 0.68,
        attackTime: 0.14,
        sustainLevel: 0.72,
        transpose: 12
      }),
      createTone('lush', 'Lush', 'synth_choir', {
        noteDuration: 1.8,
        releaseTail: 0.78,
        attackTime: 0.18,
        sustainLevel: 0.78,
        transpose: -12
      })
    ],
    trackName: 'Vocal Stack',
    instrumentLabel: 'Vocal Mic',
    instrumentGlyph: '🎤',
    keyRange: '8 lead and harmony triggers',
    keys: [
      { label: 'Lead', type: 'white', active: true, note: 'C4' },
      { label: 'Double', type: 'black', note: 'E4' },
      { label: 'Low', type: 'white', note: 'G3' },
      { label: 'High', type: 'black', active: true, note: 'A4' },
      { label: 'Ad-lib', type: 'white', note: 'D5' },
      { label: 'FX', type: 'black', note: 'F4' },
      { label: 'Air', type: 'white', note: 'G4' },
      { label: 'Choir', type: 'black', note: 'C5' }
    ],
    stepNotes: ['C4', 'E4', 'G3', 'A4', 'C4', 'D5', 'A4', 'F4']
  },
  {
    id: 'mix',
    name: 'Mixer',
    icon: 'M',
    badge: 'M',
    addable: false,
    sampleInstrument: 'pad_2_warm',
    clipFill: 'rgba(244, 244, 245, 0.2)',
    clipLine: '#f4f4f5',
    gradient: 'linear-gradient(135deg, rgba(161,161,170,0.24), rgba(244,244,245,0.08))',
    panelTitle: 'Mix View',
    panelText: 'This view helps manage the session, but it does not create a new playable track on the timeline.',
    tone: 'Neutral',
    output: 'Master',
    noteDuration: 0.44,
    releaseTail: 0.12,
    attackTime: 0.016,
    tones: [
      createTone('neutral', 'Neutral', 'pad_2_warm', { noteDuration: 0.58, releaseTail: 0.2, attackTime: 0.025 }),
      createTone('glass', 'Glass', 'pad_4_choir', { noteDuration: 0.78, releaseTail: 0.28, attackTime: 0.06, transpose: 12 }),
      createTone('soft', 'Soft', 'pad_3_polysynth', { noteDuration: 0.9, releaseTail: 0.34, attackTime: 0.1, transpose: -12 })
    ],
    trackName: 'Mixer',
    instrumentLabel: 'Control Surface',
    instrumentGlyph: '🎚️',
    keyRange: 'Session controls',
    keys: [
      { label: 'A1', type: 'white', active: true, note: 'C3' },
      { label: 'A2', type: 'black', note: 'D3' },
      { label: 'B1', type: 'white', note: 'E3' },
      { label: 'B2', type: 'black', note: 'G3' },
      { label: 'C1', type: 'white', active: true, note: 'A3' },
      { label: 'C2', type: 'black', note: 'B3' },
      { label: 'FX1', type: 'white', note: 'C4' },
      { label: 'FX2', type: 'black', note: 'D4' }
    ],
    stepNotes: ['C3', 'E3', 'G3', 'B3', 'A3', 'G3', 'E3', 'D3']
  }
];

export const toolMap = new Map(tools.map((tool) => [tool.id, tool]));

export function getDefaultToneId(tool) {
  return Array.isArray(tool?.tones) && tool.tones.length > 0 ? tool.tones[0].id : 'default';
}

export function getTonePreset(tool, toneId) {
  if (!Array.isArray(tool?.tones) || tool.tones.length === 0) {
    return {
      id: 'default',
      name: tool?.tone ?? 'Default',
      sampleInstrument: tool?.sampleInstrument
    };
  }

  return tool.tones.find((tone) => tone.id === toneId) || tool.tones[0];
}

export function resolveToolTone(tool, toneId) {
  if (!tool) {
    return null;
  }

  const preset = getTonePreset(tool, toneId);

  return {
    ...tool,
    tone: preset.name,
    toneId: preset.id,
    sampleInstrument: preset.sampleInstrument ?? tool.sampleInstrument,
    noteDuration: typeof preset.noteDuration === 'number' ? preset.noteDuration : tool.noteDuration,
    releaseTail: typeof preset.releaseTail === 'number' ? preset.releaseTail : tool.releaseTail,
    attackTime: typeof preset.attackTime === 'number' ? preset.attackTime : tool.attackTime,
    sustainLevel: typeof preset.sustainLevel === 'number' ? preset.sustainLevel : tool.sustainLevel,
    transpose: Number.isInteger(preset.transpose) ? preset.transpose : 0,
    keys: applyKeyOverrides(tool.keys, preset.keyOverrides)
  };
}

function applyKeyOverrides(keys, overrides = {}) {
  if (!Array.isArray(keys)) {
    return [];
  }

  return keys.map((key) => ({
    ...key,
    ...(overrides[key.label] || {})
  }));
}
