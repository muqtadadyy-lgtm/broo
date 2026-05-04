#!/bin/bash
set -e

cd backend

# Install requirements if needed
pip install -q -r requirements.txt

# Run migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Start server
gunicorn university_activities.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --threads 2
