#!/bin/sh

echo "=== Starting Application ==="
echo "=== Working directory: $(pwd) ==="
echo "=== Python path: $(which python) ==="

# Wait for database to be ready
echo "=== Waiting for database... ==="
sleep 5

# Check if database directory exists and is writable
echo "=== Checking database access ==="
ls -la /app/backend/db.sqlite3 || echo "Database file not found, will be created"
python manage.py check --deploy || echo "Django check failed"

echo "=== Running Migrations ==="
python manage.py migrate --fake-initial --verbosity=2 || echo "Migrations failed with error $?"

echo "=== Verifying tables exist ==="
python manage.py showmigrations || echo "Cannot show migrations"

echo "=== Creating super employee ==="
python manage.py seed_super_employee || echo "Super employee creation failed (may already exist)"

echo "=== Starting Gunicorn Server on port $PORT ==="
echo "=== PORT: $PORT ==="
echo "=== Starting with enhanced logging ==="

# Start Gunicorn with enhanced error handling and logging
gunicorn --workers 1 --worker-class sync --timeout 300 --bind 0.0.0.0:$PORT \
    --access-logfile - \
    --error-logfile - \
    --log-level debug \
    --keepalive 5 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    university_activities.wsgi:application || {
    echo "=== Gunicorn failed to start, retrying in 10 seconds ==="
    sleep 10
    echo "=== Retrying Gunicorn start ==="
    exec gunicorn --workers 1 --worker-class sync --timeout 300 --bind 0.0.0.0:$PORT university_activities.wsgi:application
}
