import React from 'react';

const Navbar: React.FC<{
  page: 'dashboard' | 'meeting' | 'settings';
  onNavigate: (page: 'dashboard' | 'meeting' | 'settings') => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
}> = ({ page, onNavigate, onToggleTheme, theme }) => {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-title">MeetRecord Pro</div>
        <div className="brand-sub">Zoom scheduling + OBS automation</div>
      </div>
      <nav className="nav-actions">
        <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button className={page === 'dashboard' ? 'active' : ''} onClick={() => onNavigate('dashboard')}>
          Dashboard
        </button>
        <button className={page === 'meeting' ? 'active' : ''} onClick={() => onNavigate('meeting')}>
          Add Meeting
        </button>
        <button className={page === 'settings' ? 'active' : ''} onClick={() => onNavigate('settings')}>
          Settings
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
