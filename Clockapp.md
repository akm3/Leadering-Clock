# Leadering Clock

A meeting facilitation tool with a clock, item timer, and meeting cost calculator. All sections are displayed on a single page.

## Project Structure
- index.html        — Main HTML page with clock, timer, and meeting cost UI
- styles.css        — IntelliTect-branded styling (blue #1F70B9 theme)
- app.js            — JavaScript logic for clock, timer, and meeting cost calculator

## Clock Features
- Display current time in 24-hour format (HH:MM, no seconds)
- Date displayed above the time in short format (e.g., "Wed, Feb 11")
- Updates every second
- Hidden easter egg: hovering over "Leadering" in the title reveals a tooltip about the name's origin

## Item Timer Features
- Minutes-only input field (defaults to 5 minutes, max 999)
- Start / Pause / Reset controls
- +1 Min / -1 Min adjustment buttons (always enabled, work before and during countdown)
- Timer remembers the last-used duration and resets to that value
- Counts past zero into negative time with escalating warnings:
  - At 0:00 — display turns red, audio beep alert (3 tones)
  - At -5:00 — display starts flashing, "!!!" warning appears
  - At -10:00 — skull emoji (💀) appears next to the timer
- Full state persistence via localStorage (survives page refresh, accounts for elapsed time while page was closed)

## Meeting Cost Calculator
- Separate independent timer that counts up (HH:MM:SS)
- Inputs for number of people and average hourly rate ($/hr)
- Real-time cost calculation: people × rate × elapsed hours
- Cost and elapsed time displayed side-by-side with labels ("Total Cost" / "Meet Time")
- People and rate can be adjusted mid-meeting with live cost recalculation
- Start Meeting / End Meeting / Reset controls
- Full state persistence via localStorage

## UI / Layout
- Single-page layout with three sections: Clock, Item Timer, Meeting Cost
- Sections separated by horizontal dividers
- IntelliTect brand theme with blue accent bars and dot grid background
- DM Mono font for time/number displays, Inter for UI text
- Responsive design with mobile breakpoint at 500px
- Clean card-based container with subtle shadow

## State Management (in app.js)
- Clock: updates every second, no persistent state needed
- Item Timer: `timerDuration`, `timerInitialDuration`, `isRunning`, `isPaused`, `hasReachedZero` — all persisted to localStorage with wall-clock sync
- Meeting Cost: `meetingElapsed`, `meetingRunning`, `meetingPaused`, people count, hourly rate — all persisted to localStorage with wall-clock sync
