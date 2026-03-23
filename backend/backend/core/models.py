from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field

from .diagnostics import Diagnostic


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:10]}"


StepOp = Literal["input", "filter", "temporal_reduce", "index", "band_math", "region_stats", "export"]
ProviderType = Literal["gee", "local_python"]
DataType = Literal["Image", "ImageCollection", "Feature", "FeatureCollection", "Table", "Raster", "File", "Scalar"]
TemplateKind = Literal["built_in", "user_saved", "ai_draft"]
WorkflowStatus = Literal["draft", "validated", "compiled", "running", "completed", "failed"]
AuthMode = Literal["browser_oauth", "service_account", "none"]
ExportDestination = Literal["local_download", "google_drive"]
StepKind = Literal["template_step", "ai_script_step"]
AssetKind = Literal["staged_roi", "gee_asset", "artifact_ref", "uploaded_file"]
ScriptLanguage = Literal["gee_js"]
AIProviderKind = Literal["openai_compatible"]


class StepOutput(BaseModel):
    name: str
    dataType: DataType
    description: str = ""


class ValidationState(BaseModel):
    valid: bool = True
    diagnostics: list[Diagnostic] = Field(default_factory=list)


class WorkflowStep(BaseModel):
    id: str
    name: str
    op: StepOp
    params: dict[str, Any] = Field(default_factory=dict)
    inputs: list[str] = Field(default_factory=list)
    outputs: list[StepOutput] = Field(default_factory=list)
    kind: StepKind = "template_step"
    scriptUnitId: str | None = None
    resourceRefs: list[str] = Field(default_factory=list)
    executionHints: dict[str, Any] = Field(default_factory=dict)
    validationState: ValidationState = Field(default_factory=ValidationState)


class Project(BaseModel):
    id: str = Field(default_factory=lambda: new_id("project"))
    name: str
    description: str = ""
    createdAt: str = Field(default_factory=utc_now)
    updatedAt: str = Field(default_factory=utc_now)
    defaultWorkflowId: str | None = None


class Template(BaseModel):
    id: str = Field(default_factory=lambda: new_id("template"))
    name: str
    kind: TemplateKind = "user_saved"
    description: str = ""
    stepBlueprints: list[WorkflowStep] = Field(default_factory=list)
    parameterSchema: dict[str, Any] = Field(default_factory=dict)
    defaults: dict[str, Any] = Field(default_factory=dict)
    version: str = "1.0.0"


class WorkflowSpec(BaseModel):
    id: str = Field(default_factory=lambda: new_id("workflow"))
    projectId: str
    name: str
    steps: list[WorkflowStep] = Field(default_factory=list)
    bindings: dict[str, Any] = Field(default_factory=dict)
    sourceTemplateId: str | None = None
    status: WorkflowStatus = "draft"
    schemaVersion: str = "1.0.0"


class AIConfig(BaseModel):
    provider: AIProviderKind = "openai_compatible"
    model: str = "gpt-4.1-mini"
    baseUrl: str | None = "https://api.openai.com/v1"
    apiKey: str | None = None
    enabled: bool = False


class AIConfigStatus(BaseModel):
    provider: AIProviderKind = "openai_compatible"
    model: str = "gpt-4.1-mini"
    baseUrl: str | None = None
    enabled: bool = False
    hasKey: bool = False
    message: str = "AI is not configured."


class AssetRef(BaseModel):
    id: str = Field(default_factory=lambda: new_id("asset"))
    kind: AssetKind
    name: str
    location: str
    projectId: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ScriptUnit(BaseModel):
    id: str = Field(default_factory=lambda: new_id("script"))
    name: str
    provider: ProviderType = "gee"
    language: ScriptLanguage = "gee_js"
    script: str
    inputs: list[str] = Field(default_factory=list)
    outputs: list[str] = Field(default_factory=list)
    resourceRefs: list[str] = Field(default_factory=list)
    status: str = "draft"


class WorkflowLinearStep(BaseModel):
    id: str
    name: str
    op: StepOp
    kind: StepKind = "template_step"
    inputs: list[str] = Field(default_factory=list)
    outputs: list[str] = Field(default_factory=list)
    scriptUnitId: str | None = None
    providerHint: ProviderType = "gee"
    resourceRefs: list[str] = Field(default_factory=list)
    params: dict[str, Any] = Field(default_factory=dict)


class WorkflowDraft(BaseModel):
    id: str = Field(default_factory=lambda: new_id("draft"))
    projectId: str
    name: str
    workflow: WorkflowSpec
    linearSteps: list[WorkflowLinearStep] = Field(default_factory=list)
    bindings: dict[str, Any] = Field(default_factory=dict)
    diagnostics: list[Diagnostic] = Field(default_factory=list)


class ProviderDecision(BaseModel):
    stepId: str
    operation: str
    provider: ProviderType
    reason: str


