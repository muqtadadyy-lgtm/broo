#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

# Wait for database to be ready
echo "Waiting for database to be ready..."
python manage.py migrate --fake-initial
python manage.py collectstatic --noinput
python manage.py seed_super_employee

echo "Build completed successfully!"
