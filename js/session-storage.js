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

function createNoteEntry(note, label = note) {
  return {
    note,
    label
  };
}

function normalizeNoteEntry(item) {
  if (!item || typeof item.note !== 'string') {
    return null;
  }

  return createNoteEntry(item.note, typeof item.label === 'string' ? item.label : item.note);
}

function normalizeStepEntry(entry, tool) {
  if (Array.isArray(entry)) {
    return entry
      .map(normalizeNoteEntry)
      .filter(Boolean);
  }

  const normalized = normalizeNoteEntry(entry);
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
  return createNoteEntry(note);
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
  const tool = toolMap.get(track.toolId);
  if (!tool) {
    return null;
  }

  return {
    id: tool.id,
    toolId: tool.id,
    toneId: typeof track.toneId === 'string' ? track.toneId : selectedToneIds[tool.id],
    name: typeof track.name === 'string' ? track.name : tool.trackName,
    icon: tool.instrumentGlyph,
    steps: normalizeTrackSteps(track, tool, stepCount),
    volume: typeof track.volume === 'number' ? Math.max(0, Math.min(100, track.volume)) : 66,
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
