import React from 'react';
import { Meeting, LogEntry } from '../shared/types';
import MeetingList from '../components/MeetingList';
import LogPanel from '../components/LogPanel';
import SystemStatusCard from '../components/SystemStatusCard';
import { SystemStatus } from '../shared/types';

const Dashboard: React.FC<{
  meetings: Meeting[];
  timezone: string;
  onAddMeeting: () => void;
  onEditMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (id: number) => void;
  logs: LogEntry[];
  systemStatus: SystemStatus | null;
  onRefreshStatus: () => void;
}> = ({ meetings, timezone, onAddMeeting, onEditMeeting, onDeleteMeeting, logs, systemStatus, onRefreshStatus }) => {
  return (
    <div className="page">
      <SystemStatusCard status={systemStatus} onRefresh={onRefreshStatus} />
      <MeetingList
        meetings={meetings}
        timezone={timezone}
        onAdd={onAddMeeting}
        onEdit={onEditMeeting}
        onDelete={onDeleteMeeting}
      />
      <LogPanel logs={logs} />
    </div>
  );
};

export default Dashboard;
