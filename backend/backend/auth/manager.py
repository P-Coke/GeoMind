from __future__ import annotations

from pathlib import Path

from ..core.models import BrowserLoginCompleteRequest, BrowserLoginStartResponse, GeeAuthStatus, GeeValidateResponse, ServiceAccountLoginRequest
from .browser_auth import BrowserOAuthProvider
from .service_account_auth import ServiceAccountProvider


class GEEAuthManager:
    def __init__(self, data_dir: Path) -> None:
        auth_dir = data_dir / "auth"
        self.browser = BrowserOAuthProvider(auth_dir / "browser_oauth.json")
        self.service_account = ServiceAccountProvider(auth_dir / "service_account.json")

    def get_status(self) -> GeeAuthStatus:
        service_status = self.service_account.get_status()
        if service_status.configured:
            return service_status
        return self.browser.get_status()

    def start_browser_login(self) -> BrowserLoginStartResponse:
        return self.browser.start_login()

    def complete_browser_login(self, request: BrowserLoginCompleteRequest) -> GeeAuthStatus:
        return self.browser.complete_login(request)

    def login_service_account(self, request: ServiceAccountLoginRequest) -> GeeAuthStatus:
        return self.service_account.login(request)

    def validate(self) -> GeeValidateResponse:
        status = self.get_status()
        return GeeValidateResponse(valid=status.authenticated, status=status)

    def logout(self) -> GeeAuthStatus:
        browser_status = self.browser.logout()
        service_status = self.service_account.logout()
        return GeeAuthStatus(
            mode="none",
            configured=False,
            authenticated=False,
            message="All GEE login state cleared.",
            projectId=service_status.projectId or browser_status.projectId,
            accountEmail=service_status.accountEmail or browser_status.accountEmail,
        )

    def get_service_account_config(self) -> dict:
        return self.service_account.get_config()
