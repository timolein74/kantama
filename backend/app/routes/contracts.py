from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import os
import uuid
import random
import string

from app.database import get_db
from app.config import settings
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStatus
from app.models.assignment import ApplicationAssignment
from app.models.offer import Offer, OfferStatus
from app.models.contract import Contract, ContractStatus
from app.models.financier import Financier
from app.models.file import File as FileModel
from app.schemas.contract import ContractCreate, ContractUpdate, ContractResponse
from app.utils.auth import get_current_user, require_role
from app.services.notification_service import notification_service
from app.services.email_service import email_service


router = APIRouter()


def generate_contract_number() -> str:
    """Generate unique contract number like A000379XXX"""
    random_part = ''.join(random.choices(string.digits, k=6))
    return f"A000{random_part}"


@router.post("/", response_model=ContractResponse)
async def create_contract(
    contract_data: ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.FINANCIER))
):
    """Create contract with full details (Financier only)"""
    # Get application
    result = await db.execute(
        select(Application).where(Application.id == contract_data.application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(status_code=404, detail="Hakemusta ei löytynyt")
    
    # Verify access
    result = await db.execute(
        select(ApplicationAssignment).where(
            ApplicationAssignment.application_id == application.id,
            ApplicationAssignment.financier_id == current_user.financier_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    # Verify application status (allow OFFER_ACCEPTED or further)
    allowed_statuses = [
        ApplicationStatus.OFFER_ACCEPTED,
        ApplicationStatus.CONTRACT_SENT
    ]
    if application.status not in allowed_statuses:
        raise HTTPException(
            status_code=400, 
            detail="Sopimus voidaan luoda vain hyväksytylle tarjoukselle"
        )
    
    # Get financier for lessor info
    result = await db.execute(
        select(Financier).where(Financier.id == current_user.financier_id)
    )
    financier = result.scalar_one()
    
    # Get accepted offer for pre-filling rent info
    accepted_offer = None
    if contract_data.offer_id:
        result = await db.execute(
            select(Offer).where(
                Offer.id == contract_data.offer_id,
                Offer.status == OfferStatus.ACCEPTED
            )
        )
        accepted_offer = result.scalar_one_or_none()
    
    # Create contract with all details
    contract = Contract(
        contract_number=generate_contract_number(),
        application_id=application.id,
        financier_id=current_user.financier_id,
        offer_id=contract_data.offer_id,
        
        # Lessee (pre-fill from application if not provided)
        lessee_company_name=contract_data.lessee_company_name or application.company_name,
        lessee_business_id=contract_data.lessee_business_id or application.business_id,
        lessee_street_address=contract_data.lessee_street_address or application.street_address,
        lessee_postal_code=contract_data.lessee_postal_code or application.postal_code,
        lessee_city=contract_data.lessee_city or application.city,
        lessee_country=contract_data.lessee_country,
        lessee_contact_person=contract_data.lessee_contact_person or application.contact_person,
        lessee_phone=contract_data.lessee_phone or application.contact_phone,
        lessee_email=contract_data.lessee_email or application.contact_email,
        lessee_tax_country=contract_data.lessee_tax_country,
        
        # Lessor (financier info)
        lessor_company_name=contract_data.lessor_company_name or financier.name,
        lessor_business_id=contract_data.lessor_business_id or financier.business_id,
        lessor_street_address=contract_data.lessor_street_address or financier.address,
        lessor_postal_code=contract_data.lessor_postal_code,
        lessor_city=contract_data.lessor_city,
        
        # Seller
        seller_company_name=contract_data.seller_company_name or application.equipment_supplier,
        seller_business_id=contract_data.seller_business_id,
        seller_street_address=contract_data.seller_street_address,
        seller_postal_code=contract_data.seller_postal_code,
        seller_city=contract_data.seller_city,
        seller_contact_person=contract_data.seller_contact_person,
        seller_phone=contract_data.seller_phone,
        seller_email=contract_data.seller_email,
        seller_tax_country=contract_data.seller_tax_country,
        
        # Lease objects (convert to dict for JSON storage)
        lease_objects=[obj.model_dump() for obj in contract_data.lease_objects] if contract_data.lease_objects else None,
        usage_location=contract_data.usage_location,
        
        # Delivery
        delivery_method=contract_data.delivery_method,
        estimated_delivery_date=contract_data.estimated_delivery_date,
        other_delivery_terms=contract_data.other_delivery_terms,
        
        # Rent (pre-fill from accepted offer if available)
        advance_payment=contract_data.advance_payment or (accepted_offer.upfront_payment if accepted_offer else None),
        monthly_rent=contract_data.monthly_rent or (accepted_offer.monthly_payment if accepted_offer else None),
        rent_installments_count=contract_data.rent_installments_count or (accepted_offer.term_months if accepted_offer else None),
        rent_installments_start=contract_data.rent_installments_start,
        rent_installments_end=contract_data.rent_installments_end or (accepted_offer.term_months if accepted_offer else None),
        residual_value=contract_data.residual_value or (accepted_offer.residual_value if accepted_offer else None),
        processing_fee=contract_data.processing_fee,
        arrangement_fee=contract_data.arrangement_fee,
        invoicing_method=contract_data.invoicing_method,
        
        # Lease period
        lease_period_months=contract_data.lease_period_months or (accepted_offer.term_months if accepted_offer else None),
        lease_start_date=contract_data.lease_start_date,
        
        # Insurance
        insurance_type=contract_data.insurance_type,
        insurance_provider=contract_data.insurance_provider,
        insurance_policy_number=contract_data.insurance_policy_number,
        
        # Bank
        bank_name=contract_data.bank_name,
        bank_iban=contract_data.bank_iban,
        bank_bic=contract_data.bank_bic,
        
        # Guarantees
        guarantees=contract_data.guarantees,
        guarantee_type=contract_data.guarantee_type,
        
        # Special conditions
        special_conditions=contract_data.special_conditions,
        
        # Messages
        message_to_customer=contract_data.message_to_customer,
        internal_notes=contract_data.internal_notes,
        
        status=ContractStatus.DRAFT
    )
    
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    
    return contract


@router.put("/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: int,
    contract_data: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.FINANCIER))
):
    """Update contract details (Financier only, only DRAFT contracts)"""
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Sopimusta ei löytynyt")
    
    if contract.financier_id != current_user.financier_id:
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    if contract.status != ContractStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Vain luonnosta voi muokata")
    
    # Update all provided fields
    update_data = contract_data.model_dump(exclude_unset=True)
    
    # Handle lease_objects specially
    if 'lease_objects' in update_data and update_data['lease_objects']:
        update_data['lease_objects'] = [
            obj.model_dump() if hasattr(obj, 'model_dump') else obj 
            for obj in update_data['lease_objects']
        ]
    
    for key, value in update_data.items():
        if hasattr(contract, key):
            setattr(contract, key, value)
    
    await db.commit()
    await db.refresh(contract)
    
    return contract


@router.post("/{contract_id}/upload-logo")
async def upload_contract_logo(
    contract_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.FINANCIER))
):
    """Upload financier logo for contract (Financier only)"""
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Sopimusta ei löytynyt")
    
    if contract.financier_id != current_user.financier_id:
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    # Validate file type
    allowed_types = ['.png', '.jpg', '.jpeg', '.svg']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_types:
        raise HTTPException(status_code=400, detail="Vain kuvatiedostot sallittu (PNG, JPG, SVG)")
    
    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_filename = f"logo_{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB limit for logos
        raise HTTPException(status_code=400, detail="Logo on liian suuri (max 5MB)")
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create file record
    file_record = FileModel(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content),
        application_id=contract.application_id,
        uploaded_by_id=current_user.id,
        description="Rahoittajan logo"
    )
    
    db.add(file_record)
    await db.flush()
    
    contract.logo_file_id = file_record.id
    await db.commit()
    
    return {"message": "Logo ladattu", "file_id": file_record.id}


