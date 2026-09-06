"""Storage Abstraction Layer Interface."""
from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class StorageProvider(ABC):
    """Abstract interface for local/cloud file storage."""

    @abstractmethod
    async def save_file(self, filename: str, content: bytes, content_type: Optional[str] = None) -> str:
        """Save a file and return its storage key/path."""
        pass

    @abstractmethod
    async def get_file(self, file_path: str) -> Optional[bytes]:
        """Read a file's byte contents."""
        pass

    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """Delete a file from storage."""
        pass

    @abstractmethod
    def get_url(self, file_path: str) -> str:
        """Get publicly/authenticated accessible URL or local path for the file."""
        pass
