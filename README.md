# SoftLocker

SoftLocker is an AI-powered document categorization web application. You can upload photos or PDFs of documents (like Resumes, Invoices, Certificates, IDs), and the system will automatically extract the text using OCR and intelligently sort the document into the correct category folder.

This project is built as a monorepo containing:
- **Frontend**: Next.js (React), TypeScript, CSS Modules
- **Backend**: FastAPI (Python), SQLite, SQLAlchemy, Tesseract OCR, PyMuPDF

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

1. **Node.js** (v18 or higher)
2. **pnpm** (Package manager for the monorepo)
   ```bash
   npm install -g pnpm
   ```
3. **Python 3.11+**
4. **uv** (Extremely fast Python package installer and resolver)
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
5. **Tesseract OCR** (Required for extracting text from images)
   - **macOS**: `brew install tesseract`
   - **Ubuntu/Debian**: `sudo apt-get install tesseract-ocr`
   - **Windows**: Download the installer from [UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)

---

## Local Setup Instructions

Clone the repository and follow these steps to get both the frontend and backend running locally.

### 1. Install Node Dependencies

Navigate to the root of the project and install all frontend and workspace dependencies:

```bash
cd softlocker
pnpm install
```

### 2. Setup the Python Backend

Navigate to the `apps/api` directory and use `uv` to install the backend dependencies. `uv` will automatically create a virtual environment (`.venv`) for you.

```bash
cd apps/api
uv sync
```

*Note: The SQLite database (`softlocker.db`) and the `uploads/` directory will be created automatically the first time you run the backend server.*

---

## Running the Application

You need to run both the backend API server and the frontend Next.js development server simultaneously. Open two separate terminal windows.

### Terminal 1: Start the Backend (FastAPI)

```bash
cd softlocker/apps/api
uv run uvicorn src.main:app --reload --port 8000
```
*The backend API will be running at `http://localhost:8000`*

### Terminal 2: Start the Frontend (Next.js)

```bash
cd softlocker
pnpm --filter web dev
```
*The frontend application will be running at `http://localhost:3000`*

---

## Usage

1. Open your browser and navigate to `http://localhost:3000`.
2. **Create an account** (Sign Up) or Log in.
3. On the Dashboard, click **Upload Document**.
4. Drag and drop an image (JPG/PNG) or a PDF.
5. The backend will extract the text via OCR, detect the category (e.g., Identity Document, Invoice, Resume), and save it.
6. Click on the document card in your dashboard to view the original image preview, read the extracted OCR text, or download the file (including converting images to PDFs on the fly).
