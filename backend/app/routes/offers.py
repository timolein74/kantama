from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStatus
from app.models.assignment import ApplicationAssignment
from app.models.offer import Offer, OfferStatus
from app.models.financier import Financier
from app.schemas.offer import OfferCreate, OfferUpdate, OfferResponse, OfferCustomerResponse
from app.utils.auth import get_current_user, require_role
from app.services.notification_service import notification_service
from app.services.email_service import email_service


router = APIRouter()


@router.post("/", response_model=OfferResponse)
async def create_offer(
    offer_data: OfferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.FINANCIER))
):
    """Create offer draft (Financier only)"""
    # Verify access to application
    result = await db.execute(
        select(Application).where(Application.id == offer_data.application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(status_code=404, detail="Hakemusta ei löytynyt")
    
    result = await db.execute(
        select(ApplicationAssignment).where(
            ApplicationAssignment.application_id == application.id,
            ApplicationAssignment.financier_id == current_user.financier_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    offer = Offer(
        application_id=application.id,
        financier_id=current_user.financier_id,
        status=OfferStatus.DRAFT,
        **offer_data.model_dump(exclude={"application_id"})
    )
    
    db.add(offer)
    await db.commit()
    await db.refresh(offer)
    
    return offer


@router.put("/{offer_id}", response_model=OfferResponse)
async def update_offer(
    offer_id: int,
    offer_data: OfferUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.FINANCIER))
):
    """Update offer (Financier only, draft status)"""
    result = await db.execute(
        select(Offer).where(Offer.id == offer_id)
    )
    offer = result.scalar_one_or_none()
    
    if not offer:
        raise HTTPException(status_code=404, detail="Tarjousta ei löytynyt")
    
    if offer.financier_id != current_user.financier_id:
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    if offer.status != OfferStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Vain luonnostilassa olevia tarjouksia voi muokata")
    
    for field, value in offer_data.model_dump(exclude_unset=True).items():
        if field != "status":  # Status handled separately
            setattr(offer, field, value)
    
    await db.commit()
    await db.refresh(offer)
    
    return offer


@router.post("/{offer_id}/send", response_model=OfferResponse)
async def send_offer_to_admin(
    offer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.FINANCIER))
):
    """Send offer to admin for approval (Financier only)"""
    result = await db.execute(
        select(Offer).where(Offer.id == offer_id)
    )
    offer = result.scalar_one_or_none()
    
    if not offer:
        raise HTTPException(status_code=404, detail="Tarjousta ei löytynyt")
    
    if offer.financier_id != current_user.financier_id:
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    if offer.status != OfferStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Tarjous on jo lähetetty")
    
    # Get application
    result = await db.execute(
        select(Application).where(Application.id == offer.application_id)
    )
    application = result.scalar_one()
    
    # Get financier info
    result = await db.execute(
        select(Financier).where(Financier.id == offer.financier_id)
    )
    financier = result.scalar_one()
    
    # Update offer - send to admin for approval
    offer.status = OfferStatus.PENDING_ADMIN
    
    await db.commit()
    await db.refresh(offer)
    
    # Notify admin
    await email_service.send_admin_notification(
        subject=f"Uusi tarjous odottaa hyväksyntää: {application.reference_number}",
        event_type="TARJOUS ODOTTAA HYVÄKSYNTÄÄ",
        application_ref=application.reference_number,
        details={
            "Rahoittaja": financier.name,
            "Yritys": application.company_name,
            "Kuukausierä": f"{offer.monthly_payment:,.2f} €",
            "Sopimuskausi": f"{offer.term_months} kk",
            "Jäännösarvo": f"{offer.residual_value:,.2f} €" if offer.residual_value else "-"
        }
    )
    
    # Notify all admins
    result = await db.execute(
        select(User).where(User.role == UserRole.ADMIN, User.is_active == True)
    )
    admin_users = result.scalars().all()
    
    for admin in admin_users:
        await notification_service.create_notification(
            db=db,
            user_id=admin.id,
            title="Tarjous odottaa hyväksyntää",
            message=f"Rahoittaja {financier.name} on lähettänyt tarjouksen hakemukselle {application.reference_number}",
            notification_type="OFFER_PENDING",
            reference_type="offer",
            reference_id=offer.id,
            action_url=f"/admin/applications/{application.id}"
        )
    
    return offer


