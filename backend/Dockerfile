FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (better Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application
COPY . .

# Render uses PORT env var (default 10000)
ENV PORT=10000
EXPOSE ${PORT}

# Production: gunicorn with uvicorn workers
CMD gunicorn main:app \
    --bind 0.0.0.0:${PORT} \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
