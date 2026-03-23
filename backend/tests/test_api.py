from __future__ import annotations

import json
import shutil
from pathlib import Path

from fastapi.testclient import TestClient

import backend.api.deps as deps_module
from backend.api.app import create_app
from backend.api.deps import Container
from backend.core.compiler.gee import GEECompiler
from backend.core.models import WorkflowSpec
from backend.core.planner import ExecutionPlanner
from backend.core.validator import WorkflowValidator


FIXTURES = Path(__file__).resolve().parent / "fixtures"


def load_workflow(name: str) -> WorkflowSpec:
    payload = json.loads((FIXTURES / "workflows" / f"{name}.json").read_text(encoding="utf-8"))
    return WorkflowSpec.model_validate(payload)


def setup_module() -> None:
    test_data_dir = Path(__file__).resolve().parent / "data"
    if test_data_dir.exists():
        for item in test_data_dir.glob("*"):
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
    deps_module.container = Container(test_data_dir)
    deps_module.container.ai_service.provider = FakeProvider()


client = TestClient(create_app())


class FakeProvider:
    def generate_json(self, config, system_prompt: str, user_prompt: str) -> dict:  # noqa: ANN001
        return {
            "workflowDraft": {
                "name": "AI True Color Draft",
                "bindings": {"goal": "true color"},
                "workflow": {
                    "projectId": "placeholder-project",
                    "name": "AI True Color Draft",
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
                            "id": "filter-step",
                            "name": "Filter",
                            "op": "filter",
                            "kind": "template_step",
                            "params": {"start": "2024-01-01", "end": "2024-12-31"},
                            "inputs": ["imagery", "roi"],
                            "outputs": [{"name": "filtered_imagery", "dataType": "ImageCollection"}],
                            "resourceRefs": [],
                            "validationState": {"valid": True, "diagnostics": []},
                        },
                        {
                            "id": "reduce-step",
                            "name": "Median Composite",
                            "op": "temporal_reduce",
                            "kind": "ai_script_step",
                            "scriptUnitId": "script_reduce",
                            "params": {"reducer": "median"},
                            "inputs": ["filtered_imagery"],
                            "outputs": [{"name": "composite_image", "dataType": "Image"}],
                            "resourceRefs": [],
                            "validationState": {"valid": True, "diagnostics": []},
                        },
                        {
                            "id": "export-step",
                            "name": "Export",
                            "op": "export",
                            "kind": "template_step",
                            "params": {"destination": "local_download", "filename": "ai-output", "scale": 10, "fileFormat": "GeoTIFF"},
                            "inputs": ["composite_image", "roi"],
                            "outputs": [{"name": "export_file", "dataType": "File"}],
                            "resourceRefs": [],
                            "validationState": {"valid": True, "diagnostics": []},
                        },
                    ],
                    "bindings": {"goal": "true color"},
                    "status": "draft",
                    "schemaVersion": "1.0.0",
                },
                "linearSteps": [
                    {"id": "roi-input", "name": "ROI Input", "op": "input", "kind": "template_step", "inputs": [], "outputs": ["roi"], "providerHint": "local_python", "resourceRefs": [], "params": {}},
                    {"id": "dataset-input", "name": "Dataset Input", "op": "input", "kind": "template_step", "inputs": [], "outputs": ["imagery"], "providerHint": "gee", "resourceRefs": [], "params": {}},
                    {"id": "filter-step", "name": "Filter", "op": "filter", "kind": "template_step", "inputs": ["imagery", "roi"], "outputs": ["filtered_imagery"], "providerHint": "gee", "resourceRefs": [], "params": {}},
                    {"id": "reduce-step", "name": "Median Composite", "op": "temporal_reduce", "kind": "ai_script_step", "scriptUnitId": "script_reduce", "inputs": ["filtered_imagery"], "outputs": ["composite_image"], "providerHint": "gee", "resourceRefs": [], "params": {}},
                    {"id": "export-step", "name": "Export", "op": "export", "kind": "template_step", "inputs": ["composite_image", "roi"], "outputs": ["export_file"], "providerHint": "gee", "resourceRefs": [], "params": {}},
                ],
            },
            "scriptUnits": [
                {
                    "id": "script_reduce",
                    "name": "Median Composite Script",
                    "provider": "gee",
                    "language": "gee_js",
                    "script": "var composite = filtered_imagery.median();",
                    "inputs": ["filtered_imagery"],
                    "outputs": ["composite_image"],
                    "resourceRefs": [],
                    "status": "draft",
                }
            ],
            "diagnostics": [],
            "explanation": ["Structured AI draft generated."],
        }


def create_project() -> str:
    response = client.post("/projects", json={"name": "Test Project", "description": "test"})
    assert response.status_code == 200
    return response.json()["id"]


def test_validator_fixture_and_cycle_detection() -> None:
    validator = WorkflowValidator()
    valid = validator.validate(load_workflow("ndvi_quick_analysis"))
    assert valid.valid is True

    invalid = validator.validate(load_workflow("invalid_cycle"))
    assert invalid.valid is False
    assert any(item["code"] == "workflow.graph.cycle" for item in [diag.model_dump() for diag in invalid.diagnostics])


