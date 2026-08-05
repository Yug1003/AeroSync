import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  Plane,
  ArrowLeft,
  Download,
  FileText,
  BarChart2,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Shield
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import './ExecutiveAnalyticsPage.css';

const INDIAN_AIRPORTS = [
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel Intl', city: 'Ahmedabad' },
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'New Delhi' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai' },
  { code: 'BLR', name: 'Kempegowda Intl', city: 'Bengaluru' },
  { code: 'MAA', name: 'Chennai Intl', city: 'Chennai' },
  { code: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose Intl', city: 'Kolkata' },
];

export default function ExecutiveAnalyticsPage() {
  const navigate = useNavigate();
  const [selectedAirport, setSelectedAirport] = useState('AMD');
  const [loading, setLoading] = useState(false);
  const [delayPredictData, setDelayPredictData] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.get(`flights/predict-delays/?airport=${selectedAirport}`);
      setDelayPredictData(res.data);
    } catch (err) {
      console.warn('Predictor fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAirport]);

  const otpData = [
    { airport: 'AMD', otp: 94.2 },
    { airport: 'DEL', otp: 88.5 },
    { airport: 'BOM', otp: 86.1 },
    { airport: 'BLR', otp: 92.8 },
    { airport: 'MAA', otp: 91.0 },
    { airport: 'HYD', otp: 95.4 },
    { airport: 'CCU', otp: 89.3 },
  ];

  const rootCauseData = [
    { name: 'Late Inbound Arrival', value: 38, color: '#ef4444' },
    { name: 'Baggage Handling Backlog', value: 24, color: '#f59e0b' },
    { name: 'Fuel Dispenser Congestion', value: 18, color: '#3b82f6' },
    { name: 'Catering Uplift Delay', value: 12, color: '#8b5cf6' },
    { name: 'Cabin Sanitation', value: 8, color: '#10b981' },
  ];

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Airport,Flight Callsign,Tail Number,Gate Stand,Completed Milestones,Predicted Delay (Mins),Risk Level,Bottleneck Cause\n";
    
    if (delayPredictData && delayPredictData.predictions) {
      delayPredictData.predictions.forEach(p => {
        csvContent += `${selectedAirport},${p.callsign},${p.tailNumber},${p.gate},${p.completed_milestones}/4,${p.predicted_delay_mins},${p.risk_level},"${p.primary_bottleneck}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AeroSync_Executive_Analytics_${selectedAirport}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="analytics-page-container">
      {/* Header */}
      <header className="analytics-header">
        <div className="header-left">
          <div className="brand-badge">
            <div className="brand-logo-small">
              <Plane size={16} />
            </div>
            <span className="brand-name">AeroSync</span>
          </div>
          <span className="header-divider">/</span>
          <span className="header-title">Executive Airport Performance & Delay Analytics</span>
          <span className="badge-page font-mono">15 Airports Covered</span>
        </div>

        <div className="header-right-tools">
          <div className="airport-selector-box">
            <MapPin size={14} className="selector-icon" />
            <select
              className="airport-select-native"
              value={selectedAirport}
              onChange={(e) => setSelectedAirport(e.target.value)}
            >
              {INDIAN_AIRPORTS.map((ap) => (
                <option key={ap.code} value={ap.code}>
                  {ap.code} — {ap.city}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="shadcn-btn-primary btn-compact" onClick={handleExportCSV}>
            <Download size={14} />
            <span>Export CSV Report</span>
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

      {/* Main Body */}
      <main className="analytics-main">
        {/* KPI Grid */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon text-cyan">
              <TrendingUp size={26} />
            </div>
            <div className="kpi-info font-mono">
              <span className="kpi-title">On-Time Performance (OTP)</span>
              <span className="kpi-value">92.4%</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon text-emerald">
              <Clock size={26} />
            </div>
            <div className="kpi-info font-mono">
              <span className="kpi-title">Avg Turnaround Time</span>
              <span className="kpi-value">38.5 Mins</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon text-amber">
              <AlertTriangle size={26} />
            </div>
            <div className="kpi-info font-mono">
              <span className="kpi-title">High Delay Risk Flights</span>
              <span className="kpi-value">{delayPredictData ? delayPredictData.high_risk_count : 1}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon text-indigo">
              <Shield size={26} />
            </div>
            <div className="kpi-info font-mono">
              <span className="kpi-title">AI Delay Prevention</span>
              <span className="kpi-value">96.8%</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <BarChart2 size={16} className="text-cyan" />
              <span>On-Time Performance (OTP %) Across Major Airports</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={otpData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="airport" stroke="#94a3b8" />
                  <YAxis domain={[70, 100]} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                  <Bar dataKey="otp" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                    {otpData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.airport === selectedAirport ? '#38bdf8' : '#0284c7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <AlertTriangle size={16} className="text-amber" />
              <span>Turnaround Delay Root Cause Pareto Breakdown</span>
            </div>
            <div className="chart-container flex-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                  <Pie
                    data={rootCauseData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    label
                  >
                    {rootCauseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Predictor Table Section */}
        <section className="predictor-table-card">
          <div className="table-header-title font-mono">
            <span>⚡ AI PREDICTIVE TURNAROUND DELAY & BOTTLENECK MATRIX — {selectedAirport}</span>
          </div>

          <div className="table-responsive">
            <table className="analytics-table font-mono">
              <thead>
                <tr>
                  <th>Flight & Tail Number</th>
                  <th>Stand Location</th>
                  <th>Turnaround Milestones</th>
                  <th>Predicted Delay</th>
                  <th>Risk Level</th>
                  <th>Primary Bottleneck Cause</th>
                  <th>AI Confidence</th>
                </tr>
              </thead>
              <tbody>
                {delayPredictData && delayPredictData.predictions ? (
                  delayPredictData.predictions.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>✈️ {p.callsign}</strong> ({p.tailNumber})
                      </td>
                      <td>{p.gate}</td>
                      <td>{p.completed_milestones} / {p.total_milestones} Completed</td>
                      <td style={{ color: p.risk_color, fontWeight: 700 }}>
                        {p.predicted_delay_mins > 0 ? `+${p.predicted_delay_mins} Mins` : 'On Schedule'}
                      </td>
                      <td>
                        <span className="risk-pill" style={{ backgroundColor: `${p.risk_color}22`, color: p.risk_color, border: `1px solid ${p.risk_color}55` }}>
                          {p.risk_level}
                        </span>
                      </td>
                      <td>{p.primary_bottleneck}</td>
                      <td className="text-cyan">{p.ai_confidence_pct}% Match</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      Loading AI predictive delay analysis...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
