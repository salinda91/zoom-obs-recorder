import React, { useEffect, useMemo, useState } from 'react';
import { Meeting, MeetingUpdate, Settings, LogEntry } from './shared/types';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import MeetingForm from './pages/MeetingForm';
import SettingsPage from './pages/Settings';
import { SystemStatus } from './shared/types';

const App: React.FC = () => {
  const [page, setPage] = useState<'dashboard' | 'meeting' | 'settings'>('dashboard');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const loadMeetings = async () => {
    const data = await window.api.listMeetings();
    setMeetings(data);
  };

  const loadSettings = async () => {
    const data = await window.api.getSettings();
    setSettings(data);
  };

  const loadLogs = async () => {
    const data = await window.api.getLogs();
    setLogs(data);
  };

  const loadSystemStatus = async () => {
    const data = await window.api.getSystemStatus();
    setSystemStatus(data as SystemStatus);
  };

  useEffect(() => {
    if (!window.electronEnv?.isElectron || !window.api) {
      return;
    }
    void loadMeetings();
    void loadSettings();
    void loadLogs();
    void loadSystemStatus();
    const interval = setInterval(() => {
      void loadSystemStatus();
    }, 5000);
    window.api.onLog((entry) => {
      setLogs((prev) => [...prev, entry]);
    });
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleAddMeeting = () => {
    setEditingMeeting(null);
    setPage('meeting');
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setPage('meeting');
  };

  const handleDeleteMeeting = async (id: number) => {
    try {
      await window.api.deleteMeeting(id);
      await loadMeetings();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleSaveMeeting = async (meeting: MeetingUpdate) => {
    try {
      await window.api.upsertMeeting(meeting);
      await loadMeetings();
      setPage('dashboard');
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleSaveSettings = async (updated: Settings) => {
    try {
      await window.api.saveSettings(updated);
      await loadSettings();
      setPage('dashboard');
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  };

  const timezone = useMemo(() => settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, [settings]);

  console.log('[renderer] electronEnv', window.electronEnv);

  if (!window.electronEnv?.isElectron || !window.api) {
    return (
      <div className="app">
        <Navbar page={page} onNavigate={setPage} />
        <div className="error-banner">
          This UI must be opened inside the Electron app. Do not open `http://localhost:5173` in a browser.
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar page={page} onNavigate={setPage} onToggleTheme={toggleTheme} theme={theme} />
      {error && <div className="error-banner">{error}</div>}
      {page === 'dashboard' && (
        <Dashboard
          meetings={meetings}
          timezone={timezone}
          onAddMeeting={handleAddMeeting}
          onEditMeeting={handleEditMeeting}
          onDeleteMeeting={handleDeleteMeeting}
          logs={logs}
          systemStatus={systemStatus}
          onRefreshStatus={loadSystemStatus}
        />
      )}
      {page === 'meeting' && settings && (
        <MeetingForm
          settings={settings}
          timezone={timezone}
          meeting={editingMeeting}
          onCancel={() => setPage('dashboard')}
          onSave={handleSaveMeeting}
        />
      )}
      {page === 'settings' && settings && (
        <SettingsPage settings={settings} onSave={handleSaveSettings} />
      )}
    </div>
  );
};

export default App;
