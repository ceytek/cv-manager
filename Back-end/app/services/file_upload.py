"""
File Upload Service
Handles CV file upload, validation, and storage
"""
import os
import uuid
from pathlib import Path
from datetime import datetime
from typing import Tuple, Optional

from app.core.config import settings


class FileUploadService:
    """Service for handling file uploads"""

    @staticmethod
    def validate_file(filename: str, file_size: int) -> Tuple[bool, Optional[str]]:
        """
        Validate uploaded file
        
        Args:
            filename: Original filename
            file_size: File size in bytes
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file extension
        file_ext = Path(filename).suffix.lower()
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            return False, f"Desteklenmeyen dosya formatı. İzin verilenler: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        
        # Check file size
        if file_size > settings.MAX_UPLOAD_SIZE:
            max_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
            return False, f"Dosya boyutu {max_mb} MB'den büyük olamaz"
        
        return True, None

    @staticmethod
    def generate_unique_filename(original_filename: str) -> str:
        """
        Generate unique filename to prevent conflicts
        Format: YYYYMMDD_UUID_original.ext
        
        Args:
            original_filename: Original uploaded filename
            
        Returns:
            Unique filename
        """
        # Get file extension
        file_ext = Path(original_filename).suffix.lower()
        
        # Generate unique name
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        # Sanitize original filename (remove special chars)
        safe_name = "".join(c for c in Path(original_filename).stem if c.isalnum() or c in ('_', '-'))
        safe_name = safe_name[:50]  # Limit length
        
        return f"{timestamp}_{unique_id}_{safe_name}{file_ext}"

    @staticmethod
    async def save_file(file_content: bytes, filename: str) -> Tuple[str, str]:
        """
        Save uploaded file to disk
        
        Args:
            file_content: File binary content
            filename: Original filename
            
        Returns:
            Tuple of (file_path, generated_filename)
        """
        # Ensure upload directory exists
        settings.CV_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        unique_filename = FileUploadService.generate_unique_filename(filename)
        
        # Full file path
        file_path = settings.CV_UPLOAD_DIR / unique_filename
        
        # Write file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        return str(file_path), unique_filename

    @staticmethod
    def delete_file(file_path: str) -> bool:
        """
        Delete file from disk
        
        Args:
            file_path: Full path to file
            
        Returns:
            True if deleted successfully
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False

    @staticmethod
    def get_file_size(file_content: bytes) -> int:
        """Get file size in bytes"""
        return len(file_content)

    async def upload_cv_to_storage(self, cv_file) -> Tuple[str, str]:
        """
        Upload CV file to storage and return file path and URL.
        
        Args:
            cv_file: UploadFile object from FastAPI
            
        Returns:
            Tuple of (file_path, file_url)
        """
        # Read file content
        file_content = await cv_file.read()
        await cv_file.seek(0)  # Reset file pointer
        
        # Validate file
        file_size = self.get_file_size(file_content)
        is_valid, error_msg = self.validate_file(cv_file.filename, file_size)
        
        if not is_valid:
            raise ValueError(error_msg)
        
        # Save file to disk
        file_path, unique_filename = await self.save_file(file_content, cv_file.filename)
        
        # Generate file URL (relative path for now, can be full URL with domain in production)
        file_url = f"/uploads/cvs/{unique_filename}"
        
        return file_path, file_url
