import os
import time
import json
import logging
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from socketio import AsyncServer
from aiohttp import web
import aiohttp
from dotenv import load_dotenv
from jose import jwt, JWTError
import redis.asyncio as redis

# Load environment variables from .env file
load_dotenv()

from app.routes import auth, rooms, ai
from app.database import SessionLocal, Room, User
from app.security import SECRET_KEY, ALGORITHM

logger = logging.getLogger("lumo")

# Redis client for room state (horizontal scaling)
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client: redis.Redis = None

async def get_redis() -> redis.Redis:
    global redis_client
    if redis_client is None:
        try:
            redis_client = redis.from_url(redis_url, decode_responses=True)
            await redis_client.ping()
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Falling back to in-memory state.")
            redis_client = None
    return redis_client

# Socket.IO setup
sio = AsyncServer(
    async_mode='aiohttp',
    cors_allowed_origins='*',
    ping_timeout=120,
    ping_interval=30
)

app = FastAPI(title="LUMO API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://eraser-eb0.pages.dev",
        "https://lumo.bigboyaks.me",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(ai.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler so unhandled 500s still carry CORS headers."""
    origin = request.headers.get("origin", "*")
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc) if os.getenv("DEBUG") else "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        },
    )


# User colors for participants
user_colors = {
    "red": "#FF6B6B",
    "orange": "#FFA500",
    "yellow": "#FFD93D",
    "green": "#6BCB77",
    "blue": "#4D96FF",
    "purple": "#9D84B7",
}


def _get_color_for_user(user_id: str) -> str:
    """Generate a consistent color based on user_id hash."""
    color_list = list(user_colors.values())
    hash_val = sum(ord(c) for c in user_id)
    return color_list[hash_val % len(color_list)]


def _verify_jwt_token(token: str) -> dict | None:
    """Verify JWT token and return payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def _is_user_member(user_id: str, room_id: str) -> bool:
    """Check if user is a member of the room."""
    db = SessionLocal()
    try:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            return False
        member_ids = {u.id for u in room.users}
        return user_id in member_ids
    finally:
        db.close()


async def _ensure_room_member(db, room: Room, user_id: str):
    """Auto-add user to room if not already a member."""
    member_ids = {u.id for u in room.users}
    if user_id not in member_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            room.users.append(user)
            db.commit()
            db.refresh(room)


# === Redis-based room state functions ===

async def _add_user_to_room_redis(room_id: str, user_id: str, user_name: str, sid: str):
    """Add user to room in Redis."""
    r = await get_redis()
    if r:
        user_data = json.dumps({
            'id': user_id,
            'name': user_name,
            'color': _get_color_for_user(user_id),
            'sid': sid
        })
        await r.hset(f"room:{room_id}:users", user_id, user_data)
        await r.sadd(f"room:{room_id}:sids", sid)
        # Set expiry for cleanup
        await r.expire(f"room:{room_id}:users", 3600)
        await r.expire(f"room:{room_id}:sids", 3600)


async def _remove_user_from_room_redis(room_id: str, user_id: str, sid: str):
    """Remove user from room in Redis."""
    r = await get_redis()
    if r:
        await r.hdel(f"room:{room_id}:users", user_id)
        await r.srem(f"room:{room_id}:sids", sid)


async def _get_room_users_redis(room_id: str) -> list:
    """Get all users in a room from Redis."""
    r = await get_redis()
    if r:
        users_data = await r.hgetall(f"room:{room_id}:users")
        return [json.loads(v) for v in users_data.values()]
    return []


async def _broadcast_users_update(room_id: str):
    """Broadcast updated user list to room."""
    users = await _get_room_users_redis(room_id)
    await sio.emit('users_update', users, room=room_id)


# Fallback in-memory state (used when Redis is unavailable)
_in_memory_rooms: dict = {}
_color_index = 0


@app.get("/")
async def root():
    return {
        "message": "LUMO API",
        "version": "1.0.0",
        "status": "running"
    }


@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return {"status": "healthy"}


@app.get("/db-status")
async def db_status():
    """Check database connection and tables"""
    from app.database import engine, Base
    from sqlalchemy import inspect, text

    try:
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()

        # Check tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        return {
            "status": "connected",
            "database_url": engine.url.render_as_string(hide_password=True),
            "tables": tables,
            "expected_tables": ["users", "rooms", "drawing_objects", "ai_prompts", "room_users"]
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "database_url": engine.url.render_as_string(hide_password=True)
        }


# === Socket.IO Events ===

@sio.event
async def connect(sid, environ, auth=None):
    """Handle new Socket.IO connection with JWT authentication."""
    logger.info(f"Client {sid} attempting connection")

    # Try to get token from auth object (newer Socket.IO) or header
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get("token")

    # Fallback to Authorization header
    if not token:
        auth_header = environ.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

    # Reject if no token provided
    if not token:
        logger.warning(f"Connection rejected for {sid}: No token provided")
        raise ConnectionRefusedError("Authentication required")

    # Verify JWT token
    payload = _verify_jwt_token(token)
    if not payload:
        logger.warning(f"Connection rejected for {sid}: Invalid token")
        raise ConnectionRefusedError("Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        logger.warning(f"Connection rejected for {sid}: No user_id in token")
        raise ConnectionRefusedError("Invalid token payload")

    # Store user_id in session
    await sio.save_session(sid, {
        "user_id": user_id,
        "authenticated": True
    })

    logger.info(f"Client {sid} authenticated as user {user_id}")


@sio.event
async def join_room(sid, data):
    """User joins a room with membership validation."""
    # Get authenticated user from session
    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else None

    # Fallback to data (for backward compatibility)
    if not user_id:
        user_id = data.get('user_id')

    if not user_id:
        await sio.emit('error', {'message': 'Authentication required'}, to=sid)
        return

    room_id = data.get('room_id')
    if not room_id:
        await sio.emit('error', {'message': 'room_id required'}, to=sid)
        return

    # Verify room membership
    if not await _is_user_member(user_id, room_id):
        logger.warning(f"User {user_id} attempted to join room {room_id} without membership")
        await sio.emit('error', {'message': 'Access denied: Not a room member'}, to=sid)
        return

    # Add user to room state (Redis or in-memory)
    r = await get_redis()
    if r:
        await _add_user_to_room_redis(room_id, user_id, f'User {user_id[:8]}', sid)
    else:
        # Fallback to in-memory
        global _in_memory_rooms, _color_index
        if room_id not in _in_memory_rooms:
            _in_memory_rooms[room_id] = {'users': {}, 'objects': [], 'cursor_positions': {}}

        color = list(user_colors.values())[_color_index % len(user_colors)]
        _color_index += 1
        _in_memory_rooms[room_id]['users'][user_id] = {
            'id': user_id,
            'name': f'User {user_id[:8]}',
            'color': color,
            'sid': sid
        }

    # Load room data from database and send to user
    db = SessionLocal()
    try:
        room = db.query(Room).filter(Room.id == room_id).first()
        if room:
            # Ensure user is a member (for share-link flow)
            _ensure_room_member(db, room, user_id)

            # Send room data
            objects_data = [
                {
                    'id': obj.id,
                    'type': obj.type,
                    'x': obj.x,
                    'y': obj.y,
                    'data': obj.data,
                    'userId': obj.user_id,
                    'timestamp': obj.timestamp,
                    'color': obj.color,
                    'strokeWidth': obj.stroke_width,
                }
                for obj in room.objects
            ]
            await sio.emit('room_data', {'objects': objects_data}, to=sid)
    finally:
        db.close()

    # Notify others
    await _broadcast_users_update(room_id)

    sio.enter_room(sid, room_id)
    logger.info(f"User {user_id} joined room {room_id}")


@sio.event
async def draw(sid, data):
    """Handle drawing events."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else data.get('userId')

    room_id = data.get('room_id')
    if not room_id:
        return

    # Verify membership
    if user_id and not await _is_user_member(user_id, room_id):
        return

    # Broadcast to all users in room
    await sio.emit('object_drawn', data, room=room_id, skip_sid=sid)

    # Save to database
    db = SessionLocal()
    try:
        from app.database import DrawingObject
        obj = DrawingObject(
            room_id=room_id,
            user_id=user_id,
            type=data.get('type'),
            x=data.get('x'),
            y=data.get('y'),
            data=data.get('data', {}),
            color=data.get('color'),
            stroke_width=data.get('strokeWidth'),
            timestamp=int(time.time() * 1000)
        )
        db.add(obj)
        db.commit()
    finally:
        db.close()


@sio.event
async def cursor_move(sid, data):
    """Handle cursor movement."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else data.get('userId')

    room_id = data.get('room_id')
    if not room_id:
        return

    # Verify membership
    if user_id and not await _is_user_member(user_id, room_id):
        return

    # Broadcast cursor position
    cursor_data = {
        'userId': user_id or sid,
        'x': data.get('x'),
        'y': data.get('y'),
    }

    await sio.emit('cursor_moved', cursor_data, room=room_id, skip_sid=sid)


@sio.event
async def delete_object(sid, data):
    """Handle object deletion."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else data.get('userId')

    room_id = data.get('room_id')
    object_id = data.get('object_id')

    if not room_id or not object_id:
        return

    # Verify membership
    if user_id and not await _is_user_member(user_id, room_id):
        return

    # Broadcast deletion
    await sio.emit(
        'object_deleted',
        {'object_id': object_id},
        room=room_id
    )

    # Delete from database
    db = SessionLocal()
    try:
        from app.database import DrawingObject
        obj = db.query(DrawingObject).filter(
            DrawingObject.id == object_id,
            DrawingObject.room_id == room_id
        ).first()
        if obj:
            db.delete(obj)
            db.commit()
    finally:
        db.close()


@sio.event
async def clear_room(sid, data):
    """Clear all drawing objects in room."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else data.get('userId')

    room_id = data.get('room_id')
    if not room_id:
        return

    # Verify membership
    if user_id and not await _is_user_member(user_id, room_id):
        return

    # Broadcast clear
    await sio.emit('room_cleared', {}, room=room_id)

    # Clear from database
    db = SessionLocal()
    try:
        from app.database import DrawingObject
        db.query(DrawingObject).filter(
            DrawingObject.room_id == room_id
        ).delete()
        db.commit()
    finally:
        db.close()


@sio.event
async def leave_room(sid, data):
    """User leaves a room."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else data.get('user_id')

    room_id = data.get('room_id')
    if not room_id:
        return

    # Remove from Redis or in-memory
    r = await get_redis()
    if r:
        await _remove_user_from_room_redis(room_id, user_id or sid, sid)
    else:
        global _in_memory_rooms
        if room_id in _in_memory_rooms:
            for uid, user in list(_in_memory_rooms[room_id]['users'].items()):
                if user['sid'] == sid:
                    del _in_memory_rooms[room_id]['users'][uid]
                    break

    # Notify others
    await _broadcast_users_update(room_id)

    sio.leave_room(sid, room_id)
    logger.info(f"User left room {room_id}")


@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    logger.info(f"Client {sid} disconnected")

    # Get session to find user_id
    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else None

    # Remove from all rooms (in-memory fallback)
    r = await get_redis()
    if not r:
        global _in_memory_rooms
        for room_id in list(_in_memory_rooms.keys()):
            for uid, user in list(_in_memory_rooms[room_id]['users'].items()):
                if user['sid'] == sid:
                    del _in_memory_rooms[room_id]['users'][uid]
                    await sio.emit('users_update', list(_in_memory_rooms[room_id]['users'].values()), room=room_id)
                    break

            if not _in_memory_rooms[room_id]['users']:
                del _in_memory_rooms[room_id]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
