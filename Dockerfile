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

# DISABLED: Collect static files at build time - requires auth app
# RUN echo "=== Collecting static files ===" && python manage.py collectstatic --noinput

# Expose port (Railway will map this)
EXPOSE 8080

# Railway will provide PORT environment variable dynamically

# Railway will use this CMD if Start Command is not set - v24.0 FORCE SHOW LOGS
CMD ["sh", "-c", "echo '=== FORCE SHOW LOGS V24.0 ===' && echo '=== CONTAINER IS STARTING ===' && echo '=== DOCKERFILE CMD IS RUNNING ===' && echo '=== PORT: '$PORT' ===' && echo '=== PWD: '$(pwd)' ===' && python manage.py runserver 0.0.0.0:$PORT"]
