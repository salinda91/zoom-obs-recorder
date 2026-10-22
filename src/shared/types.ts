export type MeetingState = 'scheduled' | 'running' | 'completed' | 'failed';

export type Settings = {
  obsHost: string;
  obsPort: number;
  obsPassword: string;
  defaultRecordingBasePath: string;
  zoomDownloadsPath: string;
  timezone: string;
};

export type Meeting = {
  id: number;
  meetingName: string;
  zoomLink: string;
  startUtc: string;
  timezone: string;
  recordingBasePath: string;
  zoomDownloadsPath: string;
  state: MeetingState;
  createdAt: string;
  updatedAt: string;
  actualStartUtc?: string | null;
  actualStopUtc?: string | null;
  lastError?: string | null;
  metaPath?: string | null;
};

export type MeetingInput = {
  meetingName: string;
  zoomLink: string;
  startLocal: string;
  timezone: string;
  recordingBasePath: string;
  zoomDownloadsPath: string;
};

export type MeetingUpdate = MeetingInput & { id?: number };

export type LogEntry = {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
};

export type SystemStatus = {
  obsConfigured: boolean;
  obsPortOpen: boolean;
  zoomInstalled: boolean;
  internetLatencyMs: number | null;
  internetSpeedMbps: number | null;
  signalLevel: 0 | 1 | 2 | 3 | 4;
  checkedAt: string;
};
