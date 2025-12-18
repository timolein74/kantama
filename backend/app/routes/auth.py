from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse, PasswordReset
from app.utils.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    generate_verification_token,
    get_current_user
)
from app.services.email_service import email_service


router = APIRouter()


@router.post("/register", response_model=Token)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new customer account"""
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sähköpostiosoite on jo käytössä"
        )
    
    # Create verification token
    verification_token = generate_verification_token()
    
    # Create user - auto-verify in demo mode (no real email sending)
    # In production, set DEMO_MODE=false
    import os
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=UserRole.CUSTOMER,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        company_name=user_data.company_name,
        business_id=user_data.business_id,
        is_active=True,
        is_verified=demo_mode,  # Auto-verify in demo mode
        verification_token=None if demo_mode else verification_token,
        verification_token_expires=None if demo_mode else datetime.utcnow() + timedelta(hours=24)
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Send verification email
    await email_service.send_verification_email(
        email=user.email,
        token=verification_token,
        first_name=user.first_name
    )
    
    # Generate access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login with email and password"""
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Virheellinen sähköposti tai salasana"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tili ei ole aktiivinen"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Generate access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/verify/{token}")
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Verify email with token"""
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Virheellinen vahvistuslinkki"
        )
    
    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vahvistuslinkki on vanhentunut"
        )
    
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    await db.commit()
    
    return {"message": "Sähköposti vahvistettu onnistuneesti"}


@router.post("/resend-verification")
async def resend_verification(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Resend verification email"""
    if current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tili on jo vahvistettu"
        )
    
    # Generate new token
    verification_token = generate_verification_token()
    current_user.verification_token = verification_token
    current_user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
    await db.commit()
    
    # Send verification email
    await email_service.send_verification_email(
        email=current_user.email,
        token=verification_token,
        first_name=current_user.first_name
    )
    
    return {"message": "Vahvistuslinkki lähetetty"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password")
async def forgot_password(
    data: PasswordReset,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset"""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    # Always return success to prevent email enumeration
    if user:
        # Generate reset token
        reset_token = generate_verification_token()
        user.verification_token = reset_token
        user.verification_token_expires = datetime.utcnow() + timedelta(hours=2)
        await db.commit()
        
        # TODO: Send password reset email
    
    return {"message": "Jos sähköposti on rekisteröity, lähetimme sinulle salasanan palautuslinkin."}

