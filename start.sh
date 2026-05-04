#!/bin/bash
set -e

cd backend
python manage.py migrate --noinput
python manage.py collectstatic --noinput
gunicorn university_activities.wsgi:application --bind 0.0.0.0:$PORT
