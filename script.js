import { AudioEngine } from './js/audio-engine.js';
import { createSessionTrack, loadSession, persistSession } from './js/session-storage.js';
import { getDefaultToneId, getTonePreset, INITIAL_STEP_COUNT, resolveToolTone, STEP_MS, toolMap, tools } from './js/tools.js';

const toolList = document.getElementById('toolList');
const panelTitle = document.getElementById('panelTitle');
const panelText = document.getElementById('panelText');
const workspaceBadge = document.getElementById('workspaceBadge');
const toneSelect = document.getElementById('toneSelect');
const modeValue = document.getElementById('modeValue');
const outputValue = document.getElementById('outputValue');
const instrumentStage = document.getElementById('instrumentStage');
const keyRange = document.getElementById('keyRange');
const keysBoard = document.getElementById('keysBoard');
const trackSidebar = document.getElementById('trackSidebar');
const laneContainer = document.getElementById('laneContainer');
const ruler = document.getElementById('ruler');
const playhead = document.querySelector('.playhead');
const timelineScroll = document.querySelector('.timeline-scroll');
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const rewindBtn = document.getElementById('rewindBtn');
const shrinkTimelineBtn = document.getElementById('shrinkTimelineBtn');
const transportStatus = document.getElementById('transportStatus');
const transportDot = document.getElementById('transportDot');
const expandTimelineBtn = document.getElementById('expandTimelineBtn');
const stepEditor = document.getElementById('stepEditor');
const stepEditorTitle = document.getElementById('stepEditorTitle');
const stepEditorList = document.getElementById('stepEditorList');
const stepEditorSelect = document.getElementById('stepEditorSelect');
const stepEditorAddBtn = document.getElementById('stepEditorAddBtn');
const stepEditorClose = document.getElementById('stepEditorClose');

const audioEngine = new AudioEngine();
const initialSession = loadSession(toolMap);

let activeToolId = toolMap.has(initialSession.activeToolId) ? initialSession.activeToolId : 'guitar';
let sessionTracks = initialSession.sessionTracks;
let currentStep = initialSession.currentStep;
let stepCount = initialSession.stepCount;
let selectedToneIds = initialSession.selectedToneIds;
let isPlaying = false;
let transportTimer = null;
let playbackRunId = 0;
let isDraggingPlayhead = false;
let stepEditorState = null;

function getTool(toolId) {
  return toolMap.get(toolId);
}

function getSessionSnapshot() {
  return {
    activeToolId,
    currentStep,
    stepCount,
    selectedToneIds,
    sessionTracks
  };
}

function saveSession() {
  persistSession(getSessionSnapshot());
}

function getSelectedToneId(toolId) {
  const tool = getTool(toolId);
  return selectedToneIds[toolId] || getDefaultToneId(tool);
}

function getResolvedTool(toolId, toneId = getSelectedToneId(toolId)) {
  return resolveToolTone(getTool(toolId), toneId);
}

function addToolToSession(tool) {
  if (!tool.addable || sessionTracks.some((track) => track.toolId === tool.id)) {
    return;
  }

  sessionTracks = [...sessionTracks, createSessionTrack(tool, stepCount, getSelectedToneId(tool.id))];
  saveSession();
}

function getSliderFill(value) {
  return `linear-gradient(to right, rgba(74, 222, 128, 0.92) 0%, rgba(190, 242, 100, 0.88) ${value}%, rgba(255,255,255,0.12) ${value}%, rgba(255,255,255,0.08) 100%)`;
}

function setTransportStatus(text, playing = false) {
  transportStatus.textContent = text;
  transportDot.classList.toggle('is-playing', playing);
}

function renderRuler() {
  ruler.innerHTML = '';
  ruler.style.gridTemplateColumns = `repeat(${stepCount}, minmax(90px, 1fr))`;
  for (let i = 1; i <= stepCount; i += 1) {
    const measure = document.createElement('div');
    measure.className = 'measure';
    measure.innerHTML = `<div>${i}</div><div class="ticks"></div>`;
    ruler.appendChild(measure);
  }
}