@router.post("/{contract_id}/upload")
async def upload_contract_file(
    contract_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.FINANCIER))
):
    """Upload contract PDF (Financier only)"""
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Sopimusta ei löytynyt")
    
    if contract.financier_id != current_user.financier_id:
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    # Validate file
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Vain PDF-tiedostot sallittu")
    
    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Tiedosto on liian suuri")
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create file record
    file_record = FileModel(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content),
        application_id=contract.application_id,
        uploaded_by_id=current_user.id,
        description="Sopimus"
    )
    
    db.add(file_record)
    await db.flush()
    
    contract.contract_file_id = file_record.id
    await db.commit()
    
    return {"message": "Sopimustiedosto ladattu", "file_id": file_record.id}


@router.post("/{contract_id}/send", response_model=ContractResponse)
async def send_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.FINANCIER))
):
    """Send contract to customer for signing (Financier only)"""
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Sopimusta ei löytynyt")
    
    if contract.financier_id != current_user.financier_id:
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    if contract.status != ContractStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Sopimus on jo lähetetty")
    
    # Validate contract has required info
    if not contract.lessee_company_name:
        raise HTTPException(status_code=400, detail="Vuokralleottajan tiedot puuttuvat")
    if not contract.monthly_rent:
        raise HTTPException(status_code=400, detail="Vuokraerä puuttuu")
    
    # Get application and customer
    result = await db.execute(
        select(Application).where(Application.id == contract.application_id)
    )
    application = result.scalar_one()
    
    result = await db.execute(
        select(User).where(User.id == application.customer_id)
    )
    customer = result.scalar_one()
    
    # Update contract
    contract.status = ContractStatus.SENT
    contract.sent_at = datetime.utcnow()
    
    # Update application
    application.status = ApplicationStatus.CONTRACT_SENT
    
    await db.commit()
    await db.refresh(contract)
    
    # Send notification
    await notification_service.notify_contract_sent(
        db=db,
        customer_id=customer.id,
        application_id=application.id,
        reference_number=application.reference_number
    )
    
    # Send email
    await email_service.send_contract_to_customer(
        customer_email=customer.email,
        customer_name=customer.full_name,
        application_ref=application.reference_number,
        message=contract.message_to_customer
    )
    
    return contract


