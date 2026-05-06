FROM python:3.11.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    default-libmysqlclient-dev \
    pkg-config \
    python3-dev \
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

# Expose port (Railway will map this)
EXPOSE 8080

# Railway will provide PORT environment variable dynamically

# Create startup script with proper PORT handling
RUN echo '#!/bin/sh\nPORT=${PORT:-8080}\necho "Starting gunicorn on port $PORT"\ncd /app/backend && exec gunicorn --workers 1 --worker-class sync --timeout 300 --bind 0.0.0.0:$PORT university_activities.wsgi:application' > /app/start.sh && chmod +x /app/start.sh

# Start command - use exec to replace shell with gunicorn
CMD ["/app/start.sh"]
