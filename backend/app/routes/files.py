from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import os
import uuid

from app.database import get_db
from app.config import settings
from app.models.user import User, UserRole
from app.models.application import Application
from app.models.assignment import ApplicationAssignment
from app.models.file import File as FileModel
from app.schemas.application import FileResponse as FileResponseSchema
from app.utils.auth import get_current_user


router = APIRouter()


@router.post("/upload")
async def upload_file(
    application_id: int,
    description: Optional[str] = None,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a file for an application"""
    # Verify access to application
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(status_code=404, detail="Hakemusta ei löytynyt")
    
    # Check access
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
    
    # Validate file type
    allowed_types = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_types:
        raise HTTPException(status_code=400, detail="Tiedostotyyppi ei ole sallittu")
    
    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Tiedosto on liian suuri (max 10MB)")
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create file record
    file_record = FileModel(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content),
        application_id=application_id,
        uploaded_by_id=current_user.id,
        description=description
    )
    
    db.add(file_record)
    await db.commit()
    await db.refresh(file_record)
    
    return {
        "id": file_record.id,
        "filename": file_record.original_filename,
        "message": "Tiedosto ladattu"
    }


@router.get("/application/{application_id}", response_model=List[FileResponseSchema])
async def get_application_files(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get files for an application"""
    # Verify access
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(status_code=404, detail="Hakemusta ei löytynyt")
    
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
        select(FileModel)
        .where(FileModel.application_id == application_id)
        .order_by(FileModel.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download a file"""
    result = await db.execute(
        select(FileModel).where(FileModel.id == file_id)
    )
    file_record = result.scalar_one_or_none()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="Tiedostoa ei löytynyt")
    
    # Verify access
    if file_record.application_id:
        result = await db.execute(
            select(Application).where(Application.id == file_record.application_id)
        )
        application = result.scalar_one()
        
        if current_user.role == UserRole.CUSTOMER:
            if application.customer_id != current_user.id:
                raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
        elif current_user.role == UserRole.FINANCIER:
            result = await db.execute(
                select(ApplicationAssignment).where(
                    ApplicationAssignment.application_id == application.id,
                    ApplicationAssignment.financier_id == current_user.financier_id
                )
            )
            if not result.scalar_one_or_none():
                raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    if not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="Tiedostoa ei löytynyt palvelimelta")
    
    return FileResponse(
        path=file_record.file_path,
        filename=file_record.original_filename,
        media_type=file_record.file_type
    )


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a file"""
    result = await db.execute(
        select(FileModel).where(FileModel.id == file_id)
    )
    file_record = result.scalar_one_or_none()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="Tiedostoa ei löytynyt")
    
    # Only uploader or admin can delete
    if file_record.uploaded_by_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Ei käyttöoikeutta")
    
    # Delete file from disk
    if os.path.exists(file_record.file_path):
        os.remove(file_record.file_path)
    
    # Delete record
    await db.delete(file_record)
    await db.commit()
    
    return {"message": "Tiedosto poistettu"}

