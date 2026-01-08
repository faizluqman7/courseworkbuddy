"""Image serving router for extracted PDF images."""

import urllib.parse
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/images", tags=["images"])

# Image cache directory (relative to server directory)
IMAGE_CACHE_DIR = Path(__file__).parent.parent / "image_cache"


@router.get("/{document_id}/{filename}")
async def get_image(document_id: str, filename: str):
    """
    Serve an extracted image from a processed document.
    
    Args:
        document_id: The document UUID
        filename: Image filename (e.g., page1_img0.png)
    
    Returns:
        The image file
    """
    # Decode URL-encoded paths
    document_id = urllib.parse.unquote(document_id)
    filename = urllib.parse.unquote(filename)
    
    # Construct full path
    image_path = IMAGE_CACHE_DIR / document_id / filename
    
    # Security: Ensure path is within cache directory
    try:
        image_path = image_path.resolve()
        IMAGE_CACHE_DIR.resolve()
        if not str(image_path).startswith(str(IMAGE_CACHE_DIR.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid path")
    
    # Check if file exists
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="Not a file")
    
    # Determine media type from extension
    suffix = image_path.suffix.lower()
    media_type = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }.get(suffix, "application/octet-stream")
    
    return FileResponse(
        path=image_path,
        media_type=media_type,
        filename=filename,
    )


@router.get("/raw")
async def get_image_by_path(path: str):
    """
    Serve an image by its full path (URL encoded).
    
    This is an alternative endpoint for cases where the full path is known.
    The path must be within the image cache directory.
    """
    # Decode the path
    decoded_path = urllib.parse.unquote(path)
    image_path = Path(decoded_path)
    
    # Security: Ensure path is within cache directory
    try:
        image_path = image_path.resolve()
        if not str(image_path).startswith(str(IMAGE_CACHE_DIR.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid path")
    
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    suffix = image_path.suffix.lower()
    media_type = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }.get(suffix, "application/octet-stream")
    
    return FileResponse(
        path=image_path,
        media_type=media_type,
    )
