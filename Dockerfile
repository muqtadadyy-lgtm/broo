FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy project
COPY . .

# Set working directory to backend
WORKDIR /app/backend

# Run migrations and collect static
RUN python manage.py migrate --noinput || true
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8080

# Start command
CMD ["gunicorn", "university_activities.wsgi:application", "--bind", "0.0.0.0:8080", "--workers", "4"]
