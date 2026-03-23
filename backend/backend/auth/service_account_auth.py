from __future__ import annotations

import json
from pathlib import Path

from ..core.models import GeeAuthStatus, ServiceAccountLoginRequest


class ServiceAccountProvider:
    mode = "service_account"

    def __init__(self, state_file: Path) -> None:
        self.state_file = state_file

    def get_status(self) -> GeeAuthStatus:
        state = self._load_state()
        credentials_path = state.get("credentialsPath")
        configured = bool(credentials_path)
        authenticated = configured and Path(credentials_path).exists() and bool(state.get("projectId"))
        return GeeAuthStatus(
            mode="service_account",
            configured=configured,
            authenticated=authenticated,
            projectId=state.get("projectId"),
            accountEmail=state.get("accountEmail"),
            message="Service account configured." if authenticated else "Service account not configured.",
        )

    def login(self, request: ServiceAccountLoginRequest) -> GeeAuthStatus:
        credentials_path = Path(request.credentialsPath)
        if not credentials_path.exists():
            return GeeAuthStatus(mode="service_account", configured=False, authenticated=False, message="Credentials file not found.")
        try:
            payload = json.loads(credentials_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return GeeAuthStatus(mode="service_account", configured=False, authenticated=False, message="Credentials file is not valid JSON.")

        project_id = request.projectId or payload.get("project_id")
        if not project_id:
            return GeeAuthStatus(mode="service_account", configured=True, authenticated=False, message="Project ID is required for service account mode.")

        state = {
            "credentialsPath": str(credentials_path),
            "projectId": project_id,
            "accountEmail": payload.get("client_email"),
        }
        self._save_state(state)
        return GeeAuthStatus(
            mode="service_account",
            configured=True,
            authenticated=True,
            projectId=project_id,
            accountEmail=state.get("accountEmail"),
            message="Service account configured.",
        )

    def validate(self) -> GeeAuthStatus:
        return self.get_status()

    def logout(self) -> GeeAuthStatus:
        self._save_state({})
        return GeeAuthStatus(mode="service_account", configured=False, authenticated=False, message="Service account cleared.")

    def get_config(self) -> dict:
        return self._load_state()

    def _load_state(self) -> dict:
        if not self.state_file.exists():
            return {}
        return json.loads(self.state_file.read_text(encoding="utf-8"))

    def _save_state(self, payload: dict) -> None:
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        self.state_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
