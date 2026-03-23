import { useEffect, useMemo, useState } from "react";
import { CatalogPage } from "./features/catalog/CatalogPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { RunsPage } from "./features/runs/RunsPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { createQuickIndexWorkflow, createTrueColorWorkflow, type QuickIndexState, toolRegistry, type ToolCategory, type ToolDefinition, type ToolId } from "./features/toolbox/toolRegistry";
import { TemplatesPage } from "./features/templates/TemplatesPage";
import { WorkspacePage } from "./features/workspace/WorkspacePage";
import { apiClient } from "./shared/api/client";
import { AppIcon, type AppIconName } from "./shared/components/AppIcon";
import { I18nProvider, useI18n } from "./shared/i18n";
import type { Locale } from "./shared/i18n/catalog";
import { basemapProviders, findBasemapVariant } from "./shared/map/basemaps";
import type { BasemapInstance, DockLayoutState, LayerNode, RoiUploadResponse } from "./shared/types";
import { useAppStore } from "./store";

declare global {
  interface Window {
    geeAiDesktop?: {
      platform: string;
      saveFile?: (sourcePath: string, defaultName?: string) => Promise<{ cancelled: boolean; filePath?: string; error?: string }>;
      openExternal?: (url: string) => Promise<{ ok: boolean; error?: string }>;
      selectFile?: (filters?: Array<{ name: string; extensions: string[] }>) => Promise<{ cancelled: boolean; filePath?: string; error?: string }>;
    };
  }
}

type PageId = "workspace" | "projects" | "catalog" | "templates" | "runs" | "settings";

const pageOrder: PageId[] = ["workspace", "projects", "catalog", "templates", "runs", "settings"];
const pageMeta: Record<PageId, { labelKey: "nav.workspace" | "nav.projects" | "nav.catalog" | "nav.templates" | "nav.runs" | "nav.settings"; icon: AppIconName }> = {
  workspace: { labelKey: "nav.workspace", icon: "workspace" },
  projects: { labelKey: "nav.projects", icon: "projects" },
  catalog: { labelKey: "nav.catalog", icon: "catalog" },
  templates: { labelKey: "nav.templates", icon: "templates" },
  runs: { labelKey: "nav.runs", icon: "runs" },
  settings: { labelKey: "nav.settings", icon: "settings" }
};

const defaultDockLayout: DockLayoutState = {
  leftCollapsed: false,
  rightCollapsed: false,
  bottomCollapsed: false,
  leftWidth: 320,
  rightWidth: 360,
  bottomHeight: 250,
  leftActive: "toolbox",
  rightActive: "parameters",
  bottomActive: "execution"
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function reorderLayers(layers: LayerNode[], layerId: string, direction: "up" | "down") {
  const index = layers.findIndex((layer) => layer.id === layerId);
  if (index === -1) {
    return layers;
  }
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= layers.length) {
    return layers;
  }
  const updated = [...layers];
  const [item] = updated.splice(index, 1);
  updated.splice(nextIndex, 0, item);
  return updated;
}

function createBasemapLayer(providerId: string, variantId: string): LayerNode {
  const variant = findBasemapVariant(providerId, variantId);
  const basemap: BasemapInstance = {
    providerId,
    variantId,
    styleType: variant?.styleType ?? "imagery",
    urlTemplate: variant?.urlTemplate ?? "",
    attribution: variant?.attribution ?? providerId
  };
  return {
    id: `base-${providerId}-${variantId}`,
    name: variant?.name ?? `${providerId}-${variantId}`,
    kind: "base",
    visible: true,
    opacity: 1,
    sourceRef: `${providerId}:${variantId}`,
    groupId: "base",
    metadata: { basemap }
  };
}

