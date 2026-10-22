import path from 'path';
import fs from 'fs/promises';
import { shell } from 'electron';
import { DateTime } from 'luxon';
import { startDownloadsWatcher } from './downloadsWatcher';
import { connectObs, disconnectObs, getLastRecordingPath, startRecording, stopRecording } from './obsService';
import { log } from './logService';
import {
  getSettings,
  listMeetings,
  updateMeetingState
} from './db';
import { buildShortName } from '../src/shared/shortname';
import { Meeting } from '../src/shared/types';
import { ZoomDetector } from './zoomDetector';
import { WindowsZoomDetector } from './zoomDetectorWindows';
import { MacZoomDetector } from './zoomDetectorMac';

const CHECK_INTERVAL_MS = 30000;
const STOP_CHECK_MS = 10000;
const STOP_MISS_COUNT = 6;
const RECORDING_PATH_RETRIES = 12;
const RECORDING_PATH_DELAY_MS = 1000;
const FILE_STABLE_CHECKS = 5;
const FILE_STABLE_DELAY_MS = 1000;

type RunningMeeting = {
  meeting: Meeting;
  stopChecks: number;
  watcherStop?: () => Promise<void>;
  copiedFiles: string[];
  meetingFolder: string;
  recordingFolder: string;
  filesFolder: string;
};

