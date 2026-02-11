A clock app with a separate timer that is resettable. Please write all the things I would need:

## Project Structure
- index.html        — Main HTML page with clock and timer UI
- styles.css        — Styling for the clock, timer, and layout
- app.js            — JavaScript logic for the clock and timer

## Clock Features
- Display current time (hours, minutes, seconds)
- 12-hour / 24-hour format toggle
- Update every second using setInterval
- Display current date (day of week, month, day, year)

## Timer Features
- Hours, minutes, seconds input fields
- Start button — begins countdown from the entered time
- Pause button — pauses the countdown, preserving remaining time
- Resume button — continues countdown from where it was paused
- Reset button — stops the countdown and clears back to 00:00:00
- Audio or visual alert when timer reaches 00:00:00

## UI / Layout
- Two distinct sections: Clock view and Timer view
- Tab or toggle to switch between Clock and Timer
- Responsive design for mobile and desktop
- Clean, readable font for time display (e.g., monospace or digital-style)

## State Management (in app.js)
- currentTime — updated each second for the clock display
- timerDuration — total seconds remaining on the timer
- timerInterval — reference to the setInterval running the countdown
- isRunning — boolean tracking whether the timer is active
- isPaused — boolean tracking whether the timer is paused

## Implementation Steps
1. Create HTML skeleton with clock container and timer container
2. Style the layout, buttons, and time displays in CSS
3. Implement real-time clock with setInterval updating the DOM every 1s
4. Implement timer countdown logic (start, pause, resume, reset)
5. Add input validation (no negative values, max 99:59:59)
6. Add completion alert (sound, flashing, or notification)
7. Test edge cases (reset while running, pause then reset, 00:00:00 start)