@router.post("/{offer_id}/approve", response_model=OfferResponse)
async def approve_and_send_offer(
    offer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Approve offer and send to customer (Admin only)"""
    result = await db.execute(
        select(Offer).where(Offer.id == offer_id)
    )
    offer = result.scalar_one_or_none()
    
    if not offer:
        raise HTTPException(status_code=404, detail="Tarjousta ei löytynyt")
    
    if offer.status != OfferStatus.PENDING_ADMIN:
        raise HTTPException(status_code=400, detail="Tarjous ei ole odottamassa hyväksyntää")
    
    # Get application
    result = await db.execute(
        select(Application).where(Application.id == offer.application_id)
    )
    application = result.scalar_one()
    
    # Get customer
    result = await db.execute(
        select(User).where(User.id == application.customer_id)
    )
    customer = result.scalar_one()
    
    # Update offer
    offer.status = OfferStatus.SENT
    offer.sent_at = datetime.utcnow()
    
    # Update application status
    application.status = ApplicationStatus.OFFER_SENT
    
    await db.commit()
    await db.refresh(offer)
    
    # Send notification to customer
    await notification_service.notify_offer_sent(
        db=db,
        customer_id=customer.id,
        application_id=application.id,
        reference_number=application.reference_number,
        monthly_payment=offer.monthly_payment
    )
    
    # Send email to customer
    await email_service.send_offer_to_customer(
        customer_email=customer.email,
        customer_name=customer.full_name,
        application_ref=application.reference_number,
        monthly_payment=offer.monthly_payment,
        term_months=offer.term_months,
        notes=offer.notes_to_customer
    )
    
    return offer


@router.post("/{offer_id}/accept")
async def accept_offer(
    offer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CUSTOMER))
):
    """Accept offer (Customer only)"""
    result = await db.execute(
        select(Offer).where(Offer.id == offer_id)
    )
    offer = result.scalar_one_or_none()
    
    if not offer:
        raise HTTPException(status_code=404, detail="Tarjousta ei löytynyt")
    
    if offer.status != OfferStatus.SENT:
        raise HTTPException(status_code=400, detail="Tarjousta ei voi hyväksyä tässä tilassa")
    
    # Verify customer owns the application
    result = await db.execute(
        select(Application).where(Application.id == offer.application_id)
    )
    application = result.scalar_one()
    
    if application.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    # Update offer
    offer.status = OfferStatus.ACCEPTED
    offer.responded_at = datetime.utcnow()
    
    # Update application
    application.status = ApplicationStatus.OFFER_ACCEPTED
    
    await db.commit()
    
    # Get financier info
    result = await db.execute(
        select(Financier).where(Financier.id == offer.financier_id)
    )
    financier = result.scalar_one()
    
    result = await db.execute(
        select(User).where(
            User.financier_id == financier.id,
            User.is_active == True
        )
    )
    financier_users = result.scalars().all()
    
    # Notify financier
    await notification_service.notify_offer_accepted(
        db=db,
        financier_user_ids=[u.id for u in financier_users],
        application_id=application.id,
        reference_number=application.reference_number,
        company_name=application.company_name
    )
    
    # Send emails
    await email_service.send_offer_accepted_notification(
        to_email=financier.email,
        recipient_name=financier.name,
        application_ref=application.reference_number,
        company_name=application.company_name,
        monthly_payment=offer.monthly_payment,
        term_months=offer.term_months,
        is_financier=True
    )
    
    await email_service.send_offer_accepted_notification(
        to_email=current_user.email,
        recipient_name=current_user.full_name,
        application_ref=application.reference_number,
        company_name=application.company_name,
        monthly_payment=offer.monthly_payment,
        term_months=offer.term_months,
        is_financier=False
    )
    
    return {"message": "Tarjous hyväksytty"}


@router.post("/{offer_id}/reject")
async def reject_offer(
    offer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CUSTOMER))
):
    """Reject offer (Customer only)"""
    result = await db.execute(
        select(Offer).where(Offer.id == offer_id)
    )
    offer = result.scalar_one_or_none()
    
    if not offer:
        raise HTTPException(status_code=404, detail="Tarjousta ei löytynyt")
    
    if offer.status != OfferStatus.SENT:
        raise HTTPException(status_code=400, detail="Tarjousta ei voi hylätä tässä tilassa")
    
    # Verify customer owns the application
    result = await db.execute(
        select(Application).where(Application.id == offer.application_id)
    )
    application = result.scalar_one()
    
    if application.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    # Update offer
    offer.status = OfferStatus.REJECTED
    offer.responded_at = datetime.utcnow()
    
    # Update application
    application.status = ApplicationStatus.OFFER_REJECTED
    
    await db.commit()
    
    return {"message": "Tarjous hylätty"}


@router.get("/application/{application_id}", response_model=List[OfferResponse])
async def get_application_offers(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get offers for an application"""
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(status_code=404, detail="Hakemusta ei löytynyt")
    
    # Verify access
    if current_user.role == UserRole.CUSTOMER:
        if application.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
        # Customer only sees sent offers (not DRAFT or PENDING_ADMIN)
        result = await db.execute(
            select(Offer)
            .where(
                Offer.application_id == application_id,
                Offer.status.not_in([OfferStatus.DRAFT, OfferStatus.PENDING_ADMIN])
            )
            .order_by(Offer.created_at.desc())
        )
    elif current_user.role == UserRole.FINANCIER:
        # Financier sees only own offers
        result = await db.execute(
            select(Offer)
            .where(
                Offer.application_id == application_id,
                Offer.financier_id == current_user.financier_id
            )
            .order_by(Offer.created_at.desc())
        )
    else:
        # Admin sees all
        result = await db.execute(
            select(Offer)
            .where(Offer.application_id == application_id)
            .order_by(Offer.created_at.desc())
        )
    
    return result.scalars().all()


@router.get("/{offer_id}", response_model=OfferResponse)
async def get_offer(
    offer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get offer by ID"""
    result = await db.execute(
        select(Offer).where(Offer.id == offer_id)
    )
    offer = result.scalar_one_or_none()
    
    if not offer:
        raise HTTPException(status_code=404, detail="Tarjousta ei löytynyt")
    
    # Verify access
    result = await db.execute(
        select(Application).where(Application.id == offer.application_id)
    )
    application = result.scalar_one()
    
    if current_user.role == UserRole.CUSTOMER:
        if application.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
        if offer.status in [OfferStatus.DRAFT, OfferStatus.PENDING_ADMIN]:
            raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    elif current_user.role == UserRole.FINANCIER:
        if offer.financier_id != current_user.financier_id:
            raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    return offer


@router.get("/admin/all")
async def get_all_offers_admin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Get all offers for admin with application and financier info"""
    result = await db.execute(
        select(Offer).order_by(Offer.created_at.desc())
    )
    offers_list = result.scalars().all()
    
    # Enrich with application and financier info
    enriched_offers = []
    for offer in offers_list:
        # Get application
        app_result = await db.execute(
            select(Application).where(Application.id == offer.application_id)
        )
        application = app_result.scalar_one_or_none()
        
        # Get financier
        fin_result = await db.execute(
            select(Financier).where(Financier.id == offer.financier_id)
        )
        financier = fin_result.scalar_one_or_none()
        
        offer_dict = {
            "id": offer.id,
            "application_id": offer.application_id,
            "financier_id": offer.financier_id,
            "monthly_payment": offer.monthly_payment,
            "term_months": offer.term_months,
            "upfront_payment": offer.upfront_payment,
            "residual_value": offer.residual_value,
            "interest_or_margin": offer.interest_or_margin,
            "included_services": offer.included_services,
            "notes_to_customer": offer.notes_to_customer,
            "internal_notes": offer.internal_notes,
            "status": offer.status.value,
            "attachment_file_id": offer.attachment_file_id,
            "created_at": offer.created_at.isoformat() if offer.created_at else None,
            "updated_at": offer.updated_at.isoformat() if offer.updated_at else None,
            "sent_at": offer.sent_at.isoformat() if offer.sent_at else None,
            "responded_at": offer.responded_at.isoformat() if offer.responded_at else None,
            "expires_at": offer.expires_at.isoformat() if offer.expires_at else None,
            "application": {
                "id": application.id,
                "reference_number": application.reference_number,
                "company_name": application.company_name,
                "status": application.status.value
            } if application else None,
            "financier_name": financier.name if financier else None
        }
        enriched_offers.append(offer_dict)
    
    return enriched_offers

