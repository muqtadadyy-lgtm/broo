#!/bin/bash
set -e

python manage.py migrate --noinput
gunicorn university_activities.wsgi:application --bind 0.0.0.0:$PORT
