import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { Plane, Shield, User, Key, ArrowRight, CheckCircle2, Lock, UserPlus, Briefcase, Mail } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up form state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regRole, setRegRole] = useState('ground_crew');
  const [regDepartment, setRegDepartment] = useState('baggage');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await API.post('auth/login/', { username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('username', username);
      localStorage.setItem('user_role', response.data.role || 'admin');
      
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await API.post('auth/register/', {
        username: regUsername,
        password: regPassword,
        email: regEmail,
        first_name: regFirstName,
        last_name: regLastName,
        role: regRole,
        department: regDepartment
      });

      setLoading(false);
      setSuccessMsg(response.data.message || 'Staff registration successful! You can now log in.');
      
      // Auto-fill login form with newly registered credentials
      setUsername(regUsername);
      setPassword(regPassword);
      setIsSignUp(false);

      // Reset sign up fields
      setRegUsername('');
      setRegPassword('');
      setRegEmail('');
      setRegFirstName('');
      setRegLastName('');
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          const firstErr = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
          setError(`${firstKey}: ${firstErr}`);
        } else {
          setError('Registration failed. Please check inputs.');
        }
      } else {
        setError('Network error. Unable to register user.');
      }
    }
  };

  const fillDemoAccount = (u, p) => {
    setIsSignUp(false);
    setUsername(u);
    setPassword(p);
    setError('');
    setSuccessMsg('');
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

        {/* Tab Switcher for Sign In vs Staff Sign Up */}
        <div className="auth-tab-bar">
          <button
            type="button"
            className={`auth-tab-btn ${!isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(false); setError(''); setSuccessMsg(''); }}
          >
            <Lock size={14} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(true); setError(''); setSuccessMsg(''); }}
          >
            <UserPlus size={14} />
            <span>Staff Sign Up</span>
          </button>
        </div>

        {error && (
          <div className="login-error-alert">
            <span className="error-dot" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="login-success-alert">
            <CheckCircle2 size={16} className="text-emerald" />
            <span>{successMsg}</span>
          </div>
        )}

        {!isSignUp ? (
          /* Sign In Form */
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-field">
              <label htmlFor="username">Username</label>
              <div className="input-with-icon">
                <User className="field-icon" size={16} />
                <input
                  id="username"
                  type="text"
                  className="shadcn-input"
                  placeholder="e.g. admin, ops, crew"
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
        ) : (
          /* Staff Sign Up Form */
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-field-row">
              <div className="form-field">
                <label htmlFor="regFirstName">First Name</label>
                <input
                  id="regFirstName"
                  type="text"
                  className="shadcn-input"
                  placeholder="e.g. Rajesh"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="regLastName">Last Name</label>
                <input
                  id="regLastName"
                  type="text"
                  className="shadcn-input"
                  placeholder="e.g. Patel"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="regUsername">Staff Username *</label>
              <div className="input-with-icon">
                <User className="field-icon" size={16} />
                <input
                  id="regUsername"
                  type="text"
                  className="shadcn-input"
                  placeholder="Choose username"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="regEmail">Work Email</label>
              <div className="input-with-icon">
                <Mail className="field-icon" size={16} />
                <input
                  id="regEmail"
                  type="email"
                  className="shadcn-input"
                  placeholder="staff@aerosync.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="regPassword">Password *</label>
              <div className="input-with-icon">
                <Key className="field-icon" size={16} />
                <input
                  id="regPassword"
                  type="password"
                  className="shadcn-input"
                  placeholder="At least 4 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-field-row">
              <div className="form-field">
                <label htmlFor="regRole">Airport Staff Role *</label>
                <div className="input-with-icon">
                  <Shield className="field-icon" size={16} />
                  <select
                    id="regRole"
                    className="shadcn-input select-input"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                  >
                    <option value="ground_crew">Ground Crew</option>
                    <option value="ops_manager">Ops Manager</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </div>

              {regRole === 'ground_crew' && (
                <div className="form-field">
                  <label htmlFor="regDepartment">Department</label>
                  <div className="input-with-icon">
                    <Briefcase className="field-icon" size={16} />
                    <select
                      id="regDepartment"
                      className="shadcn-input select-input"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                    >
                      <option value="baggage">Baggage Handling</option>
                      <option value="fuel">Fuel Operations</option>
                      <option value="cleaning">Cabin Cleaning</option>
                      <option value="catering">Catering Service</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="shadcn-btn-primary login-submit-btn" disabled={loading}>
              {loading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create Staff Account</span>
                  <UserPlus size={16} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="demo-accounts-section">
          <div className="demo-header">
            <Lock size={12} />
            <span>Quick Select Demo Role (Pass: admin123)</span>
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
