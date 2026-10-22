import { app, BrowserWindow, ipcMain, dialog, session } from 'electron';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { initDb, getSettings, saveSettings, listMeetings, getMeeting, upsertMeeting, deleteMeeting } from './db';
import { IPC_CHANNELS } from '../src/shared/ipc';
import { MeetingUpdate, Settings, SystemStatus } from '../src/shared/types';
import { SchedulerService } from './scheduler';
import { attachLogWindow, getLogs, log } from './logService';
import { toUtcIsoFromLocal } from '../src/shared/time';

let mainWindow: BrowserWindow | null = null;
const scheduler = new SchedulerService();

const resolveRendererHtml = () => {
  const candidates = [
    path.join(__dirname, '../../dist/index.html'),
    path.join(__dirname, '../dist/index.html'),
    path.join(process.cwd(), 'dist/index.html'),
    path.join(process.cwd(), 'dist-electron/renderer/index.html'),
    path.join(process.cwd(), 'dist/renderer/index.html')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

const configureCsp = () => {
  const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
  const scriptSrc = isDev ? "'self' 'unsafe-eval' 'unsafe-inline'" : "'self'";
  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self' ws: http: https:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'"
  ].join('; ');

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders ?? {};
    responseHeaders['Content-Security-Policy'] = [csp];
    callback({ responseHeaders });
  });

  console.log('[main] CSP configured', { isDev });
};

