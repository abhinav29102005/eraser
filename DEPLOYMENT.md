# Deployment Guide

Complete guide to deploying LUMO with $0/month infrastructure.

## 🎯 Free Architecture Overview

```text
Cloudflare Pages (Frontend - Free)
          ↓
      Browser
          ↓
   WebSocket + HTTPS
          ↓
Oracle Cloud Always Free VM
  ├─ FastAPI + Socket.IO
  ├─ PostgreSQL
  └─ Redis
```

## 📦 Frontend Deployment (Cloudflare Pages - Free)

### Prerequisites
- Cloudflare account
- GitHub account

### Steps
1. Push the repo to GitHub.
2. In Cloudflare dashboard: Workers & Pages → Create → Pages → Connect to Git.
3. Build settings:
   - Framework: Next.js
   - Build command: `npm install && npm run build --workspace=frontend`
   - Output directory: `frontend/.next`
4. Add environment variables:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

## 🔧 Backend Deployment (Oracle Cloud Always Free VM)

### Why this path
- Keeps FastAPI + Socket.IO unchanged
- Fully free hosting tier
- No forced sleep for your service

### Steps
1. Create an Always Free Ubuntu VM in Oracle Cloud.
2. Open inbound ports (`80`, `443`, and optionally `8000`).
3. Install Docker and Docker Compose plugin.
4. Clone repo and configure backend env.
5. Run backend stack in Docker.

### Backend env (fully free mode)

```env
DATABASE_URL=postgresql://eraser:strong_password@postgres:5432/lumo_db
REDIS_URL=redis://redis:6379/0
SECRET_KEY=replace-with-strong-random-value
AI_PROVIDER=mock
OPENAI_API_KEY=
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Start backend stack

```bash
cd backend
docker compose up -d
```

## 🤖 AI: Keep It Free

Use one of these:
- `AI_PROVIDER=mock` (default, zero external cost)
- `AI_PROVIDER=ollama` with local model on your VM (also free)

> If you set `AI_PROVIDER=openai`, that introduces paid API usage.

## 🔗 Connect Frontend to Backend

1. Point frontend env to your backend domain.
2. Restrict CORS in [backend/main.py](backend/main.py) to frontend domains.
3. Validate login + whiteboard sync + websocket.

## 🔒 Security Checklist

- [ ] Rotate `SECRET_KEY`
- [ ] Use strong DB password
- [ ] Enable HTTPS on API domain
- [ ] Restrict CORS to frontend domains
- [ ] Keep `.env` out of git
- [ ] Set backup jobs (`pg_dump`)

## 💰 Cost Summary

| Service | Cost |
|---|---|
| Cloudflare Pages | Free |
| Oracle Cloud Always Free VM | Free |
| PostgreSQL (self-hosted on VM) | Free |
| Redis (self-hosted on VM) | Free |
| AI (`mock` / local `ollama`) | Free |
| Total | **$0/month** |

## 🆘 Troubleshooting

### Build fails (frontend)
1. Check Node version (18+)
2. Re-check build command

### API not reachable
1. Confirm VM firewall/security list
2. Confirm DNS points to VM
3. Check backend logs: `docker compose logs -f`

### WebSocket issues
1. Ensure `NEXT_PUBLIC_SOCKET_URL` matches API origin
2. Confirm reverse proxy supports websocket upgrade

## Next Steps

1. Deploy backend on Oracle Free VM
2. Deploy frontend on Cloudflare Pages
3. Configure custom domain + HTTPS
4. Run end-to-end test