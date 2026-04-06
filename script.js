const tools = [
  {
    id: 'drums',
    name: 'Drums',
    icon: 'D',
    badge: 'D',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.32), rgba(74,222,128,0.12))',
    panelTitle: 'Drum Machine',
    panelText: 'Build punchy patterns, adjust groove, and shape the rhythm section.',
    tone: 'Punchy',
    output: 'Stereo',
    bars: [30, 55, 40, 70, 52, 65, 35, 72, 45, 58, 38, 62],
    controls: [
      { label: 'Gain', value: 68 },
      { label: 'Swing', value: 42 },
      { label: 'Room', value: 25 }
    ],
    tracks: [
      { name: 'Hip Hop Drum Machine', icon: '🥁', blocks: [0, 1, 2, 3, 4, 5, 6, 7] },
      { name: 'Snare Accent', icon: '🥁', blocks: [1, 3, 5, 7] },
      { name: 'Perc Loop', icon: '🥁', blocks: [0, 2, 4, 6] }
    ]
  },
  {
    id: 'guitar',
    name: 'Guitar',
    icon: 'G',
    badge: 'G',
    gradient: 'linear-gradient(135deg, rgba(249,115,22,0.32), rgba(251,191,36,0.12))',
    panelTitle: 'Guitar Controls',
    panelText: 'Shape tone, add drive, and sketch riffs with quick preset switching.',
    tone: 'Warm',
    output: 'Stereo',
    bars: [26, 48, 62, 36, 72, 58, 40, 66, 52, 74, 44, 57],
    controls: [
      { label: 'Gain', value: 68 },
      { label: 'Reverb', value: 42 },
      { label: 'Delay', value: 25 }
    ],
    tracks: [
      { name: 'Picked', icon: '🎸', blocks: [0, 2, 4, 6, 7] },
      { name: 'Classic Clean', icon: '🎸', blocks: [1, 2, 3, 4, 6, 7] },
      { name: 'Hard Rock', icon: '🎸', blocks: [0, 3, 5, 7] }
    ]
  },
  {
    id: 'keys',
    name: 'Keys',
    icon: 'K',
    badge: 'K',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.32), rgba(129,140,248,0.12))',
    panelTitle: 'Keyboard Studio',
    panelText: 'Layer soft chords, synth textures, and melodic phrases in one place.',
    tone: 'Dreamy',
    output: 'Stereo',
    bars: [42, 60, 38, 74, 48, 67, 32, 58, 76, 45, 63, 40],
    controls: [
      { label: 'Chorus', value: 54 },
      { label: 'Reverb', value: 61 },
      { label: 'Attack', value: 33 }
    ],
    tracks: [
      { name: 'Ethereal Rhythm', icon: '🎹', blocks: [0, 1, 4, 5] },
      { name: 'Dream Chords', icon: '🎹', blocks: [1, 3, 4, 6] },
      { name: 'Lead Keys', icon: '🎹', blocks: [2, 5, 7] }
    ]
  },
  {
    id: 'vocals',
    name: 'Vocals',
    icon: 'V',
    badge: 'V',
    gradient: 'linear-gradient(135deg, rgba(14,165,233,0.32), rgba(34,211,238,0.12))',
    panelTitle: 'Vocal Lane',
    panelText: 'Track ideas, stack harmonies, and keep voice effects easy to reach.',
    tone: 'Bright',
    output: 'Mono',
    bars: [35, 44, 58, 72, 54, 40, 63, 77, 49, 69, 38, 56],
    controls: [
      { label: 'Comp', value: 49 },
      { label: 'Air', value: 57 },
      { label: 'Delay', value: 22 }
    ],
    tracks: [
      { name: 'Lead Vocal', icon: '🎤', blocks: [1, 2, 4, 6] },
      { name: 'Harmony', icon: '🎤', blocks: [2, 4, 6] },
      { name: 'Ad-libs', icon: '🎤', blocks: [5, 7] }
    ]
  },
  {
    id: 'mix',
    name: 'Mixer',
    icon: 'M',
    badge: 'M',
    gradient: 'linear-gradient(135deg, rgba(161,161,170,0.24), rgba(244,244,245,0.08))',
    panelTitle: 'Mix View',
    panelText: 'Balance levels, shape space, and keep the session clean while arranging.',
    tone: 'Neutral',
    output: 'Master',
    bars: [28, 36, 54, 66, 44, 59, 72, 51, 39, 62, 47, 70],
    controls: [
      { label: 'Bus A', value: 73 },
      { label: 'Bus B', value: 46 },
      { label: 'FX', value: 31 }
    ],
    tracks: [
      { name: 'Bus A', icon: '🎚️', blocks: [0, 1, 2, 3, 4, 5, 6, 7] },
      { name: 'Bus B', icon: '🎚️', blocks: [1, 3, 5, 7] },
      { name: 'FX Return', icon: '🎚️', blocks: [2, 6] }
    ]
  }
];

