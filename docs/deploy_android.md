# Android Deployment & Google Play Guide

This guide details the steps to prepare, build, and upload **MapParser** to the Google Play Store using Capacitor.

## 1. Preparation & Assets

### Generate Icons and Splash Screens
If you haven't already, use the `@capacitor/assets` tool to generate all necessary Android resources from a single source icon and splash image in your `assets/` folder.
```bash
npx capacitor-assets generate --android
```

### Update Versioning
Before every release, update the version info in:
1.  **`package.json`**: Update the `"version": "x.x.x"`.
2.  **`android/app/build.gradle`**:
    *   `versionCode`: An integer that must increase with every upload (e.g., `1`, `2`, `3`).
    *   `versionName`: Your user-facing version string (e.g., `"1.0.1"`).

---

## 2. Syncing the Web Build
Every time you change the React code, you must sync it to the Android project.
```bash
npm run build
npx cap sync android
```

---

## 3. Configure Signing in Android Studio

1.  Open the project in Android Studio:
    ```bash
    npx cap open android
    ```
2.  **Generate an Upload Key** (if you don't have one):
    *   Go to **Build > Generate Signed Bundle / APK...**
    *   Select **Android App Bundle** > **Next**.
    *   Click **Create new...** under Key store path.
    *   Fill in the details and **SAVE your .jks file safely**. You cannot update your app if you lose this key.
3.  **Configure Build Variants**:
    *   Ensure the "Active Build Variant" is set to `release` in the Build Variants tab.

---

## 4. Generate the Signed App Bundle (.aab)

Google Play now requires the `.aab` format instead of `.apk`.

1.  In Android Studio: **Build > Generate Signed Bundle / APK...**
2.  Select **Android App Bundle** and your keystore.
3.  Select the **release** destination folder.
4.  Once finished, the `.aab` file will be in `android/app/release/app-release.aab`.

---

## 5. Google Play Console Setup

1.  **Developer Account**: Create an account at [play.google.com/console](https://play.google.com/console).
2.  **Create App**: Select "Create app", enter "MapParser", and choose "App" (not Game).
3.  **Store Listing Metadata**:
    *   **Short Description**: "Convert Google Maps routes to CSV and KML effortlessly."
    *   **Full Description**: (Use the description we generated earlier).
    *   **Graphics**: Upload your icons (512x512) and feature graphic (1024x500).
4.  **Privacy Policy**: Link to `https://mapparser.travel-tracker.org/privacy`.
5.  **Data Safety**: MapParser collects Email/Name for authentication. Disclose this in the "Data Safety" section.
6.  **Account Deletion**: Provide the link `https://mapparser.travel-tracker.org/delete-account`.

---

## 6. Upload and Release

1.  Navigate to **Production** (or **Internal Testing** for a trial run).
2.  Click **Create new release**.
3.  Upload your `app-release.aab` file.
4.  Type your "Release notes" (e.g., "Initial release of MapParser").
5.  Click **Save**, **Review**, and **Start rollout to Production**.

*Note: New accounts might require a 14-day testing period with 20 testers before Production access is granted.*
