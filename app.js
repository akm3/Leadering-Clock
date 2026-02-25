// ── State ────────────────────────────────────────
let clockInterval = null;

let timerDuration = 0;   // seconds remaining
let timerInitialDuration = 300; // last started duration (default 5 min)
let timerInterval = null;
let isRunning = false;
let isPaused = false;
let hasReachedZero = false;

// ── Persistence Helpers ─────────────────────────
function saveTimerState() {
  const state = {
    isRunning,
    isPaused,
    hasReachedZero,
    // Store the wall-clock time when the timer was last synced
    savedAt: Date.now(),
    timerDuration,
    timerInitialDuration,
  };
  localStorage.setItem('timerState', JSON.stringify(state));
}

function clearTimerState() {
  localStorage.removeItem('timerState');
}

// ── DOM References ──────────────────────────────
const clockTimeEl  = document.getElementById('clock-time');
const clockDateEl  = document.getElementById('clock-date');

const timerTimeEl   = document.getElementById('timer-time');
const timerDisplay  = document.getElementById('timer-display');
const inputMinutes  = document.getElementById('input-minutes');
const btnStart      = document.getElementById('btn-start');
const btnReset      = document.getElementById('btn-reset');
const btnPlus1      = document.getElementById('btn-plus1');
const btnMinus1     = document.getElementById('btn-minus1');
const timerWarning  = document.getElementById('timer-warning');
const timerSkull    = document.getElementById('timer-skull');

// ── Clock ───────────────────────────────────────
function updateClock() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  clockTimeEl.textContent = `${hours}:${minutes}`;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  clockDateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

// Start the clock immediately
updateClock();
clockInterval = setInterval(updateClock, 1000);

// ── Collapsible Sections ────────────────────────
(function initCollapsibleSections() {
  const toggles = document.querySelectorAll('.section-toggle');
  const saved = JSON.parse(localStorage.getItem('collapsedSections') || '{}');

  function getSectionForToggle(toggle) {
    return toggle.closest('.section') || document.getElementById(toggle.dataset.section);
  }

  // Restore saved collapsed state
  toggles.forEach(toggle => {
    const key = toggle.dataset.section;
    if (saved[key]) {
      getSectionForToggle(toggle).classList.add('collapsed');
      // Sync arrow indicator on external toggles (app-title)
      if (!toggle.closest('.section')) {
        toggle.classList.add('collapsed-indicator');
      }
    }
  });

  // Click handler
  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const section = getSectionForToggle(toggle);
      section.classList.toggle('collapsed');

      // Sync arrow indicator on external toggles (app-title)
      if (!toggle.closest('.section')) {
        toggle.classList.toggle('collapsed-indicator', section.classList.contains('collapsed'));
      }

      // Persist state
      const state = JSON.parse(localStorage.getItem('collapsedSections') || '{}');
      state[toggle.dataset.section] = section.classList.contains('collapsed');
      localStorage.setItem('collapsedSections', JSON.stringify(state));
    });
  });
})();

// ── Timer Helpers ───────────────────────────────
function formatTime(totalSeconds) {
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const time = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return totalSeconds < 0 ? `-${time}` : time;
}

function clamp(value, min, max) {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < min) return min;
  if (n > max) return max;
  return n;
}

function getInputDuration() {
  const m = clamp(inputMinutes.value, 0, 999);
  return m * 60;
}

function setInputsDisabled(disabled) {
  inputMinutes.disabled = disabled;
}

function stopFlash() {
  timerDisplay.classList.remove('flash');
  timerDisplay.classList.remove('negative');
  timerDisplay.classList.remove('urgent-flash');
  timerWarning.hidden = true;
  timerSkull.hidden = true;
}

// ── Timer: Alert on reaching zero ───────────────
function timerReachedZero() {
  hasReachedZero = true;
  timerDisplay.classList.add('negative');

  // Audio beep using Web Audio API
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start(ctx.currentTime + i * 0.35);
      osc.stop(ctx.currentTime + i * 0.35 + 0.2);
    }
  } catch (_) {
    // Audio not available — visual alert is enough
  }
}

