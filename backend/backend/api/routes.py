from __future__ import annotations

import shutil
from pathlib import Path

from fastapi import APIRouter
from fastapi import File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from ..core.models import (
    AIConfigRequest,
    AIConfigStatus,
    AssetRef,
    BrowserLoginCompleteRequest,
    BrowserLoginStartResponse,
    CompileResponse,
    DatasetEntry,
    GeeAuthStatus,
    GeeValidateResponse,
    Project,
    RoiUploadResponse,
    RunRecord,
    RunSummaryResponse,
    ServiceAccountLoginRequest,
    ScriptExplainRequest,
    ScriptExplainResponse,
    ScriptUnit,
    Template,
    TemplateDraftRequest,
    TemplateDraftResponse,
    ValidationResponse,
    WorkflowGenerateRequest,
    WorkflowGenerateResponse,
    WorkflowMaterializeRequest,
    WorkflowMaterializeResponse,
    WorkflowRunRequest,
    WorkflowSpec,
    WorkflowSuggestRequest,
    WorkflowSuggestResponse,
)
from . import deps
from .deps import require_project, require_run, require_template, require_workflow

router = APIRouter()


@router.get("/auth/gee/status", response_model=GeeAuthStatus)
def gee_status() -> GeeAuthStatus:
    return deps.container.auth_manager.get_status()


@router.post("/auth/gee/login/browser/start", response_model=BrowserLoginStartResponse)
def gee_browser_login_start() -> BrowserLoginStartResponse:
    return deps.container.auth_manager.start_browser_login()


@router.post("/auth/gee/login/browser/complete", response_model=GeeAuthStatus)
def gee_browser_login_complete(request: BrowserLoginCompleteRequest) -> GeeAuthStatus:
    return deps.container.auth_manager.complete_browser_login(request)


@router.post("/auth/gee/login/service-account", response_model=GeeAuthStatus)
def gee_service_account_login(request: ServiceAccountLoginRequest) -> GeeAuthStatus:
    return deps.container.auth_manager.login_service_account(request)


@router.post("/auth/gee/validate", response_model=GeeValidateResponse)
def gee_validate() -> GeeValidateResponse:
    return deps.container.auth_manager.validate()


@router.post("/auth/gee/logout", response_model=GeeAuthStatus)
def gee_logout() -> GeeAuthStatus:
    return deps.container.auth_manager.logout()


@router.get("/datasets/catalog", response_model=list[DatasetEntry])
def dataset_catalog() -> list[DatasetEntry]:
    return [DatasetEntry.model_validate(item) for item in deps.container.gee_provider.datasets()]


@router.post("/local/roi/upload", response_model=RoiUploadResponse)
def upload_roi(projectId: str | None = Form(None), file: UploadFile = File(...)) -> RoiUploadResponse:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".geojson", ".json", ".zip"}:
        raise HTTPException(status_code=400, detail="Only GeoJSON and Shapefile ZIP are supported.")
    upload_dir = deps.container.data_dir / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    target_path = upload_dir / (file.filename or "roi.geojson")
    with target_path.open("wb") as handle:
        shutil.copyfileobj(file.file, handle)
    try:
        payload = deps.container.local_provider.extract_roi(str(target_path))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    asset_ref = deps.container.ai_service.register_asset_ref(
        AssetRef(
            kind="staged_roi",
            name=payload["fileName"],
            location=payload["filePath"],
            projectId=projectId,
            metadata={
                "sourceType": payload["sourceType"],
                "featureCount": payload["featureCount"],
                "geojson": payload["geojson"],
            },
        )
    )
    payload["assetRef"] = asset_ref.model_dump()
    return RoiUploadResponse.model_validate(payload)


@router.get("/assets", response_model=list[AssetRef])
def list_assets(projectId: str | None = None) -> list[AssetRef]:
    return deps.container.repository.list_asset_refs(projectId)


@router.post("/projects", response_model=Project)
def create_project(project: Project) -> Project:
    return deps.container.project_service.create(project)


@router.get("/projects", response_model=list[Project])
def list_projects() -> list[Project]:
    return deps.container.project_service.list()


@router.get("/projects/{project_id}", response_model=Project)
def get_project(project_id: str) -> Project:
    return require_project(project_id)


@router.put("/projects/{project_id}", response_model=Project)
def update_project(project_id: str, project: Project) -> Project:
    require_project(project_id)
    return deps.container.project_service.update(project_id, project)


@router.post("/templates", response_model=Template)
def create_template(template: Template) -> Template:
    return deps.container.template_service.create(template)


@router.get("/templates", response_model=list[Template])
def list_templates() -> list[Template]:
    return deps.container.template_service.list()


@router.get("/templates/{template_id}", response_model=Template)
def get_template(template_id: str) -> Template:
    return require_template(template_id)


