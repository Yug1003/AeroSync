import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import StaffRosterPage from './pages/StaffRosterPage';
import ExecutiveAnalyticsPage from './pages/ExecutiveAnalyticsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/activity-log" element={<ActivityLogPage />} />
        <Route path="/pending-approvals" element={<PendingApprovalsPage />} />
        <Route path="/staff-roster" element={<StaffRosterPage />} />
        <Route path="/analytics" element={<ExecutiveAnalyticsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
