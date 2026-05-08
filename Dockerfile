# ULTIMATE CACHE BUST V25.0 - Force Railway to rebuild from scratch
ARG CACHE_BUST_V25=2024-05-08-04-30-ULTIMATE
FROM python:3.11.9-slim AS cache_bust_v25

# Force layer cache bust with unique timestamp
RUN echo "=== CACHE BUST V25.0: $CACHE_BUST_V25 ===" && \
    echo "=== FORCING COMPLETE REBUILD ===" && \
    mkdir -p /tmp/cache_bust && \
    echo "ULTIMATE_CACHE_BUST_V25" > /tmp/cache_bust/bust_marker && \
    cat /tmp/cache_bust/bust_marker

WORKDIR /app

# Install system dependencies - restructured to break cache
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/* && \
    echo "=== SYSTEM DEPS INSTALLED V25.0 ==="

# Copy requirements and install Python dependencies - restructured
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.txt && \
    echo "=== PYTHON DEPS INSTALLED V25.0 ==="

# Copy the application code - restructured to break cache
COPY . /app/source/
RUN echo "=== SOURCE CODE COPIED V25.0 ===" && \
    ls -la /app/source/

# Change to backend directory - restructured
WORKDIR /app/source/backend
RUN echo "=== WORKING DIR SET V25.0: $(pwd) ==="

# Create logs directory - restructured
RUN mkdir -p logs && \
    echo "=== LOGS DIR CREATED V25.0 ==="

# COMPLETELY DISABLED: Collect static files - removed entirely
# This was causing the build to fail with old cached code

# Expose port (Railway will map this)
EXPOSE 8080

# Railway will provide PORT environment variable dynamically

# ULTIMATE CACHE BUST V25.0 - Completely restructured CMD
CMD ["sh", "-c", "echo '=== ULTIMATE CACHE BUST V25.0 ===' && echo '=== RAILWAY FORCED TO USE LATEST CODE ===' && echo '=== CONTAINER STARTING ===' && echo '=== PORT: '$PORT' ===' && echo '=== PWD: '$(pwd)' ===' && echo '=== DOCKERFILE RESTRUCTURED ===' && python manage.py runserver 0.0.0.0:$PORT"]
