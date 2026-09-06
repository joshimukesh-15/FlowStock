"""In-Memory Cache & Lock Service (Redis-Compatible Abstraction)."""
import asyncio
import time
from typing import Any, Optional, Dict


class InMemoryCacheService:
    """Lightweight in-memory cache and mutex lock with TTL support.
    
    Provides the exact same interface needed for token blacklists, KPI cache,
    and idempotency locks, ready to swap with Redis later if desired.
    """

    def __init__(self):
        self._store: Dict[str, Any] = {}
        self._expiry: Dict[str, float] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._global_lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Any]:
        async with self._global_lock:
            if key in self._expiry and time.time() > self._expiry[key]:
                del self._store[key]
                del self._expiry[key]
                return None
            return self._store.get(key)

    async def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        async with self._global_lock:
            self._store[key] = value
            if ttl_seconds is not None:
                self._expiry[key] = time.time() + ttl_seconds
            elif key in self._expiry:
                del self._expiry[key]

    async def delete(self, key: str) -> bool:
        async with self._global_lock:
            existed = key in self._store
            self._store.pop(key, None)
            self._expiry.pop(key, None)
            return existed

    async def acquire_lock(self, lock_name: str, timeout: float = 10.0) -> bool:
        """Acquire an in-memory lock for idempotency safety."""
        async with self._global_lock:
            if lock_name not in self._locks:
                self._locks[lock_name] = asyncio.Lock()
            lock = self._locks[lock_name]

        try:
            await asyncio.wait_for(lock.acquire(), timeout=timeout)
            return True
        except asyncio.TimeoutError:
            return False

    async def release_lock(self, lock_name: str) -> None:
        """Release an acquired lock."""
        async with self._global_lock:
            lock = self._locks.get(lock_name)
            if lock and lock.locked():
                lock.release()


cache_service = InMemoryCacheService()
