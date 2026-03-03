# 🚀 Quick Start Guide

Get Eraser up and running in 5 minutes!

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- Python 3.11+ ([Download](https://www.python.org))
- Docker & Docker Compose ([Download](https://www.docker.com))
- Git

## Installation

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/eraser.git
cd eraser

# Run setup script
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Install frontend dependencies
- Create Python virtual environment
- Install backend dependencies
- Copy environment templates

### 2. Configure Environment Variables

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://lumo:lumo_password@localhost:5432/lumo_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-in-production
AI_PROVIDER=mock
OPENAI_API_KEY=
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

✅ **Free by default**: keep `AI_PROVIDER=mock`.
Optional: use `AI_PROVIDER=ollama` for local free model, or `AI_PROVIDER=openai` if you want paid API quality.

### 3. Start Development Environment

#### Option A: Automated (Recommended)
```bash
chmod +x start-dev.sh
./start-dev.sh
```

#### Option B: Manual

**Terminal 1 - Start Databases**:
```bash
cd backend
docker-compose -f docker-compose.dev.yml up
```

**Terminal 2 - Start Backend**:
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python -m uvicorn main:app --reload
```

**Terminal 3 - Start Frontend**:
```bash
cd frontend
npm run dev
```

### 4. Access the App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Redis**: localhost:6379
- **PostgreSQL**: localhost:5432

## First Steps

1. **Register**: Create an account at http://localhost:3000/register
2. **Create Room**: Create your first whiteboard
3. **Draw**: Use the drawing tools to create content
4. **Invite**: Share the room URL with others
5. **Collaborate**: Draw together in real-time!

## Common Commands

```bash
# Frontend
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run type-check   # TypeScript checking

# Backend
cd backend
python -m uvicorn main:app --reload  # Start server
pytest                                # Run tests
alembic upgrade head                  # Run migrations

# Docker
docker-compose -f docker-compose.dev.yml up    # Start services
docker-compose -f docker-compose.dev.yml down  # Stop services

# Project
./setup.sh      # Initial setup
./start-dev.sh  # Start all services
./stop-dev.sh   # Stop all services
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process using port 3000 (Frontend)
lsof -ti:3000 | xargs kill -9

# Kill process using port 8000 (Backend)
lsof -ti:8000 | xargs kill -9
```

### Database Connection Failed
1. Ensure Docker services are running: `docker-compose ps`
2. Check DATABASE_URL in `.env`
3. Verify PostgreSQL is healthy: `docker-compose logs postgres`

### WebSocket Connection Failed
1. Ensure backend is running
2. Check SOCKET_URL matches API_URL
3. Look for CORS errors in console
4. Verify firewall allows connections

### Python Environment Issues
```bash
# Recreate virtual environment
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Next Steps

- 📚 Read the [Main README](README.md)
- 🚀 Deploy to production ([Deployment Guide](DEPLOYMENT.md))
- 🤝 Contribute ([Contributing Guide](CONTRIBUTING.md))
- 🔒 Security ([Security Policy](SECURITY.md))
- 📝 API Docs (http://localhost:8000/docs)

## Project Structure

```
eraser/
├── frontend/        ← Next.js + React
├── backend/         ← FastAPI + Python
├── shared/          ← Config files
├── README.md        ← Main documentation
├── DEPLOYMENT.md    ← Deployment guide
├── CONTRIBUTING.md  ← Contributing guide
├── setup.sh         ← Setup script
└── start-dev.sh     ← Start development
```

## Key Features

✅ Real-time collaborative drawing
✅ Multiple users on same whiteboard
✅ AI diagram generation
✅ Sketch analysis
✅ Drawing persistence
✅ Responsive design
✅ JWT authentication
✅ WebSocket communication

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ├─ Pages: Home, Login, Register, Dashboard, Editor    │
│  ├─ Components: Canvas, Toolbar, Sidebar               │
│  ├─ State: Zustand                                     │
│  └─ WebSocket: Socket.IO                              │
└──────────────────────┬──────────────────────────────────┘
                       │
                  Socket.IO + HTTP
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  Backend (FastAPI)                       │
│  ├─ Routes: /auth, /rooms, /ai                         │
│  ├─ WebSocket: Events for real-time sync              │
│  ├─ Database: SQLAlchemy ORM                          │
│  └─ AI: OpenAI GPT-4 Integration                      │
└──────────────────────┬──────────────────────────────────┘
                       │
            ┌──────────┼──────────┐
            │          │          │
    ┌───────▼──┐ ┌────▼────┐ ┌──▼──────┐
    │PostgreSQL│ │  Redis  │ │ OpenAI  │
    └──────────┘ └─────────┘ └─────────┘
```

## Environment Files

Already created:
- `frontend/.env.local` (copy from `shared/.env.frontend.example`)
- `backend/.env` (copy from `shared/.env.example`)

Just fill in your values!

## Getting Help

- 🐛 [Report Bugs](https://github.com/yourusername/eraser/issues)
- 💬 [Discussions](https://github.com/yourusername/eraser/discussions)
- 📧 Email: support@lumo-app.dev
- 📖 Documentation: See README.md files in each folder

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Socket.IO Docs](https://socket.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [OpenAI API](https://platform.openai.com/docs)

---

**Happy whiteboarding!** ✏️🎨

Last Updated: 2024-03-03
