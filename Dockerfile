FROM python:3.11.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Change to backend directory
WORKDIR /app/backend

# Run Django commands
RUN python manage.py migrate --fake-initial
RUN python manage.py collectstatic --noinput
RUN python manage.py seed_super_employee

# Expose port
EXPOSE 8000

# Start command
CMD ["gunicorn", "--workers", "1", "--worker-class", "sync", "--timeout", "300", "--bind", "0.0.0.0:$PORT", "--graceful-timeout", "120", "--max-requests", "500", "--max-requests-jitter", "50", "--preload", "university_activities.wsgi:application"]
