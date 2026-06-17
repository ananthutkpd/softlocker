"""OCR service for extracting text from images and PDFs."""

import io
import logging
from pathlib import Path

from PIL import Image

logger = logging.getLogger(__name__)


def extract_text_from_image(file_path: str) -> str:
    """Extract text from an image file using Tesseract OCR."""
    try:
        import pytesseract

        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except ImportError:
        logger.warning("pytesseract not installed, skipping OCR for image")
        return ""
    except Exception as e:
        logger.error(f"OCR failed for image {file_path}: {e}")
        return ""


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyMuPDF and fallback to OCR for images."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(file_path)
        text_parts = []
        for page in doc:
            text = page.get_text().strip()
            if not text:
                try:
                    import pytesseract
                    from PIL import Image
                    pix = page.get_pixmap(dpi=300)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    ocr_text = pytesseract.image_to_string(img)
                    text = ocr_text.strip()
                except Exception as ocr_err:
                    logger.warning(f"OCR fallback failed for page: {ocr_err}")
            text_parts.append(text)
        doc.close()
        return "\n".join(text_parts).strip()
    except ImportError:
        logger.warning("PyMuPDF not installed, skipping PDF text extraction")
        return ""
    except Exception as e:
        logger.error(f"PDF extraction failed for {file_path}: {e}")
        return ""


def extract_text(file_path: str, mime_type: str) -> str:
    """Extract text from a file based on its MIME type."""
    if mime_type in ("image/jpeg", "image/png"):
        return extract_text_from_image(file_path)
    elif mime_type == "application/pdf":
        return extract_text_from_pdf(file_path)
    else:
        logger.info(f"Unsupported MIME type for text extraction: {mime_type}")
        return ""