export class SchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private running = new Map<number, RunningMeeting>();
  private zoomDetector: ZoomDetector;

  constructor() {
    this.zoomDetector = process.platform === 'darwin' ? new MacZoomDetector() : new WindowsZoomDetector();
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), CHECK_INTERVAL_MS);
    void this.tick();
    log('info', 'Scheduler started');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick() {
    const meetings = listMeetings();
    const nowUtc = DateTime.utc();

    for (const meeting of meetings) {
      if (meeting.state !== 'scheduled') continue;
      const meetingTime = DateTime.fromISO(meeting.startUtc, { zone: 'utc' });
      if (meetingTime <= nowUtc) {
        void this.startMeeting(meeting);
      }
    }
  }

  private async startMeeting(meeting: Meeting) {
    if (this.running.has(meeting.id)) return;
    const settings = getSettings();
    const recordingBasePath = meeting.recordingBasePath || settings.defaultRecordingBasePath;
    const downloadsPath = meeting.zoomDownloadsPath || settings.zoomDownloadsPath;

    if (!recordingBasePath || !downloadsPath) {
      log('error', 'Missing recording or downloads path', { meetingId: meeting.id });
      updateMeetingState(meeting.id, 'failed', { lastError: 'Missing recording or downloads path' });
      return;
    }

    try {
      const meetingFolderInfo = await this.createMeetingFolders(recordingBasePath, meeting);

      const actualStartUtc = new Date().toISOString();
      updateMeetingState(meeting.id, 'running', { actualStartUtc });
      meeting.actualStartUtc = actualStartUtc;

      await shell.openExternal(toZoomMtgLink(meeting.zoomLink));
      await connectObs(settings);
      await startRecording();

      const watcher = startDownloadsWatcher(downloadsPath, meetingFolderInfo.filesFolder, (fileName) => {
        const runningMeeting = this.running.get(meeting.id);
        if (runningMeeting) {
          runningMeeting.copiedFiles.push(fileName);
        }
      });

      const running: RunningMeeting = {
        meeting,
        stopChecks: 0,
        watcherStop: async () => watcher.close(),
        copiedFiles: [],
        meetingFolder: meetingFolderInfo.meetingFolder,
        recordingFolder: meetingFolderInfo.recordingFolder,
        filesFolder: meetingFolderInfo.filesFolder
      };

      this.running.set(meeting.id, running);
      this.watchForStop(meeting.id);
      log('info', `Meeting started: ${meeting.meetingName}`);
    } catch (error) {
      log('error', 'Failed to start meeting', error);
      updateMeetingState(meeting.id, 'failed', { lastError: String(error) });
      await disconnectObs();
    }
  }

  private watchForStop(meetingId: number) {
    const interval = setInterval(async () => {
      const running = this.running.get(meetingId);
      if (!running) {
        clearInterval(interval);
        return;
      }

      // Require multiple consecutive misses to avoid transient window/process checks.
      const status = await this.zoomDetector.checkStatus();
      if (!status.hasProcess || status.meetingEnded || !status.hasMeetingWindow) {
        running.stopChecks += 1;
      } else {
        running.stopChecks = 0;
      }

      if (running.stopChecks >= STOP_MISS_COUNT) {
        clearInterval(interval);
        await this.stopMeeting(meetingId);
      }
    }, STOP_CHECK_MS);
  }

  private async stopMeeting(meetingId: number) {
    const running = this.running.get(meetingId);
    if (!running) return;

    try {
      let stopped = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await stopRecording();
          stopped = true;
          break;
        } catch (error) {
          log('warn', `Stop recording attempt ${attempt + 1} failed`, error);
          try {
            await connectObs(getSettings());
          } catch (connectError) {
            log('warn', 'OBS reconnect failed while stopping', connectError);
          }
        }
      }
      if (!stopped) {
        throw new Error('Unable to stop OBS recording');
      }
      const recordingPath = await this.waitForRecordingPath();
      log('info', `Recording path resolved`, { recordingPath });
      const finalRecording = await this.moveRecording(recordingPath, running);
      await this.writeMeta(running, finalRecording);

      updateMeetingState(meetingId, 'completed', {
        actualStopUtc: new Date().toISOString(),
        metaPath: path.join(running.meetingFolder, 'meta.json')
      });

      log('info', `Meeting completed: ${running.meeting.meetingName}`);
    } catch (error) {
      log('error', 'Failed to stop meeting', error);
      updateMeetingState(meetingId, 'failed', { lastError: String(error) });
    } finally {
      if (running.watcherStop) {
        await running.watcherStop();
      }
      this.running.delete(meetingId);
      await disconnectObs();
    }
  }

  private async createMeetingFolders(recordingBasePath: string, meeting: Meeting) {
    const dateFolder = DateTime.fromISO(meeting.startUtc, { zone: 'utc' }).toFormat('yyyy-LL-dd');
    const { shortName } = buildShortName(meeting.meetingName);
    const meetingFolder = path.join(recordingBasePath, dateFolder, shortName);
    const recordingFolder = path.join(meetingFolder, 'recording');
    const filesFolder = path.join(meetingFolder, 'files');

    await fs.mkdir(recordingFolder, { recursive: true });
    await fs.mkdir(filesFolder, { recursive: true });

    return { meetingFolder, recordingFolder, filesFolder, shortName, dateFolder };
  }

  private async moveRecording(recordingPath: string | null, running: RunningMeeting) {
    if (!recordingPath) {
      throw new Error('No recording path found from OBS');
    }

    const extension = path.extname(recordingPath) || '.mkv';
    const datePart = DateTime.fromISO(running.meeting.startUtc, { zone: 'utc' }).toFormat('yyyy-LL-dd');
    const timePart = DateTime.fromISO(running.meeting.startUtc, { zone: 'utc' }).toFormat('HHmm');
    const { shortName } = buildShortName(running.meeting.meetingName);
    const fileName = `${datePart}_${shortName}_${timePart}${extension}`;
    const targetPath = path.join(running.recordingFolder, fileName);

    await this.waitForFileStable(recordingPath);
    await this.moveWithRetries(recordingPath, targetPath);
    return targetPath;
  }

  private async writeMeta(running: RunningMeeting, recordingFile: string) {
    const meta = {
      meetingName: running.meeting.meetingName,
      zoomLink: running.meeting.zoomLink,
      timezone: running.meeting.timezone,
      startLocal: DateTime.fromISO(running.meeting.startUtc, { zone: 'utc' })
        .setZone(running.meeting.timezone)
        .toISO({ suppressSeconds: true, suppressMilliseconds: true }),
      startUtc: running.meeting.startUtc,
      actualStartUtc: running.meeting.actualStartUtc ?? new Date().toISOString(),
      actualStopUtc: new Date().toISOString(),
      recordingFile,
      copiedFiles: running.copiedFiles,
      errors: []
    };

    await fs.writeFile(path.join(running.meetingFolder, 'meta.json'), JSON.stringify(meta, null, 2));
  }

  private async waitForRecordingPath() {
    for (let attempt = 0; attempt < RECORDING_PATH_RETRIES; attempt += 1) {
      const path = await getLastRecordingPath();
      if (path) return path;
      await sleep(RECORDING_PATH_DELAY_MS);
    }
    return null;
  }

  private async waitForFileStable(filePath: string) {
    let lastSize = -1;
    for (let attempt = 0; attempt < FILE_STABLE_CHECKS; attempt += 1) {
      try {
        const stat = await fs.stat(filePath);
        if (stat.size > 0 && stat.size === lastSize) {
          return;
        }
        lastSize = stat.size;
      } catch {
        // Keep waiting if file isn't ready yet.
      }
      await sleep(FILE_STABLE_DELAY_MS);
    }
  }

  private async moveWithRetries(source: string, target: string) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        await fs.rename(source, target);
        return;
      } catch (error) {
        lastError = error;
        await sleep(750);
      }
    }

    try {
      await fs.copyFile(source, target);
      await fs.unlink(source);
      return;
    } catch (error) {
      lastError = error;
    }

    throw lastError ?? new Error('Failed to move recording file');
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toZoomMtgLink = (zoomLink: string): string => {
  try {
    const url = new URL(zoomLink);
    const isZoom = url.hostname.includes('zoom.us');
    if (!isZoom) return zoomLink;
    const pathParts = url.pathname.split('/').filter(Boolean);
    const meetingIdIndex = pathParts.findIndex((part) => part === 'j');
    if (meetingIdIndex === -1 || !pathParts[meetingIdIndex + 1]) {
      return zoomLink;
    }
    const meetingId = pathParts[meetingIdIndex + 1];
    const password = url.searchParams.get('pwd');
    const params = new URLSearchParams({ confno: meetingId });
    if (password) {
      params.set('pwd', password);
    }
    return `zoommtg://zoom.us/join?${params.toString()}`;
  } catch {
    return zoomLink;
  }
};
