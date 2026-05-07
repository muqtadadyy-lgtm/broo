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
exec gunicorn --workers 1 --worker-class sync --timeout 300 --bind 0.0.0.0:$PORT university_activities.wsgi:application
