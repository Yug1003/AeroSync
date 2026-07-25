import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';

function DashboardPlaceholder() {
  const username = localStorage.getItem('username') || 'Operator';
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#f8fafc' }}>
      <h1>Welcome to AeroSync Dashboard, {username}!</h1>
      <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Dashboard KPI cards & Gate Map will be loaded here in Phase 9.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}
