import type {
  AIConfigStatus,
  AssetRef,
  Artifact,
  BrowserLoginStartResponse,
  CompileResponse,
  DatasetEntry,
  GeeAuthStatus,
  GeeValidateResponse,
  Project,
  RoiUploadResponse,
  RunSummaryResponse,
  RunRecord,
  ScriptUnit,
  Template,
  ValidationResponse,
  WorkflowGenerateResponse,
  WorkflowMaterializeResponse,
  WorkflowSpec
} from "../types";

const API_BASE = "http://127.0.0.1:8000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const apiClient = {
  getAuthStatus: () => api<GeeAuthStatus>("/auth/gee/status"),
  startBrowserLogin: () => api<BrowserLoginStartResponse>("/auth/gee/login/browser/start", { method: "POST" }),
  completeBrowserLogin: (payload: { state: string; code?: string; accountEmail?: string; projectId?: string }) =>
    api<GeeAuthStatus>("/auth/gee/login/browser/complete", { method: "POST", body: JSON.stringify(payload) }),
  loginServiceAccount: (payload: { credentialsPath: string; projectId?: string | null }) =>
    api<GeeAuthStatus>("/auth/gee/login/service-account", { method: "POST", body: JSON.stringify({ mode: "service_account", ...payload }) }),
  validateGee: () => api<GeeValidateResponse>("/auth/gee/validate", { method: "POST" }),
  logoutGee: () => api<GeeAuthStatus>("/auth/gee/logout", { method: "POST" }),
  getDatasets: () => api<DatasetEntry[]>("/datasets/catalog"),
  uploadRoi: async (file: File, projectId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (projectId) {
      formData.append("projectId", projectId);
    }
    return api<RoiUploadResponse>("/local/roi/upload", { method: "POST", body: formData });
  },
  getAssets: (projectId?: string) => api<AssetRef[]>(`/assets${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`),
  getProjects: () => api<Project[]>("/projects"),
  createProject: (payload: Partial<Project>) => api<Project>("/projects", { method: "POST", body: JSON.stringify(payload) }),
  getTemplates: () => api<Template[]>("/templates"),
  createTemplate: (payload: Partial<Template>) => api<Template>("/templates", { method: "POST", body: JSON.stringify(payload) }),
  createWorkflow: (payload: Partial<WorkflowSpec>) => api<WorkflowSpec>("/workflows", { method: "POST", body: JSON.stringify(payload) }),
  updateWorkflow: (id: string, payload: Partial<WorkflowSpec>) => api<WorkflowSpec>(`/workflows/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  validateWorkflow: (id: string) => api<ValidationResponse>(`/workflows/${id}/validate`, { method: "POST" }),
  compileWorkflow: (id: string) => api<CompileResponse>(`/workflows/${id}/compile`, { method: "POST" }),
  runWorkflow: (id: string, userScriptOverride?: string) =>
    api<RunSummaryResponse>(`/workflows/${id}/run`, { method: "POST", body: JSON.stringify({ userScriptOverride }) }),
  getRuns: () => api<RunRecord[]>("/runs"),
  getRunArtifacts: (id: string) => api<Artifact[]>(`/runs/${id}/artifacts`),
  getArtifactDownloadUrl: (path: string) => `${API_BASE}/artifacts/download?path=${encodeURIComponent(path)}`,
  getAiConfigStatus: () => api<AIConfigStatus>("/ai/config/status"),
  saveAiConfig: (payload: { provider: "openai_compatible"; model: string; baseUrl?: string; apiKey?: string; enabled: boolean }) =>
    api<AIConfigStatus>("/ai/config", { method: "POST", body: JSON.stringify(payload) }),
  generateAiWorkflow: (goal: string, projectId: string) =>
    api<WorkflowGenerateResponse>("/ai/workflow/generate", { method: "POST", body: JSON.stringify({ goal, projectId }) }),
  saveScriptUnit: (payload: ScriptUnit) => api<ScriptUnit>("/script-units", { method: "POST", body: JSON.stringify(payload) }),
  getScriptUnit: (id: string) => api<ScriptUnit>(`/script-units/${id}`),
  materializeWorkflow: (workflowId: string, payload: { draftId: string; projectId?: string; workflowName?: string }) =>
    api<WorkflowMaterializeResponse>(`/workflows/${workflowId}/materialize`, { method: "POST", body: JSON.stringify(payload) }),
  suggestWorkflow: (goal: string, projectId: string) =>
    api<{ workflow: WorkflowSpec; diagnostics: unknown[]; explanation: string[] }>("/ai/workflow/suggest", { method: "POST", body: JSON.stringify({ goal, projectId }) }),
  draftTemplate: (goal: string) =>
    api<{ template: Template; diagnostics: unknown[]; explanation: string[] }>("/ai/template/draft", { method: "POST", body: JSON.stringify({ goal }) }),
  explainScript: (workflowId: string) =>
    api<{ explanation: string[] }>("/ai/script/explain", { method: "POST", body: JSON.stringify({ workflowId }) })
};
