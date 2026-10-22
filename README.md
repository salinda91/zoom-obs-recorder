# MeetRecord Pro 🎥⚡

> **Intelligent Zoom Meeting Scheduler & Automated OBS Studio Recording Assistant**

[![Electron](https://img.shields.io/badge/Electron-29.x-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![OBS WebSocket](https://img.shields.io/badge/OBS_WebSocket-v5.0-302E31?logo=obs-studio&logoColor=white)](https://obsproject.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white)](https://github.com/WiseLibs/better-sqlite3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MeetRecord Pro** is a modern, cross-platform desktop application designed to eliminate manual meeting management. It automatically launches scheduled Zoom meetings, controls **OBS Studio** screen/audio recording via OBS WebSocket v5, tracks meeting lifecycles in real time, and automatically collects and organizes your recordings and Zoom shared files into clean, timestamped folders.

---

## 🌟 Key Features

- ⏰ **Automated Meeting Scheduler**: Schedule one-time or recurring meetings. The app automatically launches the Zoom desktop client via `zoommtg://` protocol at the exact scheduled time.
- 🎬 **Autonomous OBS Studio Recording**: Integrates with OBS Studio via OBS WebSocket v5. Automatically triggers high-definition screen/audio recording when meetings begin.
- 🧠 **Smart Process & Window Detection**: Monitors active Zoom processes and meeting windows on both **Windows** (PowerShell) and **macOS** (AppleScript). Debounced detection prevents premature stops.
- 🛑 **Automatic Meeting Teardown**: When the Zoom meeting ends, the app automatically stops the OBS recording, disconnects cleanly, and updates the meeting status.
- 📂 **Auto-Organized Meeting Archives**:
  - Automatically creates a dedicated folder for each meeting: `{BaseDir}/{YYYY-MM-DD}_{MeetingName}/`
  - Moves and verifies the finalized OBS recording file into `Recordings/`.
  - Automatically captures files downloaded or shared during the call into `Files/`.
  - Generates a detailed `metadata.json` audit log with exact start/stop timestamps, durations, and file lists.
- 📡 **System Health Diagnostics**: Real-time dashboard indicator that verifies:
  - OBS configuration status
  - OBS WebSocket port connectivity
  - Local Zoom client installation
- 📜 **Live Activity Streaming**: Integrated streaming console with color-coded logs for real-time monitoring and debugging.
- 💾 **Local & Private**: All configuration and meeting records are stored in a local SQLite database (`better-sqlite3`). No external cloud dependencies or third-party servers required.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Desktop Framework** | [Electron 29](https://www.electronjs.org/) (Secure Context Isolation, Preload IPC Bridge) |
| **Frontend UI** | [React 18](https://react.dev/), [Vite 5](https://vitejs.dev/), CSS3 with Modern Theme |
| **Languages** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Database** | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) with WAL journal mode |
| **OBS Integration** | [obs-websocket-js v5](https://github.com/obs-websocket-community-projects/obs-websocket-js) |
| **File Watching** | [Chokidar 3](https://github.com/paulmillr/chokidar) |
| **Date & Time Engine** | [Luxon](https://moment.github.io/luxon/) (Full IANA Timezone support) |
| **Packaging** | [electron-builder](https://www.electron.build/) (NSIS Windows, macOS DMG) |

---

## 📋 Prerequisites

Before installing, ensure your system has:

1. **Node.js**: v18.x or v20.x installed ([Download Node.js](https://nodejs.org/)).
2. **Zoom Desktop Client**: Installed and logged in ([Download Zoom](https://zoom.us/download)).
3. **OBS Studio**: Version 28.0 or newer (OBS 28+ includes built-in WebSocket v5) ([Download OBS Studio](https://obsproject.com/)).
4. **Build Tools** (for native SQLite module compilation):
   - **Windows**: Visual Studio C++ Build Tools (or `npm install --global windows-build-tools`).
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`).

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/meetrecord-pro.git
cd meetrecord-pro

# Install dependencies
npm install

# (Optional) Rebuild native SQLite module if needed
npm run rebuild:electron
```

### 2. Configure OBS Studio

1. Open **OBS Studio**.
2. Navigate to **Tools** ➔ **WebSocket Server Settings**.
3. Check **Enable WebSocket server**.
4. Set **Server Port** (default: `4455`).
5. Set a **Server Password** (or leave empty if running strictly on a protected localhost).
6. Recommended OBS Output Configuration:
   - Go to **Settings** ➔ **Output** ➔ **Recording**.
   - Set **Recording Path** to your preferred temporary recording directory.
   - Set **Recording Format** to `mkv` or `mp4`.
   - Configure your audio/video capture sources (e.g. Display Capture / Window Capture and Desktop Audio).
7. Click **Apply** and **OK**.

### 3. Configure Zoom Client

1. Open the **Zoom Desktop Client**.
2. Go to **Settings** (gear icon) ➔ **Chat** / **General**.
3. Under **Receive files** / **Download location**, select or verify your Zoom downloads directory.
   *(Note this path — you will add it to the app's settings so shared files are automatically synced!)*
4. Ensure your browser allows opening Zoom links directly in the desktop app.

> **macOS Note**: When launching on macOS, ensure you grant Zoom and the application permissions for **Accessibility** and **Screen Recording** under *System Settings ➔ Privacy & Security*.

### 4. Run MeetRecord Pro in Development

```bash
npm run dev
# or
npm start
```

This starts the Vite development server on `http://localhost:5173` and boots Electron with hot reloading enabled.

---

## ⚙️ In-App Setup

Once the app is running:

1. Click **Settings** in the navigation bar.
2. Fill in your environment parameters:
   - **OBS Host**: `127.0.0.1` (localhost)
   - **OBS Port**: `4455` (must match your OBS WebSocket port)
   - **OBS Password**: (your OBS WebSocket password, or empty if disabled)
   - **Default Recording Base Path**: Folder where meeting archives will be created (e.g., `C:\Recordings\Meetings` or `/Users/name/Recordings`).
   - **Zoom Downloads Path**: The directory where Zoom places incoming chat downloads.
   - **Timezone**: Your local timezone (e.g., `America/New_York`, `UTC`, `Asia/Kolkata`).
3. Click **Save Settings**.
4. Return to the **Dashboard** and check the **System Status** card:
   - ✓ `OBS configured`
   - ✓ `OBS WebSocket` (shows green signal when port 4455 is reachable)
   - ✓ `Zoom installed`

---

## 📅 Scheduling & Automating a Meeting

1. From the **Dashboard**, click **+ Add Meeting**.
2. Enter:
   - **Meeting Name** (e.g., `Sprint Planning`, `Client Presentation`)
   - **Zoom Link** (e.g., `https://zoom.us/j/1234567890?pwd=...`)
   - **Date & Start Time**
   - *(Optional)* Custom recording base path or custom Zoom downloads path override.
3. Click **Save Meeting**.
4. **What happens automatically**:
   - At the scheduled start time, MeetRecord Pro launches Zoom with your meeting link.
   - Connects to OBS Studio via WebSocket and fires `StartRecord`.
   - Starts a file watcher on your Zoom downloads folder.
   - Polls the Zoom process and window state.
   - Once you leave or the meeting ends, it issues `StopRecord` to OBS, awaits file finalization, relocates the video into the meeting folder, copies any files received during the session, and writes a `metadata.json` summary.

---

## 🗂️ Generated Output Structure

Each meeting automatically creates an organized, self-contained workspace:

```text
📁 Your-Recording-Base-Path/
 └── 📁 2026-10-22_Sprint_Planning/
      ├── 📁 Recordings/
      │    └── 2026-10-22_Sprint_Planning_REC.mp4
      ├── 📁 Files/
      │    ├── slides_deck.pdf
      │    └── notes_export.docx
      └── 📄 metadata.json
```

### Example `metadata.json`

```json
{
  "meetingId": 1,
  "meetingName": "Sprint Planning",
  "zoomLink": "https://zoom.us/j/123456789",
  "scheduledStartUtc": "2026-10-22T14:00:00.000Z",
  "actualStartUtc": "2026-10-22T14:00:02.120Z",
  "actualStopUtc": "2026-10-22T14:45:15.890Z",
  "durationSeconds": 2713,
  "recordingPath": "/Recordings/2026-10-22_Sprint_Planning_REC.mp4",
  "copiedFiles": [
    "slides_deck.pdf",
    "notes_export.docx"
  ],
  "state": "completed"
}
```

---

## 📦 Building Production Installers

To compile and package the desktop app for distribution:

```bash
# Production package build (Vite build + TypeScript compilation + Electron Builder)
npm run build
```

The output installers will be generated in the `dist/` directory:
- **Windows**: `dist/MeetRecord Pro Setup <version>.exe` (NSIS Installer)
- **macOS**: `dist/MeetRecord Pro-<version>.dmg`

---

## 📂 Project Structure

```text
zoom-automation/
├── docs/                       # Supplemental setup and configuration guides
│   └── zoom-obs-configuration.md
├── electron/                   # Electron Main Process (Node.js runtime)
│   ├── db.ts                   # SQLite schema, migrations, and CRUD operations
│   ├── downloadsWatcher.ts     # Chokidar watcher for Zoom shared files
│   ├── logService.ts           # Log broadcasting and rotating logger
│   ├── main.ts                 # Electron application lifecycle & IPC handlers
│   ├── obsService.ts           # OBS Studio WebSocket client integration
│   ├── preload.ts              # Context bridge exposing secure window.api
│   ├── scheduler.ts            # Cron-like meeting executor & monitor
│   ├── zoomDetector.ts         # Abstract process/window detector
│   ├── zoomDetectorMac.ts      # AppleScript detector for macOS
│   └── zoomDetectorWindows.ts  # PowerShell detector for Windows
├── src/                        # Renderer Process (React UI)
│   ├── components/             # Reusable UI widgets
│   │   ├── LogPanel.tsx        # Real-time streaming log component
│   │   ├── MeetingList.tsx     # Meeting card lists & action buttons
│   │   ├── Navbar.tsx          # Top navigation bar
│   │   └── SystemStatusCard.tsx# OBS/Zoom connection health indicator
│   ├── pages/                  # Page views
│   │   ├── Dashboard.tsx       # Main monitoring dashboard
│   │   ├── MeetingForm.tsx     # Schedule & edit meeting dialogs
│   │   └── Settings.tsx        # System configuration page
│   ├── shared/                 # Shared types, IPC channel contracts, utilities
│   │   ├── ipc.ts
│   │   ├── shortname.ts
│   │   ├── time.ts
│   │   └── types.ts
│   ├── App.tsx                 # Root UI controller
│   ├── main.tsx                # React DOM mount point
│   └── styles.css              # Custom responsive stylesheet
├── index.html                  # HTML entry point
├── package.json                # Project dependencies & build scripts
├── tsconfig.json               # TypeScript config for React renderer
├── tsconfig.main.json          # TypeScript config for Electron main process
└── vite.config.ts              # Vite configuration
```

---

## 🔧 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs Vite dev server and launches Electron with live reload |
| `npm run electron:dev` | Runs Electron with verbose logging and stack dumping enabled |
| `npm run rebuild:electron` | Rebuilds native `better-sqlite3` bindings against local Electron version |
| `npm run build` | Compiles Vite UI, compiles Electron TS, and packages binaries with electron-builder |
| `npm run lint` | Runs ESLint across TypeScript and TSX files |

---

## 🛠️ Troubleshooting

### 1. `OBS WebSocket connection refused / not open`
- Ensure OBS Studio is open and running on the same computer (or update `obsHost` in Settings to the remote IP).
- Check **Tools ➔ WebSocket Server Settings** in OBS: ensure the server is enabled and the port matches `obsPort` (default `4455`).
- If you set a password in OBS, verify that it is entered accurately in the app Settings.

### 2. `better-sqlite3` Native Module Mismatch Error
If you upgrade Node or Electron and encounter `NODE_MODULE_VERSION` errors:
```bash
npm run rebuild:electron
```

### 3. Zoom meeting does not automatically stop recording
- Verify that Zoom has fully closed the active meeting window.
- The app checks for active Zoom windows with a grace period debounce to avoid stopping on brief network reconnects or minimized windows.

### 4. macOS System Audio is not captured by OBS
macOS does not route desktop audio to recording applications by default. To capture meeting audio in OBS on macOS:
- Install a free virtual audio driver such as [BlackHole](https://github.com/ExistentialAudio/BlackHole).
- Add an **Audio Output Capture** source in your OBS Scene targeting the virtual device.

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
