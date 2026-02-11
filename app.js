// ── State ────────────────────────────────────────
let is24Hour = false;
let clockInterval = null;

let timerDuration = 0;   // seconds remaining
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
  };
  localStorage.setItem('timerState', JSON.stringify(state));
}

function clearTimerState() {
  localStorage.removeItem('timerState');
}

// ── DOM References ──────────────────────────────
const clockTimeEl  = document.getElementById('clock-time');
const clockAmpmEl  = document.getElementById('clock-ampm');
const clockDateEl  = document.getElementById('clock-date');
const formatToggle = document.getElementById('format-toggle');

const timerTimeEl   = document.getElementById('timer-time');
const timerDisplay  = document.getElementById('timer-display');
const inputHours    = document.getElementById('input-hours');
const inputMinutes  = document.getElementById('input-minutes');
const inputSeconds  = document.getElementById('input-seconds');
const btnStart      = document.getElementById('btn-start');
const btnPause      = document.getElementById('btn-pause');
const btnReset      = document.getElementById('btn-reset');
const btnPlus1      = document.getElementById('btn-plus1');
const btnMinus1     = document.getElementById('btn-minus1');

// ── Clock ───────────────────────────────────────
function updateClock() {
  const now = new Date();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  if (is24Hour) {
    clockTimeEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    clockAmpmEl.textContent = '';
  } else {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    clockTimeEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    clockAmpmEl.textContent = ampm;
  }

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  clockDateEl.textContent = now.toLocaleDateString('en-US', options);
}

formatToggle.addEventListener('click', () => {
  is24Hour = !is24Hour;
  formatToggle.textContent = is24Hour ? 'Switch to 12h' : 'Switch to 24h';
  updateClock();
});

// Start the clock immediately
updateClock();
clockInterval = setInterval(updateClock, 1000);

// ── Timer Helpers ───────────────────────────────
function formatTime(totalSeconds) {
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return totalSeconds < 0 ? `-${time}` : time;
}

function clamp(value, min, max) {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < min) return min;
  if (n > max) return max;
  return n;
}

function getInputDuration() {
  const h = clamp(inputHours.value, 0, 99);
  const m = clamp(inputMinutes.value, 0, 59);
  const s = clamp(inputSeconds.value, 0, 59);
  return h * 3600 + m * 60 + s;
}

function setInputsDisabled(disabled) {
  inputHours.disabled = disabled;
  inputMinutes.disabled = disabled;
  inputSeconds.disabled = disabled;
}

function stopFlash() {
  timerDisplay.classList.remove('flash');
  timerDisplay.classList.remove('negative');
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
}

// ── Timer Controls ──────────────────────────────
btnStart.addEventListener('click', () => {
  stopFlash();
  hasReachedZero = false;

  if (isPaused) {
    // Resume
    isPaused = false;
    isRunning = true;
    timerInterval = setInterval(tick, 1000);
    btnStart.textContent = 'Start';
    btnStart.disabled = true;
    btnPause.disabled = false;
    btnPause.textContent = 'Pause';
    saveTimerState();
    return;
  }

  const duration = getInputDuration();
  if (duration <= 0) return; // nothing to count down

  timerDuration = duration;
  timerTimeEl.textContent = formatTime(timerDuration);
  isRunning = true;
  isPaused = false;

  timerInterval = setInterval(tick, 1000);

  btnStart.disabled = true;
  btnPause.disabled = false;
  btnReset.disabled = false;
  btnPlus1.disabled = false;
  btnMinus1.disabled = false;
  setInputsDisabled(true);
  saveTimerState();
});

btnPause.addEventListener('click', () => {
  if (!isRunning) return;

  if (!isPaused) {
    // Pause
    clearInterval(timerInterval);
    timerInterval = null;
    isPaused = true;
    isRunning = false;
    btnPause.textContent = 'Pause';
    btnStart.textContent = 'Resume';
    btnStart.disabled = false;
    saveTimerState();
  }
});

btnReset.addEventListener('click', () => {
  stopFlash();
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isPaused = false;
  hasReachedZero = false;
  timerDuration = 0;

  timerTimeEl.textContent = '00:00:00';
  inputHours.value = 0;
  inputMinutes.value = 0;
  inputSeconds.value = 0;

  btnStart.textContent = 'Start';
  btnStart.disabled = false;
  btnPause.disabled = true;
  btnPause.textContent = 'Pause';
  btnReset.disabled = true;
  btnPlus1.disabled = true;
  btnMinus1.disabled = true;
  setInputsDisabled(false);
  clearTimerState();
});

// ── +/- 1 Minute Controls ───────────────────────
btnPlus1.addEventListener('click', () => {
  timerDuration += 60;
  timerTimeEl.textContent = formatTime(timerDuration);
  saveTimerState();
  // If adding time brings us back above zero, remove negative styling
  if (timerDuration >= 0 && hasReachedZero) {
    hasReachedZero = false;
    timerDisplay.classList.remove('negative');
  }
});

