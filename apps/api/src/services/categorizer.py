"""Document categorization service using keyword matching."""

import logging

logger = logging.getLogger(__name__)

CATEGORY_RULES: dict[str, list[str]] = {
    "Identity Document": [
        "identity", "government of", "dob", "date of birth", "uidai", 
        "aadhar", "aadhaar", "passport", "driving license", "pan card", 
        "permanent account number", "voter id", "national id", "gender"
    ],
    "Resume": [
        "resume", "curriculum vitae", "cv", "experience", "education",
        "skills", "objective", "career", "references", "work history",
        "qualifications", "employment", "profile"
    ],
    "Invoice": [
        "invoice", "bill", "amount due", "payment", "total",
        "subtotal", "tax", "due date", "billing", "invoice number",
        "purchase order", "receipt", "qty", "price", "amount"
    ],
    "Certificate": [
        "certificate", "certify", "awarded", "completion",
        "achievement", "hereby", "conferred", "recognition",
        "participation", "certification", "diploma", "degree"
    ],
    "Medical Report": [
        "diagnosis", "patient", "medical", "prescription",
        "lab report", "clinical", "hospital", "treatment",
        "symptoms", "physician", "health", "blood test", "clinic"
    ],
    "Legal Document": [
        "agreement", "contract", "clause", "court", "legal",
        "hereby agree", "terms", "conditions", "witness",
        "jurisdiction", "plaintiff", "defendant", "affidavit"
    ],
    "Bank Statement": [
        "bank", "statement", "transaction", "balance", "account",
        "debit", "credit", "opening balance", "closing balance",
        "withdrawal", "deposit", "account number"
    ],
}


def categorize(text: str) -> str:
    """Categorize a document based on extracted text using keyword matching.

    Args:
        text: The extracted text from the document.

    Returns:
        The detected category name, or "Other" if no match.
    """
    if not text:
        return "Other"

    text_lower = text.lower()
    scores: dict[str, int] = {}

    for category, keywords in CATEGORY_RULES.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        scores[category] = score

    if not scores:
        return "Other"

    best_category = max(scores, key=scores.get)  # type: ignore
    best_score = scores[best_category]

    logger.info(f"Categorization scores: {scores} → {best_category} (score={best_score})")

    return best_category if best_score > 0 else "Other"


def get_all_categories() -> list[str]:
    """Return all known category names including 'Other'."""
    return list(CATEGORY_RULES.keys()) + ["Other"]
