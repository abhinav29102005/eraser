#!/bin/bash

# LUMO Setup Script

set -e

echo "🚀 LUMO - Collaborative Whiteboarding Setup"
echo "=============================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. You can still run locally without it."
fi

echo "✅ Prerequisites check passed!"
echo ""

# Frontend setup
echo "📦 Setting up Frontend..."
cd frontend
npm install
if [ ! -f .env.local ]; then
    cp ../shared/.env.frontend.example .env.local
    echo "✅ Created .env.local - please update with your values"
fi
cd ..

# Backend setup
echo "📦 Setting up Backend..."
cd backend
if [ ! -d venv ]; then
    python3 -m venv venv
    echo "✅ Created Python virtual environment"
fi

source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null || true
pip install -r requirements.txt

if [ ! -f .env ]; then
    cp ../shared/.env.example .env
    echo "✅ Created .env - please update with your values"
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env files with your configuration"
echo "2. For local development with Docker:"
echo "   cd backend && docker-compose -f docker-compose.dev.yml up"
echo "3. In another terminal, start the frontend:"
echo "   cd frontend && npm run dev"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Documentation: See README.md for more details"
