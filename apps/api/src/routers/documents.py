"""Document router — upload, list, get, delete, download, categories."""

import os
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.config import MAX_FILE_SIZE, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES
from src.database import get_db
from src.models.user import User
from src.models.document import Document
from src.schemas.document import DocumentResponse, CategoriesResponse, CategoryCount
from src.routers.auth import get_current_user
from src.services.ocr import extract_text
from src.services.categorizer import categorize
from src.services.file_storage import save_file, delete_file, get_file_path

router = APIRouter(prefix="/api/documents", tags=["documents"])
logger = logging.getLogger(__name__)


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a document, extract text via OCR, and auto-categorize it."""
    # Validate file extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB",
        )

    # Determine mime type
    mime_type = file.content_type or "application/octet-stream"

    # Save file to disk (temporarily to "Other" folder, will move after categorization)
    stored_filename, file_path = save_file(
        content, file.filename or "unknown", current_user.id, "Uncategorized"
    )

    # Extract text via OCR
    extracted_text = extract_text(file_path, mime_type)

    # Categorize based on extracted text
    category = categorize(extracted_text)

    # Move file to correct category folder if needed
    if category != "Uncategorized":
        new_filename, new_path = save_file(
            content, file.filename or "unknown", current_user.id, category
        )
        # Remove the temp file
        delete_file(file_path)
        stored_filename = new_filename
        file_path = new_path

    # Create database record
    doc = Document(
        user_id=current_user.id,
        filename=stored_filename,
        original_filename=file.filename or "unknown",
        mime_type=mime_type,
        file_size=len(content),
        file_path=file_path,
        category=category,
        extracted_text=extracted_text[:5000] if extracted_text else None,  # Limit stored text
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    logger.info(
        f"Document uploaded: {doc.original_filename} → {doc.category} (user={current_user.id})"
    )

    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        original_filename=doc.original_filename,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        category=doc.category,
        extracted_text=doc.extracted_text,
        created_at=doc.created_at.isoformat(),
        updated_at=doc.updated_at.isoformat(),
    )


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    category: str | None = Query(None, description="Filter by category"),
    search: str | None = Query(None, description="Search by filename"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all documents for the current user, optionally filtered."""
    query = db.query(Document).filter(Document.user_id == current_user.id)

    if category:
        query = query.filter(Document.category == category)
    if search:
        query = query.filter(Document.original_filename.ilike(f"%{search}%"))

    docs = query.order_by(Document.created_at.desc()).all()

    return [
        DocumentResponse(
            id=doc.id,
            filename=doc.filename,
            original_filename=doc.original_filename,
            mime_type=doc.mime_type,
            file_size=doc.file_size,
            category=doc.category,
            extracted_text=doc.extracted_text,
            created_at=doc.created_at.isoformat(),
            updated_at=doc.updated_at.isoformat(),
        )
        for doc in docs
    ]


@router.get("/categories", response_model=CategoriesResponse)
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get document counts per category for the current user."""
    results = (
        db.query(Document.category, func.count(Document.id))
        .filter(Document.user_id == current_user.id)
        .group_by(Document.category)
        .all()
    )

    categories = [CategoryCount(category=cat, count=count) for cat, count in results]
    total = sum(c.count for c in categories)

    return CategoriesResponse(categories=categories, total=total)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single document by ID."""
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        original_filename=doc.original_filename,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        category=doc.category,
        extracted_text=doc.extracted_text,
        created_at=doc.created_at.isoformat(),
        updated_at=doc.updated_at.isoformat(),
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document and its file."""
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Delete file from disk
    delete_file(doc.file_path)

    # Delete from database
    db.delete(doc)
    db.commit()
    logger.info(f"Document deleted: {doc.original_filename} (id={doc.id})")


@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download the original file."""
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    file_path = get_file_path(doc.file_path)
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk"
        )

    return FileResponse(
        path=str(file_path),
        filename=doc.original_filename,
        media_type=doc.mime_type,
    )


@router.get("/{document_id}/download-pdf")
def download_document_as_pdf(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download the document as a PDF. Converts images if needed."""
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    file_path = get_file_path(doc.file_path)
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk"
        )

    # If it's already a PDF, return it directly
    if doc.mime_type == "application/pdf":
        return FileResponse(
            path=str(file_path),
            filename=doc.original_filename,
            media_type="application/pdf",
        )

    # If it's an image, convert to PDF
    if doc.mime_type in ["image/jpeg", "image/png"]:
        from PIL import Image
        import io
        from fastapi.responses import StreamingResponse

        try:
            img = Image.open(file_path).convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="PDF", resolution=100.0)
            buf.seek(0)
            
            # Generate new filename
            base_name = Path(doc.original_filename).stem
            pdf_filename = f"{base_name}.pdf"
            
            return StreamingResponse(
                buf, 
                media_type="application/pdf", 
                headers={"Content-Disposition": f'attachment; filename="{pdf_filename}"'}
            )
        except Exception as e:
            logger.error(f"Failed to convert image to PDF: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate PDF")
            
    # Unsupported types
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, 
        detail=f"Cannot convert {doc.mime_type} to PDF"
    )
