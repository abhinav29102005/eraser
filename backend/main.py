import os
import time
import json
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from socketio import AsyncServer
from aiohttp import web
import aiohttp

from app.routes import auth, rooms, ai
from app.database import SessionLocal, Room, User

logger = logging.getLogger("lumo")

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(ai.router)

# Store active connections
active_rooms = {}
user_colors = {
    "red": "#FF6B6B",
    "orange": "#FFA500",
    "yellow": "#FFD93D",
    "green": "#6BCB77",
    "blue": "#4D96FF",
    "purple": "#9D84B7",
}
color_index = 0


@app.get("/")
async def root():
    return {
        "message": "LUMO API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


# Socket.IO events
@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")
    # Get user_id from auth
    auth = environ.get('HTTP_AUTHORIZATION', '')
    print(f"Connection from {sid}")


@sio.event
async def join_room(sid, data):
    """User joins a room."""
    room_id = data.get('room_id')
    user_id = data.get('user_id') or sid
    
    if room_id not in active_rooms:
        active_rooms[room_id] = {
            'users': {},
            'objects': [],
            'cursor_positions': {}
        }
    
    # Add user to room
    global color_index
    color = list(user_colors.values())[color_index % len(user_colors)]
    color_index += 1
    
    active_rooms[room_id]['users'][user_id] = {
        'id': user_id,
        'name': f'User {user_id[:8]}',
        'color': color,
        'sid': sid
    }
    
    # Load room data from database
    db = SessionLocal()
    try:
        room = db.query(Room).filter(Room.id == room_id).first()
        if room:
            # Send room data to user
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
                for obj in room.drawing_objects
            ]
            await sio.emit('room_data', {'objects': objects_data}, to=sid)
    finally:
        db.close()
    
    # Notify others
    users_list = list(active_rooms[room_id]['users'].values())
    await sio.emit(
        'users_update',
        users_list,
        room=room_id
    )
    
    sio.enter_room(sid, room_id)
    print(f"User {user_id} joined room {room_id}")


@sio.event
async def draw(sid, data):
    """Handle drawing events."""
    room_id = data.get('room_id')
    if room_id not in active_rooms:
        return
    
    # Broadcast to all users in room
    await sio.emit('object_drawn', data, room=room_id, skip_sid=sid)
    
    # Save to database
    db = SessionLocal()
    try:
        from app.database import DrawingObject
        obj = DrawingObject(
            room_id=room_id,
            user_id=data.get('userId'),
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
    room_id = data.get('room_id')
    if room_id not in active_rooms:
        return
    
    # Broadcast cursor position
    cursor_data = {
        'userId': data.get('userId', sid),
        'x': data.get('x'),
        'y': data.get('y'),
    }
    
    await sio.emit('cursor_moved', cursor_data, room=room_id, skip_sid=sid)


@sio.event
async def delete_object(sid, data):
    """Handle object deletion."""
    room_id = data.get('room_id')
    object_id = data.get('object_id')
    
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
    room_id = data.get('room_id')
    
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
    room_id = data.get('room_id')
    
    if room_id in active_rooms:
        # Remove user from room
        for user_id, user in list(active_rooms[room_id]['users'].items()):
            if user['sid'] == sid:
                del active_rooms[room_id]['users'][user_id]
                break
        
        # Notify others
        users_list = list(active_rooms[room_id]['users'].values())
        await sio.emit('users_update', users_list, room=room_id)
        
        # Remove room if empty
        if not active_rooms[room_id]['users']:
            del active_rooms[room_id]
    
    sio.leave_room(sid, room_id)
    print(f"User left room {room_id}")


@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    print(f"Client {sid} disconnected")
    
    # Remove from all rooms
    for room_id in list(active_rooms.keys()):
        for user_id, user in list(active_rooms[room_id]['users'].items()):
            if user['sid'] == sid:
                del active_rooms[room_id]['users'][user_id]
                users_list = list(active_rooms[room_id]['users'].values())
                await sio.emit('users_update', users_list, room=room_id)
                break
        
        if not active_rooms[room_id]['users']:
            del active_rooms[room_id]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
