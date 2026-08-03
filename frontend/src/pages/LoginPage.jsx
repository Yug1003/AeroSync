import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { Plane, Shield, User, Key, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('auth/login/', { username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('username', username);
      
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data) {
        setError(err.response.data.detail || 'Invalid username or password');
      } else {
        setError('Network error. Unable to connect to server.');
      }
    }
  };

  const fillDemoAccount = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="shadcn-login-wrapper">
      <div className="login-glow" />

      <div className="shadcn-login-card">
        <div className="brand-header">
          <div className="brand-icon-box">
            <Plane className="brand-plane-icon" size={24} />
          </div>
          <h1 className="brand-title">AeroSync</h1>
          <p className="brand-subtitle">Airport Ramp Operations & Gate Management Control</p>
        </div>

        {error && (
          <div className="login-error-alert">
            <span className="error-dot" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <User className="field-icon" size={16} />
              <input
                id="username"
                type="text"
                className="shadcn-input"
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <div className="field-header">
              <label htmlFor="password">Password</label>
            </div>
            <div className="input-with-icon">
              <Key className="field-icon" size={16} />
              <input
                id="password"
                type="password"
                className="shadcn-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="shadcn-btn-primary login-submit-btn" disabled={loading}>
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="demo-accounts-section">
          <div className="demo-header">
            <Lock size={12} />
            <span>Quick Select Demo Role</span>
          </div>
          <div className="demo-btn-group">
            <button
              type="button"
              className="demo-chip"
              onClick={() => fillDemoAccount('admin', 'admin123')}
            >
              <Shield size={12} className="text-violet" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              className="demo-chip"
              onClick={() => fillDemoAccount('ops', 'admin123')}
            >
              <Plane size={12} className="text-cyan" />
              <span>Ops Manager</span>
            </button>
            <button
              type="button"
              className="demo-chip"
              onClick={() => fillDemoAccount('crew', 'admin123')}
            >
              <CheckCircle2 size={12} className="text-emerald" />
              <span>Ground Crew</span>
            </button>
          </div>
        </div>

        <div className="login-footer">
          <span>AeroSync Operations v2.4 • Secured via SimpleJWT & PyMongo Engine</span>
        </div>
      </div>
    </div>
  );
}
