"""PDF text extraction service using PyMuPDF."""

import fitz  # PyMuPDF
from pathlib import Path
import tempfile


class PDFParserError(Exception):
    """Raised when PDF parsing fails."""
    pass


def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        file_content: Raw bytes of the PDF file
        
    Returns:
        Extracted text from all pages
        
    Raises:
        PDFParserError: If the PDF cannot be parsed
    """
    try:
        # Create a temporary file to work with PyMuPDF
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(file_content)
            tmp_path = Path(tmp.name)
        
        try:
            # Open and extract text
            doc = fitz.open(tmp_path)
            
            text_parts = []
            for page_num, page in enumerate(doc, start=1):
                page_text = page.get_text("text")
                if page_text.strip():
                    text_parts.append(f"[Page {page_num}]\n{page_text}")
            
            doc.close()
            
            if not text_parts:
                raise PDFParserError("No text could be extracted from the PDF")
            
            return "\n\n".join(text_parts)
            
        finally:
            # Clean up temp file
            tmp_path.unlink(missing_ok=True)
            
    except fitz.FileDataError as e:
        raise PDFParserError(f"Invalid or corrupted PDF file: {e}")
    except Exception as e:
        if isinstance(e, PDFParserError):
            raise
        raise PDFParserError(f"Failed to parse PDF: {e}")


def get_pdf_metadata(file_content: bytes) -> dict:
    """
    Extract metadata from a PDF file.
    
    Args:
        file_content: Raw bytes of the PDF file
        
    Returns:
        Dictionary containing PDF metadata
    """
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(file_content)
            tmp_path = Path(tmp.name)
        
        try:
            doc = fitz.open(tmp_path)
            metadata = {
                "page_count": doc.page_count,
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
                "subject": doc.metadata.get("subject", ""),
            }
            doc.close()
            return metadata
        finally:
            tmp_path.unlink(missing_ok=True)
            
    except Exception:
        return {"page_count": 0, "title": "", "author": "", "subject": ""}
