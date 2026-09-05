# 🎌 AniKuro (アニクロ) - Anime & Manga Tracker + AI Oracle

[![License: MIT](https://img.shields.io/badge/License-MIT-sky.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Android](https://img.shields.io/badge/Android-APK_%26_AAB-34d399.svg)](https://developer.android.com/)
[![AniList API](https://img.shields.io/badge/AniList-GraphQL_v2-02a9ff.svg)](https://anilist.gitbook.io/)

**AniKuro** is a modern, high-performance anime and manga tracking application powered by real-time AniList GraphQL 2-way synchronization, an intelligent AI Oracle (*KuroSensei*), weekly airing calendars, detailed statistics, and native Android haptic feedback.

---

## ✨ Features

- ⚡ **Official AniList 2-Way Sync**: Instant OAuth implicit grant login with deep link support (`anikuro://auth`). Track episodes, read chapters, update scores, and custom lists in real-time.
- 🧙 **KuroSensei AI Oracle**: Personalized AI recommendation engine based on your personal AniList watching history and genre affinities.
- 📅 **Weekly Airing Calendar**: Interactive day-by-day anime release schedule countdown with notifications for newly aired episodes.
- 📊 **Rich User Statistics**: Comprehensive breakdown of hours watched, chapters read, score distributions, and favorite genres.
- 🎨 **Sleek Mobile UI**: Fluid 60/120 FPS spring physics modal sheets, dark glassmorphism styling, and custom animations.
- 📱 **Cross-Platform**:
  - **Android App**: Native Capacitor Android wrapper with background notifications, hardware acceleration, and edge-to-edge system bars.
  - **Web App**: Self-contained, single-file distribution that can run offline or be deployed to Vercel/Netlify in 1 click.

---

## 📁 Repository Structure

```
AniKuro/
├── AniKuro Web App/         # React 19 + TypeScript + Vite Web Source
│   ├── src/                 # Components, Hooks, Services, Types
│   ├── public/              # Static assets & redirects
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Vite bundler configuration
│
├── AniKuro Mobile App/      # Native Android Studio Capacitor Project
│   ├── app/                 # Main Android Application (Kotlin/Java, Manifest, Res)
│   ├── gradle/              # Gradle wrapper (8.13)
│   ├── build.gradle         # Root Gradle build script
│   └── variables.gradle     # SDK version definitions (SDK 36)
│
├── .gitignore               # Excludes build artifacts, node_modules, keys
├── LICENSE                  # MIT License
└── README.md                # Project documentation
```

---

## 🚀 Quick Start

### 🌐 Web App (Development & Build)

1. Navigate to the web app folder:
   ```bash
   cd "AniKuro Web App"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Build production single-file bundle:
   ```bash
   npm run build
   ```

---

### 📱 Mobile App (Android Studio)

1. Open **Android Studio**.
2. Select **Open** and choose the `AniKuro Mobile App` directory.
3. Allow Gradle to sync dependencies.
4. Run on your physical device or emulator via **Run (Shift+F10)**.
5. To assemble a debug APK:
   ```bash
   cd "AniKuro Mobile App"
   ./gradlew assembleDebug
   ```

---

## 🔑 AniList OAuth Configuration

AniKuro connects to AniList via official OAuth2 Implicit Grant:
- **Client Name**: `AniKuro`
- **Redirect URL**: `anikuro://auth`
- **Developer Settings**: [anilist.co/settings/developer](https://anilist.co/settings/developer)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
