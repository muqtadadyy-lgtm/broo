FROM python:3.11.9-slim

# Force rebuild to remove postgresql-client completely
ARG RAILWAY_REBUILD=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
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

# Collect static files (can be done during build)
RUN echo "=== Collecting static files ===" && python manage.py collectstatic --noinput || echo "Static collection failed"

# Expose port (Railway will map this)
EXPOSE 8080

# Railway will provide PORT environment variable dynamically

# Production CMD - run migrations and start gunicorn with Railway PORT
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn university_activities.wsgi:application --bind 0.0.0.0:$PORT"]
