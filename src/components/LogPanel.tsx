import React from 'react';
import { LogEntry } from '../shared/types';

const LogPanel: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const recent = logs.slice(-50).reverse();
  const formatData = (data: LogEntry['data']) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };
  return (
    <section className="card">
      <div className="card-header">
        <h2>Run Log</h2>
      </div>
      <div className="log-list">
        {recent.length === 0 && <p>No logs yet.</p>}
        {recent.map((entry) => (
          <div key={entry.id} className={`log-item log-${entry.level}`}>
            <div className="log-meta">
              <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
              <span>{entry.level}</span>
            </div>
            <div className="log-message">{entry.message}</div>
            {entry.data && <pre className="log-data">{formatData(entry.data)}</pre>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default LogPanel;
