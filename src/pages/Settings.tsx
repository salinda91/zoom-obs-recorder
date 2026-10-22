import React, { useState } from 'react';
import { Settings } from '../shared/types';

const SettingsPage: React.FC<{ settings: Settings; onSave: (settings: Settings) => void }> = ({ settings, onSave }) => {
  const [form, setForm] = useState<Settings>(settings);

  const handlePick = async (field: 'defaultRecordingBasePath' | 'zoomDownloadsPath') => {
    const path = await window.api.openFolderDialog();
    if (path) {
      setForm((prev) => ({ ...prev, [field]: path }));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <div className="page">
      <form className="card form" onSubmit={handleSubmit}>
        <h2>Settings</h2>
        <label>
          OBS Host
          <input value={form.obsHost} onChange={(e) => setForm({ ...form, obsHost: e.target.value })} required />
        </label>
        <label>
          OBS Port
          <input
            type="number"
            value={form.obsPort}
            onChange={(e) => setForm({ ...form, obsPort: Number(e.target.value) })}
            required
          />
        </label>
        <label>
          OBS Password
          <input
            type="password"
            value={form.obsPassword}
            onChange={(e) => setForm({ ...form, obsPassword: e.target.value })}
          />
        </label>
        <label>
          Default Recording Base Path
          <div className="row">
            <input
              value={form.defaultRecordingBasePath}
              onChange={(e) => setForm({ ...form, defaultRecordingBasePath: e.target.value })}
              required
            />
            <button type="button" onClick={() => handlePick('defaultRecordingBasePath')}>
              Browse
            </button>
          </div>
        </label>
        <label>
          Zoom Downloads Path
          <div className="row">
            <input
              value={form.zoomDownloadsPath}
              onChange={(e) => setForm({ ...form, zoomDownloadsPath: e.target.value })}
              required
            />
            <button type="button" onClick={() => handlePick('zoomDownloadsPath')}>
              Browse
            </button>
          </div>
        </label>
        <label>
          Timezone
          <input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} required />
        </label>
        <div className="form-actions">
          <button type="submit">Save Settings</button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