@router.post("/workflows", response_model=WorkflowSpec)
def create_workflow(workflow: WorkflowSpec) -> WorkflowSpec:
    require_project(workflow.projectId)
    return deps.container.workflow_service.create(workflow)


@router.get("/workflows/{workflow_id}", response_model=WorkflowSpec)
def get_workflow(workflow_id: str) -> WorkflowSpec:
    return require_workflow(workflow_id)


@router.put("/workflows/{workflow_id}", response_model=WorkflowSpec)
def update_workflow(workflow_id: str, workflow: WorkflowSpec) -> WorkflowSpec:
    require_project(workflow.projectId)
    return deps.container.workflow_service.update(workflow_id, workflow)


@router.post("/workflows/{workflow_id}/validate", response_model=ValidationResponse)
def validate_workflow(workflow_id: str) -> ValidationResponse:
    return deps.container.workflow_service.validate(require_workflow(workflow_id))


@router.post("/workflows/{workflow_id}/compile", response_model=CompileResponse)
def compile_workflow(workflow_id: str) -> CompileResponse:
    return deps.container.workflow_service.compile(require_workflow(workflow_id))


@router.post("/workflows/{workflow_id}/run", response_model=RunSummaryResponse)
def run_workflow(workflow_id: str, request: WorkflowRunRequest) -> RunSummaryResponse:
    return deps.container.run_service.run(require_workflow(workflow_id), request.userScriptOverride)


@router.post("/workflows/{workflow_id}/materialize", response_model=WorkflowMaterializeResponse)
def materialize_workflow(workflow_id: str, request: WorkflowMaterializeRequest) -> WorkflowMaterializeResponse:
    if workflow_id != "new":
        require_workflow(workflow_id)
    if request.projectId:
        require_project(request.projectId)
    return deps.container.ai_service.materialize_workflow(workflow_id, request.draftId, request.projectId, request.workflowName)


@router.post("/ai/workflow/suggest", response_model=WorkflowSuggestResponse)
def ai_suggest_workflow(request: WorkflowSuggestRequest) -> WorkflowSuggestResponse:
    require_project(request.projectId)
    return deps.container.ai_service.suggest_workflow(request.goal, request.projectId)


@router.get("/ai/config/status", response_model=AIConfigStatus)
def ai_config_status() -> AIConfigStatus:
    return deps.container.ai_service.get_config_status()


@router.post("/ai/config", response_model=AIConfigStatus)
def ai_config_save(request: AIConfigRequest) -> AIConfigStatus:
    return deps.container.ai_service.save_config(request)


@router.post("/ai/workflow/generate", response_model=WorkflowGenerateResponse)
def ai_generate_workflow(request: WorkflowGenerateRequest) -> WorkflowGenerateResponse:
    require_project(request.projectId)
    return deps.container.ai_service.generate_linear_workflow(request.goal, request.projectId)


@router.post("/ai/template/draft", response_model=TemplateDraftResponse)
def ai_template_draft(request: TemplateDraftRequest) -> TemplateDraftResponse:
    return deps.container.ai_service.draft_template(request.goal)


@router.post("/ai/script/explain", response_model=ScriptExplainResponse)
def ai_explain_script(request: ScriptExplainRequest) -> ScriptExplainResponse:
    compiled = deps.container.workflow_service.compile(require_workflow(request.workflowId))
    return ScriptExplainResponse(explanation=compiled.explanation)


@router.post("/script-units", response_model=ScriptUnit)
def save_script_unit(script_unit: ScriptUnit) -> ScriptUnit:
    return deps.container.ai_service.save_script_unit(script_unit)


@router.get("/script-units/{script_unit_id}", response_model=ScriptUnit)
def get_script_unit(script_unit_id: str) -> ScriptUnit:
    script_unit = deps.container.ai_service.get_script_unit(script_unit_id)
    if script_unit is None:
        raise HTTPException(status_code=404, detail="ScriptUnit not found")
    return script_unit


@router.get("/runs/{run_id}", response_model=RunRecord)
def get_run(run_id: str) -> RunRecord:
    return require_run(run_id)


@router.get("/runs", response_model=list[RunRecord])
def list_runs() -> list[RunRecord]:
    return deps.container.run_service.list()


@router.get("/runs/{run_id}/logs", response_model=list[str])
def get_run_logs(run_id: str) -> list[str]:
    return require_run(run_id).logs


@router.get("/runs/{run_id}/artifacts")
def get_run_artifacts(run_id: str) -> list[dict]:
    return [artifact.model_dump() for artifact in require_run(run_id).artifacts]


@router.get("/artifacts/download")
def download_artifact(path: str) -> FileResponse:
    artifact_path = Path(path)
    if not artifact_path.exists():
        raise HTTPException(status_code=404, detail="Artifact file not found")
    return FileResponse(artifact_path, filename=artifact_path.name)
