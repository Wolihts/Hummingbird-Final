import { getDefaultToneId, INITIAL_STEP_COUNT, STORAGE_KEY } from './tools.js';

export function createSessionTrack(tool, stepCount = INITIAL_STEP_COUNT, toneId = getDefaultToneId(tool)) {
  return {
    id: tool.id,
    toolId: tool.id,
    toneId,
    name: tool.trackName,
    icon: tool.instrumentGlyph,
    steps: Array.from({ length: stepCount }, () => []),
    volume: 66,
    muted: false,
    solo: false
  };
}

function createEmptySession(toolMap) {
  return {
    activeToolId: null,
    currentStep: 0,
    stepCount: INITIAL_STEP_COUNT,
    selectedToneIds: normalizeSelectedToneIds(null, toolMap),
    sessionTracks: []
  };
}

function createNoteEntry(note, label = note, overrides = {}) {
  const entry = {
    note,
    label
  };

  if (typeof overrides.sampleInstrument === 'string') {
    entry.sampleInstrument = overrides.sampleInstrument;
  }

  if (Number.isInteger(overrides.transpose)) {
    entry.transpose = overrides.transpose;
  }

  if (typeof overrides.noteDuration === 'number') {
    entry.noteDuration = overrides.noteDuration;
  }

  if (typeof overrides.releaseTail === 'number') {
    entry.releaseTail = overrides.releaseTail;
  }

  if (typeof overrides.attackTime === 'number') {
    entry.attackTime = overrides.attackTime;
  }

  if (typeof overrides.sustainLevel === 'number') {
    entry.sustainLevel = overrides.sustainLevel;
  }

  return entry;
}

function findToolKey(tool, item) {
  if (!Array.isArray(tool?.keys)) {
    return null;
  }

  return tool.keys.find((key) => (
    key.note === item.note
    || (typeof item.label === 'string' && key.label === item.label)
  )) || null;
}

function normalizeNoteEntry(item, tool) {
  if (!item || typeof item.note !== 'string') {
    return null;
  }

  const matchingKey = findToolKey(tool, item);
  return createNoteEntry(
    item.note,
    typeof item.label === 'string' ? item.label : item.note,
    {
      ...matchingKey,
      ...item
    }
  );
}

function normalizeStepEntry(entry, tool) {
  if (Array.isArray(entry)) {
    return entry
      .map((item) => normalizeNoteEntry(item, tool))
      .filter(Boolean);
  }

  const normalized = normalizeNoteEntry(entry, tool);
  if (normalized) {
    return [normalized];
  }

  if (Array.isArray(tool.stepNotes) && Array.isArray(entry) === false && entry === null) {
    return [];
  }

  return [];
}

function normalizeSelectedToneIds(parsedToneIds, toolMap) {
  const selectedToneIds = {};

  toolMap.forEach((tool, toolId) => {
    const requestedToneId = parsedToneIds && typeof parsedToneIds[toolId] === 'string'
      ? parsedToneIds[toolId]
      : getDefaultToneId(tool);
    selectedToneIds[toolId] = requestedToneId;
  });

  return selectedToneIds;
}

function createLegacyBlockEntry(tool, stepIndex) {
  const note = tool.stepNotes[stepIndex % tool.stepNotes.length];
  const matchingKey = Array.isArray(tool.keys)
    ? tool.keys.find((key) => key.note === note)
    : null;
  return matchingKey ? createNoteEntry(matchingKey.note, matchingKey.label, matchingKey) : createNoteEntry(note);
}

function normalizeTrackSteps(track, tool, stepCount) {
  return Array.from({ length: stepCount }, (_, stepIndex) => {
    if (Array.isArray(track.steps)) {
      const normalized = normalizeStepEntry(track.steps[stepIndex], tool);
      if (normalized.length > 0 || track.steps[stepIndex] === null || Array.isArray(track.steps[stepIndex])) {
        return normalized;
      }
    }

    if (Array.isArray(track.blocks) && track.blocks.includes(stepIndex)) {
      return [createLegacyBlockEntry(tool, stepIndex)];
    }

    return [];
  });
}

function normalizeTrack(track, toolMap, selectedToneIds, stepCount) {
  if (!track || typeof track !== 'object') {
    return null;
  }

  const tool = toolMap.get(track.toolId);
  if (!tool) {
    return null;
  }

  const volume = Number.isFinite(track.volume)
    ? Math.max(0, Math.min(100, track.volume))
    : 66;

  return {
    id: tool.id,
    toolId: tool.id,
    toneId: typeof track.toneId === 'string' ? track.toneId : selectedToneIds[tool.id],
    name: typeof track.name === 'string' ? track.name : tool.trackName,
    icon: tool.instrumentGlyph,
    steps: normalizeTrackSteps(track, tool, stepCount),
    volume,
    muted: Boolean(track.muted),
    solo: Boolean(track.solo)
  };
}

export function normalizeSession(parsed, toolMap) {
  try {
    if (!parsed || typeof parsed !== 'object') {
      return createEmptySession(toolMap);
    }

    const stepCount = Number.isInteger(parsed.stepCount)
      ? Math.max(INITIAL_STEP_COUNT, parsed.stepCount)
      : INITIAL_STEP_COUNT;
    const selectedToneIds = normalizeSelectedToneIds(parsed.selectedToneIds, toolMap);

    const sessionTracks = Array.isArray(parsed.sessionTracks)
      ? parsed.sessionTracks
          .map((track) => normalizeTrack(track, toolMap, selectedToneIds, stepCount))
          .filter(Boolean)
      : [];

    return {
      activeToolId: typeof parsed.activeToolId === 'string' ? parsed.activeToolId : null,
      currentStep: Number.isInteger(parsed.currentStep) ? Math.max(0, Math.min(stepCount - 1, parsed.currentStep)) : 0,
      stepCount,
      selectedToneIds,
      sessionTracks
    };
  } catch (error) {
    return createEmptySession(toolMap);
  }
}

export function loadSession(toolMap) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptySession(toolMap);
    }

    return normalizeSession(JSON.parse(raw), toolMap);
  } catch (error) {
    return createEmptySession(toolMap);
  }
}

export function persistSession(snapshot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    // Ignore storage errors so the app remains usable in restricted contexts.
  }
}
