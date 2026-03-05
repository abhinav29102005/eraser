from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class DrawingObjectCreate(BaseModel):
    type: str
    x: float
    y: float
    data: dict
    color: Optional[str] = None
    stroke_width: Optional[float] = None


class DrawingObject(DrawingObjectCreate):
    id: str
    user_id: str
    timestamp: int


class RoomCreate(BaseModel):
    name: str


class RoomResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    objects: List[DrawingObject] = []

    class Config:
        from_attributes = True


class AIPromptRequest(BaseModel):
    prompt: str


class AIPromptResponse(BaseModel):
    id: str
    prompt: str
    result: str
    timestamp: int


class AIDiagramSVGResponse(BaseModel):
    id: str
    prompt: str
    mermaid: str
    message: str
    type: str = "mermaid"
    timestamp: int


class CanvasSaveObject(BaseModel):
    type: str
    x: float
    y: float
    data: dict
    color: Optional[str] = None
    stroke_width: Optional[float] = None
    user_id: Optional[str] = None
    timestamp: Optional[int] = None


class CanvasSaveRequest(BaseModel):
    objects: List[CanvasSaveObject] = []
