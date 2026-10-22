import React, { useState } from 'react';
import { SystemStatus } from '../shared/types';

const SystemStatusCard: React.FC<{ status: SystemStatus | null; onRefresh: () => void }> = ({ status, onRefresh }) => {
  const [showGuide, setShowGuide] = useState(false);
  const renderIcon = (ok: boolean) => (
    <span className={`status-icon ${ok ? 'ok' : 'bad'}`}>{ok ? '✓' : '✕'}</span>
  );

  const renderSignalBars = (level: SystemStatus['signalLevel']) => {
    const labels = ['No signal', 'Weak', 'Average', 'Good', 'Full'];
    const label = labels[level] ?? 'Unknown';
    return (
      <div className="signal-wrap">
        <div className="signal-bars">
          {[0, 1, 2, 3].map((index) => {
            const active = level > index;
            return <span key={index} className={`signal-bar ${active ? `level-${level}` : 'inactive'}`} />;
          })}
        </div>
        <div className={`signal-label level-${level}`}>{label}</div>
      </div>
    );
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2>System Status</h2>
        <div className="status-actions">
          <button className="ghost" onClick={() => setShowGuide(true)}>
            Video guide
          </button>
          <button onClick={onRefresh}>Refresh</button>
        </div>
      </div>
      {!status && <p>Loading status...</p>}
      {status && (
        <div className="status-chips">
          <div className="status-chip">
            <span>OBS configured</span>
            {renderIcon(status.obsConfigured)}
          </div>
          <div className="status-chip">
            <span>OBS WebSocket</span>
            {renderIcon(status.obsPortOpen)}
          </div>
          <div className="status-chip">
            <span>Zoom installed</span>
            {renderIcon(status.zoomInstalled)}
          </div>
          <div className="status-chip status-chip-wide">
            <span>Internet</span>
            <div className="internet-info">
              {renderSignalBars(status.signalLevel)}
              <div className="internet-meta">
                <div>{status.internetLatencyMs !== null ? `${status.internetLatencyMs} ms` : 'Offline'}</div>
                <div>{status.internetSpeedMbps !== null ? `${status.internetSpeedMbps} Mbps` : '-- Mbps'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showGuide && (
        <div className="modal-backdrop" onClick={() => setShowGuide(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Zoom + OBS Setup Guide</h3>
              <button className="ghost" onClick={() => setShowGuide(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <section className="guide-section">
                <h4>Configure Zoom</h4>
                <ol>
                  <li>Install the Zoom desktop client and sign in.</li>
                  <li>Open Zoom Settings (gear icon).</li>
                  <li>Set the folder where Zoom saves files you receive in meetings.</li>
                  <li>Use that same folder as the "Zoom Downloads Path" in the app.</li>
                </ol>
              </section>
              <section className="guide-section">
                <h4>Configure OBS Studio</h4>
                <ol>
                  <li>Open OBS Studio.</li>
                  <li>Go to Tools -- WebSocket Server Settings.</li>
                  <li>Enable the server and keep the port (default 4455).</li>
                  <li>Set a password (recommended) and save.</li>
                </ol>
              </section>
              <section className="guide-section">
                <h4>Configure MeetRecord Pro</h4>
                <ol>
                  <li>OBS Host: use 127.0.0.1 if OBS is on the same machine.</li>
                  <li>OBS Port/Password: match the WebSocket settings.</li>
                  <li>Default Recording Base Path: where meeting folders are created.</li>
                  <li>Zoom Downloads Path: match the folder from Zoom settings.</li>
                </ol>
              </section>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SystemStatusCard;
