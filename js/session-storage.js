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

function normalizeStepEntry(entry, tool, stepIndex) {
  if (Array.isArray(entry)) {
    return entry
      .filter((item) => item && typeof item.note === 'string')
      .map((item) => ({
        note: item.note,
        label: typeof item.label === 'string' ? item.label : item.note
      }));
  }

  if (entry && typeof entry.note === 'string') {
    return [{
      note: entry.note,
      label: typeof entry.label === 'string' ? entry.label : entry.note
    }];
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

export function loadSession(toolMap) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        activeToolId: null,
        currentStep: 0,
        stepCount: INITIAL_STEP_COUNT,
        selectedToneIds: normalizeSelectedToneIds(null, toolMap),
        sessionTracks: []
      };
    }

    const parsed = JSON.parse(raw);
    const stepCount = Number.isInteger(parsed.stepCount)
      ? Math.max(INITIAL_STEP_COUNT, parsed.stepCount)
      : INITIAL_STEP_COUNT;
    const selectedToneIds = normalizeSelectedToneIds(parsed.selectedToneIds, toolMap);

    const sessionTracks = Array.isArray(parsed.sessionTracks)
      ? parsed.sessionTracks
          .map((track) => {
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
              steps: Array.from({ length: stepCount }, (_, stepIndex) => {
                if (Array.isArray(track.steps)) {
                  const normalized = normalizeStepEntry(track.steps[stepIndex], tool, stepIndex);
                  if (normalized.length > 0 || track.steps[stepIndex] === null || Array.isArray(track.steps[stepIndex])) {
                    return normalized;
                  }
                }

                if (Array.isArray(track.blocks) && track.blocks.includes(stepIndex)) {
                  return [{
                    note: tool.stepNotes[stepIndex % tool.stepNotes.length],
                    label: tool.stepNotes[stepIndex % tool.stepNotes.length]
                  }];
                }

                return [];
              }),
              volume: typeof track.volume === 'number' ? Math.max(0, Math.min(100, track.volume)) : 66,
              muted: Boolean(track.muted),
              solo: Boolean(track.solo)
            };
          })
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
    return {
      activeToolId: null,
      currentStep: 0,
      stepCount: INITIAL_STEP_COUNT,
      selectedToneIds: normalizeSelectedToneIds(null, toolMap),
      sessionTracks: []
    };
  }
}

export function persistSession(snapshot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    // Ignore storage errors so the app remains usable in restricted contexts.
  }
}
