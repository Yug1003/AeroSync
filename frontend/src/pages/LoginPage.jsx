import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import ThemeToggle from "../components/ThemeToggle";
import {
  Plane,
  Shield,
  User,
  Key,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  UserPlus,
} from "lucide-react";
import "./LoginPage.css";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up form state
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regRole, setRegRole] = useState("ground_crew");
  const [regDepartment, setRegDepartment] = useState("baggage");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await API.post("auth/login/", { username, password });
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      localStorage.setItem("username", username);
      localStorage.setItem("user_role", response.data.role || "admin");

      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.detail) {
          setError(data.detail);
        } else if (data.non_field_errors) {
          setError(
            Array.isArray(data.non_field_errors)
              ? data.non_field_errors[0]
              : data.non_field_errors,
          );
        } else if (typeof data === "object") {
          const firstKey = Object.keys(data)[0];
          const firstErr = Array.isArray(data[firstKey])
            ? data[firstKey][0]
            : data[firstKey];
          setError(`${firstKey}: ${firstErr}`);
        } else {
          setError("Invalid username or password");
        }
      } else {
        setError("Network error. Unable to connect to server.");
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await API.post("auth/register/", {
        username: regUsername,
        password: regPassword,
        email: regEmail,
        first_name: regFirstName,
        last_name: regLastName,
        role: regRole,
        department: regDepartment,
      });

      localStorage.setItem(`staff_home_airport_${regUsername}`, "AMD");

      setLoading(false);
      setSuccessMsg(
        response.data.message ||
          "Staff registration successful for [AMD] Ahmedabad Airport Station! You can now log in.",
      );

      setUsername(regUsername);
      setPassword(regPassword);
      setIsSignUp(false);

      setRegUsername("");
      setRegPassword("");
      setRegEmail("");
      setRegFirstName("");
      setRegLastName("");
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (typeof data === "object") {
          const firstKey = Object.keys(data)[0];
          const firstErr = Array.isArray(data[firstKey])
            ? data[firstKey][0]
            : data[firstKey];
          setError(`${firstKey}: ${firstErr}`);
        } else {
          setError("Registration failed. Please check inputs.");
        }
      } else {
        setError("Network error. Unable to register user.");
      }
    }
  };

  return (
    <div className="aero-login-wrapper">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="aero-back-home-btn"
        style={{
          position: "absolute",
          top: "1.25rem",
          left: "1.25rem",
          zIndex: 10,
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.45rem 0.75rem",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          color: "var(--text-main)",
          fontSize: "0.8125rem",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        title="Back to Home Page"
      >
        <ArrowLeft size={15} />
        <span>Back to Home</span>
      </button>

      <div
        style={{
          position: "absolute",
          top: "1.25rem",
          right: "1.25rem",
          zIndex: 10,
        }}
      >
        <ThemeToggle />
      </div>
      <div className="aero-single-card-container">
        <div className="aero-auth-card">
          {/* Brand Mark Header */}
          <div className="aero-brand-center">
            <div className="aero-brand-icon-box">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <span className="aero-brand-title">AEROSYNC</span>
          </div>

          {/* Header Switcher */}
          <div className="aero-tab-switcher">
            <button
              type="button"
              className={`aero-tab-btn ${!isSignUp ? "active" : ""}`}
              onClick={() => {
                setIsSignUp(false);
                setError("");
                setSuccessMsg("");
              }}
            >
              <Lock className="w-4 h-4" />
              <span>SIGN IN</span>
            </button>
            <button
              type="button"
              className={`aero-tab-btn ${isSignUp ? "active" : ""}`}
              onClick={() => {
                setIsSignUp(true);
                setError("");
                setSuccessMsg("");
              }}
            >
              <UserPlus className="w-4 h-4" />
              <span>STAFF SIGN UP</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="aero-alert-error">
              <span
                className="aero-pulse-dot"
                style={{ backgroundColor: "#f87171" }}
              />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="aero-alert-success">
              <CheckCircle2 className="w-4.5 h-4.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isSignUp ? (
            /* Sign In Form */
            <form onSubmit={handleLogin} className="aero-form-stack">
              <div className="aero-form-field">
                <label className="aero-form-label">Staff Username</label>
                <div className="aero-input-wrapper">
                  <User className="aero-input-icon w-4 h-4" />
                  <input
                    type="text"
                    className="aero-input-field"
                    placeholder="e.g. admin, ops, crew"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="aero-form-field">
                <label className="aero-form-label">Password</label>
                <div className="aero-input-wrapper">
                  <Key className="aero-input-icon w-4 h-4" />
                  <input
                    type="password"
                    className="aero-input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="aero-submit-btn"
              >
                {loading ? (
                  <span>AUTHENTICATING...</span>
                ) : (
                  <>
                    <span>SIGN IN TO TERMINAL</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Staff Sign Up Form */
            <form onSubmit={handleRegister} className="aero-form-stack">
              <div className="aero-form-row">
                <div className="aero-form-field">
                  <label className="aero-form-label">First Name *</label>
                  <input
                    type="text"
                    className="aero-input-field"
                    style={{ paddingLeft: "1rem" }}
                    placeholder="Rajesh"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="aero-form-field">
                  <label className="aero-form-label">Last Name</label>
                  <input
                    type="text"
                    className="aero-input-field"
                    style={{ paddingLeft: "1rem" }}
                    placeholder="Patel"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="aero-form-field">
                <label className="aero-form-label">Staff Username *</label>
                <input
                  type="text"
                  className="aero-input-field"
                  style={{ paddingLeft: "1rem" }}
                  placeholder="Choose username"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                />
              </div>

              <div className="aero-form-field">
                <label className="aero-form-label">Work Email *</label>
                <input
                  type="email"
                  className="aero-input-field"
                  style={{ paddingLeft: "1rem" }}
                  placeholder="staff@aerosync.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="aero-form-field">
                <label className="aero-form-label">Password *</label>
                <input
                  type="password"
                  className="aero-input-field"
                  style={{ paddingLeft: "1rem" }}
                  placeholder="At least 4 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div className="aero-form-row">
                <div className="aero-form-field">
                  <label className="aero-form-label">Staff Department *</label>
                  <select
                    className="aero-select-field"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                  >
                    <option value="fuel">Fueling Ramp Operations</option>
                    <option value="cleaning">
                      Aircraft Cleaning & Cabin Service
                    </option>
                    <option value="catering">Galley & Catering Service</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="aero-submit-btn"
              >
                {loading ? (
                  <span>REGISTERING...</span>
                ) : (
                  <>
                    <span>CREATE STAFF ACCOUNT</span>
                    <UserPlus className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
