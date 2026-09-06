"""Base Service Layer."""
from typing import Generic, TypeVar

RepositoryType = TypeVar("RepositoryType")


class BaseService(Generic[RepositoryType]):
    """Encapsulates business logic and coordinates repository interactions."""

    def __init__(self, repository: RepositoryType):
        self.repository = repository
