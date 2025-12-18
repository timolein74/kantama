from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.utils.auth import get_current_user
from app.services.notification_service import notification_service


router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's notifications"""
    notifications = await notification_service.get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit
    )
    return notifications


@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    count = await notification_service.get_unread_count(db=db, user_id=current_user.id)
    return {"count": count}


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    success = await notification_service.mark_as_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Ilmoitusta ei löytynyt")
    
    return {"message": "Ilmoitus merkitty luetuksi"}


@router.put("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    count = await notification_service.mark_all_as_read(db=db, user_id=current_user.id)
    return {"message": f"{count} ilmoitusta merkitty luetuksi"}