// ── Timer: Countdown tick ───────────────────────
function tick() {
  timerDuration--;
  timerTimeEl.textContent = formatTime(timerDuration);
  saveTimerState();

  // First time crossing zero — turn red, beep, keep going
  if (timerDuration === 0 && !hasReachedZero) {
    timerReachedZero();
  } else if (timerDuration < 0 && !hasReachedZero) {
    timerReachedZero();
  }

  // At -5 minutes: start flashing and show !!!
  if (timerDuration <= -300 && !timerDisplay.classList.contains('urgent-flash')) {
    timerDisplay.classList.add('urgent-flash');
    timerWarning.hidden = false;
  }

  // At -10 minutes: show skull
  if (timerDuration <= -600) {
    timerSkull.hidden = false;
  }
}

// ── Timer Controls ──────────────────────────────
btnStart.addEventListener('click', () => {
  if (isRunning) {
    // Pause
    clearInterval(timerInterval);
    timerInterval = null;
    isPaused = true;
    isRunning = false;
    btnStart.textContent = 'Resume';
    btnStart.classList.remove('btn-warning');
    btnStart.classList.add('btn-primary');
    saveTimerState();
    return;
  }

  if (isPaused) {
    // Resume
    stopFlash();
    isPaused = false;
    isRunning = true;
    timerInterval = setInterval(tick, 1000);
    btnStart.textContent = 'Pause';
    btnStart.classList.remove('btn-primary');
    btnStart.classList.add('btn-warning');
    saveTimerState();
    return;
  }

  // Fresh start
  stopFlash();
  hasReachedZero = false;

  const duration = getInputDuration();
  if (duration <= 0) return;

  timerDuration = duration;
  timerInitialDuration = duration;
  timerTimeEl.textContent = formatTime(timerDuration);
  isRunning = true;
  isPaused = false;

  timerInterval = setInterval(tick, 1000);

  btnStart.textContent = 'Pause';
  btnStart.classList.remove('btn-primary');
  btnStart.classList.add('btn-warning');
  btnReset.disabled = false;
  setInputsDisabled(true);
  saveTimerState();
});

btnReset.addEventListener('click', () => {
  stopFlash();
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isPaused = false;
  hasReachedZero = false;
  timerDuration = 0;

  const resetM = Math.round(timerInitialDuration / 60);
  timerTimeEl.textContent = formatTime(timerInitialDuration);
  inputMinutes.value = resetM;

  btnStart.textContent = 'Start';
  btnStart.classList.remove('btn-warning');
  btnStart.classList.add('btn-primary');
  btnReset.disabled = true;
  setInputsDisabled(false);
  clearTimerState();
});

// ── +/- 1 Minute Controls ───────────────────────
btnPlus1.addEventListener('click', () => {
  if (!isRunning && !isPaused) {
    let m = clamp(inputMinutes.value, 0, 999) + 1;
    if (m > 999) m = 999;
    inputMinutes.value = m;
    timerTimeEl.textContent = formatTime(m * 60);
    return;
  }
  timerDuration += 60;
  timerTimeEl.textContent = formatTime(timerDuration);
  saveTimerState();
  if (timerDuration >= 0 && hasReachedZero) {
    hasReachedZero = false;
    timerDisplay.classList.remove('negative');
    timerDisplay.classList.remove('urgent-flash');
    timerWarning.hidden = true;
    timerSkull.hidden = true;
  } else {
    // Update warning states based on current duration
    if (timerDuration > -300) {
      timerDisplay.classList.remove('urgent-flash');
      timerWarning.hidden = true;
    }
    if (timerDuration > -600) {
      timerSkull.hidden = true;
    }
  }
});

