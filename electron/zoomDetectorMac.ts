import { exec } from 'child_process';
import { ZoomDetector, ZoomStatus } from './zoomDetector';

const execAsync = (command: string) =>
  new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.toString());
      }
    });
  });

export class MacZoomDetector implements ZoomDetector {
  async checkStatus(): Promise<ZoomStatus> {
    let hasProcess = false;
    let hasMeetingWindow = false;

    try {
      const psOutput = await execAsync("ps -ax | grep -i 'zoom.us' | grep -v grep");
      hasProcess = psOutput.trim().length > 0;
    } catch {
      hasProcess = false;
    }

    try {
      const windowOutput = await execAsync("osascript -e 'tell application \"System Events\" to tell process \"zoom.us\" to (count of windows) > 0'");
      hasMeetingWindow = windowOutput.toString().trim() === 'true';
    } catch {
      hasMeetingWindow = false;
    }

    return { hasProcess, hasMeetingWindow, meetingEnded: false };
  }
}
