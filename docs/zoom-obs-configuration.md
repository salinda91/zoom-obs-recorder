# Zoom and OBS Studio Configuration

This guide explains how to configure Zoom and OBS Studio so MeetRecord Pro can launch meetings, start/stop recordings, and copy shared files.

## Prerequisites
- Zoom desktop client installed and signed in.
- OBS Studio installed (OBS 28+ recommended because obs-websocket is built in).

## Configure Zoom
1) Install the Zoom desktop client if you do not already have it.
2) In Zoom, open Settings (gear icon).
3) Set the folder where Zoom saves files you receive during meetings.
   - Note the path and use it for "Zoom Downloads Path" in the app.
4) When you click a Zoom meeting link in a browser, allow it to open the Zoom app.

Notes:
- The app checks for the Zoom process and a visible meeting window to know when to stop recording.
- On macOS, grant Zoom and this app any required permissions (Accessibility and Screen Recording) in System Settings.

## Configure OBS Studio
1) Open OBS Studio.
2) Go to Tools -&gt; WebSocket Server Settings.
3) Enable the server.
4) Set the server port (default is 4455).
5) Set a password (optional but recommended).
6) Apply the settings.

Optional OBS recording setup:
- Set a local Recording Path in OBS (Settings -&gt; Output -&gt; Recording).
- Choose a recording format you want (e.g., MKV or MP4).

## Configure MeetRecord Pro (in the app)
Open Settings and set:
- OBS Host: use `127.0.0.1` if OBS runs on the same machine.
- OBS Port: match the OBS WebSocket port.
- OBS Password: match the OBS WebSocket password (or leave blank if none).
- Default Recording Base Path: where the app will create meeting folders.
- Zoom Downloads Path: the folder where Zoom saves files you receive during meetings.
- Timezone: your local timezone (e.g., `America/New_York`).

## Quick Validation
- Open the app and confirm the System Status shows:
  - OBS Configured: yes
  - OBS Port Open: yes
  - Zoom Installed: yes
- Schedule a test meeting and verify recording starts and stops.