const toolList = document.getElementById('toolList');
const panelTitle = document.getElementById('panelTitle');
const panelText = document.getElementById('panelText');
const workspaceBadge = document.getElementById('workspaceBadge');
const toneValue = document.getElementById('toneValue');
const modeValue = document.getElementById('modeValue');
const outputValue = document.getElementById('outputValue');
const performanceBars = document.getElementById('performanceBars');
const quickControls = document.getElementById('quickControls');
const trackSidebar = document.getElementById('trackSidebar');
const laneContainer = document.getElementById('laneContainer');
const ruler = document.getElementById('ruler');

let activeToolId = 'guitar';

function renderRuler() {
  ruler.innerHTML = '';
  for (let i = 1; i <= 8; i += 1) {
    const measure = document.createElement('div');
    measure.className = 'measure';
    measure.innerHTML = `<div>${i}</div><div class="ticks"></div>`;
    ruler.appendChild(measure);
  }
}

function renderToolButtons() {
  toolList.innerHTML = '';

  tools.forEach((tool) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tool-button${tool.id === activeToolId ? ' active' : ''}`;
    button.innerHTML = `
      <div class="tool-icon" style="background:${tool.gradient}">${tool.icon}</div>
      <div>
        <div class="tool-title">${tool.name}</div>
        <div class="tool-subtitle">Open tool layout</div>
      </div>
    `;

    button.addEventListener('click', () => {
      activeToolId = tool.id;
      render();
    });

    toolList.appendChild(button);
  });
}

function renderPerformanceBars(bars) {
  performanceBars.innerHTML = '';

  bars.forEach((height) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${height}%`;
    performanceBars.appendChild(bar);
  });
}

function renderQuickControls(controls) {
  quickControls.innerHTML = '';

  controls.forEach((control) => {
    const row = document.createElement('div');
    row.className = 'control-row';
    row.innerHTML = `
      <div class="control-top">
        <span>${control.label}</span>
        <span>${control.value}%</span>
      </div>
      <div class="control-track">
        <div class="control-fill" style="width:${control.value}%"></div>
      </div>
    `;
    quickControls.appendChild(row);
  });
}

function createClipMarkup() {
  return `
    <div class="clip">
      <div class="clip-notes">
        <span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="clip-line"></div>
    </div>
  `;
}

function renderTracks(tracks) {
  trackSidebar.innerHTML = '';
  laneContainer.innerHTML = '';

  tracks.forEach((track) => {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.innerHTML = `
      <div>
        <div class="track-name">${track.name}</div>
        <div class="track-controls">
          <button class="round-btn" type="button" aria-label="Mute"></button>
          <button class="round-btn" type="button" aria-label="Headphones"></button>
          <div class="track-slider"></div>
        </div>
      </div>
      <div class="track-thumb">${track.icon}</div>
    `;
    trackSidebar.appendChild(row);

    const laneRow = document.createElement('div');
    laneRow.className = 'lane-row';

    for (let i = 0; i < 8; i += 1) {
      const cell = document.createElement('div');
      cell.className = `lane-cell${track.blocks.includes(i) ? ' active' : ''}`;
      cell.innerHTML = createClipMarkup();
      laneRow.appendChild(cell);
    }

    laneContainer.appendChild(laneRow);
  });
}

function render() {
  const activeTool = tools.find((tool) => tool.id === activeToolId);

  renderToolButtons();
  panelTitle.textContent = activeTool.panelTitle;
  panelText.textContent = activeTool.panelText;
  workspaceBadge.textContent = activeTool.badge;
  workspaceBadge.style.background = activeTool.gradient;
  toneValue.textContent = activeTool.tone;
  modeValue.textContent = activeTool.name;
  outputValue.textContent = activeTool.output;
  renderPerformanceBars(activeTool.bars);
  renderQuickControls(activeTool.controls);
  renderTracks(activeTool.tracks);
}

renderRuler();
render();
