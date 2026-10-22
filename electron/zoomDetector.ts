export type ZoomStatus = {
  hasProcess: boolean;
  hasMeetingWindow: boolean;
  meetingEnded: boolean;
};

export interface ZoomDetector {
  checkStatus(): Promise<ZoomStatus>;
}
