# Android Deployment Guide (Google Play Store)

This guide outlines the steps to take your **Hive Forecast** app from your local development environment to the Google Play Store using Android Studio.

## Prerequisites

1.  **Google Play Developer Account**: You need a developer account ($25 one-time fee) at [play.google.com/console](https://play.google.com/console).
2.  **Android Studio**: Installed and configured.
3.  **Java Development Kit (JDK)**: Usually bundled with Android Studio.

---

## Part 1: Prepare Your App for Release

Before building, ensure your app is ready and all web assets are up to date.

1.  **Update Version**:
    *   Open `android/app/build.gradle`.
    *   Update `versionCode` (integer, increment by 1 for every update).
    *   Update `versionName` (string, e.g., "1.0.0").

2.  **Build Web Assets**:
    Generate the latest static files from your Next.js project.
    ```bash
    npm run build
    ```

3.  **Sync to Android**:
    Copy the new web assets and plugins to the Android native project.
    ```bash
    npx cap sync
    ```

---

## Part 2: Build Signed App Bundle in Android Studio

Google Play requires an Android App Bundle (`.aab`) signed with a release key.

1.  **Open Android Studio**:
    ```bash
    npx cap open android
    ```
    Or manually open the `android` folder in Android Studio.

2.  **Generate Signed Bundle**:
    *   Go to **Build** > **Generate Signed Bundle / APK**.
    *   Select **Android App Bundle** and click **Next**.

3.  **Create a Keystore (First Time Only)**:
    *   *If you already have a keystore (`.jks` file), skip to step 4.*
    *   Click **Create new...** under "Key store path".
    *   **Path**: Save it somewhere safe (NOT inside your project folder if you plan to share the code publicly, or add it to `.gitignore`).
    *   **Password**: Set a strong password for the keystore.
    *   **Key Alias**: Name it (e.g., `key0` or `upload`).
    *   **Key Password**: Set a strong password for the key.
    *   **Validity**: Set to 25+ years.
    *   Fill in the Certificate details (Name, Org, etc.).
    *   Click **OK**.

4.  **Sign the Bundle**:
    *   Select your keystore path.
    *   Enter the keystore and key passwords.
    *   Select your key alias.
    *   Click **Next**.
    *   Select **release** build variant.
    *   Click **Create**.

5.  **Locate the File**:
    *   Once the build finishes, a popup will appear. Click **locate**.
    *   The file will be in `android/app/release/app-release.aab`.

---

## Part 3: Upload to Google Play Console

1.  **Create App**:
    *   Go to [Google Play Console](https://play.google.com/console).
    *   Click **Create app**.
    *   Enter App Name ("Hive Forecast"), Language, and App Type (App).
    *   Select "Free" or "Paid".
    *   Accept declarations and click **Create app**.

2.  **Set Up Store Listing**:
    *   **Dashboard**: Follow the "Set up your app" checklist.
    *   **Main Store Listing**: Upload your App Icon (512x512), Feature Graphic (1024x500), and Screenshots.
    *   **Data Safety**: Fill out the questionnaire (Hive Forecast collects minimal data, mostly local).

3.  **Create a Release**:
    *   Go to **Testing** > **Internal testing** (recommended for first run) or **Production**.
    *   Click **Create new release**.
    *   **App bundles**: Upload the `app-release.aab` file you generated in Part 2.
    *   **Release Name**: Enter a name (e.g., "1.0.0 Initial Release").
    *   **Release Notes**: Describe what's new.
    *   Click **Next** and review any warnings.
    *   Click **Save** and **Start rollout**.

## Important Notes

*   **Keystore Security**: **NEVER LOSE YOUR KEYSTORE OR FORGET THE PASSWORD.** You cannot update your app on the Play Store without it. Back it up in a secure location (Google Drive, 1Password, etc.).
*   **Review Time**: Google takes a few days to review new apps.
*   **Testing**: Use "Internal Testing" to test on your own device before releasing to the public. You can add your email to the tester list and download it via a special Play Store link.

## Troubleshooting & Common Issues

### 1. "File Inaccessible" or Lock Errors
**Issue**: You might see errors saying files are "locked" or "inaccessible" if both Antigravity (VS Code) and Android Studio are trying to write to the same files simultaneously.
**Solution**:
*   **Stop the Dev Server**: Ensure you aren't running `npm run dev` or other watch processes in Antigravity while building the release bundle.
*   **Sync First, Then Build**: Always run `npx cap sync` *before* switching focus to Android Studio. This ensures all files are copied over and ready.
*   **Invalidate Caches**: In Android Studio, go to **File > Invalidate Caches / Restart** if it refuses to see new files.

### 2. "Icon Not Found" or Resource Errors
**Issue**: Android Studio looks for resources in `android/app/src/main/res`, while your web icons are in `public/`.
**Solution**:
*   **Capacitor Sync**: The `npx cap sync` command is supposed to copy your web assets to the Android project.
*   **Manual Generation**: If icons are still missing or look wrong, you can use the `capacitor-assets` tool to generate native icons from your logo:
    ```bash
    npx @capacitor/assets generate --iconBackgroundColor #ffffff --iconPath public/logo.jpg
    ```
    (Note: You may need to install the package first: `npm install @capacitor/assets --save-dev`)

