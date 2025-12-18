from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserUpdate, UserResponse, FinancierUserCreate
from app.utils.auth import get_current_user, get_password_hash, require_role


router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def list_users(
    role: UserRole = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """List all users (Admin only)"""
    query = select(User)
    if role:
        query = query.where(User.role == role)
    query = query.order_by(User.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Get user by ID (Admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Käyttäjää ei löytynyt"
        )
    
    return user


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    for field, value in user_data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.post("/financier-user", response_model=UserResponse)
async def create_financier_user(
    user_data: FinancierUserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Create a new financier user (Admin only)"""
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sähköpostiosoite on jo käytössä"
        )
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=UserRole.FINANCIER,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        financier_id=user_data.financier_id,
        is_active=True,
        is_verified=True  # Admin-created users are pre-verified
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


@router.put("/{user_id}/activate")
async def activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Activate a user (Admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Käyttäjää ei löytynyt"
        )
    
    user.is_active = True
    await db.commit()
    
    return {"message": "Käyttäjä aktivoitu"}


@router.put("/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Deactivate a user (Admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Käyttäjää ei löytynyt"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Et voi deaktivoida omaa tiliäsi"
        )
    
    user.is_active = False
    await db.commit()
    
    return {"message": "Käyttäjä deaktivoitu"}

