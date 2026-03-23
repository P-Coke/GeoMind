from __future__ import annotations

import json
from abc import ABC, abstractmethod

import requests

from ..core.models import AIConfig


class AIProviderError(RuntimeError):
    pass


class AIProvider(ABC):
    @abstractmethod
    def generate_json(self, config: AIConfig, system_prompt: str, user_prompt: str) -> dict:
        raise NotImplementedError


class RemoteLLMProvider(AIProvider):
    def generate_json(self, config: AIConfig, system_prompt: str, user_prompt: str) -> dict:
        base_url = (config.baseUrl or "https://api.openai.com/v1").rstrip("/")
        if base_url == "mock://local":
            return self._mock_payload(user_prompt)
        if not config.apiKey:
            raise AIProviderError("AI API key is missing.")

        response = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {config.apiKey}",
                "Content-Type": "application/json",
            },
            json={
                "model": config.model,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
            timeout=60,
        )
        if response.status_code >= 400:
            raise AIProviderError(f"AI request failed: {response.status_code} {response.text}")

        payload = response.json()
        try:
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise AIProviderError("AI response is missing message content.") from exc

        if isinstance(content, list):
            content = "".join(part.get("text", "") if isinstance(part, dict) else str(part) for part in content)
        if not isinstance(content, str) or not content.strip():
            raise AIProviderError("AI response content is empty.")

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise AIProviderError("AI response is not valid JSON.") from exc

    def _mock_payload(self, user_prompt: str) -> dict:
        return {
            "workflowDraft": {
                "name": "Mock AI Draft",
                "bindings": {"goal": user_prompt},
                "workflow": {
                    "projectId": "mock-project",
                    "name": "Mock AI Draft",
                    "steps": [
                        {
                            "id": "roi-input",
                            "name": "ROI Input",
                            "op": "input",
                            "kind": "template_step",
                            "params": {"sourceType": "drawn_roi", "geometry": "{\"type\":\"FeatureCollection\",\"features\":[]}"},
                            "inputs": [],
                            "outputs": [{"name": "roi", "dataType": "FeatureCollection"}],
                            "resourceRefs": [],
                            "validationState": {"valid": True, "diagnostics": []},
                        },
                        {
                            "id": "dataset-input",
                            "name": "Dataset Input",
                            "op": "input",
                            "kind": "template_step",
                            "params": {"sourceType": "gee_collection", "datasetId": "COPERNICUS/S2_SR_HARMONIZED"},
                            "inputs": [],
                            "outputs": [{"name": "imagery", "dataType": "ImageCollection"}],
                            "resourceRefs": [],
                            "validationState": {"valid": True, "diagnostics": []},
                        },
                        {
                            "id": "reduce-step",
                            "name": "Median Composite",
                            "op": "temporal_reduce",
                            "kind": "ai_script_step",
                            "scriptUnitId": "mock_script_reduce",
                            "params": {"reducer": "median"},
                            "inputs": ["imagery"],
                            "outputs": [{"name": "composite_image", "dataType": "Image"}],
                            "resourceRefs": [],
                            "validationState": {"valid": True, "diagnostics": []},
                        },
                        {
                            "id": "export-step",
                            "name": "Export",
                            "op": "export",
                            "kind": "template_step",
                            "params": {"destination": "local_download", "filename": "mock-ai-output", "scale": 10, "fileFormat": "GeoTIFF"},
                            "inputs": ["composite_image", "roi"],
                            "outputs": [{"name": "export_file", "dataType": "File"}],
                            "resourceRefs": [],
                            "validationState": {"valid": True, "diagnostics": []},
                        },
                    ],
                    "bindings": {"goal": user_prompt},
                    "status": "draft",
                    "schemaVersion": "1.0.0",
                },
                "linearSteps": [
                    {"id": "roi-input", "name": "ROI Input", "op": "input", "kind": "template_step", "inputs": [], "outputs": ["roi"], "providerHint": "local_python", "resourceRefs": [], "params": {}},
                    {"id": "dataset-input", "name": "Dataset Input", "op": "input", "kind": "template_step", "inputs": [], "outputs": ["imagery"], "providerHint": "gee", "resourceRefs": [], "params": {}},
                    {"id": "reduce-step", "name": "Median Composite", "op": "temporal_reduce", "kind": "ai_script_step", "scriptUnitId": "mock_script_reduce", "inputs": ["imagery"], "outputs": ["composite_image"], "providerHint": "gee", "resourceRefs": [], "params": {}},
                    {"id": "export-step", "name": "Export", "op": "export", "kind": "template_step", "inputs": ["composite_image", "roi"], "outputs": ["export_file"], "providerHint": "gee", "resourceRefs": [], "params": {}},
                ],
            },
            "scriptUnits": [
                {
                    "id": "mock_script_reduce",
                    "name": "Median Composite Script",
                    "provider": "gee",
                    "language": "gee_js",
                    "script": "var composite = imagery.median();",
                    "inputs": ["imagery"],
                    "outputs": ["composite_image"],
                    "resourceRefs": [],
                    "status": "draft",
                }
            ],
            "diagnostics": [],
            "explanation": ["Mock AI provider generated a linear workflow draft."],
        }
