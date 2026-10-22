import type { ApiType } from '../../electron/preload';

declare global {
  interface Window {
    api: ApiType;
    electronEnv?: {
      isElectron: boolean;
      platform: string;
    };
  }
}

export {};