class ExecutionOperation(BaseModel):
    id: str = Field(default_factory=lambda: new_id("op"))
    action: str
    provider: ProviderType
    params: dict[str, Any] = Field(default_factory=dict)
    dependsOn: list[str] = Field(default_factory=list)
    cacheKey: str | None = None
    consumes: list[str] = Field(default_factory=list)
    produces: list[StepOutput] = Field(default_factory=list)


class ExecutionPlan(BaseModel):
    id: str = Field(default_factory=lambda: new_id("plan"))
    workflowId: str
    plannerVersion: str = "1.0.0"
    policyVersion: str = "1.0.0"
    operations: list[ExecutionOperation] = Field(default_factory=list)
    providerSummary: list[str] = Field(default_factory=list)
    providerDecisions: list[ProviderDecision] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class Artifact(BaseModel):
    id: str = Field(default_factory=lambda: new_id("artifact"))
    runId: str
    type: str
    pathOrUri: str
    previewMetadata: dict[str, Any] = Field(default_factory=dict)


class RunRecord(BaseModel):
    id: str = Field(default_factory=lambda: new_id("run"))
    workflowId: str
    compiledScript: str
    userScriptOverride: str | None = None
    workflowSnapshot: WorkflowSpec
    executionPlanSnapshot: ExecutionPlan
    compiledScriptSnapshot: str
    status: WorkflowStatus = "running"
    logs: list[str] = Field(default_factory=list)
    artifacts: list[Artifact] = Field(default_factory=list)
    startedAt: str = Field(default_factory=utc_now)
    finishedAt: str | None = None


class ValidationResponse(BaseModel):
    valid: bool
    diagnostics: list[Diagnostic] = Field(default_factory=list)


class CompileResponse(BaseModel):
    workflow: WorkflowSpec
    plan: ExecutionPlan
    script: str
    diagnostics: list[Diagnostic] = Field(default_factory=list)
    explanation: list[str] = Field(default_factory=list)


class GeeAuthLoginRequest(BaseModel):
    mode: str = "environment"


class GeeAuthStatus(BaseModel):
    mode: AuthMode
    configured: bool
    authenticated: bool
    projectId: str | None = None
    accountEmail: str | None = None
    message: str


class BrowserLoginStartResponse(BaseModel):
    mode: AuthMode = "browser_oauth"
    loginUrl: str
    state: str
    callbackUrl: str
    message: str


class BrowserLoginCompleteRequest(BaseModel):
    state: str
    code: str = ""
    accountEmail: str | None = None
    projectId: str | None = None


class ServiceAccountLoginRequest(BaseModel):
    mode: AuthMode = "service_account"
    credentialsPath: str
    projectId: str | None = None


class GeeValidateResponse(BaseModel):
    valid: bool
    status: GeeAuthStatus


class WorkflowSuggestRequest(BaseModel):
    goal: str
    projectId: str


class WorkflowSuggestResponse(BaseModel):
    workflow: WorkflowSpec
    diagnostics: list[Diagnostic] = Field(default_factory=list)
    explanation: list[str] = Field(default_factory=list)


class TemplateDraftRequest(BaseModel):
    goal: str


class TemplateDraftResponse(BaseModel):
    template: Template
    diagnostics: list[Diagnostic] = Field(default_factory=list)
    explanation: list[str] = Field(default_factory=list)


class ScriptExplainRequest(BaseModel):
    workflowId: str


class ScriptExplainResponse(BaseModel):
    explanation: list[str]


class AIConfigRequest(BaseModel):
    provider: AIProviderKind = "openai_compatible"
    model: str = "gpt-4.1-mini"
    baseUrl: str | None = "https://api.openai.com/v1"
    apiKey: str | None = None
    enabled: bool = True


class WorkflowGenerateRequest(BaseModel):
    goal: str
    projectId: str


class WorkflowGenerateResponse(BaseModel):
    workflowDraft: WorkflowDraft
    scriptUnits: list[ScriptUnit] = Field(default_factory=list)
    diagnostics: list[Diagnostic] = Field(default_factory=list)
    explanation: list[str] = Field(default_factory=list)


class WorkflowMaterializeRequest(BaseModel):
    draftId: str
    projectId: str | None = None
    workflowName: str | None = None


class WorkflowMaterializeResponse(BaseModel):
    workflow: WorkflowSpec
    scriptUnits: list[ScriptUnit] = Field(default_factory=list)
    diagnostics: list[Diagnostic] = Field(default_factory=list)


class WorkflowRunRequest(BaseModel):
    userScriptOverride: str | None = None


class RunSummaryResponse(BaseModel):
    run: RunRecord
    snapshotRefs: dict[str, str]


class RoiUploadResponse(BaseModel):
    fileName: str
    sourceType: Literal["uploaded_geojson", "uploaded_shapefile"]
    filePath: str
    featureCount: int
    geojson: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    assetRef: AssetRef | None = None


class DatasetEntry(BaseModel):
    id: str
    name: str
    description: str
    provider: str
    bands: list[str]
    defaultScale: int
