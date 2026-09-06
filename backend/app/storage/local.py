"""Local Disk Storage Implementation (Free & Open-Source)."""
import os
import aiofiles
from typing import Optional
from app.core.config import settings
from app.storage.base import StorageProvider


class LocalStorageProvider(StorageProvider):
    """Stores files on the local filesystem behind a clean abstraction."""

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = os.path.abspath(base_dir or settings.STORAGE_LOCAL_PATH)
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_file(self, filename: str, content: bytes, content_type: Optional[str] = None) -> str:
        safe_filename = os.path.basename(filename)
        dest_path = os.path.join(self.base_dir, safe_filename)
        async with aiofiles.open(dest_path, "wb") as f:
            await f.write(content)
        return safe_filename

    async def get_file(self, file_path: str) -> Optional[bytes]:
        full_path = os.path.join(self.base_dir, os.path.basename(file_path))
        if not os.path.isfile(full_path):
            return None
        async with aiofiles.open(full_path, "rb") as f:
            return await f.read()

    async def delete_file(self, file_path: str) -> bool:
        full_path = os.path.join(self.base_dir, os.path.basename(file_path))
        if os.path.isfile(full_path):
            os.remove(full_path)
            return True
        return False

    def get_url(self, file_path: str) -> str:
        return f"/api/v1/files/{os.path.basename(file_path)}"


storage_service = LocalStorageProvider()
