from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from ..core.models import BrowserLoginCompleteRequest, BrowserLoginStartResponse, GeeAuthStatus


class BrowserOAuthProvider:
    mode = "browser_oauth"

    def __init__(self, state_file: Path) -> None:
        self.state_file = state_file

    def get_status(self) -> GeeAuthStatus:
        state = self._load_state()
        configured = bool(state)
        authenticated = bool(state.get("authenticated"))
        return GeeAuthStatus(
            mode="browser_oauth" if configured else "none",
            configured=configured,
            authenticated=authenticated,
            projectId=state.get("projectId"),
            accountEmail=state.get("accountEmail"),
            message="Browser login active." if authenticated else ("Browser login not completed." if configured else "No GEE login configured."),
        )

    def start_login(self) -> BrowserLoginStartResponse:
        state = uuid4().hex
        callback_url = "http://127.0.0.1:8000/auth/gee/login/browser/complete"
        login_url = (
            "https://accounts.google.com/o/oauth2/v2/auth"
            f"?state={state}&redirect_uri={callback_url}&response_type=code&scope=openid%20email"
        )
        self._save_state({"pendingState": state, "authenticated": False})
        return BrowserLoginStartResponse(
            loginUrl=login_url,
            state=state,
            callbackUrl=callback_url,
            message="Open the login URL in the system browser and complete the Google sign-in flow.",
        )

    def complete_login(self, request: BrowserLoginCompleteRequest) -> GeeAuthStatus:
        state = self._load_state()
        if state.get("pendingState") != request.state:
            return GeeAuthStatus(
                mode="browser_oauth",
                configured=True,
                authenticated=False,
                message="Browser login state mismatch.",
            )
        new_state = {
            "authenticated": True,
            "accountEmail": request.accountEmail or "browser-user@example.com",
            "projectId": request.projectId or state.get("projectId"),
        }
        self._save_state(new_state)
        return GeeAuthStatus(
            mode="browser_oauth",
            configured=True,
            authenticated=True,
            projectId=new_state.get("projectId"),
            accountEmail=new_state.get("accountEmail"),
            message="Browser login completed.",
        )

    def validate(self) -> GeeAuthStatus:
        return self.get_status()

    def logout(self) -> GeeAuthStatus:
        self._save_state({})
        return GeeAuthStatus(
            mode="browser_oauth",
            configured=False,
            authenticated=False,
            message="Browser login cleared.",
        )

    def _load_state(self) -> dict:
        if not self.state_file.exists():
            return {}
        import json

        return json.loads(self.state_file.read_text(encoding="utf-8"))

    def _save_state(self, payload: dict) -> None:
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        import json

        self.state_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
