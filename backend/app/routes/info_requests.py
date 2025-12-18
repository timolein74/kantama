from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStatus
from app.models.assignment import ApplicationAssignment
from app.models.info_request import InfoRequest, InfoRequestStatus, InfoRequestResponse as InfoRequestResponseModel
from app.schemas.info_request import (
    InfoRequestCreate, InfoRequestResponse, InfoRequestResponseCreate
)
from app.utils.auth import get_current_user, require_role
from app.services.notification_service import notification_service
from app.services.email_service import email_service


router = APIRouter()


@router.post("/", response_model=InfoRequestResponse)
async def create_info_request(
    request_data: InfoRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.FINANCIER))
):
    """Create info request (Financier only)"""
    # Get application
    result = await db.execute(
        select(Application).where(Application.id == request_data.application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hakemusta ei löytynyt"
        )
    
    # Verify financier has access
    result = await db.execute(
        select(ApplicationAssignment).where(
            ApplicationAssignment.application_id == application.id,
            ApplicationAssignment.financier_id == current_user.financier_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ei käyttöoikeutta tähän hakemukseen"
        )
    
    # Create info request
    info_request = InfoRequest(
        application_id=application.id,
        financier_id=current_user.financier_id,
        message=request_data.message,
        requested_items=request_data.requested_items,
        status=InfoRequestStatus.PENDING
    )
    
    db.add(info_request)
    
    # Update application status
    application.status = ApplicationStatus.INFO_REQUESTED
    
    await db.commit()
    await db.refresh(info_request)
    
    # Get customer
    result = await db.execute(select(User).where(User.id == application.customer_id))
    customer = result.scalar_one()
    
    # Send notification
    await notification_service.notify_info_requested(
        db=db,
        customer_id=customer.id,
        application_id=application.id,
        reference_number=application.reference_number,
        message=request_data.message
    )
    
    # Send email
    await email_service.send_info_request_to_customer(
        customer_email=customer.email,
        customer_name=customer.full_name,
        application_ref=application.reference_number,
        message=request_data.message,
        requested_items=request_data.requested_items
    )
    
    return info_request


@router.get("/application/{application_id}", response_model=List[InfoRequestResponse])
async def get_application_info_requests(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get info requests for an application"""
    # Verify access
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hakemusta ei löytynyt"
        )
    
    if current_user.role == UserRole.CUSTOMER:
        if application.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    elif current_user.role == UserRole.FINANCIER:
        result = await db.execute(
            select(ApplicationAssignment).where(
                ApplicationAssignment.application_id == application_id,
                ApplicationAssignment.financier_id == current_user.financier_id
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    result = await db.execute(
        select(InfoRequest)
        .options(selectinload(InfoRequest.responses).selectinload(InfoRequestResponseModel.user))
        .where(InfoRequest.application_id == application_id)
        .order_by(InfoRequest.created_at.desc())
    )
    return result.scalars().all()


@router.post("/respond", response_model=InfoRequestResponse)
async def respond_to_info_request(
    response_data: InfoRequestResponseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Respond to info request (Customer or Financier)"""
    # Get info request
    result = await db.execute(
        select(InfoRequest)
        .options(selectinload(InfoRequest.application))
        .where(InfoRequest.id == response_data.info_request_id)
    )
    info_request = result.scalar_one_or_none()
    
    if not info_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lisätietopyyntöä ei löytynyt"
        )
    
    application = info_request.application
    
    # Verify access
    if current_user.role == UserRole.CUSTOMER:
        if application.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    elif current_user.role == UserRole.FINANCIER:
        if info_request.financier_id != current_user.financier_id:
            raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    # Create response
    response = InfoRequestResponseModel(
        info_request_id=info_request.id,
        user_id=current_user.id,
        message=response_data.message,
        attachments=response_data.attachment_ids
    )
    
    db.add(response)
    
    # Update info request status
    info_request.status = InfoRequestStatus.RESPONDED
    
    await db.commit()
    await db.refresh(info_request)
    
    # Send notifications
    if current_user.role == UserRole.CUSTOMER:
        # Notify financier
        result = await db.execute(
            select(User).where(
                User.financier_id == info_request.financier_id,
                User.is_active == True
            )
        )
        financier_users = result.scalars().all()
        
        await notification_service.notify_info_provided(
            db=db,
            financier_user_ids=[u.id for u in financier_users],
            application_id=application.id,
            reference_number=application.reference_number
        )
    
    # Re-fetch with responses
    result = await db.execute(
        select(InfoRequest)
        .options(selectinload(InfoRequest.responses).selectinload(InfoRequestResponseModel.user))
        .where(InfoRequest.id == info_request.id)
    )
    return result.scalar_one()

