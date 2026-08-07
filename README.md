# ✈️ AeroSync

Next-Generation Airport Operations & Ramp Dispatch Command Center.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

---

### 1. Backend Setup

```bash
# 1. Create and activate a Python virtual environment
python -m venv venv

# Linux / macOS:
source venv/bin/activate

# Windows (Command Prompt):
venv\Scripts\activate

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup environment variables (Optional - Neon PostgreSQL)
# Create a .env file and set DATABASE_URL (if omitted, falls back to SQLite):
# DATABASE_URL=postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require

# 4. Run database migrations & seed demo data
python manage.py migrate
python seed_demo_data.py

# 5. Start Django development server
python manage.py runserver
```
*Backend API runs at `http://127.0.0.1:8000/`*

#### 🔑 Default Seeded Login Credentials

| Role | Username | Password | Email |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | `admin@aerosync.com` |
| **Ground Crew / Staff** | `staff` | `admin123` | `staff@aerosync.com` |

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend application runs at `http://localhost:5173/`*

---

## 🐳 Running with Docker

Run the entire pre-built AeroSync stack (React Frontend + Django Backend) directly from Docker Hub in a single command:

```bash
# Pull and run AeroSync container
docker run -d -p 80:80 --name aerosync-app satyampatelmh/aerosync:latest
```

Open your browser at **[http://localhost](http://localhost)** *(or your server's IP address)*.

To stop and remove the container:
```bash
docker stop aerosync-app && docker rm aerosync-app
```