const createWindow = () => {
  console.log('[main] createWindow called');
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('[main] preload path:', preloadPath, 'exists:', fs.existsSync(preloadPath));
  if (!fs.existsSync(preloadPath)) {
    throw new Error(`Preload not found at ${preloadPath}`);
  }
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  attachLogWindow(mainWindow);

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl && devUrl.trim().length > 0) {
    console.log(`[main] loading dev URL: ${devUrl}`);
    mainWindow.loadURL(devUrl).catch((error) => {
      console.error('[main] loadURL failed', error);
    });
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const htmlPath = resolveRendererHtml();
    console.log('[main] resolved renderer path:', htmlPath);
    if (!htmlPath) {
      console.error('[main] renderer index.html not found. Build the renderer first.');
    } else {
      mainWindow.loadFile(htmlPath).catch((error) => {
        console.error('[main] loadFile failed', error);
      });
    }
  }

  mainWindow.webContents.on('did-fail-load', (_event, code, desc, url) => {
    console.error('[main] did-fail-load', { code, desc, url });
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('[main] dom-ready');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const registerIpc = () => {
  ipcMain.handle(IPC_CHANNELS.settingsGet, () => getSettings());

  ipcMain.handle(IPC_CHANNELS.settingsSave, (_event, settings: Settings) => {
    if (!fs.existsSync(settings.defaultRecordingBasePath) || !fs.existsSync(settings.zoomDownloadsPath)) {
      throw new Error('Invalid folder path. Please choose existing folders.');
    }
    saveSettings(settings);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.meetingsList, () => listMeetings());

  ipcMain.handle(IPC_CHANNELS.meetingGet, (_event, id: number) => getMeeting(id));

  ipcMain.handle(IPC_CHANNELS.meetingUpsert, (_event, meeting: MeetingUpdate) => {
    if (!fs.existsSync(meeting.recordingBasePath) || !fs.existsSync(meeting.zoomDownloadsPath)) {
      throw new Error('Invalid folder path. Please choose existing folders.');
    }
    const startUtc = toUtcIsoFromLocal(meeting.startLocal, meeting.timezone);
    const id = upsertMeeting({
      id: meeting.id,
      meetingName: meeting.meetingName,
      zoomLink: meeting.zoomLink,
      startUtc,
      timezone: meeting.timezone,
      recordingBasePath: meeting.recordingBasePath,
      zoomDownloadsPath: meeting.zoomDownloadsPath
    });

    return id;
  });

  ipcMain.handle(IPC_CHANNELS.meetingDelete, (_event, id: number) => {
    deleteMeeting(id);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.logsGet, () => getLogs());

  ipcMain.handle(IPC_CHANNELS.dialogOpenFolder, async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC_CHANNELS.systemStatus, async () => {
    return await getSystemStatus();
  });
};

app.whenReady().then(() => {
  console.log('[main] app.whenReady');
  configureCsp();
  initDb();
  createWindow();
  registerIpc();
  scheduler.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('[main] window-all-closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', () => {
  console.log('[main] app.ready');
});

app.on('activate', () => {
  console.log('[main] app.activate');
});

process.on('uncaughtException', (error) => {
  console.error('[main] uncaughtException', error);
  log('error', 'Uncaught exception', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[main] unhandledRejection', error);
  log('error', 'Unhandled promise rejection', error);
});

const getSystemStatus = async (): Promise<SystemStatus> => {
  const settings = getSettings();
  const obsConfigured = Boolean(settings.obsHost && settings.obsPort);
  const obsPortOpen = obsConfigured ? await canConnect(settings.obsHost, settings.obsPort, 2000) : false;
  const zoomInstalled = checkZoomInstalled();
  const { internetLatencyMs, internetSpeedMbps, signalLevel } = await checkInternet();

  return {
    obsConfigured,
    obsPortOpen,
    zoomInstalled,
    internetLatencyMs,
    internetSpeedMbps,
    signalLevel,
    checkedAt: new Date().toISOString()
  };
};

const canConnect = (host: string, port: number, timeoutMs: number) =>
  new Promise<boolean>((resolve) => {
    const socket = net.connect(port, host);
    const onDone = (result: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };
    socket.once('connect', () => onDone(true));
    socket.once('error', () => onDone(false));
    socket.setTimeout(timeoutMs, () => onDone(false));
  });

const checkZoomInstalled = () => {
  if (process.platform === 'darwin') {
    return fs.existsSync('/Applications/zoom.us.app');
  }
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? '';
    const localAppData = process.env.LOCALAPPDATA ?? '';
    const programFiles = process.env['ProgramFiles'] ?? '';
    const programFilesx86 = process.env['ProgramFiles(x86)'] ?? '';
    const candidates = [
      path.join(appData, 'Zoom', 'bin', 'Zoom.exe'),
      path.join(localAppData, 'Zoom', 'bin', 'Zoom.exe'),
      path.join(programFiles, 'Zoom', 'bin', 'Zoom.exe'),
      path.join(programFilesx86, 'Zoom', 'bin', 'Zoom.exe')
    ];
    return candidates.some((candidate) => candidate && fs.existsSync(candidate));
  }
  return false;
};

const checkInternet = async (): Promise<{
  internetLatencyMs: number | null;
  internetSpeedMbps: number | null;
  signalLevel: SystemStatus['signalLevel'];
}> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const start = Date.now();
  try {
    const response = await fetch('https://www.google.com/generate_204', { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      return { internetLatencyMs: null, internetSpeedMbps: null, signalLevel: 0 };
    }
    const latency = Date.now() - start;
    const speedResult = await measureDownloadSpeed();
    const speedMbps = speedResult.speedMbps;
    const signalLevel = mapSignalLevel(latency, speedMbps);
    return { internetLatencyMs: latency, internetSpeedMbps: speedMbps, signalLevel };
  } catch {
    clearTimeout(timeout);
    return { internetLatencyMs: null, internetSpeedMbps: null, signalLevel: 0 };
  }
};

const measureDownloadSpeed = async (): Promise<{ speedMbps: number | null }> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  const start = Date.now();
  try {
    // Cloudflare speed test endpoint supports byte sizing.
    const bytes = 500000;
    const response = await fetch(`https://speed.cloudflare.com/__down?bytes=${bytes}`, {
      signal: controller.signal
    });
    const data = new Uint8Array(await response.arrayBuffer());
    clearTimeout(timeout);
    const durationMs = Math.max(Date.now() - start, 1);
    const bits = data.length * 8;
    const mbps = (bits / durationMs) / 1000;
    return { speedMbps: Math.round(mbps * 10) / 10 };
  } catch {
    clearTimeout(timeout);
    return { speedMbps: null };
  }
};

const mapSignalLevel = (latencyMs: number, speedMbps: number | null): SystemStatus['signalLevel'] => {
  if (speedMbps === null) return 1;
  if (speedMbps >= 20 && latencyMs < 100) return 4;
  if (speedMbps >= 10 && latencyMs < 150) return 3;
  if (speedMbps >= 5) return 2;
  return 1;
};
