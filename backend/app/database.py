import os
from sqlalchemy import create_engine, Column, String, DateTime, Float, JSON, Integer, BigInteger, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import uuid

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Normalize SQLAlchemy URL for psycopg v3.
# Allows users to keep DATABASE_URL=postgresql://... in env files.
if DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# Connection pool settings for production PostgreSQL
is_postgres = "postgresql" in DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    # Production-grade connection pool
    pool_size=20 if is_postgres else 5,
    max_overflow=10 if is_postgres else 5,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Association table for room users
room_users = Table(
    'room_users',
    Base.metadata,
    Column('room_id', String, ForeignKey('rooms.id'), primary_key=True),
    Column('user_id', String, ForeignKey('users.id'), primary_key=True)
)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    rooms = relationship("Room", secondary=room_users, back_populates="users")
    drawing_objects = relationship("DrawingObject", back_populates="user", cascade="all, delete-orphan")
    ai_prompts = relationship("AIPrompt", back_populates="user", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    owner_id = Column(String, index=True)  # Track room owner
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", secondary=room_users, back_populates="rooms")
    objects = relationship("DrawingObject", back_populates="room", cascade="all, delete-orphan")


class DrawingObject(Base):
    __tablename__ = "drawing_objects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String, ForeignKey("rooms.id"), index=True)
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(String)
    x = Column(Float)
    y = Column(Float)
    data = Column(JSON)
    color = Column(String, nullable=True)
    stroke_width = Column(Float, nullable=True)
    timestamp = Column(BigInteger)

    room = relationship("Room", back_populates="objects")
    user = relationship("User", back_populates="drawing_objects")


class AIPrompt(Base):
    __tablename__ = "ai_prompts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    room_id = Column(String, ForeignKey("rooms.id"), nullable=True)
    prompt = Column(String)
    result = Column(String)
    timestamp = Column(BigInteger)

    user = relationship("User", back_populates="ai_prompts")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_timestamp_columns():
    """Migrate timestamp columns from INTEGER to BIGINT if needed."""
    if "postgresql" in DATABASE_URL:
        with engine.begin() as connection:
            # Check if drawing_objects.timestamp is still INTEGER and migrate if needed
            try:
                connection.execute("""
                    ALTER TABLE drawing_objects ALTER COLUMN timestamp TYPE BIGINT;
                """)
            except Exception:
                pass  # Column already BIGINT or doesn't exist

            try:
                connection.execute("""
                    ALTER TABLE ai_prompts ALTER COLUMN timestamp TYPE BIGINT;
                """)
            except Exception:
                pass  # Column already BIGINT or doesn't exist


Base.metadata.create_all(bind=engine)
migrate_timestamp_columns()
