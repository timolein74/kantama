from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import random
import string

from app.database import get_db
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationType, ApplicationStatus
from app.models.assignment import ApplicationAssignment
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    LeasingApplicationCreate, SaleLeasebackApplicationCreate
)
from app.utils.auth import get_current_user, require_role
from app.services.notification_service import notification_service
from app.services.email_service import email_service


router = APIRouter()


def generate_reference_number(app_type: ApplicationType) -> str:
    """Generate unique reference number"""
    prefix = "LEA" if app_type == ApplicationType.LEASING else "SLB"
    year = datetime.now().year
    random_part = ''.join(random.choices(string.digits, k=5))
    return f"{prefix}-{year}-{random_part}"


@router.get("/", response_model=List[ApplicationResponse])
async def list_applications(
    status_filter: Optional[ApplicationStatus] = None,
    type_filter: Optional[ApplicationType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List applications based on user role"""
    query = select(Application).options(selectinload(Application.files))
    
    if current_user.role == UserRole.CUSTOMER:
        # Customers see only their own applications
        query = query.where(Application.customer_id == current_user.id)
    elif current_user.role == UserRole.FINANCIER:
        # Financiers see only assigned applications
        query = query.join(ApplicationAssignment).where(
            ApplicationAssignment.financier_id == current_user.financier_id
        )
    # Admins see all applications
    
    if status_filter:
        query = query.where(Application.status == status_filter)
    
    if type_filter:
        query = query.where(Application.application_type == type_filter)
    
    query = query.order_by(Application.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get application by ID"""
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.files))
        .where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hakemusta ei löytynyt"
        )
    
    # Check access
    if current_user.role == UserRole.CUSTOMER:
        if application.customer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ei käyttöoikeutta"
            )
    elif current_user.role == UserRole.FINANCIER:
        # Check if assigned to this financier
        assignment_result = await db.execute(
            select(ApplicationAssignment).where(
                ApplicationAssignment.application_id == application_id,
                ApplicationAssignment.financier_id == current_user.financier_id
            )
        )
        if not assignment_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ei käyttöoikeutta"
            )
    
    return application


