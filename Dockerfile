FROM python:3.11.9-slim

# Force rebuild to remove postgresql-client completely
ARG RAILWAY_REBUILD=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Change to backend directory
WORKDIR /app/backend

# Create logs directory
RUN mkdir -p logs

# Run Django commands with logging
RUN echo "=== Running migrations ===" && python manage.py migrate --fake-initial || echo "Migrations failed"
RUN echo "=== Collecting static files ===" && python manage.py collectstatic --noinput || echo "Static collection failed"
RUN echo "=== Creating super employee ===" && python manage.py seed_super_employee || echo "Super employee creation failed"
RUN echo "=== Django setup completed ==="

# Expose port (Railway will map this)
EXPOSE 8080

# Railway will provide PORT environment variable dynamically

# Railway will use this CMD if Start Command is not set - v3
CMD ["sh", "-c", "exec gunicorn --workers 1 --worker-class sync --timeout 300 --bind 0.0.0.0:$PORT university_activities.wsgi:application"]
