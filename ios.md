# Leadering Clock — iOS App Store Deployment

## Overview

This document outlines all steps and development work required to fork the Leadering Clock web app and deploy it to the iOS App Store. The recommended approach is wrapping the existing HTML/CSS/JS in a native shell using **Capacitor** (by Ionic), which provides the smoothest web-to-native path.

---

## 1. Prerequisites

- [ ] macOS with Xcode installed (latest stable)
- [ ] Apple Developer Program membership ($99/year) — required for App Store distribution
- [ ] Node.js and npm installed
- [ ] CocoaPods installed (`sudo gem install cocoapods`)

---

## 2. Fork & Project Setup

- [ ] Create a fork of `akm3/Leadering-Clock` (e.g. `akm3/Leadering-Clock-iOS`)
- [ ] Clone the fork locally
- [ ] Initialize npm: `npm init -y`
- [ ] Install Capacitor:
  ```bash
  npm install @capacitor/core @capacitor/cli
  npx cap init "Leadering Clock" com.intellitect.leaderingclock --web-dir .
  ```
- [ ] Add the iOS platform:
  ```bash
  npm install @capacitor/ios
  npx cap add ios
  ```

---

## 3. Code Changes Required

### 3.1 Viewport & Safe Areas
- [ ] Update `index.html` viewport meta tag for iOS notch/Dynamic Island:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  ```
- [ ] Add CSS safe area padding:
  ```css
  body {
    padding: env(safe-area-inset-top) env(safe-area-inset-right)
             env(safe-area-inset-bottom) env(safe-area-inset-left);
  }
  ```

### 3.2 Status Bar
- [ ] Install the status bar plugin:
  ```bash
  npm install @capacitor/status-bar
  ```
- [ ] Configure status bar style in `capacitor.config.ts` or via JS:
  ```js
  import { StatusBar, Style } from '@capacitor/status-bar';
  StatusBar.setStyle({ style: Style.Light });
  ```

### 3.3 Prevent Sleep / Screen Dimming
- [ ] Install a keep-awake plugin (e.g. `capacitor-keep-awake` or use the `@capacitor-community/keep-awake` plugin) so the clock stays visible during meetings:
  ```bash
  npm install @capacitor-community/keep-awake
  ```
- [ ] Activate keep-awake when a timer or meeting is running; release when idle

### 3.4 Audio / Haptics
- [ ] The Web Audio API beep may be blocked on iOS without user interaction. Add `@capacitor/haptics` for tactile feedback:
  ```bash
  npm install @capacitor/haptics
  ```
- [ ] Consider using `@capacitor/local-notifications` for the timer-reached-zero alert so it works even when the app is backgrounded

### 3.5 Background Execution
- [ ] iOS aggressively suspends background apps. The timer will stop counting when the app is backgrounded. The existing `savedAt` / wall-clock reconciliation logic already handles this correctly on restore — verify it works on device.
- [ ] For meeting cost: same approach — reconcile elapsed time on `appStateChange` resume event:
  ```js
  import { App } from '@capacitor/app';
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) { /* reconcile timers */ }
  });
  ```

### 3.6 localStorage → Capacitor Preferences (Optional)
- [ ] `localStorage` works in Capacitor's WKWebView but for extra reliability consider migrating to `@capacitor/preferences` (native key-value store)

### 3.7 Splash Screen
- [ ] Install splash screen plugin:
  ```bash
  npm install @capacitor/splash-screen
  ```
- [ ] Configure auto-hide after app loads

---

## 4. App Assets

- [ ] **App Icon**: Create a 1024×1024 App Store icon (IntelliTect blue theme with clock motif)
  - Generate all required sizes using Xcode asset catalog or a tool like [appicon.co](https://appicon.co)
- [ ] **Splash/Launch Screen**: Design a simple launch storyboard (Xcode default or custom) with IntelliTect branding
- [ ] **Screenshots**: Capture 6.7" (iPhone 15 Pro Max), 6.1" (iPhone 15 Pro), and optionally iPad screenshots for App Store listing

---

## 5. Xcode Configuration

- [ ] Open the iOS project: `npx cap open ios`
- [ ] Set the **Bundle Identifier**: `com.intellitect.leaderingclock`
- [ ] Set **Display Name**: `Leadering Clock`
- [ ] Set **Deployment Target**: iOS 16.0 minimum (covers ~95% of active devices)
- [ ] Configure **Signing & Capabilities**:
  - Select the team (Apple Developer account)
  - Enable automatic signing
- [ ] Set device orientation to **Portrait only** (or allow all based on preference)
- [ ] Add the App Icon set to `Assets.xcassets`

---

## 6. Capacitor Configuration

Create/update `capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.intellitect.leaderingclock',
  appName: 'Leadering Clock',
  webDir: '.',
  server: {
    // No live-reload in production
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Leadering Clock',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1000,
      backgroundColor: '#F7F9FC',
    },
    StatusBar: {
      style: 'LIGHT',
    },
  },
};

