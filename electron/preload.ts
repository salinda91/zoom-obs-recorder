import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../src/shared/ipc';
import { LogEntry, Meeting, MeetingUpdate, Settings } from '../src/shared/types';

console.log('[preload] loaded');

const api = {
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.settingsGet) as Promise<Settings>,
  saveSettings: (settings: Settings) => ipcRenderer.invoke(IPC_CHANNELS.settingsSave, settings),
  listMeetings: () => ipcRenderer.invoke(IPC_CHANNELS.meetingsList) as Promise<Meeting[]>,
  getMeeting: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.meetingGet, id) as Promise<Meeting | undefined>,
  upsertMeeting: (meeting: MeetingUpdate) => ipcRenderer.invoke(IPC_CHANNELS.meetingUpsert, meeting),
  deleteMeeting: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.meetingDelete, id),
  getLogs: () => ipcRenderer.invoke(IPC_CHANNELS.logsGet) as Promise<LogEntry[]>,
  onLog: (callback: (entry: LogEntry) => void) => {
    ipcRenderer.on(IPC_CHANNELS.logsSubscribe, (_event, entry: LogEntry) => callback(entry));
  },
  openFolderDialog: () => ipcRenderer.invoke(IPC_CHANNELS.dialogOpenFolder) as Promise<string | null>,
  getSystemStatus: () => ipcRenderer.invoke(IPC_CHANNELS.systemStatus)
};

try {
  contextBridge.exposeInMainWorld('api', api);
  contextBridge.exposeInMainWorld('electronEnv', {
    isElectron: true,
    platform: process.platform
  });
  console.log('[preload] api exposed');
} catch (error) {
  console.error('[preload] failed to expose api', error);
}

export type ApiType = typeof api;
