"""
Room Service - Business logic for room operations.
"""
from sqlalchemy.orm import Session
from app.database import Room, User, DrawingObject
from app.schemas import RoomCreate, RoomResponse, DrawingObjectCreate
from fastapi import HTTPException, status
import time
import logging

logger = logging.getLogger("lumo.services.room")


class RoomService:
    """Service class for room-related operations."""

    @staticmethod
    def create_room(db: Session, name: str, user_id: str) -> Room:
        """Create a new room with the user as owner."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        room = Room(name=name, owner_id=user_id)
        room.users.append(user)
        db.add(room)
        db.commit()
        db.refresh(room)
        return room

    @staticmethod
    def get_room(db: Session, room_id: str) -> Room:
        """Get a room by ID."""
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )
        return room

    @staticmethod
    def get_user_rooms(db: Session, user_id: str) -> list[Room]:
        """Get all rooms for a user."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user.rooms

    @staticmethod
    def update_room(db: Session, room_id: str, name: str, user_id: str) -> Room:
        """Update room name. Only owner can update."""
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )

        if room.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only room owner can update room"
            )

        room.name = name
        db.commit()
        db.refresh(room)
        return room

    @staticmethod
    def delete_room(db: Session, room_id: str, user_id: str) -> None:
        """Delete a room. Only owner can delete."""
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )

        if room.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only room owner can delete room"
            )

        db.delete(room)
        db.commit()

    @staticmethod
    def ensure_room_member(db: Session, room: Room, user_id: str) -> None:
        """Auto-add user to room if not already a member."""
        member_ids = {u.id for u in room.users}
        if user_id not in member_ids:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                room.users.append(user)
                db.commit()
                db.refresh(room)

    @staticmethod
    def is_user_member(db: Session, room_id: str, user_id: str) -> bool:
        """Check if user is a member of the room."""
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            return False
        member_ids = {u.id for u in room.users}
        return user_id in member_ids

    @staticmethod
    def add_drawing_object(
        db: Session,
        room_id: str,
        user_id: str,
        obj_data: DrawingObjectCreate
    ) -> DrawingObject:
        """Add a drawing object to a room."""
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )

        # Ensure membership
        RoomService.ensure_room_member(db, room, user_id)

        new_obj = DrawingObject(
            room_id=room_id,
            user_id=user_id,
            type=obj_data.type,
            x=obj_data.x,
            y=obj_data.y,
            data=obj_data.data,
            color=obj_data.color,
            stroke_width=obj_data.stroke_width,
            timestamp=int(time.time() * 1000)
        )

        db.add(new_obj)
        db.commit()
        db.refresh(new_obj)
        return new_obj

    @staticmethod
    def save_canvas(db: Session, room_id: str, user_id: str, objects: list) -> int:
        """Bulk save canvas objects. Returns count of saved objects."""
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )

        RoomService.ensure_room_member(db, room, user_id)

        try:
            # Remove old objects
            db.query(DrawingObject).filter(
                DrawingObject.room_id == room_id
            ).delete(synchronize_session="fetch")

            # Insert new objects
            now = int(time.time() * 1000)
            for obj in objects:
                new_obj = DrawingObject(
                    room_id=room_id,
                    user_id=user_id,
                    type=obj.type,
                    x=obj.x,
                    y=obj.y,
                    data=obj.data if obj.data is not None else {},
                    color=obj.color,
                    stroke_width=obj.stroke_width,
                    timestamp=obj.timestamp or now,
                )
                db.add(new_obj)

            db.commit()
            return len(objects)
        except Exception as e:
            db.rollback()
            logger.error("Canvas save failed for room %s: %s", room_id, e)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save canvas: {str(e)}"
            )
