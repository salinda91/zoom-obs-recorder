import OBSWebSocket from 'obs-websocket-js';
import { Settings } from '../src/shared/types';
import { log } from './logService';

let obs: OBSWebSocket | null = null;
let lastRecordingPath: string | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectObs = async (settings: Settings) => {
  if (!obs) {
    obs = new OBSWebSocket();
  }

  let attempt = 0;
  const maxAttempts = 10;

  while (attempt < maxAttempts) {
    try {
      await obs.connect(`ws://${settings.obsHost}:${settings.obsPort}`, settings.obsPassword);
      obs.on('RecordStateChanged', (event) => {
        if (event.outputState === 'OBS_WEBSOCKET_OUTPUT_STOPPED' && event.outputPath) {
          lastRecordingPath = event.outputPath;
        }
      });
      log('info', 'Connected to OBS');
      return obs;
    } catch (error) {
      attempt += 1;
      // Exponential backoff with a reasonable cap keeps retries responsive.
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      log('warn', `OBS connect failed (attempt ${attempt})`, error);
      await sleep(delay);
    }
  }

  throw new Error('Unable to connect to OBS after multiple attempts');
};

export const startRecording = async () => {
  if (!obs) {
    throw new Error('OBS not connected');
  }

  await obs.call('StartRecord');
  log('info', 'OBS recording started');
};

export const stopRecording = async () => {
  if (!obs) {
    throw new Error('OBS not connected');
  }

  await obs.call('StopRecord');
  log('info', 'OBS recording stopped');
};

export const getLastRecordingPath = async () => {
  if (lastRecordingPath) return lastRecordingPath;
  if (!obs) return null;
  try {
    const status = await obs.call('GetRecordStatus');
    const typed = status as { outputPath?: string };
    return typed.outputPath ?? null;
  } catch (error) {
    log('warn', 'Unable to query OBS recording status', error);
    return null;
  }
};

export const disconnectObs = async () => {
  if (!obs) return;
  try {
    await obs.disconnect();
  } catch {
    // Ignore
  }
  obs = null;
};
