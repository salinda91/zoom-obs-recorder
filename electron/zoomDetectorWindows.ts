import { exec } from 'child_process';
import { ZoomDetector, ZoomStatus } from './zoomDetector';

const execAsync = (command: string) =>
  new Promise<string>((resolve, reject) => {
    exec(command, { windowsHide: true }, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.toString());
      }
    });
  });

export class WindowsZoomDetector implements ZoomDetector {
  async checkStatus(): Promise<ZoomStatus> {
    const taskList = await execAsync('tasklist');
    const hasProcess = taskList.toLowerCase().includes('zoom.exe');

    let hasMeetingWindow = false;
    let meetingEnded = false;
    let windowTitles: string[] = [];
    const isEndedTitle = (title: string) => {
      const lower = title.toLowerCase();
      return (
        lower.includes('meeting ended') ||
        lower.includes('meeting has ended') ||
        lower.includes('ended by host') ||
        lower.includes('this meeting has ended') ||
        lower.includes('meeting is over')
      );
    };
    try {
      const classOutput = await execAsync(
        'powershell -command "$sig=@\'using System;using System.Runtime.InteropServices;public class ZoomWin32{[DllImport(\\\"user32.dll\\\",SetLastError=true)]public static extern IntPtr FindWindow(string lpClassName,string lpWindowName);}\'@; Add-Type -TypeDefinition $sig -ErrorAction SilentlyContinue; $classes=@(\\\"ZPMeetingWndClass\\\",\\\"ZoomMeetingWndClass\\\"); foreach($c in $classes){ if([ZoomWin32]::FindWindow($c,$null) -ne [IntPtr]::Zero){ Write-Output \\\"true\\\"; exit } }; Write-Output \\\"false\\\";"'
      );
      if (classOutput.trim().toLowerCase() === 'true') {
        hasMeetingWindow = true;
      }
    } catch {
      hasMeetingWindow = false;
    }

    try {
      const windowOutput = await execAsync(
        'powershell -command "Get-Process Zoom | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -ExpandProperty MainWindowTitle"'
      );
      windowTitles = windowOutput
        .split(/\r?\n/)
        .map((title) => title.trim())
        .filter(Boolean);
    } catch {
      windowTitles = [];
    }

    const homeTitles = new Set(['zoom', 'zoom workplace', 'zoom meetings', 'zoom cloud meetings']);
    if (windowTitles.length > 0) {
      const hasActiveTitle = windowTitles.some((title) => {
        const lower = title.toLowerCase();
        if (homeTitles.has(lower)) return false;
        if (isEndedTitle(lower)) return false;
        return true;
      });
      const hasOnlyHomeOrEnded = windowTitles.every((title) => {
        const lower = title.toLowerCase();
        return homeTitles.has(lower) || isEndedTitle(lower);
      });

      if (hasActiveTitle) {
        hasMeetingWindow = true;
        meetingEnded = false;
      } else if (hasOnlyHomeOrEnded) {
        hasMeetingWindow = false;
        meetingEnded = true;
      }
    }

    return { hasProcess, hasMeetingWindow, meetingEnded };
  }
}