function renderToolButtons() {
  toolList.innerHTML = '';

  tools.forEach((tool) => {
    const isAdded = sessionTracks.some((track) => track.toolId === tool.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tool-button${tool.id === activeToolId ? ' active' : ''}`;
    button.innerHTML = `
      <div class="tool-icon" style="background:${tool.gradient}">${tool.icon}</div>
      <div>
        <div class="tool-title">${tool.name}</div>
        <div class="tool-subtitle">${tool.addable ? (isAdded ? 'Added to session' : 'Add to session') : 'Workspace only'}</div>
      </div>
    `;

    button.addEventListener('click', () => {
      activeToolId = tool.id;
      addToolToSession(tool);
      saveSession();
      render();
    });

    toolList.appendChild(button);
  });
}

function createClipMarkup() {
  return `
    <div class="clip">
      <div class="clip-label"></div>
      <div class="clip-notes">
        <span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="clip-line"></div>
    </div>
  `;
}

function hasStepEvents(step) {
  return Array.isArray(step) && step.length > 0;
}

function buildStepLabel(step) {
  if (!hasStepEvents(step)) {
    return '';
  }

  if (step.length === 1) {
    return step[0].label;
  }

  const labels = step.slice(0, 2).map((entry) => entry.label);
  return step.length > 2 ? `${labels.join(' / ')} +${step.length - 2}` : labels.join(' / ');
}

function getTrackById(trackId) {
  return sessionTracks.find((track) => track.id === trackId) || null;
}

function getToolKeysForTrack(trackId) {
  const track = getTrackById(trackId);
  return track ? getResolvedTool(track.toolId, track.toneId).keys : [];
}

function getGlobalReleaseTail() {
  return sessionTracks.reduce((maxRelease, track) => {
    const tool = getResolvedTool(track.toolId, track.toneId);
    return Math.max(maxRelease, typeof tool.releaseTail === 'number' ? tool.releaseTail : 0.08);
  }, 0.08);
}

function syncTrackTone(toolId, toneId) {
  sessionTracks = sessionTracks.map((track) => (
    track.toolId === toolId ? { ...track, toneId } : track
  ));
}

function updateSelectedTone(toolId, toneId) {
  selectedToneIds = {
    ...selectedToneIds,
    [toolId]: toneId
  };
  syncTrackTone(toolId, toneId);
  audioEngine.stopPreviewVoice();
  saveSession();
  render();
}

function renderToneSelect(activeTool) {
  toneSelect.innerHTML = '';
  const selectedToneId = getSelectedToneId(activeTool.id);

  activeTool.tones.forEach((tone) => {
    const option = document.createElement('option');
    option.value = tone.id;
    option.textContent = tone.name;
    option.selected = tone.id === selectedToneId;
    toneSelect.appendChild(option);
  });
}

function renderInstrumentView(activeTool) {
  const resolvedTool = getResolvedTool(activeTool.id);
  instrumentStage.innerHTML = `
    <div class="instrument-hero" style="background:${resolvedTool.gradient}">
      <div class="instrument-glyph">${resolvedTool.instrumentGlyph}</div>
      <div>
        <div class="instrument-name">${resolvedTool.instrumentLabel}</div>
        <div class="instrument-meta">${resolvedTool.tone} tone</div>
      </div>
    </div>
  `;

  keyRange.textContent = `${resolvedTool.keyRange} • Click a key to preview`;
  keysBoard.innerHTML = '';

  resolvedTool.keys.forEach((key) => {
    const keyElement = document.createElement('button');
    keyElement.type = 'button';
    keyElement.className = `workspace-key ${key.type}${key.active ? ' active' : ''}`;
    keyElement.textContent = key.label;
    keyElement.addEventListener('click', async () => {
      placeNoteAtCurrentStep(resolvedTool, key);
      await previewKey(resolvedTool, key.note);
    });
    keysBoard.appendChild(keyElement);
  });
}

function renderEmptyTracks() {
  trackSidebar.innerHTML = `
    <div class="track-empty">
      <div class="track-empty-title">No instruments added</div>
      <div class="track-empty-copy">Select drums, guitar, keys, or vocals to create a track, then click the grid to place clips.</div>
    </div>
  `;

  laneContainer.innerHTML = `
    <div class="lane-empty">
      <div class="lane-empty-title">Timeline is empty</div>
      <div class="lane-empty-copy">New tracks start blank. Add an instrument, then click cells to build stacks, right-click to remove notes, or Shift-click to clear a stack.</div>
    </div>
  `;
}

function updateTrackStep(trackId, stepIndex, updateStep) {
  sessionTracks = sessionTracks.map((track) => {
    if (track.id !== trackId) {
      return track;
    }

    const nextSteps = [...track.steps];
    nextSteps[stepIndex] = updateStep(track, nextSteps[stepIndex], stepIndex);

    return {
      ...track,
      steps: nextSteps
    };
  });

  saveSession();
  renderTracks(sessionTracks);
  renderStepEditor();
}

function addDefaultNoteToStep(trackId, stepIndex) {
  updateTrackStep(trackId, stepIndex, (track, currentStepEvents, index) => {
    const tool = getResolvedTool(track.toolId, track.toneId);
    const nextStack = Array.isArray(currentStepEvents) ? [...currentStepEvents] : [];
    const note = tool.stepNotes[index % tool.stepNotes.length];

    nextStack.push({
      note,
      label: note
    });

    return nextStack;
  });
}

function removeLastNoteFromStep(trackId, stepIndex) {
  updateTrackStep(trackId, stepIndex, (_track, currentStepEvents) => {
    const nextStack = Array.isArray(currentStepEvents) ? [...currentStepEvents] : [];
    nextStack.pop();
    return nextStack;
  });
}

function clearStep(trackId, stepIndex) {
  updateTrackStep(trackId, stepIndex, () => []);
}

function updateStepNote(trackId, stepIndex, noteIndex, nextNote) {
  updateTrackStep(trackId, stepIndex, (_track, currentStepEvents) => {
    const nextStack = Array.isArray(currentStepEvents) ? [...currentStepEvents] : [];
    if (!nextStack[noteIndex]) {
      return nextStack;
    }

    nextStack[noteIndex] = {
      note: nextNote.note,
      label: nextNote.label
    };
    return nextStack;
  });
}

function addSpecificNoteToStep(trackId, stepIndex, key) {
  updateTrackStep(trackId, stepIndex, (_track, currentStepEvents) => {
    const nextStack = Array.isArray(currentStepEvents) ? [...currentStepEvents] : [];
    nextStack.push({
      note: key.note,
      label: key.label
    });
    return nextStack;
  });
}

function removeNoteAtIndex(trackId, stepIndex, noteIndex) {
  updateTrackStep(trackId, stepIndex, (_track, currentStepEvents) => {
    const nextStack = Array.isArray(currentStepEvents) ? [...currentStepEvents] : [];
    nextStack.splice(noteIndex, 1);
    return nextStack;
  });
}

function placeNoteAtCurrentStep(tool, key) {
  addToolToSession(tool);

  sessionTracks = sessionTracks.map((track) => {
    if (track.toolId !== tool.id) {
      return track;
    }

    const nextSteps = [...track.steps];
    const currentStack = Array.isArray(nextSteps[currentStep]) ? [...nextSteps[currentStep]] : [];
    currentStack.push({
      note: key.note,
      label: key.label
    });
    nextSteps[currentStep] = currentStack;

    return {
      ...track,
      steps: nextSteps
    };
  });

  saveSession();
  renderTracks(sessionTracks);
}

function closeStepEditor() {
  stepEditorState = null;
  stepEditor.classList.add('hidden');
  stepEditor.setAttribute('aria-hidden', 'true');
}

function positionStepEditor(anchorRect) {
  const panelWidth = Math.min(360, window.innerWidth - 24);
  const left = Math.min(
    Math.max(12, anchorRect.left + (anchorRect.width / 2) - (panelWidth / 2)),
    window.innerWidth - panelWidth - 12
  );
  const top = Math.min(anchorRect.bottom + 12, window.innerHeight - 260);

  stepEditor.style.left = `${left}px`;
  stepEditor.style.top = `${Math.max(12, top)}px`;
}

function expandTimeline(stepDelta) {
  stepCount += stepDelta;
  sessionTracks = sessionTracks.map((track) => ({
    ...track,
    steps: [
      ...track.steps,
      ...Array.from({ length: stepDelta }, () => [])
    ]
  }));
  saveSession();
  renderRuler();
  renderTracks(sessionTracks);
  renderStepEditor();
}

function countNotesBeyondStep(limitStep) {
  return sessionTracks.reduce((count, track) => (
    count + track.steps.slice(limitStep).reduce((stepTotal, step) => stepTotal + (Array.isArray(step) ? step.length : 0), 0)
  ), 0);
}

function shrinkTimeline(stepDelta) {
  const nextStepCount = Math.max(INITIAL_STEP_COUNT, stepCount - stepDelta);
  sessionTracks = sessionTracks.map((track) => ({
    ...track,
    steps: track.steps.slice(0, nextStepCount)
  }));
  stepCount = nextStepCount;
  currentStep = Math.min(currentStep, stepCount - 1);
  saveSession();
  renderRuler();
  renderTracks(sessionTracks);
  renderStepEditor();
}

function requestTimelineExpansion() {
  const response = window.prompt('How many steps would you like to add?', '1');
  if (response === null) {
    return;
  }

  const stepDelta = Number.parseInt(response, 10);
  if (!Number.isInteger(stepDelta) || stepDelta < 1) {
    window.alert('Please enter a whole number greater than 0.');
    return;
  }

  expandTimeline(stepDelta);
}

function requestTimelineReduction() {
  if (stepCount <= INITIAL_STEP_COUNT) {
    window.alert(`The timeline cannot go below ${INITIAL_STEP_COUNT} steps.`);
    return;
  }

  const response = window.prompt('How many steps would you like to remove?', '1');
  if (response === null) {
    return;
  }

  const requestedDelta = Number.parseInt(response, 10);
  if (!Number.isInteger(requestedDelta) || requestedDelta < 1) {
    window.alert('Please enter a whole number greater than 0.');
    return;
  }

  const maxReduction = stepCount - INITIAL_STEP_COUNT;
  const stepDelta = Math.min(requestedDelta, maxReduction);
  const nextStepCount = stepCount - stepDelta;
  const notesToRemove = countNotesBeyondStep(nextStepCount);

  if (notesToRemove > 0) {
    const confirmed = window.confirm(`Removing ${stepDelta} step(s) will also remove ${notesToRemove} note(s) beyond step ${nextStepCount}. Continue?`);
    if (!confirmed) {
      return;
    }
  }

  shrinkTimeline(stepDelta);
}

function openStepEditor(trackId, stepIndex, anchorElement) {
  stepEditorState = {
    trackId,
    stepIndex,
    anchorRect: anchorElement.getBoundingClientRect()
  };
  renderStepEditor();
}

function renderStepEditor() {
  if (!stepEditorState) {
    return;
  }

  const track = getTrackById(stepEditorState.trackId);
  if (!track) {
    closeStepEditor();
    return;
  }

  const tool = getResolvedTool(track.toolId, track.toneId);
  const step = track.steps[stepEditorState.stepIndex];
  if (!hasStepEvents(step) || step.length <= 1) {
    closeStepEditor();
    return;
  }

  stepEditorTitle.textContent = `${track.name} • Step ${stepEditorState.stepIndex + 1}`;
  stepEditorList.innerHTML = '';
  stepEditorSelect.innerHTML = '';

  tool.keys.forEach((key) => {
    const option = document.createElement('option');
    option.value = key.note;
    option.textContent = `${key.label} (${key.note})`;
    stepEditorSelect.appendChild(option);
  });

  step.forEach((entry, noteIndex) => {
    const row = document.createElement('div');
    row.className = 'step-editor-row';

    const select = document.createElement('select');
    select.className = 'step-editor-select';
    tool.keys.forEach((key) => {
      const option = document.createElement('option');
      option.value = key.note;
      option.textContent = `${key.label} (${key.note})`;
      option.selected = key.note === entry.note;
      select.appendChild(option);
    });
    select.addEventListener('change', (event) => {
      const selectedKey = tool.keys.find((key) => key.note === event.currentTarget.value);
      if (selectedKey) {
        updateStepNote(track.id, stepEditorState.stepIndex, noteIndex, selectedKey);
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'step-editor-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      removeNoteAtIndex(track.id, stepEditorState.stepIndex, noteIndex);
    });

    row.appendChild(select);
    row.appendChild(removeBtn);
    stepEditorList.appendChild(row);
  });

  positionStepEditor(stepEditorState.anchorRect);
  stepEditor.classList.remove('hidden');
  stepEditor.setAttribute('aria-hidden', 'false');
}

function updateTrackVolume(trackId, value) {
  sessionTracks = sessionTracks.map((track) => (
    track.id === trackId ? { ...track, volume: Number(value) } : track
  ));
  saveSession();
}

function toggleTrackMute(trackId) {
  sessionTracks = sessionTracks.map((track) => (
    track.id === trackId ? { ...track, muted: !track.muted } : track
  ));
  saveSession();
  renderTracks(sessionTracks);
}

function toggleTrackSolo(trackId) {
  sessionTracks = sessionTracks.map((track) => (
    track.id === trackId ? { ...track, solo: !track.solo } : track
  ));
  saveSession();
  renderTracks(sessionTracks);
}

function getAudibleTracks() {
  const soloTracks = sessionTracks.filter((track) => track.solo && !track.muted);
  if (soloTracks.length > 0) {
    return soloTracks;
  }

  return sessionTracks.filter((track) => !track.muted);
}

function renderTracks(tracks) {
  trackSidebar.innerHTML = '';
  laneContainer.innerHTML = '';

  if (tracks.length === 0) {
    renderEmptyTracks();
    return;
  }

  tracks.forEach((track) => {
    const tool = getResolvedTool(track.toolId, track.toneId);
    const row = document.createElement('div');
    row.className = 'track-row';
    row.style.setProperty('--track-accent', tool ? tool.clipLine : '#4ade80');
    row.innerHTML = `
      <div class="track-info">
        <div class="track-name">${track.name}</div>
        <div class="track-controls">
          <button class="round-btn${track.muted ? ' active' : ''}" type="button" aria-label="Mute">M</button>
          <button class="round-btn${track.solo ? ' active solo' : ''}" type="button" aria-label="Solo">S</button>
          <input class="track-slider" type="range" min="0" max="100" value="${track.volume}" aria-label="${track.name} volume" />
        </div>
      </div>
      <div class="track-thumb">${track.icon}</div>
    `;
    trackSidebar.appendChild(row);

    const slider = row.querySelector('.track-slider');
    slider.style.background = getSliderFill(track.volume);
    slider.addEventListener('input', (event) => {
      const { value } = event.currentTarget;
      event.currentTarget.style.background = getSliderFill(value);
      updateTrackVolume(track.id, value);
    });

    const [muteBtn, soloBtn] = row.querySelectorAll('.round-btn');
    muteBtn.addEventListener('click', () => {
      toggleTrackMute(track.id);
    });
    soloBtn.addEventListener('click', () => {
      toggleTrackSolo(track.id);
    });

    const laneRow = document.createElement('div');
    laneRow.className = 'lane-row';
    laneRow.dataset.trackId = track.id;
    laneRow.style.setProperty('--track-clip', tool ? tool.clipFill : 'rgba(74, 222, 128, 0.24)');
    laneRow.style.setProperty('--track-line', tool ? tool.clipLine : '#4ade80');

    laneRow.style.gridTemplateColumns = `repeat(${stepCount}, minmax(90px, 1fr))`;

    for (let i = 0; i < stepCount; i += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      const stepEvent = track.steps[i];
      cell.className = `lane-cell${hasStepEvents(stepEvent) ? ' active' : ''}`;
      cell.dataset.step = String(i);
      cell.setAttribute('aria-label', `${track.name} step ${i + 1}`);
      cell.title = 'Click to add note, right-click to remove last, Shift-click to clear';
      cell.innerHTML = createClipMarkup();

      const clipLabel = cell.querySelector('.clip-label');
      if (hasStepEvents(stepEvent)) {
        clipLabel.textContent = buildStepLabel(stepEvent);
      }

      cell.addEventListener('click', (event) => {
        if (event.shiftKey) {
          clearStep(track.id, i);
          return;
        }

        if (hasStepEvents(stepEvent) && stepEvent.length > 1) {
          openStepEditor(track.id, i, cell);
          return;
        }

        addDefaultNoteToStep(track.id, i);
      });

      cell.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        removeLastNoteFromStep(track.id, i);
      });
      laneRow.appendChild(cell);
    }

    laneContainer.appendChild(laneRow);
  });

  updatePlayhead();
}

function render() {
  const activeTool = getTool(activeToolId);

  renderToolButtons();
  panelTitle.textContent = activeTool.panelTitle;
  panelText.textContent = activeTool.panelText;
  workspaceBadge.textContent = activeTool.badge;
  workspaceBadge.style.background = activeTool.gradient;
  renderToneSelect(activeTool);
  modeValue.textContent = activeTool.name;
  outputValue.textContent = activeTool.output;
  renderInstrumentView(activeTool);
  renderTracks(sessionTracks);
}

function getClampedStep(step) {
  return Math.max(0, Math.min(stepCount - 1, step));
}

function clearStepHighlight() {
  document.querySelectorAll('.lane-cell').forEach((cell) => {
    cell.classList.remove('is-current-step');
  });
}

function highlightCurrentStep() {
  document.querySelectorAll('.lane-cell').forEach((cell) => {
    const isCurrent = Number(cell.dataset.step) === currentStep;
    cell.classList.toggle('is-current-step', isCurrent);
  });
}

function getRenderedStepElements() {
  return Array.from(ruler.querySelectorAll('.measure'));
}

function updatePlayhead() {
  const stepElements = getRenderedStepElements();
  const stepElement = stepElements[currentStep];

  if (!stepElement) {
    playhead.style.left = '0px';
    return;
  }

  playhead.style.left = `${stepElement.offsetLeft}px`;
}

function setCurrentStep(step, options = {}) {
  currentStep = getClampedStep(step);
  updatePlayhead();

  if (isPlaying || options.keepHighlight) {
    highlightCurrentStep();
  } else {
    clearStepHighlight();
  }

  if (!options.skipPersist) {
    saveSession();
  }
}

function getStepFromClientX(clientX) {
  const stepElements = getRenderedStepElements();
  if (stepElements.length === 0) {
    return 0;
  }

  const matchIndex = stepElements.findIndex((element) => {
    const rect = element.getBoundingClientRect();
    return clientX >= rect.left && clientX < rect.right;
  });

  if (matchIndex >= 0) {
    return getClampedStep(matchIndex);
  }

  if (clientX < stepElements[0].getBoundingClientRect().left) {
    return 0;
  }

  return stepElements.length - 1;
}

async function previewKey(tool, note) {
  try {
    setTransportStatus(`Loading ${tool.name} sample...`);
    await audioEngine.previewKey(tool, note);
    setTransportStatus(`${tool.name} ready`);
  } catch (error) {
    setTransportStatus('Audio blocked in this browser');
  }
}

async function playCurrentStep(runId = playbackRunId) {
  if (!isPlaying || runId !== playbackRunId) {
    return;
  }

  highlightCurrentStep();
  updatePlayhead();

  const tracksToPlay = getAudibleTracks().filter((track) => hasStepEvents(track.steps[currentStep]));
  await Promise.all(
    tracksToPlay.map((track) => audioEngine.triggerTrackStep(track, track.steps[currentStep], getResolvedTool(track.toolId, track.toneId)))
  );

  if (!isPlaying || runId !== playbackRunId) {
    return;
  }

  currentStep = (currentStep + 1) % stepCount;
}

function queueNextPlaybackTick(runId) {
  if (!isPlaying || runId !== playbackRunId) {
    return;
  }

  transportTimer = window.setTimeout(async () => {
    await playCurrentStep(runId);
    queueNextPlaybackTick(runId);
  }, STEP_MS);
}

async function startPlayback() {
  if (isPlaying || sessionTracks.length === 0) {
    return;
  }

  playbackRunId += 1;
  const runId = playbackRunId;

  try {
    setTransportStatus('Loading samples...');
    await audioEngine.preloadInstruments(sessionTracks, (toolId, toneId) => getResolvedTool(toolId, toneId));

    if (runId !== playbackRunId) {
      return;
    }

    isPlaying = true;
    setTransportStatus('Playing', true);
    playBtn.setAttribute('aria-label', 'Playback running');
    playBtn.setAttribute('title', 'Playback running');
    await playCurrentStep(runId);
    queueNextPlaybackTick(runId);
  } catch (error) {
    isPlaying = false;
    setTransportStatus('Audio unavailable');
  }
}

function stopPlayback(resetStep = true) {
  playbackRunId += 1;
  isPlaying = false;

  if (transportTimer) {
    window.clearTimeout(transportTimer);
    transportTimer = null;
  }

  audioEngine.stopActiveVoices(getGlobalReleaseTail());
  audioEngine.stopPreviewVoice();
  playBtn.setAttribute('aria-label', 'Play timeline');
  playBtn.setAttribute('title', 'Play timeline');
  setTransportStatus(sessionTracks.length > 0 ? 'Session Idle' : 'Add an instrument');
  clearStepHighlight();

  if (resetStep) {
    currentStep = 0;
    saveSession();
  }

  updatePlayhead();
}

function rewindPlayback() {
  setCurrentStep(0);
  if (!isPlaying) {
    clearStepHighlight();
  }
  setTransportStatus(isPlaying ? 'Playing from start' : 'Rewound', isPlaying);
}

function updatePlayheadFromPointer(clientX) {
  const step = getStepFromClientX(clientX);
  setCurrentStep(step, { keepHighlight: isPlaying });
}

function handlePlayheadPointerDown(event) {
  event.preventDefault();
  isDraggingPlayhead = true;
  playhead.classList.add('is-dragging');
  updatePlayheadFromPointer(event.clientX);
}

function handleGlobalPointerMove(event) {
  if (!isDraggingPlayhead) {
    return;
  }

  updatePlayheadFromPointer(event.clientX);
}

function handleGlobalPointerUp() {
  if (!isDraggingPlayhead) {
    return;
  }

  isDraggingPlayhead = false;
  playhead.classList.remove('is-dragging');
}

toneSelect.addEventListener('change', (event) => {
  const activeTool = getTool(activeToolId);
  const nextTone = getTonePreset(activeTool, event.currentTarget.value);
  updateSelectedTone(activeTool.id, nextTone.id);
});

stepEditorAddBtn.addEventListener('click', () => {
  if (!stepEditorState) {
    return;
  }

  const toolKeys = getToolKeysForTrack(stepEditorState.trackId);
  const selectedKey = toolKeys.find((key) => key.note === stepEditorSelect.value);
  if (selectedKey) {
    addSpecificNoteToStep(stepEditorState.trackId, stepEditorState.stepIndex, selectedKey);
  }
});

stepEditorClose.addEventListener('click', () => {
  closeStepEditor();
});

shrinkTimelineBtn.addEventListener('click', () => {
  requestTimelineReduction();
});

expandTimelineBtn.addEventListener('click', () => {
  requestTimelineExpansion();
});

document.addEventListener('click', (event) => {
  if (!stepEditorState) {
    return;
  }

  if (stepEditor.contains(event.target) || event.target.closest('.lane-cell')) {
    return;
  }

  closeStepEditor();
});

window.addEventListener('resize', () => {
  renderStepEditor();
  updatePlayhead();
});

playhead.addEventListener('pointerdown', handlePlayheadPointerDown);
window.addEventListener('pointermove', handleGlobalPointerMove);
window.addEventListener('pointerup', handleGlobalPointerUp);
window.addEventListener('pointercancel', handleGlobalPointerUp);

timelineScroll.addEventListener('dblclick', (event) => {
  if (event.target.closest('.lane-cell')) {
    return;
  }

  updatePlayheadFromPointer(event.clientX);
});

playBtn.addEventListener('click', async () => {
  await startPlayback();
});

stopBtn.addEventListener('click', () => {
  stopPlayback(true);
});

rewindBtn.addEventListener('click', () => {
  audioEngine.stopActiveVoices(getGlobalReleaseTail());
  audioEngine.stopPreviewVoice();
  rewindPlayback();
});

renderRuler();
updatePlayhead();
setTransportStatus(sessionTracks.length > 0 ? 'Session Idle' : 'Add an instrument');
render();
