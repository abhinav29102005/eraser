#!/bin/bash

# Stop all services

echo "🛑 Stopping LUMO services..."

# Stop Docker services
cd backend
docker-compose -f docker-compose.dev.yml down
cd ..

echo "✅ All services stopped!"
