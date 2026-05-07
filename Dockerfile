FROM python:3.11.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
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

# Run Django commands
RUN echo "=== Creating database directory ===" && mkdir -p /tmp && chmod 777 /tmp
RUN echo "=== Creating database file ===" && touch /tmp/db.sqlite3 && chmod 666 /tmp/db.sqlite3
RUN echo "=== Running migrations ===" && python manage.py migrate --fake-initial --verbosity=2
RUN echo "=== Verifying tables ===" && python manage.py showmigrations --verbosity=2
RUN echo "=== Collecting static files ===" && python manage.py collectstatic --noinput
RUN echo "=== Creating super employee ===" && python manage.py seed_super_employee
RUN echo "=== Final verification ===" && python manage.py check --verbosity=2

# Expose port (Railway will map this)
EXPOSE 8080

# Railway will provide PORT environment variable dynamically

# Railway will use this CMD if Start Command is not set - v3
CMD ["sh", "-c", "exec gunicorn --workers 1 --worker-class sync --timeout 300 --bind 0.0.0.0:$PORT university_activities.wsgi:application"]
