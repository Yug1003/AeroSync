import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle Theme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        padding: '0.45rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-main)',
        fontSize: '0.8125rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {isDark ? (
        <>
          <Sun size={15} style={{ color: '#f59e0b' }} />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon size={15} style={{ color: '#6366f1' }} />
          <span>Dark</span>
        </>
      )}
    </button>
  );
}
