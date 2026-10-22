import { BrowserWindow } from 'electron';
import { LogEntry } from '../src/shared/types';
import { IPC_CHANNELS } from '../src/shared/ipc';
import { randomUUID } from 'crypto';

const logBuffer: LogEntry[] = [];
const maxLogs = 500;
let mainWindow: BrowserWindow | null = null;

export const attachLogWindow = (window: BrowserWindow) => {
  mainWindow = window;
};

export const getLogs = (): LogEntry[] => {
  return [...logBuffer];
};

const toLogData = (data?: unknown) => {
  if (!data) return undefined;
  if (data instanceof Error) {
    return { message: data.message, stack: data.stack };
  }
  return data;
};

export const log = (level: LogEntry['level'], message: string, data?: unknown) => {
  const entry: LogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    message,
    data: toLogData(data)
  };

  logBuffer.push(entry);
  if (logBuffer.length > maxLogs) {
    logBuffer.shift();
  }

  if (mainWindow) {
    mainWindow.webContents.send(IPC_CHANNELS.logsSubscribe, entry);
  }
};