function AppShell() {
  const {
    authStatus,
    projects,
    templates,
    datasets,
    currentProject,
    currentWorkflow,
    compileResult,
    currentRun,
    runs,
    aiConfigStatus,
    assetRefs,
    aiDraft,
    aiScriptUnits,
    aiNotes,
    browserLogin,
    error,
    loading,
    bootstrap,
    createProject,
    selectProject,
    refreshAssets,
    saveWorkflow,
    suggestWorkflow,
    configureAi,
    generateAiWorkflow,
    materializeAiDraft,
    compileCurrentWorkflow,
    runCurrentWorkflow,
    uploadRoi,
    createAiTemplate,
    startBrowserLogin,
    completeBrowserLogin,
    loginServiceAccount,
    validateGee,
    logoutGee
  } = useAppStore();
  const { locale, setLocale, t } = useI18n();

  const [activePage, setActivePage] = useState<PageId>("workspace");
  const [selectedToolId, setSelectedToolId] = useState<ToolId>("true-color-composite");
  const [projectName, setProjectName] = useState("GeoMind Project");
  const [projectDescription, setProjectDescription] = useState("AI-first GIS workspace");
  const [goal, setGoal] = useState("Create a reviewable remote sensing workflow.");
  const [templateGoal, setTemplateGoal] = useState("Create a reusable true color composite template.");
  const [toolState, setToolState] = useState<QuickIndexState>({
    datasetId: "COPERNICUS/S2_SR_HARMONIZED",
    indexType: "NDVI",
    start: "2024-01-01",
    end: "2024-12-31",
    roiGeoJson: "",
    roiSourceType: "drawn_roi",
    exportDestination: "local_download",
    filename: "geomind_true_color_median",
    scale: 10
  });
  const [roiUpload, setRoiUpload] = useState<RoiUploadResponse>();
  const [scriptOverride, setScriptOverride] = useState("");
  const [dockLayout, setDockLayout] = useState<DockLayoutState>(() => {
    const stored = localStorage.getItem("geomind.dockLayout");
    return stored ? { ...defaultDockLayout, ...JSON.parse(stored) } as DockLayoutState : defaultDockLayout;
  });
  const [toolboxSearch, setToolboxSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<ToolCategory, boolean>>({
    data: false,
    preprocess: true,
    index: false,
    statistics: true,
    export: true,
    ai: true
  });
  const [collapsedLayerGroups, setCollapsedLayerGroups] = useState<Record<"base" | "ee" | "local", boolean>>({
    base: false,
    ee: false,
    local: false
  });
  const [baseLayers, setBaseLayers] = useState<LayerNode[]>(() => {
    const stored = localStorage.getItem("geomind.baseLayers");
    if (!stored) {
      return [createBasemapLayer("google", "imagery")];
    }
    try {
      const parsed = JSON.parse(stored) as LayerNode[];
      if (!Array.isArray(parsed)) {
        return [createBasemapLayer("google", "imagery")];
      }
      return parsed;
    } catch {
      return [createBasemapLayer("google", "imagery")];
    }
  });
  const [eeLayers, setEeLayers] = useState<LayerNode[]>([]);
  const [localLayers, setLocalLayers] = useState<LayerNode[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>();
  const [basemapModalOpen, setBasemapModalOpen] = useState(false);
  const [basemapDraft, setBasemapDraft] = useState({ providerId: "google", variantId: "imagery", apiKeyRef: "" });

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    localStorage.setItem("geomind.dockLayout", JSON.stringify(dockLayout));
  }, [dockLayout]);

  useEffect(() => {
    localStorage.setItem("geomind.baseLayers", JSON.stringify(baseLayers));
  }, [baseLayers]);

  useEffect(() => {
    if (!roiUpload) {
      return;
    }
    setLocalLayers((layers) => {
      const nextLayer: LayerNode = {
        id: "roi-uploaded",
        name: roiUpload.fileName,
        kind: "local",
        visible: true,
        opacity: 1,
        sourceRef: roiUpload.filePath,
        groupId: "local",
        metadata: {
          localSource: {
            fileName: roiUpload.fileName,
            sourceType: roiUpload.sourceType,
            filePath: roiUpload.filePath,
            featureCount: roiUpload.featureCount
          },
          geojson: roiUpload.geojson,
          sourceType: roiUpload.sourceType
        }
      };
      return [nextLayer, ...layers.filter((layer) => layer.id !== "roi-uploaded")];
    });
  }, [roiUpload]);

  useEffect(() => {
    if (!currentProject?.id) {
      return;
    }
    void refreshAssets(currentProject.id);
  }, [currentProject?.id, refreshAssets]);

  useEffect(() => {
    if (baseLayers.length === 0) {
      return;
    }
    if (!baseLayers.some((layer) => layer.visible)) {
      setBaseLayers((items) => items.map((item, index) => ({ ...item, visible: index === 0 })));
    }
  }, [baseLayers]);

  useEffect(() => {
    if (!currentRun) {
      return;
    }
    const mapArtifact = currentRun.artifacts.find((artifact) => artifact.type === "map_tile");
    if (!mapArtifact) {
      return;
    }
    const nextLayer: LayerNode = {
      id: `ee-${currentRun.id}`,
      name: String(mapArtifact.previewMetadata.layerName ?? currentWorkflow?.name ?? "EE Result"),
      kind: "ee",
      visible: true,
      opacity: 0.8,
      sourceRef: currentRun.id,
      groupId: "ee",
      metadata: {
        eeRender: {
          tileUrl: mapArtifact.pathOrUri,
          visParams: mapArtifact.previewMetadata.visParams,
          bandCombination: mapArtifact.previewMetadata.bandCombination
        }
      }
    };
    setEeLayers((layers) => [nextLayer, ...layers.filter((layer) => layer.id !== nextLayer.id)]);
    setSelectedLayerId(nextLayer.id);
  }, [currentRun, currentWorkflow?.name]);

  const layers = useMemo(() => [...baseLayers, ...eeLayers, ...localLayers], [baseLayers, eeLayers, localLayers]);
  const selectedLayer = useMemo(() => layers.find((layer) => layer.id === selectedLayerId), [layers, selectedLayerId]);
  const selectedTool = useMemo<ToolDefinition>(() => toolRegistry.find((tool) => tool.id === selectedToolId) ?? toolRegistry[0], [selectedToolId]);
  const basemapVariantOptions = useMemo(() => basemapProviders.find((provider) => provider.id === basemapDraft.providerId)?.variants ?? [], [basemapDraft.providerId]);

  const handleSaveWorkflow = async () => {
    const project = currentProject ?? await createProject(projectName, projectDescription);
    const builder = selectedTool.id === "true-color-composite" ? createTrueColorWorkflow : selectedTool.workflowBuilder;
    if (!builder) {
      return;
    }
    const workflow = builder(project.id, toolState);
    await saveWorkflow(workflow);
    setDockLayout((state) => ({ ...state, bottomActive: "execution", rightActive: "parameters" }));
    setActivePage("workspace");
  };

  const handleRun = async () => {
    await runCurrentWorkflow(scriptOverride || compileResult?.script);
    setDockLayout((state) => ({ ...state, bottomActive: "logs" }));
  };

  const handleCompile = async () => {
    await compileCurrentWorkflow();
    setDockLayout((state) => ({ ...state, bottomActive: "execution" }));
  };

  const handleCreateProject = async () => {
    await createProject(projectName, projectDescription);
    setActivePage("workspace");
  };

  const handleSelectTool = (tool: ToolDefinition) => {
    setSelectedToolId(tool.id);
    setDockLayout((state) => ({ ...state, rightActive: "parameters" }));
    if (tool.id === "true-color-composite") {
      setToolState((state) => ({ ...state, filename: "geomind_true_color_median" }));
    }
  };

  const handleSelectLayer = (layerId: string) => {
    setSelectedLayerId(layerId);
    setDockLayout((state) => ({ ...state, rightActive: "inspector", leftActive: "layers" }));
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    const layer = layers.find((item) => item.id === layerId);
    if (!layer) {
      return;
    }
    if (layer.kind === "base") {
      setBaseLayers((items) => items.map((item) => item.id === layerId ? { ...item, visible: !item.visible } : { ...item, visible: false }));
      return;
    }
    setEeLayers((items) => items.map((item) => item.id === layerId ? { ...item, visible: !item.visible } : item));
    setLocalLayers((items) => items.map((item) => item.id === layerId ? { ...item, visible: !item.visible } : item));
  };

  const handleRenameLayer = (layerId: string, name: string) => {
    setBaseLayers((items) => items.map((item) => item.id === layerId ? { ...item, name } : item));
    setEeLayers((items) => items.map((item) => item.id === layerId ? { ...item, name } : item));
    setLocalLayers((items) => items.map((item) => item.id === layerId ? { ...item, name } : item));
  };

  const handleDeleteLayer = (layerId: string) => {
    setBaseLayers((items) => {
      return items.filter((item) => item.id !== layerId);
    });
    setEeLayers((items) => items.filter((item) => item.id !== layerId));
    setLocalLayers((items) => items.filter((item) => item.id !== layerId));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(undefined);
    }
  };

  const handleLayerOpacityChange = (layerId: string, opacity: number) => {
    setEeLayers((items) => items.map((item) => item.id === layerId ? { ...item, opacity } : item));
    setLocalLayers((items) => items.map((item) => item.id === layerId ? { ...item, opacity } : item));
  };

  const handleMoveLayer = (layerId: string, direction: "up" | "down") => {
    setEeLayers((items) => reorderLayers(items, layerId, direction));
    setLocalLayers((items) => reorderLayers(items, layerId, direction));
  };

  const handleUploadRoi = async (file: File) => {
    const result = await uploadRoi(file);
    setRoiUpload(result);
    setToolState((state) => ({
      ...state,
      roiGeoJson: result.geojson,
      roiSourceType: result.sourceType,
      roiFilePath: result.filePath
    }));
    setDockLayout((state) => ({ ...state, leftActive: "layers" }));
  };

  const handleAddAssetToMap = (assetId: string) => {
    const asset = assetRefs.find((item) => item.id === assetId);
    if (!asset) {
      return;
    }
    const geojson = typeof asset.metadata?.geojson === "string" ? asset.metadata.geojson : "";
    if (!geojson) {
      return;
    }
    const sourceType = String(asset.metadata?.sourceType ?? "uploaded_geojson");
    const fileName = asset.name || "Uploaded ROI";
    const nextLayer: LayerNode = {
      id: `asset-${asset.id}`,
      name: fileName,
      kind: "local",
      visible: true,
      opacity: 1,
      sourceRef: asset.location,
      groupId: "local",
      metadata: {
        localSource: {
          fileName,
          sourceType: sourceType as "uploaded_geojson" | "uploaded_shapefile" | "drawn_roi",
          filePath: asset.location,
          featureCount: typeof asset.metadata?.featureCount === "number" ? asset.metadata.featureCount : undefined
        },
        geojson,
        sourceType,
        assetRefId: asset.id
      }
    };
    setLocalLayers((layers) => [nextLayer, ...layers.filter((layer) => layer.id !== nextLayer.id)]);
    setSelectedLayerId(nextLayer.id);
    setDockLayout((state) => ({ ...state, leftActive: "layers", rightActive: "inspector" }));
  };

  const handleAddBasemap = () => {
    const variant = findBasemapVariant(basemapDraft.providerId, basemapDraft.variantId);
    if (!variant) {
      return;
    }
    const nextLayer = createBasemapLayer(basemapDraft.providerId, basemapDraft.variantId);
    nextLayer.visible = true;
    nextLayer.opacity = 1;
    nextLayer.metadata = {
      basemap: {
        ...nextLayer.metadata?.basemap,
        apiKeyRef: basemapDraft.apiKeyRef || undefined
      }
    };
    setBaseLayers((layers) => [nextLayer, ...layers.map((layer) => ({ ...layer, visible: false }))]);
    setBasemapModalOpen(false);
    setSelectedLayerId(nextLayer.id);
  };

  const handleDownloadCurrentRun = async () => {
    const artifact = currentRun?.artifacts.find((item) => item.type === "download_file" && item.pathOrUri);
    if (!artifact?.pathOrUri || !window.geeAiDesktop?.saveFile) {
      return;
    }
    await window.geeAiDesktop.saveFile(artifact.pathOrUri, String(artifact.previewMetadata.fileName ?? "geomind-export.zip"));
  };

  return (
    <div className="app-shell desktop-shell" data-testid="app-shell">
      <div className="menu-bar">
        <span>{t("menu.file")}</span>
        <span>{t("menu.edit")}</span>
        <span>{t("menu.view")}</span>
        <span>{t("menu.analysis")}</span>
        <span>{t("menu.help")}</span>
      </div>

      <aside className="app-nav">
        <div className="brand-badge" title={`${t("app.title")} · ${window.geeAiDesktop?.platform ?? "desktop"}`}>
          <span>GM</span>
        </div>
        <nav className="nav-list" aria-label="Primary">
          {pageOrder.map((page) => (
            <button
              key={page}
              type="button"
              data-testid={`nav-${page}`}
              className={`nav-item ${activePage === page ? "active" : ""}`}
              title={t(pageMeta[page].labelKey)}
              aria-label={t(pageMeta[page].labelKey)}
              onClick={() => setActivePage(page)}
            >
              <AppIcon name={pageMeta[page].icon} className="nav-icon" />
              <span className="sr-only">{t(pageMeta[page].labelKey)}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="global-toolbar">
          <div className="toolbar-group">
            <strong>{currentProject?.name ?? t("project.noSelection")}</strong>
            <span className={`connection-pill ${authStatus?.authenticated ? "connected" : "disconnected"}`}>
              {authStatus?.authenticated ? t("toolbar.connected") : t("toolbar.disconnected")}
            </span>
          </div>
          <div className="toolbar-group">
            <label className="inline-select">
              <span>{t("toolbar.language")}</span>
              <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} data-testid="language-switch">
                <option value="zh-CN">中文</option>
                <option value="en-US">English</option>
              </select>
            </label>
            <button type="button" onClick={() => void handleSaveWorkflow()}>{t("toolbar.save")}</button>
            <button type="button" onClick={() => void handleCompile()}>{t("toolbar.compile")}</button>
            <button type="button" onClick={() => void handleRun()}>{t("toolbar.run")}</button>
            <button type="button" onClick={() => void handleDownloadCurrentRun()}>{t("toolbar.export")}</button>
          </div>
        </header>

        <main className="page-body">
          {activePage === "workspace" ? (
            <WorkspacePage
              currentProject={currentProject}
              currentWorkflow={currentWorkflow}
              compileResult={compileResult}
              currentRun={currentRun}
              templates={templates}
              datasets={datasets}
              assetRefs={assetRefs.filter((item) => item.projectId === currentProject?.id || item.projectId == null)}
              aiNotes={aiNotes}
              loading={loading}
              error={error}
              aiConfigStatus={aiConfigStatus}
              aiDraft={aiDraft}
              aiScriptUnits={aiScriptUnits}
              tool={selectedTool}
              selectedToolId={selectedToolId}
              quickIndexState={toolState}
              roiUpload={roiUpload}
              onSelectTool={handleSelectTool}
              onQuickIndexChange={(patch) => setToolState((state) => ({ ...state, ...patch }))}
              onUploadRoi={(file) => void handleUploadRoi(file)}
              onSaveWorkflow={() => void handleSaveWorkflow()}
              onCompile={() => void handleCompile()}
              onRun={() => void handleRun()}
              onRoiChange={(geojson) => setToolState((state) => ({ ...state, roiGeoJson: geojson, roiSourceType: "drawn_roi" }))}
              scriptOverride={scriptOverride}
              onScriptOverrideChange={setScriptOverride}
              goal={goal}
              templateGoal={templateGoal}
              onGoalChange={setGoal}
              onTemplateGoalChange={setTemplateGoal}
              onSuggest={() => {
                setDockLayout((state) => ({ ...state, rightActive: "ai", bottomActive: "execution" }));
                void generateAiWorkflow(goal);
              }}
              onMaterializeAi={() => void materializeAiDraft()}
              onDraftTemplate={() => {
                setDockLayout((state) => ({ ...state, rightActive: "ai" }));
                void createAiTemplate(templateGoal);
              }}
              onExplain={() => void apiClient.explainScript(currentWorkflow?.id ?? "")}
              layers={layers}
              selectedLayer={selectedLayer}
              dockLayout={dockLayout}
              toolboxSearch={toolboxSearch}
              collapsedCategories={collapsedCategories}
              collapsedLayerGroups={collapsedLayerGroups}
              onSelectLayer={handleSelectLayer}
              onAddAssetToMap={handleAddAssetToMap}
              onToggleLayerVisibility={handleToggleLayerVisibility}
              onRenameLayer={handleRenameLayer}
              onDeleteLayer={handleDeleteLayer}
              onLayerOpacityChange={handleLayerOpacityChange}
              onMoveLayer={handleMoveLayer}
              onOpenBasemapManager={() => setBasemapModalOpen(true)}
              onToggleLayerGroup={(groupId) => setCollapsedLayerGroups((state) => ({ ...state, [groupId]: !state[groupId] }))}
              onToolboxSearchChange={setToolboxSearch}
              onToggleToolCategory={(category) => setCollapsedCategories((state) => ({ ...state, [category]: !state[category] }))}
              onDockChange={(patch) => setDockLayout((state) => ({ ...state, ...patch }))}
              onResizeLeft={(delta) => setDockLayout((state) => ({ ...state, leftWidth: clamp(state.leftWidth + delta, 240, 480) }))}
              onResizeRight={(delta) => setDockLayout((state) => ({ ...state, rightWidth: clamp(state.rightWidth - delta, 280, 520) }))}
              onResizeBottom={(delta) => setDockLayout((state) => ({ ...state, bottomHeight: clamp(state.bottomHeight - delta, 180, 420) }))}
            />
          ) : null}
          {activePage === "projects" ? (
            <ProjectsPage
              projectName={projectName}
              projectDescription={projectDescription}
              projects={projects}
              currentProject={currentProject}
              onProjectNameChange={setProjectName}
              onProjectDescriptionChange={setProjectDescription}
              onCreate={() => void handleCreateProject()}
              onSelectProject={(projectId) => {
                selectProject(projectId);
                setActivePage("workspace");
              }}
            />
          ) : null}
          {activePage === "catalog" ? <CatalogPage datasets={datasets} /> : null}
          {activePage === "templates" ? <TemplatesPage templates={templates} /> : null}
          {activePage === "runs" ? <RunsPage currentRun={currentRun} runs={runs} onDownload={() => void handleDownloadCurrentRun()} /> : null}
          {activePage === "settings" ? (
            <SettingsPage
              locale={locale}
              authStatus={authStatus}
              aiConfigStatus={aiConfigStatus}
              browserLogin={browserLogin}
              onLocaleChange={setLocale}
              onSaveAiConfig={(payload) => void configureAi(payload)}
              onStartBrowserLogin={() => void startBrowserLogin()}
              onCompleteBrowserLogin={(payload) => void completeBrowserLogin(payload)}
              onLoginServiceAccount={(credentialsPath, projectId) => void loginServiceAccount(credentialsPath, projectId)}
              onValidate={() => void validateGee()}
              onLogout={() => void logoutGee()}
            />
          ) : null}

          {error ? <div className="status error">{error}</div> : null}
          {loading ? <div className="status">{t("status.working")}</div> : null}
        </main>
      </div>

      {basemapModalOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="panel-title">{t("layers.addBasemap")}</div>
            <label>
              <span>{t("basemap.provider")}</span>
              <select value={basemapDraft.providerId} onChange={(event) => {
                const providerId = event.target.value;
                const defaultVariant = basemapProviders.find((provider) => provider.id === providerId)?.variants[0];
                setBasemapDraft((state) => ({ ...state, providerId, variantId: defaultVariant?.id ?? "imagery" }));
              }}>
                {basemapProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
              </select>
            </label>
            <label>
              <span>{t("basemap.style")}</span>
              <select value={basemapDraft.variantId} onChange={(event) => setBasemapDraft((state) => ({ ...state, variantId: event.target.value }))}>
                {basemapVariantOptions.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}
              </select>
            </label>
            <label>
              <span>{t("basemap.apiKey")}</span>
              <input value={basemapDraft.apiKeyRef} onChange={(event) => setBasemapDraft((state) => ({ ...state, apiKeyRef: event.target.value }))} />
            </label>
            <div className="button-row">
              <button type="button" onClick={handleAddBasemap}>{t("basemap.confirm")}</button>
              <button type="button" onClick={() => setBasemapModalOpen(false)}>{t("basemap.cancel")}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function App() {
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem("geomind.locale") as Locale) || "zh-CN");

  useEffect(() => {
    localStorage.setItem("geomind.locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nProvider locale={locale} setLocale={setLocale}>
      <AppShell />
    </I18nProvider>
  );
}