btnMinus1.addEventListener('click', () => {
  if (!isRunning && !isPaused) {
    let m = clamp(inputMinutes.value, 0, 999) - 1;
    if (m < 0) m = 0;
    inputMinutes.value = m;
    timerTimeEl.textContent = formatTime(m * 60);
    return;
  }
  timerDuration -= 60;
  timerTimeEl.textContent = formatTime(timerDuration);
  saveTimerState();
  if (timerDuration < 0 && !hasReachedZero) {
    hasReachedZero = true;
    timerDisplay.classList.add('negative');
  }
  if (timerDuration <= -300) {
    timerDisplay.classList.add('urgent-flash');
    timerWarning.hidden = false;
  }
  if (timerDuration <= -600) {
    timerSkull.hidden = false;
  }
});

// ── Input Validation ────────────────────────────
inputMinutes.addEventListener('change', () => {
  inputMinutes.value = clamp(inputMinutes.value, 0, 999);
});

// ── Restore Timer on Page Load ──────────────────
(function restoreTimer() {
  const raw = localStorage.getItem('timerState');
  if (!raw) return;

  try {
    const state = JSON.parse(raw);
    hasReachedZero = state.hasReachedZero || false;
    timerInitialDuration = state.timerInitialDuration || 300;

    if (state.isRunning) {
      const elapsedSec = Math.round((Date.now() - state.savedAt) / 1000);
      timerDuration = state.timerDuration - elapsedSec;
      timerTimeEl.textContent = formatTime(timerDuration);
      isRunning = true;
      isPaused = false;
      timerInterval = setInterval(tick, 1000);

      btnStart.textContent = 'Pause';
      btnStart.classList.remove('btn-primary');
      btnStart.classList.add('btn-warning');
      btnReset.disabled = false;
      setInputsDisabled(true);

      if (timerDuration <= 0 && !hasReachedZero) {
        hasReachedZero = true;
        timerDisplay.classList.add('negative');
      } else if (hasReachedZero) {
        timerDisplay.classList.add('negative');
      }
      if (timerDuration <= -300) {
        timerDisplay.classList.add('urgent-flash');
        timerWarning.hidden = false;
      }
      if (timerDuration <= -600) {
        timerSkull.hidden = false;
      }
    } else if (state.isPaused) {
      timerDuration = state.timerDuration;
      timerTimeEl.textContent = formatTime(timerDuration);
      isRunning = false;
      isPaused = true;

      btnStart.textContent = 'Resume';
      btnReset.disabled = false;
      setInputsDisabled(true);

      if (hasReachedZero) {
        timerDisplay.classList.add('negative');
      }
      if (timerDuration <= -300) {
        timerDisplay.classList.add('urgent-flash');
        timerWarning.hidden = false;
      }
      if (timerDuration <= -600) {
        timerSkull.hidden = false;
      }
    }
  } catch (_) {
    localStorage.removeItem('timerState');
  }
})();

// ── Meeting Cost Calculator ─────────────────────
let meetingElapsed = 0;      // seconds elapsed
let meetingInterval = null;
let meetingRunning = false;
let meetingPaused = false;

const inputPeople       = document.getElementById('input-people');
const inputRate          = document.getElementById('input-rate');
const meetingTimerTimeEl = document.getElementById('meeting-timer-time');
const meetingCostEl      = document.getElementById('meeting-cost');
const btnMeetingStart    = document.getElementById('btn-meeting-start');
const btnMeetingReset    = document.getElementById('btn-meeting-reset');

// Persistence
function saveMeetingState() {
  const state = {
    meetingRunning,
    meetingPaused,
    meetingElapsed,
    people: parseInt(inputPeople.value, 10) || 2,
    rate: parseFloat(inputRate.value) || 75,
    savedAt: Date.now(),
  };
  localStorage.setItem('meetingState', JSON.stringify(state));
}

function clearMeetingState() {
  localStorage.removeItem('meetingState');
}

function formatMeetingTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateMeetingCost() {
  const people = parseInt(inputPeople.value, 10) || 0;
  const rate = parseFloat(inputRate.value) || 0;
  const hours = meetingElapsed / 3600;
  const cost = people * rate * hours;
  meetingCostEl.textContent = `$${cost.toFixed(2)}`;
}

