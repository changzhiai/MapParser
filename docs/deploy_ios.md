# iOS Development and Native Sync

This document covers the workflow for developing and testing the native iOS application using Capacitor.

## 1. Prerequisites

- **Xcode**: Installed on your Mac.
- **Node.js**: Installed locally.
- **Capacitor CLI**: Accessible via `npx cap`.

## 2. Syncing Changes

Whenever you modify any frontend code (React components, CSS, etc.) and want to see the changes in the iOS simulator or physical device, you **must** run the sync command:

```bash
# 1. Build the production web assets
npm run build

# 2. Copy assets to the ios folder and update native plugins
npx cap sync ios
```

## 3. Running in Xcode

After syncing, open the project in Xcode to run it:

```bash
npx cap open ios
```

Once Xcode opens:
1. Select your target device (iPhone Simulator or connected iPhone).
2. Press the **Play** button (Run).

## 4. Native App Specific Features

### Safe Area Insets
The app handles "Notches" and "Status Bars" using CSS environment variables. We use a special `.is-native-app` class applied to components when running on a native platform (detected via `Capacitor.isNativePlatform()`).

```css
/* Example index.css usage */
.is-native-app .map-controls {
    margin-top: calc(20px + env(safe-area-inset-top, 0px)) !important;
}
```

### Fullscreen Map Support
The Google Maps and OpenStreetMap views include custom fullscreen toggles. For Google Maps, the native fullscreen control is disabled in favor of our custom button to ensure safe area support in native apps.

### Native Social Login
Authentication on iOS uses native SDKs via `@capgo/capacitor-social-login`. This provides a smoother "one-tap" sign-in experience compared to web redirects.

## 5. Troubleshooting

- **White Screen**: Ensure `npm run build` was successful before running `npx cap sync`.
- **Plugin Not Found**: Run `npx cap update ios` to refresh the native dependencies.
- **Xcode Build Failure**: Try cleaning the build folder (**Shift + Cmd + K**) or deleting the `ios/App/App/public` folder and re-syncing.
