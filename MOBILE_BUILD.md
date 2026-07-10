# 📱 Android APK & AAB Production Build Guide

This project has been upgraded into a production-grade, hardware-accelerated **Capacitor Mobile Application** pointing to the production website [https://ssfmym.pro.bd](https://ssfmym.pro.bd). 

All native bridges, background components, secure connections, intent routers, and deep linking have been successfully configured.

---

## 📂 Project Folder Structure

The following directories and configuration assets have been added or updated:

```text
├── .github/
│   └── workflows/
│       └── android.yml            # Automated GitHub Actions APK & AAB compile pipeline
├── android/
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── AndroidManifest.xml   # Target permissions, secure TLS, and deep-linking schemas
│   │   │       └── java/
│   │   │           └── bd/
│   │   │               └── pro/
│   │   │                   └── ssfmym/
│   │   │                       └── MainActivity.java  # Native Google Auth override, Downloads, App Router & Offline Fallback
│   │   └── build.gradle           # Application specifications & dynamic google-services setup
│   ├── build.gradle               # Project build plugins
│   └── variables.gradle           # Latest Android SDK specifications (Target SDK 34, Min SDK 24)
├── capacitor.config.ts            # Capacitor core web navigation & assets bridge properties
├── package.json                   # Updated dependencies containing Capacitor core, CLI & Android platforms
└── MOBILE_BUILD.md                # This comprehensive documentation
```

---

## 🌟 Native Features Implemented

1. **Google Login Bypass (`MainActivity.java`)**:
   Standard WebViews blocking Google Auth with a `403 disallowed_useragent` error has been fixed. The native WebView automatically modifies its User-Agent headers to strip `Version/4.0` and `; wv`. Google recognizes the request as a standard Chrome mobile browser, enabling seamless OAuth redirections without complex native SDK integrations.

2. **Native Download Manager**:
   Registered a native `DownloadListener` to capture all downloads of PDFs, Images, ZIPs, and Office documents. It schedules downloads through the Android System `DownloadManager` with status bar progress indicators and handles cookie synchronization to ensure secure file routes can be downloaded. Files are saved directly to the Android `Downloads` folder.

3. **Bengla Offline Recovery Screen**:
   Intercepts DNS timeouts, connection drops, or internet outages and displays a beautiful native offline card in Bangla with an interactive reload/retry button.

4. **App Intent Router**:
   Intercepts external URL schemes and launches native application intents if they are installed on the user's phone, failing back gracefully to the browser:
   * **Phone / Call**: `tel:`
   * **Email**: `mailto:`
   * **SMS**: `sms:`
   * **WhatsApp**: `wa.me` & `whatsapp:`
   * **Telegram**: `t.me` & `tg:`
   * **Facebook & Messenger**: `facebook.com`, `m.me` & `fb:`
   * **Google Maps**: `maps.google.com` & `geo:`

5. **Deep Linking / Android App Links**:
   Configured dynamic intent filters in `AndroidManifest.xml` so that clicking a link like `https://ssfmym.pro.bd` inside WhatsApp or Gmail instantly redirects the user directly into the native Android app.

6. **Branding & Status Bar**:
   Enabled native hardware-accelerated rendering and matched the status bar color with the organization's crimson red branding (`#be123c`).

---

## 🚀 GitHub Actions CI/CD Pipeline

The `.github/workflows/android.yml` workflow compiles your Android app on every push to the `main` or `master` branches:

1. **Trigger**: Push/Pull Request to `main` / `master` or manually via **Workflow Dispatch**.
2. **Operations**:
   * Checks out code and installs dependencies.
   * Compiles the React/Vite assets.
   * Syncs files with Capacitor CLI.
   * Compiles a **Debug APK** (`app-debug.apk`).
   * Compiles an **unsigned Release APK** (`app-release-unsigned.apk`).
   * Compiles an **unsigned Release AAB** (`app-release-individual-unsigned.aab`).
3. **Output**: The files are uploaded as downloadable ZIP archives in your GitHub Actions run logs.

---

## 🛠️ How to Build Locally

If you want to build or run the application locally on your computer, follow these simple steps:

### Prerequisites:
* **Node.js** v18 or v20
* **Android Studio** (with Android SDK 34+)
* **Java JDK 17** (Ensure `JAVA_HOME` path variable is set)

### Steps:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the React web app**:
   ```bash
   npm run build
   ```

3. **Sync with Capacitor Android platform**:
   ```bash
   npx cap sync android
   ```

4. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```
   * *This will launch Android Studio pointing directly to the `/android` folder.*

5. **Run on Device / Emulator**:
   * Connect your physical Android phone (with **Developer Options** and **USB Debugging** enabled) or start an Emulator.
   * Press the **Run** button (Green Play Icon) in Android Studio to install the app.

---

## 🔑 How to Sign the App for Google Play Store

Before publishing your **Release APK** or **Release AAB** to the Google Play Store, they must be cryptographically signed.

### Step 1: Generate a Keystore File (If you don't have one)
Run the following command in your terminal:
```bash
keytool -genkey -v -keystore ssfmym-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias ssfmym-alias
```
*Keep this keystore file and its passwords extremely secure!*

### Step 2: Sign your App Bundle (AAB) or Release APK
You can use `apksigner` (for APKs) or `jarsigner` (for AABs), or simply sign it within **Android Studio**:
1. Open the project in Android Studio.
2. Go to **Build** > **Generate Signed Bundle / APK...**
3. Select **Android App Bundle (AAB)** or **APK** and click Next.
4. Locate your `ssfmym-release-key.jks` keystore, enter the credentials, select the release build variant, and click Finish.
5. Your signed production-ready files are generated inside `android/app/release/`.

---

## 🔔 Enabling Firebase Cloud Messaging (FCM)
If you decide to enable push notifications inside the Android application:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Add an **Android App** to your Firebase project with package name: `bd.pro.ssfmym`.
3. Download the `google-services.json` config file.
4. Paste the `google-services.json` file inside the `android/app/` directory.
5. Next time you build the application, Capacitor will automatically bundle Google Play Services for notifications!
