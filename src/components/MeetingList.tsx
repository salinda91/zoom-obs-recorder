import React from 'react';
import { Meeting } from '../shared/types';
import { formatLocal } from '../shared/time';

const MeetingList: React.FC<{
  meetings: Meeting[];
  timezone: string;
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}> = ({ meetings, timezone, onEdit, onDelete, onAdd }) => {
  return (
    <section className="card">
      <div className="card-header">
        <h2>Upcoming Meetings</h2>
        <button onClick={onAdd}>+ Add</button>
      </div>
      <div className="meeting-list">
        {meetings.length === 0 && <p>No meetings scheduled.</p>}
        {meetings.map((meeting) => (
          <div key={meeting.id} className={`meeting-item status-${meeting.state}`}>
            <div>
              <div className="meeting-title">{meeting.meetingName}</div>
              <div className="meeting-sub">
                {formatLocal(meeting.startUtc, timezone)} ? {meeting.timezone}
              </div>
            </div>
            <div className="meeting-actions">
              <span className="meeting-state">{meeting.state}</span>
              <button onClick={() => onEdit(meeting)}>Edit</button>
              <button className="danger" onClick={() => onDelete(meeting.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MeetingList;