btnMinus1.addEventListener('click', () => {
  timerDuration -= 60;
  timerTimeEl.textContent = formatTime(timerDuration);
  saveTimerState();
  // If subtracting pushes below zero, apply negative styling
  if (timerDuration < 0 && !hasReachedZero) {
    hasReachedZero = true;
    timerDisplay.classList.add('negative');
  }
});

// ── Input Validation ────────────────────────────
[inputHours, inputMinutes, inputSeconds].forEach(input => {
  input.addEventListener('change', () => {
    const max = input === inputHours ? 99 : 59;
    input.value = clamp(input.value, 0, max);
  });
});

// ── Restore Timer on Page Load ──────────────────
(function restoreTimer() {
  const raw = localStorage.getItem('timerState');
  if (!raw) return;

  try {
    const state = JSON.parse(raw);
    hasReachedZero = state.hasReachedZero || false;

    if (state.isRunning) {
      // Timer was actively running — account for elapsed time since save
      const elapsedSec = Math.round((Date.now() - state.savedAt) / 1000);
      timerDuration = state.timerDuration - elapsedSec;
      timerTimeEl.textContent = formatTime(timerDuration);
      isRunning = true;
      isPaused = false;
      timerInterval = setInterval(tick, 1000);

      btnStart.disabled = true;
      btnPause.disabled = false;
      btnReset.disabled = false;
      btnPlus1.disabled = false;
      btnMinus1.disabled = false;
      setInputsDisabled(true);

      // Check if timer crossed zero while page was closed
      if (timerDuration <= 0 && !hasReachedZero) {
        hasReachedZero = true;
        timerDisplay.classList.add('negative');
      } else if (hasReachedZero) {
        timerDisplay.classList.add('negative');
      }
    } else if (state.isPaused) {
      // Timer was paused — restore exact duration
      timerDuration = state.timerDuration;
      timerTimeEl.textContent = formatTime(timerDuration);
      isRunning = false;
      isPaused = true;

      btnStart.textContent = 'Resume';
      btnStart.disabled = false;
      btnPause.disabled = true;
      btnReset.disabled = false;
      btnPlus1.disabled = false;
      btnMinus1.disabled = false;
      setInputsDisabled(true);

      if (hasReachedZero) {
        timerDisplay.classList.add('negative');
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
const btnMeetingPause    = document.getElementById('btn-meeting-pause');
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
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
  if (meetingPaused) {
    // Resume
    meetingPaused = false;
    meetingRunning = true;
    meetingInterval = setInterval(meetingTick, 1000);
    btnMeetingStart.textContent = 'Start Meeting';
    btnMeetingStart.disabled = true;
    btnMeetingPause.disabled = false;
    btnMeetingPause.textContent = 'Pause';
    saveMeetingState();
    return;
  }

  meetingElapsed = 0;
  meetingRunning = true;
  meetingPaused = false;
  meetingTimerTimeEl.textContent = formatMeetingTime(0);
  updateMeetingCost();
  meetingInterval = setInterval(meetingTick, 1000);

  btnMeetingStart.disabled = true;
  btnMeetingPause.disabled = false;
  btnMeetingReset.disabled = false;
  setMeetingInputsDisabled(false); // allow changing people/rate mid-meeting
  saveMeetingState();
});

btnMeetingPause.addEventListener('click', () => {
  if (!meetingRunning) return;
  clearInterval(meetingInterval);
  meetingInterval = null;
  meetingPaused = true;
  meetingRunning = false;
  btnMeetingPause.textContent = 'Pause';
  btnMeetingStart.textContent = 'Resume';
  btnMeetingStart.disabled = false;
  saveMeetingState();
});

btnMeetingReset.addEventListener('click', () => {
  clearInterval(meetingInterval);
  meetingInterval = null;
  meetingRunning = false;
  meetingPaused = false;
  meetingElapsed = 0;

  meetingTimerTimeEl.textContent = '00:00:00';
  meetingCostEl.textContent = '$0.00';

  btnMeetingStart.textContent = 'Start Meeting';
  btnMeetingStart.disabled = false;
  btnMeetingPause.disabled = true;
  btnMeetingPause.textContent = 'Pause';
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

      btnMeetingStart.disabled = true;
      btnMeetingPause.disabled = false;
      btnMeetingReset.disabled = false;
    } else if (state.meetingPaused) {
      meetingElapsed = state.meetingElapsed;
      meetingTimerTimeEl.textContent = formatMeetingTime(meetingElapsed);
      updateMeetingCost();
      meetingPaused = true;

      btnMeetingStart.textContent = 'Resume';
      btnMeetingStart.disabled = false;
      btnMeetingPause.disabled = true;
      btnMeetingReset.disabled = false;
    }
  } catch (_) {
    localStorage.removeItem('meetingState');
  }
})();