@router.post("/{contract_id}/sign", response_model=ContractResponse)
async def sign_contract(
    contract_id: int,
    signature_place: str = "Finland",
    signer_name: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CUSTOMER))
):
    """Sign contract (Customer only) - electronic signature placeholder"""
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Sopimusta ei löytynyt")
    
    # Verify customer owns the application
    result = await db.execute(
        select(Application).where(Application.id == contract.application_id)
    )
    application = result.scalar_one()
    
    if application.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    if contract.status != ContractStatus.SENT:
        raise HTTPException(status_code=400, detail="Sopimusta ei voi allekirjoittaa tässä tilassa")
    
    # Update signature info
    contract.lessee_signature_date = datetime.utcnow()
    contract.lessee_signature_place = signature_place
    contract.lessee_signer_name = signer_name or f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email
    
    # Update status
    contract.status = ContractStatus.SIGNED
    contract.signed_at = datetime.utcnow()
    
    # Update application
    application.status = ApplicationStatus.SIGNED
    
    await db.commit()
    await db.refresh(contract)
    
    # Get financier info
    result = await db.execute(
        select(Financier).where(Financier.id == contract.financier_id)
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
    await notification_service.notify_contract_signed(
        db=db,
        financier_user_ids=[u.id for u in financier_users],
        application_id=application.id,
        reference_number=application.reference_number,
        company_name=application.company_name
    )
    
    # Notify admin
    await email_service.send_admin_notification(
        subject=f"Sopimus allekirjoitettu: {application.reference_number}",
        event_type="SOPIMUS ALLEKIRJOITETTU",
        application_ref=application.reference_number,
        details={
            "Yritys": application.company_name,
            "Rahoittaja": financier.name,
            "Allekirjoittaja": contract.lessee_signer_name,
            "Päivämäärä": datetime.utcnow().strftime("%d.%m.%Y %H:%M")
        }
    )
    
    return contract


@router.post("/{contract_id}/upload-signed")
async def upload_signed_contract(
    contract_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CUSTOMER))
):
    """Upload signed contract PDF (Customer only) - alternative to e-signature"""
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Sopimusta ei löytynyt")
    
    # Verify customer owns the application
    result = await db.execute(
        select(Application).where(Application.id == contract.application_id)
    )
    application = result.scalar_one()
    
    if application.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    if contract.status != ContractStatus.SENT:
        raise HTTPException(status_code=400, detail="Sopimusta ei voi allekirjoittaa tässä tilassa")
    
    # Validate file
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Vain PDF-tiedostot sallittu")
    
    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"signed_{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Tiedosto on liian suuri")
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create file record
    file_record = FileModel(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content),
        application_id=contract.application_id,
        uploaded_by_id=current_user.id,
        description="Allekirjoitettu sopimus"
    )
    
    db.add(file_record)
    await db.flush()
    
    # Update contract
    contract.signed_file_id = file_record.id
    contract.status = ContractStatus.SIGNED
    contract.signed_at = datetime.utcnow()
    contract.lessee_signature_date = datetime.utcnow()
    contract.lessee_signer_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email
    
    # Update application
    application.status = ApplicationStatus.SIGNED
    
    await db.commit()
    
    # Get financier info
    result = await db.execute(
        select(Financier).where(Financier.id == contract.financier_id)
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
    await notification_service.notify_contract_signed(
        db=db,
        financier_user_ids=[u.id for u in financier_users],
        application_id=application.id,
        reference_number=application.reference_number,
        company_name=application.company_name
    )
    
    # Notify admin
    await email_service.send_admin_notification(
        subject=f"Sopimus allekirjoitettu: {application.reference_number}",
        event_type="SOPIMUS ALLEKIRJOITETTU",
        application_ref=application.reference_number,
        details={
            "Yritys": application.company_name,
            "Rahoittaja": financier.name,
            "Päivämäärä": datetime.utcnow().strftime("%d.%m.%Y %H:%M")
        }
    )
    
    return {"message": "Allekirjoitettu sopimus ladattu"}


@router.get("/application/{application_id}", response_model=List[ContractResponse])
async def get_application_contracts(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get contracts for an application"""
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
        # Customer only sees sent contracts
        result = await db.execute(
            select(Contract)
            .where(
                Contract.application_id == application_id,
                Contract.status != ContractStatus.DRAFT
            )
            .order_by(Contract.created_at.desc())
        )
    elif current_user.role == UserRole.FINANCIER:
        result = await db.execute(
            select(Contract)
            .where(
                Contract.application_id == application_id,
                Contract.financier_id == current_user.financier_id
            )
            .order_by(Contract.created_at.desc())
        )
    else:
        result = await db.execute(
            select(Contract)
            .where(Contract.application_id == application_id)
            .order_by(Contract.created_at.desc())
        )
    
    return result.scalars().all()


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get contract by ID"""
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Sopimusta ei löytynyt")
    
    # Verify access
    result = await db.execute(
        select(Application).where(Application.id == contract.application_id)
    )
    application = result.scalar_one()
    
    if current_user.role == UserRole.CUSTOMER:
        if application.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
        if contract.status == ContractStatus.DRAFT:
            raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    elif current_user.role == UserRole.FINANCIER:
        if contract.financier_id != current_user.financier_id:
            raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    return contract


@router.get("/admin/all")
async def get_all_contracts_admin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Get all contracts for admin with application and financier info"""
    result = await db.execute(
        select(Contract).order_by(Contract.created_at.desc())
    )
    contracts_list = result.scalars().all()
    
    # Enrich with application and financier info
    enriched_contracts = []
    for contract in contracts_list:
        # Get application
        app_result = await db.execute(
            select(Application).where(Application.id == contract.application_id)
        )
        application = app_result.scalar_one_or_none()
        
        # Get financier
        fin_result = await db.execute(
            select(Financier).where(Financier.id == contract.financier_id)
        )
        financier = fin_result.scalar_one_or_none()
        
        contract_dict = {
            "id": contract.id,
            "contract_number": contract.contract_number,
            "application_id": contract.application_id,
            "financier_id": contract.financier_id,
            "offer_id": contract.offer_id,
            "contract_file_id": contract.contract_file_id,
            "signed_file_id": contract.signed_file_id,
            "message_to_customer": contract.message_to_customer,
            "internal_notes": contract.internal_notes,
            "lessee_company_name": contract.lessee_company_name,
            "lessee_business_id": contract.lessee_business_id,
            "lessor_company_name": contract.lessor_company_name,
            "monthly_rent": contract.monthly_rent,
            "lease_period_months": contract.lease_period_months,
            "status": contract.status.value,
            "created_at": contract.created_at.isoformat() if contract.created_at else None,
            "updated_at": contract.updated_at.isoformat() if contract.updated_at else None,
            "sent_at": contract.sent_at.isoformat() if contract.sent_at else None,
            "signed_at": contract.signed_at.isoformat() if contract.signed_at else None,
            "application": {
                "id": application.id,
                "reference_number": application.reference_number,
                "company_name": application.company_name,
                "status": application.status.value
            } if application else None,
            "financier_name": financier.name if financier else None
        }
        enriched_contracts.append(contract_dict)
    
    return enriched_contracts
