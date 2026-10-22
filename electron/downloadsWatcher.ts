import chokidar, { FSWatcher } from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import { log } from './logService';

export const startDownloadsWatcher = (
  downloadsPath: string,
  targetPath: string,
  onFileCopied: (fileName: string) => void
): FSWatcher => {
  const watcher = chokidar.watch(downloadsPath, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 200
    }
  });

  watcher.on('add', async (filePath) => {
    try {
      const fileName = path.basename(filePath);
      if (isTempDownload(fileName)) {
        return;
      }
      const targetFile = path.join(targetPath, fileName);
      await fs.copyFile(filePath, targetFile);
      log('info', `Copied shared file: ${fileName}`);
      onFileCopied(fileName);
    } catch (error) {
      log('warn', 'Failed to copy shared file', error);
    }
  });

  return watcher;
};

const isTempDownload = (fileName: string) => {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.crdownload') || lower.endsWith('.tmp') || lower.endsWith('.part');
};
