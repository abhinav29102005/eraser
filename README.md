# LUMO - Real-time Collaborative Whiteboarding

A full-stack clone of LUMO with real-time collaboration, AI features, and free tier deployment.

## 🚀 Features

- ✏️ Real-time collaborative whiteboarding
- 👥 Multiple users working simultaneously
- 🤖 AI-powered diagram generation and suggestions
- 💾 Persistent storage with PostgreSQL
- 🔄 Real-time sync via Socket.IO
- 🔐 Secure authentication with JWT
- 📱 Responsive design
- 🎨 Rich drawing tools
- 💬 Cursor tracking and presence awareness

## 📁 Project Structure

```
eraser/
├── frontend/          # Next.js + TypeScript
│   ├── src/
│   │   ├── app/       # Pages
│   │   ├── components/# React components
│   │   ├── hooks/     # Custom hooks
│   │   ├── lib/       # Utilities
│   │   ├── store/     # Zustand store
│   │   └── types/     # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── backend/           # FastAPI + Python
│   ├── app/
│   │   ├── routes/    # API endpoints
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── schemas.py
│   │   └── ai_service.py
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
├── shared/            # Shared configs
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI**: Tailwind CSS
- **State**: Zustand
- **Real-time**: Socket.IO
- **Canvas**: Konva.js for drawing
- **HTTP**: Axios
- **Auth**: JWT with NextAuth

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **Cache**: Redis
- **Real-time**: Socket.IO (python-socketio)
- **Auth**: JWT with Passlib
- **AI**: `mock` / local `ollama` / OpenAI (optional)
- **ORM**: SQLAlchemy

### Deployment
- **Frontend**: Cloudflare Pages (Free)
- **Backend**: Oracle Cloud Always Free VM
- **Database**: PostgreSQL self-hosted on VM (Free)
- **Cache**: Redis self-hosted on VM (Free)
- **AI**: `mock` or local `ollama` (Free)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL
- Redis (optional for local development)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/eraser.git
cd eraser
```

2. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

3. **Backend Setup (with Docker)**
```bash
cd backend
docker-compose up
```

Or **without Docker**:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

4. **Open in Browser**
```
http://localhost:3000
```

### Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

**Backend** (`.env`):
```
DATABASE_URL=postgresql://user:password@localhost:5432/lumo_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-in-production
AI_PROVIDER=mock
OPENAI_API_KEY=
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 📚 API Documentation

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### Rooms (Whiteboards)
- `POST /rooms` - Create new room
- `GET /rooms` - Get user's rooms
- `GET /rooms/{id}` - Get room details
- `PUT /rooms/{id}` - Update room
- `DELETE /rooms/{id}` - Delete room

### Drawing Objects
- `POST /rooms/{id}/objects` - Add drawing object
- `PUT /rooms/{id}/objects/{obj_id}` - Update object
- `DELETE /rooms/{id}/objects/{obj_id}` - Delete object

### AI Features
- `POST /ai/diagram` - Generate diagram from text
- `POST /ai/analyze` - Analyze sketch image
- `POST /ai/suggest` - Get improvement suggestions

## 🔌 WebSocket Events

### Client → Server
- `join_room` - Join a whiteboard room
- `draw` - Draw on canvas
- `cursor_move` - Update cursor position
- `delete_object` - Delete a drawing object
- `clear_room` - Clear all objects
- `leave_room` - Leave the room

### Server → Client
- `room_data` - Initial room state
- `object_drawn` - New drawing object
- `object_deleted` - Object deletion
- `room_cleared` - Room cleared
- `cursor_moved` - User cursor update
- `users_update` - Active users list

## 🚀 Deployment

### Frontend on Cloudflare Pages

1. Push to GitHub
2. Connect GitHub to Cloudflare Pages
3. Set build command: `npm run build --workspace=frontend`
4. Set publish directory: `frontend/.next`

### Backend on Oracle Cloud Always Free

1. Create an Always Free Ubuntu VM
2. Install Docker + Docker Compose plugin
3. Clone this repo on the VM
4. Set backend env vars (`AI_PROVIDER=mock` for fully free mode)
5. Run: `cd backend && docker compose up -d`

## 📦 Database Migrations

Using Alembic:

```bash
cd backend
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## 🧪 Testing

Frontend:
```bash
cd frontend
npm test
```

Backend:
```bash
cd backend
pytest
```

## 📝 Features Breakdown

### Current Implementation
- ✅ User authentication (register/login)
- ✅ Create/manage whiteboards
- ✅ Real-time drawing with Socket.IO
- ✅ Multiple user collaboration
- ✅ Cursor tracking
- ✅ Drawing persistence
- ✅ AI diagram generation
- ✅ JWT security

### Future Enhancements
- 🔄 Undo/Redo functionality
- 📤 Export to PDF/PNG
- 🎬 Recording and playback
- 📊 Analytics dashboard
- 👥 Team management
- 📱 Mobile app
- 🔐 Enterprise SSO
- 🌙 Dark mode

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙋 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/eraser/issues)
- Email: support@lumo-app.dev

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Advanced shapes library
- [ ] Template gallery
- [ ] Collaboration permissions
- [ ] Real-time chat
- [ ] Video conference integration
- [ ] Comments and annotations
- [ ] Version history
- [ ] Smart object detection

---

Made with ❤️ by [Your Name]
