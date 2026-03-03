#!/usr/bin/env bash
# Render runs this as the build command.
# It installs deps and runs DB migrations (creates tables if they don't exist).
set -e

echo "▶ Installing Python dependencies…"
pip install --no-cache-dir -r requirements.txt gunicorn

echo "▶ Running database migrations…"
python -c "
from app.database import Base, engine
print('Creating tables…')
Base.metadata.create_all(bind=engine)
print('✓ Tables ready')
"

echo "✓ Build complete"
