"""Document processing service with semantic chunking."""

from typing import List, Dict, Optional
import hashlib
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document


class DocumentProcessor:
    """Process and chunk documents for vector storage."""
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ):
        """
        Initialize document processor.
        
        Args:
            chunk_size: Target size of each chunk in characters
            chunk_overlap: Overlap between chunks for context continuity
        """
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
    
    def process_pdf_text(
        self,
        text: str,
        document_id: str,
        metadata: Optional[Dict] = None,
    ) -> List[Document]:
        """
        Split PDF text into chunks with metadata.
        
        Args:
            text: Extracted PDF text
            document_id: Unique identifier for the source document
            metadata: Additional metadata (course_name, user_id, etc.)
        
        Returns:
            List of Document objects ready for embedding
        """
        base_metadata = {
            "document_id": document_id,
            "source_type": "coursework_pdf",
            **(metadata or {}),
        }
        
        # Split into chunks
        chunks = self.splitter.split_text(text)
        
        documents = []
        for i, chunk in enumerate(chunks):
            # Generate unique chunk ID
            chunk_id = hashlib.md5(f"{document_id}:{i}".encode()).hexdigest()[:12]
            
            doc = Document(
                page_content=chunk,
                metadata={
                    **base_metadata,
                    "chunk_index": i,
                    "chunk_id": chunk_id,
                    "total_chunks": len(chunks),
                },
            )
            documents.append(doc)
        
        return documents
    
    def extract_page_references(self, text: str) -> Dict[int, int]:
        """
        Extract page number references from PDF text.
        
        Returns dict mapping page number to character position.
        """
        import re
        pages = {}
        
        for match in re.finditer(r'\[Page (\d+)\]', text):
            page_num = int(match.group(1))
            pages[page_num] = match.start()
        
        return pages
    
    def get_chunk_page(self, chunk_start: int, page_refs: Dict[int, int]) -> int:
        """Determine which page a chunk belongs to based on position."""
        current_page = 1
        for page_num, position in sorted(page_refs.items()):
            if position <= chunk_start:
                current_page = page_num
            else:
                break
        return current_page


class MultimodalDocumentProcessor:
    """
    Process documents with both text and images for multimodal RAG.
    
    Extracts text chunks and generates AI descriptions for images,
    storing both as embeddings in the vector store.
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        max_images: int = 10,
        image_cache_dir: Optional[str] = None,
    ):
        """
        Initialize multimodal document processor.
        
        Args:
            chunk_size: Target size of each text chunk
            chunk_overlap: Overlap between text chunks
            max_images: Maximum images to process per document
            image_cache_dir: Directory to store extracted images
        """
        from pathlib import Path
        
        self.text_processor = DocumentProcessor(chunk_size, chunk_overlap)
        self.max_images = max_images
        self.image_cache_dir = Path(image_cache_dir) if image_cache_dir else (
            Path(__file__).parent.parent / "image_cache"
        )
    
    def process_pdf(
        self,
        pdf_content: bytes,
        document_id: str,
        metadata: Optional[Dict] = None,
    ) -> tuple[List[Document], List[Document], List[dict]]:
        """
        Process PDF into text and image documents.
        
        Args:
            pdf_content: Raw PDF bytes
            document_id: Unique document identifier
            metadata: Additional metadata
        
        Returns:
            Tuple of (text_documents, image_documents, image_info)
        """
        from pathlib import Path
        from services.pdf_parser import extract_text_from_pdf, extract_images_from_pdf
        from services.vision_service import get_vision_service
        
        # Create document-specific image directory
        doc_image_dir = self.image_cache_dir / document_id
        doc_image_dir.mkdir(parents=True, exist_ok=True)
        
        # 1. Extract and process text
        pdf_text = extract_text_from_pdf(pdf_content)
        text_docs = self.text_processor.process_pdf_text(
            text=pdf_text,
            document_id=document_id,
            metadata={**(metadata or {}), "content_type": "text"},
        )
        
        # 2. Extract images
        try:
            images = extract_images_from_pdf(
                pdf_content,
                output_dir=doc_image_dir,
                max_images=self.max_images,
            )
        except Exception as e:
            print(f"Image extraction failed: {e}")
            images = []
        
        # 3. Generate descriptions for images using Gemini Vision
        image_docs = []
        image_info = []
        
        if images:
            vision = get_vision_service()
            context = metadata.get("course_name", "") if metadata else ""
            
            for img in images:
                try:
                    img_path = Path(img["path"])
                    description = vision.describe_image(img_path, context=context)
                    
                    # Create chunk ID for the image
                    chunk_id = hashlib.md5(
                        f"{document_id}:img:{img['page_number']}:{img['image_index']}".encode()
                    ).hexdigest()[:12]
                    
                    # Create document with image description
                    doc = Document(
                        page_content=f"[Image from Page {img['page_number']}]\n{description}",
                        metadata={
                            "document_id": document_id,
                            "source_type": "image",
                            "content_type": "image",
                            "chunk_id": chunk_id,
                            "chunk_index": len(text_docs) + len(image_docs),
                            "image_path": img["path"],
                            "image_filename": img["filename"],
                            "page_number": img["page_number"],
                            "image_width": img["width"],
                            "image_height": img["height"],
                            **(metadata or {}),
                        },
                    )
                    image_docs.append(doc)
                    
                    # Store image info for response
                    image_info.append({
                        "path": img["path"],
                        "filename": img["filename"],
                        "page_number": img["page_number"],
                        "description": description[:200] + "..." if len(description) > 200 else description,
                    })
                    
                except Exception as e:
                    print(f"Failed to process image {img.get('path')}: {e}")
                    continue
        
        return text_docs, image_docs, image_info
    
    def get_full_text(self, pdf_content: bytes) -> str:
        """Extract just the text from a PDF (for analysis agent)."""
        from services.pdf_parser import extract_text_from_pdf
        return extract_text_from_pdf(pdf_content)

