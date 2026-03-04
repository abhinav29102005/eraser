from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, AIPrompt, Room
from app.schemas import AIPromptRequest, AIPromptResponse
from app.security import get_current_user
from app.ai_service import generate_diagram, analyze_sketch, suggest_edits
import time

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/diagram", response_model=AIPromptResponse)
async def generate_diagram_endpoint(
    request: AIPromptRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a diagram from text prompt using AI."""
    try:
        result = await generate_diagram(request.prompt)
        
        # Save to database
        ai_prompt = AIPrompt(
            user_id=user_id,
            prompt=request.prompt,
            result=result,
            timestamp=int(time.time())
        )
        
        db.add(ai_prompt)
        db.commit()
        db.refresh(ai_prompt)
        
        return ai_prompt
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/analyze", response_model=AIPromptResponse)
async def analyze_sketch_endpoint(
    request: AIPromptRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze a sketch image using AI."""
    try:
        result = await analyze_sketch(request.prompt)
        
        # Save to database
        ai_prompt = AIPrompt(
            user_id=user_id,
            prompt=request.prompt,
            result=result,
            timestamp=int(time.time())
        )
        
        db.add(ai_prompt)
        db.commit()
        db.refresh(ai_prompt)
        
        return ai_prompt
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/suggest", response_model=AIPromptResponse)
async def suggest_edits_endpoint(
    request: AIPromptRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI suggestions for diagram improvements."""
    try:
        result = await suggest_edits(request.prompt)
        
        # Save to database
        ai_prompt = AIPrompt(
            user_id=user_id,
            prompt=request.prompt,
            result=result,
            timestamp=int(time.time())
        )
        
        db.add(ai_prompt)
        db.commit()
        db.refresh(ai_prompt)
        
        return ai_prompt
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
