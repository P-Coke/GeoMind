from __future__ import annotations

from abc import ABC, abstractmethod

from ..core.models import GeeAuthStatus


class BaseGEEAuthProvider(ABC):
    mode: str

    @abstractmethod
    def get_status(self) -> GeeAuthStatus:
        raise NotImplementedError

    @abstractmethod
    def validate(self) -> GeeAuthStatus:
        raise NotImplementedError

    @abstractmethod
    def logout(self) -> GeeAuthStatus:
        raise NotImplementedError

