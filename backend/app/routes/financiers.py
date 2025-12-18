from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db
from app.models.financier import Financier
from app.models.user import User, UserRole
from app.schemas.financier import FinancierCreate, FinancierUpdate, FinancierResponse
from app.utils.auth import require_role, get_current_user


router = APIRouter()


@router.get("/", response_model=List[FinancierResponse])
async def list_financiers(
    active_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """List all financiers (Admin only)"""
    query = select(Financier).options(selectinload(Financier.users))
    
    if active_only:
        query = query.where(Financier.is_active == True)
    
    query = query.order_by(Financier.name)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/active", response_model=List[FinancierResponse])
async def list_active_financiers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """List active financiers for dropdown"""
    query = select(Financier).options(selectinload(Financier.users)).where(Financier.is_active == True).order_by(Financier.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{financier_id}", response_model=FinancierResponse)
async def get_financier(
    financier_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Get financier by ID (Admin only)"""
    result = await db.execute(
        select(Financier)
        .options(selectinload(Financier.users))
        .where(Financier.id == financier_id)
    )
    financier = result.scalar_one_or_none()
    
    if not financier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rahoittajaa ei löytynyt"
        )
    
    return financier


@router.post("/", response_model=FinancierResponse)
async def create_financier(
    financier_data: FinancierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Create a new financier (Admin only)"""
    financier = Financier(**financier_data.model_dump())
    
    db.add(financier)
    await db.commit()
    
    # Re-query with users relationship loaded
    result = await db.execute(
        select(Financier)
        .options(selectinload(Financier.users))
        .where(Financier.id == financier.id)
    )
    return result.scalar_one()


@router.put("/{financier_id}", response_model=FinancierResponse)
async def update_financier(
    financier_id: int,
    financier_data: FinancierUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Update financier (Admin only)"""
    result = await db.execute(select(Financier).where(Financier.id == financier_id))
    financier = result.scalar_one_or_none()
    
    if not financier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rahoittajaa ei löytynyt"
        )
    
    for field, value in financier_data.model_dump(exclude_unset=True).items():
        setattr(financier, field, value)
    
    await db.commit()
    
    # Re-query with users relationship loaded
    result = await db.execute(
        select(Financier)
        .options(selectinload(Financier.users))
        .where(Financier.id == financier_id)
    )
    return result.scalar_one()


@router.delete("/{financier_id}")
async def delete_financier(
    financier_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Delete/deactivate financier (Admin only)"""
    result = await db.execute(select(Financier).where(Financier.id == financier_id))
    financier = result.scalar_one_or_none()
    
    if not financier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rahoittajaa ei löytynyt"
        )
    
    # Soft delete by deactivating
    financier.is_active = False
    await db.commit()
    
    return {"message": "Rahoittaja deaktivoitu"}