@router.post("/leasing", response_model=ApplicationResponse)
async def create_leasing_application(
    application_data: LeasingApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new leasing application"""
    reference_number = generate_reference_number(ApplicationType.LEASING)
    
    application = Application(
        reference_number=reference_number,
        application_type=ApplicationType.LEASING,
        status=ApplicationStatus.SUBMITTED,
        customer_id=current_user.id,
        equipment_price=application_data.equipment_price,
        submitted_at=datetime.utcnow(),
        **application_data.model_dump(exclude={"equipment_price"})
    )
    
    db.add(application)
    await db.commit()
    await db.refresh(application)
    
    # Create notification
    await notification_service.notify_application_submitted(
        db=db,
        user_id=current_user.id,
        application_id=application.id,
        reference_number=reference_number
    )
    
    # Notify admin
    await email_service.send_admin_notification(
        subject=f"Uusi leasing-hakemus: {reference_number}",
        event_type="UUSI HAKEMUS",
        application_ref=reference_number,
        details={
            "Tyyppi": "Leasing",
            "Yritys": application.company_name,
            "Y-tunnus": application.business_id,
            "Summa": f"{application.equipment_price:,.2f} €",
            "Yhteyshenkilö": application.contact_email
        }
    )
    
    return application


@router.post("/sale-leaseback", response_model=ApplicationResponse)
async def create_sale_leaseback_application(
    application_data: SaleLeasebackApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new sale-leaseback application"""
    reference_number = generate_reference_number(ApplicationType.SALE_LEASEBACK)
    
    application = Application(
        reference_number=reference_number,
        application_type=ApplicationType.SALE_LEASEBACK,
        status=ApplicationStatus.SUBMITTED,
        customer_id=current_user.id,
        equipment_price=application_data.current_value,  # Use current value as equipment price
        submitted_at=datetime.utcnow(),
        **application_data.model_dump()
    )
    
    db.add(application)
    await db.commit()
    await db.refresh(application)
    
    # Create notification
    await notification_service.notify_application_submitted(
        db=db,
        user_id=current_user.id,
        application_id=application.id,
        reference_number=reference_number
    )
    
    # Notify admin
    await email_service.send_admin_notification(
        subject=f"Uusi takaisinvuokraus-hakemus: {reference_number}",
        event_type="UUSI HAKEMUS",
        application_ref=reference_number,
        details={
            "Tyyppi": "Sale-Leaseback (Takaisinvuokraus)",
            "Yritys": application.company_name,
            "Y-tunnus": application.business_id,
            "Nykyarvo": f"{application.current_value:,.2f} €",
            "Alkuperäinen hinta": f"{application.original_purchase_price:,.2f} €",
            "Yhteyshenkilö": application.contact_email
        }
    )
    
    return application


@router.post("/public/leasing", response_model=ApplicationResponse)
async def create_public_leasing_application(
    application_data: LeasingApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a leasing application without authentication (for landing page)"""
    from app.models.user import User
    from app.utils.auth import get_password_hash
    
    # Check if user exists
    result = await db.execute(select(User).where(User.email == application_data.contact_email))
    user = result.scalar_one_or_none()
    
    is_new_user = False
    if not user:
        is_new_user = True
        # Use customer-provided password or generate one
        if application_data.password:
            password = application_data.password
        else:
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        
        user = User(
            email=application_data.contact_email,
            password_hash=get_password_hash(password),
            role=UserRole.CUSTOMER,
            company_name=application_data.company_name,
            business_id=application_data.business_id,
            phone=application_data.contact_phone,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.flush()
        
        # Send welcome email with login info
        await email_service.send_welcome_email(
            email=user.email,
            company_name=application_data.company_name,
            password=password if not application_data.password else None
        )
    
    # Create application
    reference_number = generate_reference_number(ApplicationType.LEASING)
    
    # Store new fields in extra_data including YTJ data
    extra_data = {
        "link_to_item": application_data.link_to_item,
        "ytj_data": application_data.ytj_data,  # Full YTJ company data from PRH
    }
    
    application = Application(
        reference_number=reference_number,
        application_type=ApplicationType.LEASING,
        status=ApplicationStatus.SUBMITTED,
        customer_id=user.id,
        company_name=application_data.company_name,
        business_id=application_data.business_id,
        contact_email=application_data.contact_email,
        contact_phone=application_data.contact_phone,
        equipment_description=application_data.equipment_description or "Katso linkki",
        equipment_supplier=application_data.equipment_supplier,
        equipment_price=application_data.equipment_price,
        requested_term_months=application_data.requested_term_months,
        additional_info=application_data.additional_info,
        extra_data=extra_data,
        submitted_at=datetime.utcnow(),
    )
    
    db.add(application)
    await db.commit()
    
    # Re-query with files relationship loaded to avoid greenlet error
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.files))
        .where(Application.id == application.id)
    )
    application = result.scalar_one()
    
    # Notify admin
    await email_service.send_admin_notification(
        subject=f"Uusi leasing-hakemus: {reference_number}",
        event_type="UUSI HAKEMUS",
        application_ref=reference_number,
        details={
            "Tyyppi": "Leasing",
            "Yritys": application.company_name,
            "Y-tunnus": application.business_id,
            "Summa": f"{application.equipment_price:,.2f} €",
            "Linkki": application_data.link_to_item or "-",
            "Yhteyshenkilö": application.contact_email
        }
    )
    
    return application


@router.post("/public/sale-leaseback", response_model=ApplicationResponse)
async def create_public_sale_leaseback_application(
    application_data: SaleLeasebackApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a sale-leaseback application without authentication (for landing page)"""
    from app.models.user import User
    from app.utils.auth import get_password_hash
    
    # Check if user exists
    result = await db.execute(select(User).where(User.email == application_data.contact_email))
    user = result.scalar_one_or_none()
    
    is_new_user = False
    if not user:
        is_new_user = True
        # Use customer-provided password or generate one
        if application_data.password:
            password = application_data.password
        else:
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        
        user = User(
            email=application_data.contact_email,
            password_hash=get_password_hash(password),
            role=UserRole.CUSTOMER,
            company_name=application_data.company_name,
            business_id=application_data.business_id,
            phone=application_data.contact_phone,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.flush()
        
        # Send welcome email with login info
        await email_service.send_welcome_email(
            email=user.email,
            company_name=application_data.company_name,
            password=password if not application_data.password else None
        )
    
    # Create application
    reference_number = generate_reference_number(ApplicationType.SALE_LEASEBACK)
    
    # Store new fields in extra_data including YTJ data
    extra_data = {
        "year_model": application_data.year_model,
        "hours": application_data.hours,
        "kilometers": application_data.kilometers,
        "ytj_data": application_data.ytj_data,  # Full YTJ company data from PRH
    }
    
    application = Application(
        reference_number=reference_number,
        application_type=ApplicationType.SALE_LEASEBACK,
        status=ApplicationStatus.SUBMITTED,
        customer_id=user.id,
        company_name=application_data.company_name,
        business_id=application_data.business_id,
        contact_email=application_data.contact_email,
        contact_phone=application_data.contact_phone,
        equipment_description=application_data.equipment_description,
        equipment_price=application_data.current_value,
        current_value=application_data.current_value,
        requested_term_months=application_data.requested_term_months,
        additional_info=application_data.additional_info,
        extra_data=extra_data,
        submitted_at=datetime.utcnow(),
    )
    
    db.add(application)
    await db.commit()
    
    # Re-query with files relationship loaded to avoid greenlet error
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.files))
        .where(Application.id == application.id)
    )
    application = result.scalar_one()
    
    # Notify admin
    await email_service.send_admin_notification(
        subject=f"Uusi takaisinvuokraus-hakemus: {reference_number}",
        event_type="UUSI HAKEMUS",
        application_ref=reference_number,
        details={
            "Tyyppi": "Sale-Leaseback (Takaisinvuokraus)",
            "Yritys": application.company_name,
            "Y-tunnus": application.business_id,
            "Vuosimalli": str(application_data.year_model),
            "Tunnit": str(application_data.hours or "-"),
            "Kilometrit": str(application_data.kilometers or "-"),
            "Nykyarvo": f"{application.current_value:,.2f} €",
            "Yhteyshenkilö": application.contact_email
        }
    )
    
    return application


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: int,
    application_data: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update application (Customer can update own, Admin can update all)"""
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hakemusta ei löytynyt"
        )
    
    # Check access
    if current_user.role == UserRole.CUSTOMER:
        if application.customer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ei käyttöoikeutta"
            )
        # Customers can only update in certain statuses
        if application.status not in [ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED, ApplicationStatus.INFO_REQUESTED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hakemusta ei voi enää muokata tässä tilassa"
            )
    
    for field, value in application_data.model_dump(exclude_unset=True).items():
        if field == "status" and current_user.role == UserRole.CUSTOMER:
            continue  # Customers cannot change status
        setattr(application, field, value)
    
    await db.commit()
    await db.refresh(application)
    
    return application