export default config;
```

---

## 7. Build & Test

- [ ] Sync web assets to native project:
  ```bash
  npx cap sync ios
  ```
- [ ] Build and run on Simulator from Xcode
- [ ] Test on a physical device:
  - Clock updates correctly
  - Timer start/pause/reset works
  - Timer continues counting after backgrounding and returning
  - Meeting cost calculator works
  - Audio beep fires at zero
  - Collapsible sections work
  - localStorage persistence survives app restart
  - Safe area insets look correct on notched devices
- [ ] Test on multiple screen sizes (iPhone SE, iPhone 15, iPhone 15 Pro Max)

---

## 8. App Store Submission

### 8.1 App Store Connect Setup
- [ ] Log in to [App Store Connect](https://appstoreconnect.apple.com)
- [ ] Create a new app:
  - **Platform**: iOS
  - **Name**: Leadering Clock
  - **Bundle ID**: `com.intellitect.leaderingclock`
  - **SKU**: `leadering-clock-1`
  - **Primary Language**: English (U.S.)

### 8.2 App Store Listing
- [ ] Write app description
- [ ] Set category: **Utilities** or **Productivity**
- [ ] Add keywords: clock, timer, meeting cost, countdown
- [ ] Upload screenshots for required device sizes
- [ ] Set age rating (4+ — no objectionable content)
- [ ] Set pricing: **Free**
- [ ] Add privacy policy URL (required even for apps with no data collection — state "This app does not collect or transmit any personal data")

### 8.3 Archive & Upload
- [ ] In Xcode: **Product → Archive**
- [ ] In the Organizer: **Distribute App → App Store Connect**
- [ ] Upload and wait for processing

### 8.4 Review
- [ ] Submit for App Review
- [ ] Typical review time: 24–48 hours
- [ ] Address any rejection feedback if needed

---

## 9. CI/CD (Optional)

- [ ] Set up a separate GitHub Actions workflow for the iOS fork:
  - Use `macos-latest` runner
  - Install certificates/provisioning profiles via Fastlane Match or manual secrets
  - Build with `xcodebuild`
  - Upload to App Store Connect via Fastlane or `altool`

---

## 10. Estimated Effort

| Task | Estimate |
|------|----------|
| Fork & Capacitor setup | 1 hour |
| Code changes (safe areas, status bar, keep-awake, audio) | 2–3 hours |
| App icon & splash screen design | 1–2 hours |
| Xcode configuration & signing | 30 min |
| Device testing & bug fixes | 2–3 hours |
| App Store listing & screenshots | 1–2 hours |
| Submission & review cycle | 1–3 days |
| **Total dev work** | **~8–12 hours** |

---

## Notes

- The existing codebase's wall-clock reconciliation pattern (`savedAt` + elapsed calculation on restore) is already well-suited for iOS background suspension — minimal changes needed.
- No server/API dependencies means App Review should be straightforward.
- If a future version needs push notifications (e.g., timer alerts when backgrounded), add `@capacitor/push-notifications` and configure APNs certificates.
