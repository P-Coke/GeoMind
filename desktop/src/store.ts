import { create } from "zustand";
import { apiClient } from "./shared/api/client";
import type {
  AIConfigStatus,
  AssetRef,
  BrowserLoginStartResponse,
  CompileResponse,
  DatasetEntry,
  GeeAuthStatus,
  Project,
  RoiUploadResponse,
  RunRecord,
  ScriptUnit,
  Template,
  WorkflowDraft,
  WorkflowSpec
} from "./shared/types";

interface AppState {
  authStatus?: GeeAuthStatus;
  projects: Project[];
  templates: Template[];
  datasets: DatasetEntry[];
  currentProject?: Project;
  currentWorkflow?: WorkflowSpec;
  compileResult?: CompileResponse;
  currentRun?: RunRecord;
  runs: RunRecord[];
  aiConfigStatus?: AIConfigStatus;
  assetRefs: AssetRef[];
  aiDraft?: WorkflowDraft;
  aiScriptUnits: ScriptUnit[];
  aiNotes: string[];
  browserLogin?: BrowserLoginStartResponse;
  error?: string;
  loading: boolean;
  bootstrap: () => Promise<void>;
  createProject: (name: string, description: string) => Promise<Project>;
  selectProject: (projectId: string) => void;
  refreshAssets: (projectId?: string) => Promise<void>;
  saveWorkflow: (workflow: WorkflowSpec) => Promise<void>;
  suggestWorkflow: (goal: string) => Promise<void>;
  configureAi: (payload: { provider: "openai_compatible"; model: string; baseUrl?: string; apiKey?: string; enabled: boolean }) => Promise<void>;
  generateAiWorkflow: (goal: string) => Promise<void>;
  materializeAiDraft: () => Promise<void>;
  compileCurrentWorkflow: () => Promise<void>;
  runCurrentWorkflow: (scriptOverride?: string) => Promise<void>;
  uploadRoi: (file: File) => Promise<RoiUploadResponse>;
  createAiTemplate: (goal: string) => Promise<void>;
  startBrowserLogin: () => Promise<void>;
  completeBrowserLogin: (payload: { state: string; code?: string; accountEmail?: string; projectId?: string }) => Promise<void>;
  loginServiceAccount: (credentialsPath: string, projectId?: string) => Promise<void>;
  validateGee: () => Promise<void>;
  logoutGee: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  templates: [],
  datasets: [],
  runs: [],
  aiScriptUnits: [],
  assetRefs: [],
  aiNotes: [],
  browserLogin: undefined,
  loading: false,
  bootstrap: async () => {
    set({ loading: true, error: undefined });
    try {
      const [authStatus, projects, templates, datasets, runs, aiConfigStatus, assetRefs] = await Promise.all([
        apiClient.getAuthStatus(),
        apiClient.getProjects(),
        apiClient.getTemplates(),
        apiClient.getDatasets(),
        apiClient.getRuns(),
        apiClient.getAiConfigStatus(),
        apiClient.getAssets()
      ]);
      set({ authStatus, projects, templates, datasets, runs, aiConfigStatus, assetRefs, currentProject: projects[0], currentRun: runs[0], loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  createProject: async (name, description) => {
    set({ loading: true, error: undefined });
    try {
      const project = await apiClient.createProject({ name, description });
      set((state) => ({ projects: [...state.projects, project], currentProject: project, loading: false }));
      return project;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  selectProject: (projectId) => {
    const project = get().projects.find((item) => item.id === projectId);
    if (project) {
      set({ currentProject: project });
    }
  },
  refreshAssets: async (projectId) => {
    try {
      const assetRefs = await apiClient.getAssets(projectId);
      set({ assetRefs });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  saveWorkflow: async (workflow) => {
    set({ loading: true, error: undefined });
    try {
      const saved = workflow.id ? await apiClient.updateWorkflow(workflow.id, workflow) : await apiClient.createWorkflow(workflow);
      set({ currentWorkflow: saved, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  suggestWorkflow: async (goal) => {
    const { currentProject } = get();
    if (!currentProject) {
      set({ error: "Create a project before using AI." });
      return;
    }
    set({ loading: true, error: undefined });
    try {
      const { workflow, explanation } = await apiClient.suggestWorkflow(goal, currentProject.id);
      const saved = await apiClient.createWorkflow(workflow);
      set({ currentWorkflow: saved, aiNotes: explanation, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  configureAi: async (payload) => {
    set({ loading: true, error: undefined });
    try {
      const aiConfigStatus = await apiClient.saveAiConfig(payload);
      set({ aiConfigStatus, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  generateAiWorkflow: async (goal) => {
    const { currentProject } = get();
    if (!currentProject) {
      set({ error: "Create a project before using AI." });
      return;
    }
    set({ loading: true, error: undefined, aiDraft: undefined, aiNotes: ["Generating workflow draft..."] });
    try {
      const generated = await apiClient.generateAiWorkflow(goal, currentProject.id);
      set({
        aiDraft: generated.workflowDraft,
        aiScriptUnits: generated.scriptUnits,
        aiNotes: [...generated.explanation, ...generated.diagnostics.map((item) => item.message)],
        loading: false
      });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  materializeAiDraft: async () => {
    const { currentProject, aiDraft, currentWorkflow } = get();
    if (!currentProject || !aiDraft) {
      set({ error: "No AI workflow draft is available." });
      return;
    }
    set({ loading: true, error: undefined });
    try {
      const materialized = await apiClient.materializeWorkflow(currentWorkflow?.id || "new", {
        draftId: aiDraft.id,
        projectId: currentProject.id,
        workflowName: aiDraft.workflow.name
      });
      set({ currentWorkflow: materialized.workflow, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  compileCurrentWorkflow: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) {
      set({ error: "No workflow selected." });
      return;
    }
    set({ loading: true, error: undefined });
    try {
      const compileResult = await apiClient.compileWorkflow(currentWorkflow.id);
      set({ compileResult, currentWorkflow: compileResult.workflow, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  runCurrentWorkflow: async (scriptOverride) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) {
      set({ error: "No workflow selected." });
      return;
    }
    set({ loading: true, error: undefined });
    try {
      const summary = await apiClient.runWorkflow(currentWorkflow.id, scriptOverride);
      set((state) => ({ currentRun: summary.run, runs: [summary.run, ...state.runs.filter((item) => item.id !== summary.run.id)], loading: false }));
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  uploadRoi: async (file) => {
    set({ loading: true, error: undefined });
    try {
        const result = await apiClient.uploadRoi(file, get().currentProject?.id);
        set((state) => ({
          loading: false,
          assetRefs: result.assetRef ? [result.assetRef, ...state.assetRefs.filter((item) => item.id !== result.assetRef?.id)] : state.assetRefs
        }));
        return result;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  createAiTemplate: async (goal) => {
    set({ loading: true, error: undefined });
    try {
      const { template, explanation } = await apiClient.draftTemplate(goal);
      const saved = await apiClient.createTemplate(template);
      set((state) => ({ templates: [...state.templates, saved], aiNotes: explanation, loading: false }));
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  startBrowserLogin: async () => {
    set({ loading: true, error: undefined });
    try {
      const browserLogin = await apiClient.startBrowserLogin();
      set({ browserLogin, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  completeBrowserLogin: async (payload) => {
    set({ loading: true, error: undefined });
    try {
      const authStatus = await apiClient.completeBrowserLogin(payload);
      set({ authStatus, browserLogin: undefined, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  loginServiceAccount: async (credentialsPath, projectId) => {
    set({ loading: true, error: undefined });
    try {
      const authStatus = await apiClient.loginServiceAccount({ credentialsPath, projectId });
      set({ authStatus, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  validateGee: async () => {
    set({ loading: true, error: undefined });
    try {
      const validation = await apiClient.validateGee();
      set({ authStatus: validation.status, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  logoutGee: async () => {
    set({ loading: true, error: undefined });
    try {
      const authStatus = await apiClient.logoutGee();
      set({ authStatus, browserLogin: undefined, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  }
}));
