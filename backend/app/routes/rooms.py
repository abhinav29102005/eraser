from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, Room, User, DrawingObject
from app.schemas import RoomCreate, RoomResponse, DrawingObjectCreate, DrawingObject as DrawingObjectSchema
from app.security import get_current_user
import time

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("/", response_model=RoomResponse)
async def create_room(
    room: RoomCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create room
    new_room = Room(name=room.name)
    
    # Add current user to room
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    new_room.users.append(user)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    
    return new_room


@router.get("/", response_model=list[RoomResponse])
async def get_rooms(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user.rooms


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    
    # Check if user is in room
    if user_id not in [u.id for u in room.users]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    return room


@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: str,
    room_update: RoomCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    
    room.name = room_update.name
    db.commit()
    db.refresh(room)
    
    return room


@router.delete("/{room_id}")
async def delete_room(
    room_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    
    db.delete(room)
    db.commit()
    
    return {"message": "Room deleted"}


@router.post("/{room_id}/objects", response_model=DrawingObjectSchema)
async def add_object(
    room_id: str,
    obj: DrawingObjectCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify room exists
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    
    # Create drawing object
    new_obj = DrawingObject(
        room_id=room_id,
        user_id=user_id,
        type=obj.type,
        x=obj.x,
        y=obj.y,
        data=obj.data,
        color=obj.color,
        stroke_width=obj.stroke_width,
        timestamp=int(time.time())
    )
    
    db.add(new_obj)
    db.commit()
    db.refresh(new_obj)
    
    return new_obj


@router.put("/{room_id}/objects/{object_id}", response_model=DrawingObjectSchema)
async def update_object(
    room_id: str,
    object_id: str,
    obj_update: DrawingObjectCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    obj = db.query(DrawingObject).filter(
        DrawingObject.id == object_id,
        DrawingObject.room_id == room_id
    ).first()
    
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Object not found")
    
    obj.x = obj_update.x
    obj.y = obj_update.y
    obj.data = obj_update.data
    obj.color = obj_update.color
    obj.stroke_width = obj_update.stroke_width
    
    db.commit()
    db.refresh(obj)
    
    return obj


@router.delete("/{room_id}/objects/{object_id}")
async def delete_object(
    room_id: str,
    object_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    obj = db.query(DrawingObject).filter(
        DrawingObject.id == object_id,
        DrawingObject.room_id == room_id
    ).first()
    
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Object not found")
    
    db.delete(obj)
    db.commit()
    
    return {"message": "Object deleted"}
