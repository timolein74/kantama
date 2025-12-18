from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStatus
from app.models.assignment import ApplicationAssignment, AssignmentStatus
from app.models.financier import Financier
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.utils.auth import require_role
from app.services.notification_service import notification_service
from app.services.email_service import email_service


router = APIRouter()


@router.post("/", response_model=AssignmentResponse)
async def assign_to_financier(
    assignment_data: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Assign application to financier (Admin only)"""
    # Get application
    result = await db.execute(
        select(Application).where(Application.id == assignment_data.application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hakemusta ei löytynyt"
        )
    
    # Get financier
    result = await db.execute(
        select(Financier).where(Financier.id == assignment_data.financier_id)
    )
    financier = result.scalar_one_or_none()
    
    if not financier or not financier.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rahoittajaa ei löytynyt tai se ei ole aktiivinen"
        )
    
    # Check if already assigned to this financier
    existing = await db.execute(
        select(ApplicationAssignment).where(
            ApplicationAssignment.application_id == assignment_data.application_id,
            ApplicationAssignment.financier_id == assignment_data.financier_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hakemus on jo lähetetty tälle rahoittajalle"
        )
    
    # Create assignment
    assignment = ApplicationAssignment(
        application_id=assignment_data.application_id,
        financier_id=assignment_data.financier_id,
        status=AssignmentStatus.PENDING,
        notes=assignment_data.notes,
        assigned_by_id=current_user.id
    )
    
    db.add(assignment)
    
    # Update application status
    application.status = ApplicationStatus.SUBMITTED_TO_FINANCIER
    
    await db.commit()
    await db.refresh(assignment)
    
    # Get financier users
    result = await db.execute(
        select(User).where(
            User.financier_id == financier.id,
            User.is_active == True
        )
    )
    financier_users = result.scalars().all()
    financier_user_ids = [u.id for u in financier_users]
    
    # Send notifications
    await notification_service.notify_sent_to_financier(
        db=db,
        customer_id=application.customer_id,
        financier_user_ids=financier_user_ids,
        application_id=application.id,
        reference_number=application.reference_number,
        financier_name=financier.name
    )
    
    # Send email to financier
    await email_service.send_application_submitted_to_financier(
        financier_email=financier.email,
        financier_name=financier.name,
        application_ref=application.reference_number,
        company_name=application.company_name,
        application_type=application.application_type.value,
        equipment_price=application.equipment_price
    )
    
    return assignment


@router.get("/application/{application_id}", response_model=List[AssignmentResponse])
async def get_application_assignments(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Get all assignments for an application (Admin only)"""
    result = await db.execute(
        select(ApplicationAssignment)
        .where(ApplicationAssignment.application_id == application_id)
        .order_by(ApplicationAssignment.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/{assignment_id}")
async def remove_assignment(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Remove assignment (Admin only)"""
    result = await db.execute(
        select(ApplicationAssignment).where(ApplicationAssignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Toimeksiantoa ei löytynyt"
        )
    
    await db.delete(assignment)
    await db.commit()
    
    return {"message": "Toimeksianto poistettu"}

