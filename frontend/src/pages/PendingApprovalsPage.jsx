import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/api';
import {
  Plane,
  ArrowLeft,
  UserCheck,
  UserX,
  Shield,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  User,
  Check,
  X
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import './PendingApprovalsPage.css';

export default function PendingApprovalsPage() {
  const navigate = useNavigate();
  const [pendingStaff, setPendingStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const username = localStorage.getItem('username') || '';

  const fetchPendingStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('auth/pending-staff/');
      setPendingStaff(res.data);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError('Access Denied: Admin authorization required to view staff approval requests.');
      } else {
        setError('Failed to fetch pending staff approvals.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingStaff();
  }, []);

  const handleAction = async (userId, username, action) => {
    try {
      setActionLoadingId(userId);
      setError('');
      setSuccess('');
      const res = await API.post(`auth/approve-staff/${userId}/`, { action });
      
      setSuccess(res.data.message || `Staff request for @${username} updated successfully.`);
      await fetchPendingStaff();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to process ${action} action.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="pending-approvals-container">
      {/* Top Bar Header */}
      <header className="pending-approvals-header">
        <div className="header-left">
          <div className="brand-badge" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} title="Go to Dashboard">
            <div className="brand-logo-small">
              <Plane size={16} />
            </div>
            <span className="brand-name">AeroSync</span>
          </div>
          <span className="header-divider">/</span>
          <span className="header-title">Staff Sign Up Approvals</span>
          <span className="badge-page">{pendingStaff.length} Pending</span>
        </div>

        <div className="header-actions">
          <button type="button" className="refresh-btn" onClick={fetchPendingStaff} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <ThemeToggle />
          <button
            type="button"
            className="shadcn-btn-secondary return-dashboard-btn"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="pending-approvals-main">

        {/* Notifications */}
        {error && (
          <div className="alert-banner alert-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner alert-success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Requests List Card */}
        <section className="list-section">
          <h3>📋 Staff Sign Up Authorization Requests</h3>

          {loading ? (
            <div className="empty-card">
              <RefreshCw size={24} className="spin text-cyan" />
              <p style={{ marginTop: '0.75rem' }}>Loading pending authorization requests...</p>
            </div>
          ) : pendingStaff.length === 0 ? (
            <div className="empty-card">
              <CheckCircle2 size={36} className="text-emerald" />
              <h4 style={{ marginTop: '0.75rem', color: 'var(--text-main)' }}>All Staff Requests Cleared!</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                There are currently no staff registration requests waiting for Admin approval.
              </p>
            </div>
          ) : (
            <div className="requests-table-container">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Applicant Details</th>
                    <th>Role Requested</th>
                    <th>Email Address</th>
                    <th>Registration Date</th>
                    <th style={{ textAlign: 'right' }}>Authorization Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStaff.map((staff) => (
                    <tr key={staff.id}>
                      <td>
                        <div className="applicant-cell">
                          <div className="avatar-circle">
                            {staff.full_name ? staff.full_name.charAt(0).toUpperCase() : staff.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="applicant-names">
                            <strong>{staff.full_name || staff.username}</strong>
                            <span className="username-tag">@{staff.username}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge role-${staff.role}`}>
                          {staff.role_display}
                        </span>
                      </td>
                      <td>
                        <span className="email-text">{staff.email || 'No email provided'}</span>
                      </td>
                      <td>
                        <span className="date-text">
                          <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {new Date(staff.date_joined).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-button-group">
                          <button
                            className="btn-approve"
                            disabled={actionLoadingId === staff.id}
                            onClick={() => handleAction(staff.id, staff.username, 'approve')}
                          >
                            <Check size={14} />
                            <span>Approve Staff</span>
                          </button>
                          <button
                            className="btn-reject"
                            disabled={actionLoadingId === staff.id}
                            onClick={() => handleAction(staff.id, staff.username, 'reject')}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
