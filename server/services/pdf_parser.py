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


def extract_images_from_pdf(
    file_content: bytes,
    output_dir: Path,
    max_images: int = 10,
    min_size: int = 100,
) -> list[dict]:
    """
    Extract images from a PDF file and save to disk.
    
    Args:
        file_content: Raw bytes of the PDF file
        output_dir: Directory to save extracted images
        max_images: Maximum number of images to extract (default: 10)
        min_size: Minimum width/height in pixels (filters decorative images)
        
    Returns:
        List of dicts with: path, page_number, image_index, width, height
        
    Raises:
        PDFParserError: If the PDF cannot be parsed
    """
    try:
        # Ensure output directory exists
        output_dir.mkdir(parents=True, exist_ok=True)
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(file_content)
            tmp_path = Path(tmp.name)
        
        try:
            doc = fitz.open(tmp_path)
            extracted_images = []
            image_count = 0
            
            for page_num in range(len(doc)):
                if image_count >= max_images:
                    break
                    
                page = doc[page_num]
                image_list = page.get_images(full=True)
                
                for img_index, img_info in enumerate(image_list):
                    if image_count >= max_images:
                        break
                    
                    try:
                        xref = img_info[0]
                        
                        # Extract image
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]
                        width = base_image.get("width", 0)
                        height = base_image.get("height", 0)
                        
                        # Skip small/decorative images
                        if width < min_size or height < min_size:
                            continue
                        
                        # Generate unique filename
                        image_filename = f"page{page_num + 1}_img{img_index}.{image_ext}"
                        image_path = output_dir / image_filename
                        
                        # Save image
                        with open(image_path, "wb") as f:
                            f.write(image_bytes)
                        
                        extracted_images.append({
                            "path": str(image_path),
                            "filename": image_filename,
                            "page_number": page_num + 1,
                            "image_index": img_index,
                            "width": width,
                            "height": height,
                        })
                        
                        image_count += 1
                        
                    except Exception as e:
                        # Skip problematic images
                        print(f"Failed to extract image {img_index} from page {page_num + 1}: {e}")
                        continue
            
            doc.close()
            return extracted_images
            
        finally:
            tmp_path.unlink(missing_ok=True)
            
    except fitz.FileDataError as e:
        raise PDFParserError(f"Invalid or corrupted PDF file: {e}")
    except Exception as e:
        if isinstance(e, PDFParserError):
            raise
        raise PDFParserError(f"Failed to extract images: {e}")

