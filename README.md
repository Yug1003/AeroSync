# ✈️ AeroSync — Next-Gen Airport Operations & Ramp Dispatch Command Center

[![React](https://img.shields.io/badge/Frontend-React_18_|_Vite-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Backend-Django_4.x_|_DRF-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![License](https://img.shields.io/badge/Status-Production_Ready-emerald)](#)

**AeroSync** is a state-of-the-art, high-performance airport ramp dispatch and aircraft turnaround management system. Designed for hub operations managers and ground service staff, AeroSync combines 3D kinetic landing visuals, real-time Flightradar24 radar vectoring, interactive Gantt timelines, live station weather API integration, AI-driven disruption recovery, and natural-language voice command execution across 15 major Indian airport hubs.

---

## 🌟 Key Features

### 1. 🎬 Interactive 3D Aircraft Kinetic Landing Page
- High-frame-rate canvas scroll animation depicting aircraft turnaround vectoring.
- Ultra-sleek obsidian dark luxury design tokens with smooth Lenis physics scrolling.
- Real-time preloader asset skeleton loading structure.

### 2. 📡 Live Airspace Radar & Flight Vectoring
- Interactive Leaflet map basemap with dynamic light/dark theme basemap tiles (`CartoDB`).
- Live flight telemetry integration (Flightradar24 / OpenSky Network) with interactive popup stats (callsign, tail number, altitude, ground speed, and route).

### 3. 📊 Consolidated Operations Viewport Card
Single integrated command center viewport supporting instant tab switching with auto-refresh:
- **Live Radar**: Real-time airspace and tarmac radar tracking.
- **Gate Status Grid**: Live gate stand occupancy grid with detailed inspector metrics.
- **Gantt Schedule**: Interactive timeline schedule supporting drag-and-drop gate reassignment.
- **GSE Telemetry**: Ground Support Equipment fleet management (fuelers, tugs, loaders, GPUs).

### 4. 🤖 AI Automated Disruption Recovery
- One-click disruption recovery algorithm that detects gate collisions and compresses turnaround slots in real time.

### 5. 🎙️ Live Executed Voice Dispatch Console
- Natural language voice & text command processing ("Switch to Delhi", "Run AI disruption recovery", "Filter scheduled flights").

### 6. 🌤️ Real-Time Station Weather Integration
- Fetches live weather telemetry for selected airport stations (temperature, severity dots, auto-refreshed).

### 7. 👷 Staff Roster & Duty Self-Assignment
- Ground crew turnaround duty self-assignment and release capabilities.
- Admin staff registration approval authorization workflow.

### 8. 📈 Executive Analytics & Audit Trail Logs
- On-Time Performance (OTP) charts, risk breakdown metrics, CSV report exports, and Django relational audit trail logging.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18, Vite
- **Icons & Visuals**: Lucide React, Leaflet Maps, Recharts, Framer Motion, Lenis Smooth Scroll
- **Styling**: Vanilla CSS Custom Design Tokens (`--bg-app: #09090b`, Pastel Sage `#86efac`) & TailwindCSS

### Backend
- **Framework**: Django 4.x, Django REST Framework (DRF)
- **Database**: SQLite (Relational) & MongoDB (Staff Telemetry Sync)
- **Authentication**: JWT / Token Authentication with Admin Approval Flow

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Backend Setup
```bash
# Navigate to repository root
cd AeroSync

# Install Python dependencies
pip install -r requirements.txt

# Run migrations & seed demo data
python manage.py migrate
python seed_demo_data.py

# Start Django backend server
python manage.py runserver
```
*Backend API will run on `http://127.0.0.1:8000/`*

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend application will run on `http://localhost:5173/`*

---

## 👥 Group Members & Project Credits

- **Satyam** (Roll No: 04)
- **Yug** (Roll No: 05)
- **Ayushi** (Roll No: 06)

---

© 2026 AeroSync Inc. All Rights Reserved.