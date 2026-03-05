# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LUMO - Real-time collaborative whiteboarding platform with AI diagram generation. Full-stack Next.js + FastAPI application with WebSocket real-time sync via Socket.IO.

## Common Commands

### Development
```bash
# Automated start (all services)
./start-dev.sh

# Manual start:
# Terminal 1 - Databases
cd backend && docker-compose -f docker-compose.dev.yml up

# Terminal 2 - Backend
cd backend && source venv/bin/activate && python -m uvicorn main:app --reload

# Terminal 3 - Frontend
cd frontend && npm run dev
```

### Frontend
```bash
cd frontend
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run type-check   # TypeScript checking
```

### Backend
```bash
cd backend
python -m uvicorn main:app --reload  # Dev server (localhost:8000)
alembic upgrade head                  # Run migrations
```

## Architecture

### Frontend (Next.js 14 + TypeScript)
- **State Management**: Zustand with persist middleware (`frontend/src/store/whiteboard.ts`)
- **Persistence**: localStorage via zustand/middleware/persist
- **Undo/Redo**: History stack with 50 states
- **Real-time**: Socket.IO client (`frontend/src/lib/socket.ts`)
- **HTTP**: Axios (`frontend/src/lib/api.ts`)
- **Canvas**: Konva.js for drawing
- **Styling**: Tailwind CSS

### Backend (FastAPI + Python 3.11)
- **Web Framework**: FastAPI with aiohttp async mode
- **Real-time**: python-socketio with AsyncServer
- **Room State**: Redis-backed (with in-memory fallback)
- **Database**: SQLAlchemy ORM with PostgreSQL (pool_size=20)
- **Auth**: JWT with python-jose + passlib/bcrypt
- **AI**: Three providers via `AI_PROVIDER` env var:
  - `mock` - Free, no API key needed (default)
  - `ollama` - Local free model
  - `openai` - Paid GPT-4 quality
- **Services**: `backend/app/services/room_service.py`

### API Routes (`backend/app/routes/`)
- `/auth/*` - Authentication (register, login, logout, me)
- `/rooms/*` - Whiteboard CRUD operations
- `/ai/*` - AI features (diagram generation, analyze, suggest)

### WebSocket Events
- **Client → Server**: `join_room`, `draw`, `cursor_move`, `delete_object`, `clear_room`, `leave_room`
- **Server → Client**: `room_data`, `object_drawn`, `object_deleted`, `room_cleared`, `cursor_moved`, `users_update`

### Security
- Socket.IO requires JWT token in `auth.token`
- Room membership validated on join
- Only room owner can delete rooms (returns 403)

## Environment Variables

### Frontend (`.env.local`)
```
# Development
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000

# Production (Cloudflare Pages)
NEXT_PUBLIC_API_URL=https://lumo-api-m7w6.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://lumo-api-m7w6.onrender.com
```

### Backend (`.env`)
```
DATABASE_URL=postgresql://user:pass@HOST/DBNAME
REDIS_URL=redis://HOST:6379/0
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
SECRET_KEY=your-secret-key
```

## Database Migrations

```bash
cd backend
alembic upgrade head
```

Migration files are in `backend/alembic/versions/`.

## Access Points

### Development
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Database: localhost:5432 (PostgreSQL)
- Redis: localhost:6379

### Production
- Frontend: https://eraser-eb0.pages.dev
- Backend: https://lumo-api-m7w6.onrender.com