function meetingTick() {
  meetingElapsed++;
  meetingTimerTimeEl.textContent = formatMeetingTime(meetingElapsed);
  updateMeetingCost();
  saveMeetingState();
}

function setMeetingInputsDisabled(disabled) {
  inputPeople.disabled = disabled;
  inputRate.disabled = disabled;
}

// Recalculate cost live when inputs change (even while running)
inputPeople.addEventListener('input', () => { updateMeetingCost(); saveMeetingState(); });
inputRate.addEventListener('input', () => { updateMeetingCost(); saveMeetingState(); });

btnMeetingStart.addEventListener('click', () => {
  if (meetingRunning) {
    // Pause / End
    clearInterval(meetingInterval);
    meetingInterval = null;
    meetingPaused = true;
    meetingRunning = false;
    btnMeetingStart.textContent = 'Resume';
    btnMeetingStart.classList.remove('btn-warning');
    btnMeetingStart.classList.add('btn-primary');
    saveMeetingState();
    return;
  }

  if (meetingPaused) {
    // Resume
    meetingPaused = false;
    meetingRunning = true;
    meetingInterval = setInterval(meetingTick, 1000);
    btnMeetingStart.textContent = 'End Meeting';
    btnMeetingStart.classList.remove('btn-primary');
    btnMeetingStart.classList.add('btn-warning');
    saveMeetingState();
    return;
  }

  // Fresh start
  meetingElapsed = 0;
  meetingRunning = true;
  meetingPaused = false;
  meetingTimerTimeEl.textContent = formatMeetingTime(0);
  updateMeetingCost();
  meetingInterval = setInterval(meetingTick, 1000);

  btnMeetingStart.textContent = 'End Meeting';
  btnMeetingStart.classList.remove('btn-primary');
  btnMeetingStart.classList.add('btn-warning');
  btnMeetingReset.disabled = false;
  setMeetingInputsDisabled(false);
  saveMeetingState();
});

btnMeetingReset.addEventListener('click', () => {
  clearInterval(meetingInterval);
  meetingInterval = null;
  meetingRunning = false;
  meetingPaused = false;
  meetingElapsed = 0;

  meetingTimerTimeEl.textContent = '0:00:00';
  meetingCostEl.textContent = '$0.00';

  btnMeetingStart.textContent = 'Start Meeting';
  btnMeetingStart.classList.remove('btn-warning');
  btnMeetingStart.classList.add('btn-primary');
  btnMeetingReset.disabled = true;
  setMeetingInputsDisabled(false);
  clearMeetingState();
});

// Restore meeting state on load
(function restoreMeeting() {
  const raw = localStorage.getItem('meetingState');
  if (!raw) return;

  try {
    const state = JSON.parse(raw);
    inputPeople.value = state.people || 2;
    inputRate.value = state.rate || 75;

    if (state.meetingRunning) {
      const elapsedSec = Math.round((Date.now() - state.savedAt) / 1000);
      meetingElapsed = state.meetingElapsed + elapsedSec;
      meetingTimerTimeEl.textContent = formatMeetingTime(meetingElapsed);
      updateMeetingCost();
      meetingRunning = true;
      meetingInterval = setInterval(meetingTick, 1000);

      btnMeetingStart.textContent = 'End Meeting';
      btnMeetingStart.classList.remove('btn-primary');
      btnMeetingStart.classList.add('btn-warning');
      btnMeetingReset.disabled = false;
    } else if (state.meetingPaused) {
      meetingElapsed = state.meetingElapsed;
      meetingTimerTimeEl.textContent = formatMeetingTime(meetingElapsed);
      updateMeetingCost();
      meetingPaused = true;

      btnMeetingStart.textContent = 'Resume';
      btnMeetingReset.disabled = false;
    }
  } catch (_) {
    localStorage.removeItem('meetingState');
  }
})();
