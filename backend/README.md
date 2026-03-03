# LUMO Backend

FastAPI + Socket.IO backend for real-time collaborative whiteboarding with AI features.

## Setup

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```
DATABASE_URL=postgresql://user:password@localhost:5432/lumo_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-in-production
AI_PROVIDER=mock
OPENAI_API_KEY=
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
```

3. Run migrations:
```bash
alembic upgrade head
```

4. Start the server:
```bash
uvicorn main:app --reload
```

### Docker

```bash
docker-compose up
```

## Features

- 🔐 JWT Authentication
- 💾 PostgreSQL Database
- 🔄 Redis Caching
- 🌐 WebSocket with Socket.IO
- 🤖 OpenAI Integration
- 📊 Real-time Collaboration
- 🎨 Drawing Management
- 🔄 Sync Across Clients

## API Endpoints

- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user
- `POST /rooms` - Create room
- `GET /rooms` - Get user's rooms
- `GET /rooms/{id}` - Get room details
- `POST /rooms/{id}/objects` - Add drawing object
- `POST /ai/diagram` - Generate diagram with AI
- `POST /ai/analyze` - Analyze sketch
- `POST /ai/suggest` - Get suggestions

## Deployment

### Free Backend (Oracle Cloud Always Free VM)

1. Create an Always Free Ubuntu VM
2. Install Docker + Docker Compose plugin
3. Clone repo and configure `.env`
4. Start services with `docker compose up -d`

### Cloudflare Frontend (Free)

1. Build Next.js app
2. Deploy to Cloudflare Pages
3. Configure DNS
