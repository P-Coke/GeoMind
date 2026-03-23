export type StepOp = "input" | "filter" | "temporal_reduce" | "index" | "band_math" | "region_stats" | "export";
export type DataType = "Image" | "ImageCollection" | "Feature" | "FeatureCollection" | "Table" | "Raster" | "File" | "Scalar";
export type TemplateKind = "built_in" | "user_saved" | "ai_draft";
export type DiagnosticSeverity = "error" | "warning" | "info";
export type LayerKind = "base" | "ee" | "local";
export type DockPanelId = "browser" | "layers" | "toolbox" | "inspector" | "parameters" | "ai" | "execution" | "logs" | "results" | "script";
export type ExportDestination = "local_download" | "google_drive";
export type StepKind = "template_step" | "ai_script_step";

export interface Diagnostic {
  code: string;
  message: string;
  severity: DiagnosticSeverity;
  stepId?: string | null;
  fieldPath?: string | null;
}

export interface StepOutput {
  name: string;
  dataType: DataType;
  description?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  op: StepOp;
  params: Record<string, unknown>;
  inputs: string[];
  outputs: StepOutput[];
  kind?: StepKind;
  scriptUnitId?: string | null;
  resourceRefs?: string[];
  executionHints?: Record<string, unknown>;
  validationState: {
    valid: boolean;
    diagnostics: Diagnostic[];
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  defaultWorkflowId?: string | null;
}

export interface WorkflowSpec {
  id: string;
  projectId: string;
  name: string;
  steps: WorkflowStep[];
  bindings: Record<string, unknown>;
  sourceTemplateId?: string | null;
  status: string;
  schemaVersion: string;
}

export interface Template {
  id: string;
  name: string;
  kind: TemplateKind;
  description: string;
  stepBlueprints: WorkflowStep[];
  parameterSchema: Record<string, unknown>;
  defaults: Record<string, unknown>;
  version: string;
}

export interface ExecutionOperation {
  id: string;
  action: string;
  provider: "gee" | "local_python";
  params: Record<string, unknown>;
  dependsOn: string[];
  cacheKey?: string | null;
  consumes: string[];
  produces: StepOutput[];
}

export interface ProviderDecision {
  stepId: string;
  operation: string;
  provider: "gee" | "local_python";
  reason: string;
}

export interface ExecutionPlan {
  id: string;
  workflowId: string;
  plannerVersion: string;
  policyVersion: string;
  operations: ExecutionOperation[];
  providerSummary: string[];
  providerDecisions: ProviderDecision[];
  notes: string[];
}

export interface Artifact {
  id: string;
  runId: string;
  type: string;
  pathOrUri: string;
  previewMetadata: Record<string, unknown>;
}

export interface RoiUploadResponse {
  fileName: string;
  sourceType: "uploaded_geojson" | "uploaded_shapefile";
  filePath: string;
  featureCount: number;
  geojson: string;
  metadata: Record<string, unknown>;
  assetRef?: AssetRef | null;
}

export interface AIConfigStatus {
  provider: "openai_compatible";
  model: string;
  baseUrl?: string | null;
  enabled: boolean;
  hasKey: boolean;
  message: string;
}

export interface AssetRef {
  id: string;
  kind: "staged_roi" | "gee_asset" | "artifact_ref" | "uploaded_file";
  name: string;
  location: string;
  projectId?: string | null;
  metadata: Record<string, unknown>;
}

export interface ScriptUnit {
  id: string;
  name: string;
  provider: "gee" | "local_python";
  language: "gee_js";
  script: string;
  inputs: string[];
  outputs: string[];
  resourceRefs: string[];
  status: string;
}

export interface WorkflowLinearStep {
  id: string;
  name: string;
  op: StepOp;
  kind: StepKind;
  inputs: string[];
  outputs: string[];
  scriptUnitId?: string | null;
  providerHint: "gee" | "local_python";
  resourceRefs: string[];
  params: Record<string, unknown>;
}

export interface WorkflowDraft {
  id: string;
  projectId: string;
  name: string;
  workflow: WorkflowSpec;
  linearSteps: WorkflowLinearStep[];
  bindings: Record<string, unknown>;
  diagnostics: Diagnostic[];
}

export interface RunRecord {
  id: string;
  workflowId: string;
  compiledScript: string;
  userScriptOverride?: string | null;
  workflowSnapshot: WorkflowSpec;
  executionPlanSnapshot: ExecutionPlan;
  compiledScriptSnapshot: string;
  status: string;
  logs: string[];
  artifacts: Artifact[];
  startedAt: string;
  finishedAt?: string | null;
}

export interface DatasetEntry {
  id: string;
  name: string;
  description: string;
  provider: string;
  bands: string[];
  defaultScale: number;
}

export interface GeeAuthStatus {
  mode: "browser_oauth" | "service_account" | "none";
  configured: boolean;
  authenticated: boolean;
  projectId?: string | null;
  accountEmail?: string | null;
  message: string;
}

export interface BrowserLoginStartResponse {
  mode: "browser_oauth";
  loginUrl: string;
  state: string;
  callbackUrl: string;
  message: string;
}

export interface GeeValidateResponse {
  valid: boolean;
  status: GeeAuthStatus;
}

export interface ValidationResponse {
  valid: boolean;
  diagnostics: Diagnostic[];
}

export interface CompileResponse {
  workflow: WorkflowSpec;
  plan: ExecutionPlan;
  script: string;
  diagnostics: Diagnostic[];
  explanation: string[];
}

export interface RunSummaryResponse {
  run: RunRecord;
  snapshotRefs: Record<string, string>;
}

export interface WorkflowGenerateResponse {
  workflowDraft: WorkflowDraft;
  scriptUnits: ScriptUnit[];
  diagnostics: Diagnostic[];
  explanation: string[];
}

export interface WorkflowMaterializeResponse {
  workflow: WorkflowSpec;
  scriptUnits: ScriptUnit[];
  diagnostics: Diagnostic[];
}

export interface LayerNode {
  id: string;
  name: string;
  kind: LayerKind;
  visible: boolean;
  opacity: number;
  sourceRef?: string;
  groupId: "base" | "ee" | "local";
  metadata?: {
    basemap?: BasemapInstance;
    eeRender?: Record<string, unknown>;
    localSource?: UploadedRoiMetadata;
    geojson?: string;
    tileUrl?: string;
    sourceType?: string;
    [key: string]: unknown;
  };
  children?: LayerNode[];
}

export interface BasemapVariantDefinition {
  id: string;
  name: string;
  styleType: "imagery" | "vector";
  urlTemplate: string;
  attribution: string;
  requiresKey?: boolean;
}

export interface BasemapProviderDefinition {
  id: string;
  name: string;
  variants: BasemapVariantDefinition[];
}

export interface BasemapInstance {
  providerId: string;
  variantId: string;
  styleType: "imagery" | "vector";
  urlTemplate: string;
  attribution: string;
  apiKeyRef?: string;
}

export interface UploadedRoiMetadata {
  fileName: string;
  sourceType: "uploaded_geojson" | "uploaded_shapefile" | "drawn_roi";
  filePath?: string;
  featureCount?: number;
}

export interface DockLayoutState {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  bottomCollapsed: boolean;
  leftWidth: number;
  rightWidth: number;
  bottomHeight: number;
  leftActive: "browser" | "layers" | "toolbox";
  rightActive: "inspector" | "parameters" | "ai";
  bottomActive: "execution" | "logs" | "results" | "script";
}
