import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Meeting, MeetingUpdate, Settings } from '../shared/types';
import { toLocalFromUtc } from '../shared/time';

const MeetingForm: React.FC<{
  settings: Settings;
  timezone: string;
  meeting: Meeting | null;
  onSave: (meeting: MeetingUpdate) => void;
  onCancel: () => void;
}> = ({ settings, timezone, meeting, onSave, onCancel }) => {
  const [meetingName, setMeetingName] = useState(meeting?.meetingName ?? '');
  const [zoomLink, setZoomLink] = useState(meeting?.zoomLink ?? '');
  const initialLocal = meeting
    ? toLocalFromUtc(meeting.startUtc, timezone)
    : DateTime.local().plus({ hours: 1 }).toISO({ suppressSeconds: true, suppressMilliseconds: true, includeOffset: false });
  const initialParts = splitLocalDateTime(initialLocal);
  const [startDate, setStartDate] = useState(initialParts.date);
  const [startTime, setStartTime] = useState(initialParts.time);
  const [recordingBasePath, setRecordingBasePath] = useState(meeting?.recordingBasePath ?? settings.defaultRecordingBasePath);
  const [zoomDownloadsPath, setZoomDownloadsPath] = useState(meeting?.zoomDownloadsPath ?? settings.zoomDownloadsPath);
  const [meetingTimezone, setMeetingTimezone] = useState(meeting?.timezone ?? timezone);

  useEffect(() => {
    if (meeting) {
      setMeetingName(meeting.meetingName);
      setZoomLink(meeting.zoomLink);
      const nextLocal = toLocalFromUtc(meeting.startUtc, meeting.timezone);
      const nextParts = splitLocalDateTime(nextLocal);
      setStartDate(nextParts.date);
      setStartTime(nextParts.time);
      setRecordingBasePath(meeting.recordingBasePath || settings.defaultRecordingBasePath);
      setZoomDownloadsPath(meeting.zoomDownloadsPath || settings.zoomDownloadsPath);
      setMeetingTimezone(meeting.timezone);
    }
  }, [meeting, settings, timezone]);

  const handlePickRecording = async () => {
    const path = await window.api.openFolderDialog();
    if (path) setRecordingBasePath(path);
  };

  const handlePickDownloads = async () => {
    const path = await window.api.openFolderDialog();
    if (path) setZoomDownloadsPath(path);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      id: meeting?.id,
      meetingName,
      zoomLink,
      startLocal: `${startDate}T${startTime}`,
      timezone: meetingTimezone,
      recordingBasePath,
      zoomDownloadsPath
    });
  };

  return (
    <div className="page">
      <form className="card form" onSubmit={handleSubmit}>
        <h2>{meeting ? 'Edit Meeting' : 'Add Meeting'}</h2>
        <label>
          Meeting Name
          <input value={meetingName} onChange={(e) => setMeetingName(e.target.value)} required />
        </label>
        <label>
          Zoom Link
          <input value={zoomLink} onChange={(e) => setZoomLink(e.target.value)} required />
        </label>
        <label>
          Start Date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
        <label>
          Start Time
          <input type="time" step={60} value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </label>
        <label>
          Timezone
          <input value={meetingTimezone} onChange={(e) => setMeetingTimezone(e.target.value)} required />
        </label>
        <label>
          Recording Base Path
          <div className="row">
            <input value={recordingBasePath} onChange={(e) => setRecordingBasePath(e.target.value)} required />
            <button type="button" onClick={handlePickRecording}>
              Browse
            </button>
          </div>
        </label>
        <label>
          Zoom Downloads Path
          <div className="row">
            <input value={zoomDownloadsPath} onChange={(e) => setZoomDownloadsPath(e.target.value)} required />
            <button type="button" onClick={handlePickDownloads}>
              Browse
            </button>
          </div>
        </label>
        <div className="form-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">Save Meeting</button>
        </div>
      </form>
    </div>
  );
};

export default MeetingForm;

const splitLocalDateTime = (localIso: string) => {
  const [date = '', time = ''] = localIso.split('T');
  return { date, time: time.slice(0, 5) };
};