def test_planner_fixture_matches_expected_actions() -> None:
    workflow = load_workflow("ndvi_quick_analysis")
    plan = ExecutionPlanner().build(workflow)
    expected = json.loads((FIXTURES / "plans" / "ndvi_quick_analysis.json").read_text(encoding="utf-8"))
    assert [item.action for item in plan.operations] == expected["actions"]


def test_compiler_matches_golden_fragments() -> None:
    workflow = load_workflow("ndvi_quick_analysis")
    plan = ExecutionPlanner().build(workflow)
    script, _ = GEECompiler().compile(workflow, plan)
    golden = (FIXTURES / "scripts" / "ndvi_quick_analysis.js").read_text(encoding="utf-8")
    for fragment in [line for line in golden.splitlines() if line.strip()]:
        assert fragment in script


def test_api_compile_run_and_ai_contract() -> None:
    project_id = create_project()
    workflow = load_workflow("ndvi_quick_analysis")
    workflow.projectId = project_id

    created = client.post("/workflows", json=workflow.model_dump())
    assert created.status_code == 200
    workflow_id = created.json()["id"]

    validated = client.post(f"/workflows/{workflow_id}/validate")
    assert validated.status_code == 200
    assert validated.json()["valid"] is True
    assert "diagnostics" in validated.json()

    compiled = client.post(f"/workflows/{workflow_id}/compile")
    assert compiled.status_code == 200
    compile_payload = compiled.json()
    assert "plan" in compile_payload
    assert compile_payload["plan"]["plannerVersion"] == "1.0.0"

    run = client.post(f"/workflows/{workflow_id}/run", json={"userScriptOverride": None})
    assert run.status_code == 200
    run_payload = run.json()
    assert "snapshotRefs" in run_payload
    assert run_payload["run"]["status"] == "completed"

    config = client.post(
        "/ai/config",
        json={"provider": "openai_compatible", "model": "fake-model", "baseUrl": "https://example.invalid/v1", "apiKey": "test-key", "enabled": True},
    )
    assert config.status_code == 200
    assert config.json()["hasKey"] is True

    generated = client.post("/ai/workflow/generate", json={"goal": "Create a true color composite workflow.", "projectId": project_id})
    assert generated.status_code == 200
    generated_payload = generated.json()
    assert generated_payload["workflowDraft"]["linearSteps"][3]["kind"] == "ai_script_step"
    draft_id = generated_payload["workflowDraft"]["id"]

    materialized = client.post(f"/workflows/new/materialize", json={"draftId": draft_id, "projectId": project_id})
    assert materialized.status_code == 200
    assert materialized.json()["workflow"]["steps"][3]["scriptUnitId"] == "script_reduce"

    suggest = client.post("/ai/workflow/suggest", json={"goal": "Track water area using NDWI.", "projectId": project_id})
    assert suggest.status_code == 200
    assert suggest.json()["workflow"]["steps"][3]["op"] == "temporal_reduce"
    assert "diagnostics" in suggest.json()

    draft = client.post("/ai/template/draft", json={"goal": "Reusable built-up monitoring template"})
    assert draft.status_code == 200
    assert draft.json()["template"]["kind"] == "ai_draft"


def test_auth_dual_mode_endpoints() -> None:
    status = client.get("/auth/gee/status")
    assert status.status_code == 200
    assert "mode" in status.json()

    browser_start = client.post("/auth/gee/login/browser/start")
    assert browser_start.status_code == 200
    browser_payload = browser_start.json()
    assert browser_payload["mode"] == "browser_oauth"
    assert browser_payload["state"]

    browser_complete = client.post(
        "/auth/gee/login/browser/complete",
        json={
            "state": browser_payload["state"],
            "accountEmail": "ui@example.com",
            "projectId": "browser-project"
        },
    )
    assert browser_complete.status_code == 200
    assert browser_complete.json()["authenticated"] is True
    assert browser_complete.json()["projectId"] == "browser-project"

    service_credentials = Path(__file__).resolve().parent / "service-account.json"
    service_credentials.write_text(
        '{"type":"service_account","project_id":"svc-project","client_email":"svc@example.com"}',
        encoding="utf-8",
    )
    service_login = client.post(
        "/auth/gee/login/service-account",
        json={"credentialsPath": str(service_credentials), "projectId": "svc-project"},
    )
    assert service_login.status_code == 200
    assert service_login.json()["mode"] == "service_account"
    assert service_login.json()["authenticated"] is True

    validation = client.post("/auth/gee/validate")
    assert validation.status_code == 200
    assert validation.json()["valid"] is True

    logout = client.post("/auth/gee/logout")
    assert logout.status_code == 200
    assert logout.json()["authenticated"] is False


def test_local_provider_metadata() -> None:
    sample = Path(__file__).resolve().parent / "sample.csv"
    sample.write_text("a,b\n1,2\n", encoding="utf-8")
    metadata = deps_module.container.local_provider.describe_input(str(sample))
    assert metadata["kind"] == "table"
    assert metadata["rows"] == 1
