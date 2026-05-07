#!/bin/sh

echo "=== Starting Application ==="

# Wait a moment for database to be ready
sleep 2

echo "=== Running Migrations ==="
python manage.py migrate --fake-initial

echo "=== Creating super employee ==="
python manage.py seed_super_employee || echo "Super employee creation failed (may already exist)"

echo "=== Starting Gunicorn Server ==="
exec gunicorn --workers 1 --worker-class sync --timeout 300 --bind 0.0.0.0:$PORT university_activities.wsgi:application
