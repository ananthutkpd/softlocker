"""File storage service for local filesystem operations."""

import os
import uuid
import logging
from pathlib import Path

from src.config import UPLOAD_DIR

logger = logging.getLogger(__name__)


def ensure_upload_dir(user_id: str, category: str = "") -> Path:
    """Ensure the upload directory exists for a user and category."""
    if category:
        dir_path = UPLOAD_DIR / user_id / category
    else:
        dir_path = UPLOAD_DIR / user_id
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def save_file(
    file_content: bytes,
    original_filename: str,
    user_id: str,
    category: str = "Other",
) -> tuple[str, str]:
    """Save a file to disk and return (stored_filename, file_path).

    Args:
        file_content: Raw file bytes.
        original_filename: Original name of the uploaded file.
        user_id: The ID of the uploading user.
        category: The document category for folder placement.

    Returns:
        Tuple of (stored_filename, absolute_file_path).
    """
    dir_path = ensure_upload_dir(user_id, category)

    # Generate a unique filename to avoid collisions
    ext = Path(original_filename).suffix
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = dir_path / stored_filename

    with open(file_path, "wb") as f:
        f.write(file_content)

    logger.info(f"Saved file: {file_path} ({len(file_content)} bytes)")
    return stored_filename, str(file_path)


def delete_file(file_path: str) -> bool:
    """Delete a file from disk."""
    try:
        path = Path(file_path)
        if path.exists():
            path.unlink()
            logger.info(f"Deleted file: {file_path}")
            return True
        logger.warning(f"File not found for deletion: {file_path}")
        return False
    except Exception as e:
        logger.error(f"Failed to delete file {file_path}: {e}")
        return False


def get_file_path(file_path: str) -> Path | None:
    """Get the absolute path of a stored file, or None if it doesn't exist."""
    path = Path(file_path)
    return path if path.exists() else None
