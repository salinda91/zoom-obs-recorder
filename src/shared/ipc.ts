export const IPC_CHANNELS = {
  settingsGet: 'settings:get',
  settingsSave: 'settings:save',
  meetingsList: 'meetings:list',
  meetingGet: 'meetings:get',
  meetingUpsert: 'meetings:upsert',
  meetingDelete: 'meetings:delete',
  logsGet: 'logs:get',
  logsSubscribe: 'logs:subscribe',
  dialogOpenFolder: 'dialog:openFolder',
  systemStatus: 'system:status'
} as const;

export type IpcChannels = typeof IPC_CHANNELS;
