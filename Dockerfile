# ===================================================
# Stage 1: Build React Vite Frontend Static Bundle
# ===================================================
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install
RUN npm install @tailwindcss/oxide-linux-x64-gnu

COPY frontend/ ./
RUN npm run build

# ===================================================
# Stage 2: Unified Production Container (Backend + Frontend)
# ===================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies & Nginx
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . /app/

# Copy built frontend static files from Stage 1 into Nginx web root
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Configure Nginx to serve React SPA on / and proxy /api/ to Django backend
RUN echo 'server {\
    listen 80;\
    server_name localhost;\
    root /usr/share/nginx/html;\
    index index.html;\
    location / {\
        try_files $uri $uri/ /index.html;\
    }\
    location /api/ {\
        proxy_pass http://127.0.0.1:8000/api/;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
}' > /etc/nginx/sites-available/default

EXPOSE 80

# Run database migrations, seed demo data, start Django backend and Nginx web server
CMD ["sh", "-c", "python manage.py migrate && python seed_demo_data.py && python manage.py runserver 127.0.0.1:8000 & nginx -g 'daemon off;'"]
