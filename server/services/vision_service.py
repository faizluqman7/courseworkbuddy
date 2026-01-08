"""Vision service for generating image descriptions using Gemini."""

import base64
import time
from pathlib import Path
from typing import List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

from services.langchain_service import get_langchain_service


class VisionService:
    """Generate textual descriptions of images using Gemini Vision."""
    
    # Rate limiting: delay between vision API calls (seconds)
    RATE_LIMIT_DELAY = 0.5
    
    def __init__(self):
        """Initialize vision service with Gemini model."""
        langchain = get_langchain_service()
        # Use the same model - Gemini 2.0 Flash supports vision natively
        self.model = langchain.get_llm(fast=True)
    
    def describe_image(
        self,
        image_path: Path,
        context: str = "",
    ) -> str:
        """
        Generate a description of an image using Gemini Vision.
        
        Args:
            image_path: Path to the image file
            context: Optional context about the document (course name, etc.)
        
        Returns:
            Textual description of the image
        """
        image_path = Path(image_path)
        
        if not image_path.exists():
            return "[Image file not found]"
        
        try:
            # Read and encode image as base64
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")
            
            # Determine MIME type from extension
            suffix = image_path.suffix.lower()
            mime_type = {
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".gif": "image/gif",
                ".webp": "image/webp",
            }.get(suffix, "image/png")
            
            # Build the prompt for coursework context
            prompt_text = """Analyze this image from a coursework specification document.

Describe:
1. **Type**: What kind of diagram/figure is this? (flowchart, architecture, UML, graph, table, screenshot, etc.)
2. **Components**: What are the main elements, labels, or sections visible?
3. **Relationships**: How do the components connect or relate to each other?
4. **Purpose**: What concept or requirement does this image appear to explain?

Be concise but comprehensive. Focus on information that would help a student understand the coursework requirements."""

            if context:
                prompt_text += f"\n\nDocument context: {context}"
            
            # Create multimodal message with image
            message = HumanMessage(
                content=[
                    {"type": "text", "text": prompt_text},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{image_data}"},
                    },
                ]
            )
            
            # Invoke the model
            response = self.model.invoke([message])
            
            return response.content if hasattr(response, 'content') else str(response)
            
        except Exception as e:
            print(f"Vision API error for {image_path}: {e}")
            return f"[Failed to analyze image: {str(e)[:100]}]"
    
    def batch_describe(
        self,
        image_paths: List[Path],
        context: str = "",
        max_images: int = 10,
    ) -> List[dict]:
        """
        Describe multiple images with rate limiting.
        
        Args:
            image_paths: List of paths to image files
            context: Optional context about the document
            max_images: Maximum number of images to process
        
        Returns:
            List of dicts with: path, description, success
        """
        results = []
        
        for i, path in enumerate(image_paths[:max_images]):
            path = Path(path)
            
            # Rate limiting delay (skip for first image)
            if i > 0:
                time.sleep(self.RATE_LIMIT_DELAY)
            
            try:
                description = self.describe_image(path, context)
                results.append({
                    "path": str(path),
                    "description": description,
                    "success": True,
                })
            except Exception as e:
                results.append({
                    "path": str(path),
                    "description": f"[Error: {str(e)[:100]}]",
                    "success": False,
                })
        
        return results


# Singleton instance
_vision_service: Optional[VisionService] = None


def get_vision_service() -> VisionService:
    """Get singleton vision service instance."""
    global _vision_service
    if _vision_service is None:
        _vision_service = VisionService()
    return _vision_service
