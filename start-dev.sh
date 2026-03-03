#!/bin/bash

# Development startup script

echo "🚀 Starting LUMO Development Environment"
echo "=========================================="
echo ""

# Check if .env files exist
if [ ! -f frontend/.env.local ]; then
    echo "❌ Frontend .env.local not found!"
    echo "Copy from shared/.env.frontend.example"
    exit 1
fi

if [ ! -f backend/.env ]; then
    echo "❌ Backend .env not found!"
    echo "Copy from shared/.env.example"
    exit 1
fi

# Start services in background
echo "🐳 Starting Docker services (PostgreSQL & Redis)..."
cd backend
docker-compose -f docker-compose.dev.yml up -d
cd ..

echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ Services started!"
echo ""
echo "Starting applications..."
echo ""

# Start backend
echo "🔧 Starting Backend (FastAPI)..."
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "⚛️  Starting Frontend (Next.js)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Development environment started!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID; cd backend && docker-compose -f docker-compose.dev.yml down" EXIT

wait
