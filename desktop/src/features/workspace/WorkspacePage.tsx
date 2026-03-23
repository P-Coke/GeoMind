import { AiAcceleratorPanel } from "../ai/AiAcceleratorPanel";
import { AiNotesPanel } from "../ai/AiNotesPanel";
import { ExecutionPlanPanel } from "../execution/ExecutionPlanPanel";
import { ScriptPanel } from "../execution/ScriptPanel";
import { ToolInspectorPanel } from "../toolbox/ToolInspectorPanel";
import { ToolPalette } from "../toolbox/ToolPalette";
import type { QuickIndexState, ToolCategory, ToolDefinition, ToolId } from "../toolbox/toolRegistry";
import { WorkflowSpecPanel } from "../workflow/WorkflowSpecPanel";
import { MapPanel } from "../../shared/components/MapPanel";
import { Splitter } from "../../shared/components/Splitter";
import { useI18n } from "../../shared/i18n";
import type { AIConfigStatus, AssetRef, CompileResponse, DatasetEntry, DockLayoutState, LayerNode, Project, RoiUploadResponse, RunRecord, ScriptUnit, Template, WorkflowDraft, WorkflowSpec } from "../../shared/types";
import { BrowserPanel } from "./BrowserPanel";
import { DockTabs } from "./DockTabs";
import { InspectorPanel } from "./InspectorPanel";
import { LayersPanel } from "./LayersPanel";

type LeftDockId = DockLayoutState["leftActive"];
type RightDockId = DockLayoutState["rightActive"];
type BottomDockId = DockLayoutState["bottomActive"];

export function WorkspacePage(props: {
  currentProject?: Project;
  currentWorkflow?: WorkflowSpec;
  compileResult?: CompileResponse;
  currentRun?: RunRecord;
  templates: Template[];
  datasets: DatasetEntry[];
  assetRefs: AssetRef[];
  aiNotes: string[];
  loading: boolean;
  error?: string;
  aiConfigStatus?: AIConfigStatus;
  aiDraft?: WorkflowDraft;
  aiScriptUnits: ScriptUnit[];
  tool: ToolDefinition;
  selectedToolId: ToolId;
  quickIndexState: QuickIndexState;
  roiUpload?: RoiUploadResponse;
  onSelectTool: (tool: ToolDefinition) => void;
  onQuickIndexChange: (patch: Partial<QuickIndexState>) => void;
  onUploadRoi: (file: File) => void;
  onSaveWorkflow: () => void;
  onCompile: () => void;
  onRun: () => void;
  onRoiChange: (geojson: string) => void;
  scriptOverride: string;
  onScriptOverrideChange: (value: string) => void;
  goal: string;
  templateGoal: string;
  onGoalChange: (value: string) => void;
  onTemplateGoalChange: (value: string) => void;
  onSuggest: () => void;
  onMaterializeAi: () => void;
  onDraftTemplate: () => void;
  onExplain: () => void;
  layers: LayerNode[];
  selectedLayer?: LayerNode;
  dockLayout: DockLayoutState;
  toolboxSearch: string;
  collapsedCategories: Record<ToolCategory, boolean>;
  collapsedLayerGroups: Record<"base" | "ee" | "local", boolean>;
  onSelectLayer: (layerId: string) => void;
  onAddAssetToMap: (assetId: string) => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onRenameLayer: (layerId: string, name: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
  onMoveLayer: (layerId: string, direction: "up" | "down") => void;
  onOpenBasemapManager: () => void;
  onToggleLayerGroup: (groupId: "base" | "ee" | "local") => void;
  onToolboxSearchChange: (value: string) => void;
  onToggleToolCategory: (category: ToolCategory) => void;
  onDockChange: (patch: Partial<DockLayoutState>) => void;
  onResizeLeft: (delta: number) => void;
  onResizeRight: (delta: number) => void;
  onResizeBottom: (delta: number) => void;
}) {
  const { t } = useI18n();

  const leftTabs = [
    { id: "browser" as LeftDockId, label: t("workspace.browser") },
    { id: "layers" as LeftDockId, label: t("workspace.layers") },
    { id: "toolbox" as LeftDockId, label: t("workspace.toolbox") }
  ];
  const rightTabs = [
    { id: "inspector" as RightDockId, label: t("inspector.title") },
    { id: "parameters" as RightDockId, label: t("workspace.parameters") },
    { id: "ai" as RightDockId, label: t("ai.title") }
  ];
  const bottomTabs = [
    { id: "execution" as BottomDockId, label: t("console.execution") },
    { id: "logs" as BottomDockId, label: t("console.logs") },
    { id: "results" as BottomDockId, label: t("console.result") },
    { id: "script" as BottomDockId, label: t("console.script") }
  ];

  return (
    <div className="workspace-shell desktop-workspace" data-testid="workspace-page">
      <header className="workspace-toolbar">
        <div className="toolbar-actions">
          <button type="button" onClick={props.onSaveWorkflow}>{t("toolbar.save")}</button>
          <button type="button" onClick={props.onCompile}>{t("toolbar.compile")}</button>
          <button type="button" onClick={props.onRun}>{t("toolbar.run")}</button>
        </div>
      </header>

      <div className="workspace-frame">
        {!props.dockLayout.leftCollapsed ? (
          <>
            <aside className="dock-zone left-dock" style={{ width: props.dockLayout.leftWidth }}>
              <DockTabs
                tabs={leftTabs}
                activeTab={props.dockLayout.leftActive}
                onChange={(leftActive) => props.onDockChange({ leftActive })}
                onToggleCollapsed={() => props.onDockChange({ leftCollapsed: true })}
              />
              <div className="dock-body">
                {props.dockLayout.leftActive === "browser" ? (
                  <BrowserPanel
                    currentProject={props.currentProject}
                    templates={props.templates}
                    datasets={props.datasets}
                    assetRefs={props.assetRefs}
                    onAddAssetToMap={props.onAddAssetToMap}
                  />
                ) : null}
                {props.dockLayout.leftActive === "layers" ? (
                  <LayersPanel
                    layers={props.layers}
                    selectedLayerId={props.selectedLayer?.id}
                    collapsedGroups={props.collapsedLayerGroups}
                    onToggleGroup={props.onToggleLayerGroup}
                    onSelectLayer={props.onSelectLayer}
                    onToggleVisibility={props.onToggleLayerVisibility}
                    onRenameLayer={props.onRenameLayer}
                    onDeleteLayer={props.onDeleteLayer}
                    onOpacityChange={props.onLayerOpacityChange}
                    onMoveLayer={props.onMoveLayer}
                    onAddBasemap={props.onOpenBasemapManager}
                  />
                ) : null}
                {props.dockLayout.leftActive === "toolbox" ? (
                  <div className="dock-panel-content">
                    <div className="info-callout">{t("workspace.toolboxHint")}</div>
                    <ToolPalette
                      selectedToolId={props.selectedToolId}
                      search={props.toolboxSearch}
                      collapsedCategories={props.collapsedCategories}
                      onSearchChange={props.onToolboxSearchChange}
                      onToggleCategory={props.onToggleToolCategory}
                      onSelectTool={props.onSelectTool}
                    />
                  </div>
                ) : null}
              </div>
            </aside>
            <Splitter orientation="vertical" onDrag={props.onResizeLeft} />
          </>
        ) : (
          <button type="button" className="dock-restore dock-restore-left" onClick={() => props.onDockChange({ leftCollapsed: false })}>
            {t("dock.expand")}
          </button>
        )}

        <div className="center-stage">
          <div className="map-stage">
            <MapPanel layers={props.layers} onRoiChange={props.onRoiChange} />
          </div>

          {!props.dockLayout.bottomCollapsed ? (
            <>
              <Splitter orientation="horizontal" onDrag={props.onResizeBottom} />
              <section className="dock-zone bottom-dock" style={{ height: props.dockLayout.bottomHeight }}>
                <DockTabs
                  tabs={bottomTabs}
                  activeTab={props.dockLayout.bottomActive}
                  onChange={(bottomActive) => props.onDockChange({ bottomActive })}
                  onToggleCollapsed={() => props.onDockChange({ bottomCollapsed: true })}
                />
                <div className="dock-body">
                  {props.dockLayout.bottomActive === "execution" ? <ExecutionPlanPanel operations={props.compileResult?.plan.operations ?? []} /> : null}
                  {props.dockLayout.bottomActive === "logs" ? <AiNotesPanel notes={[]} logs={props.currentRun?.logs ?? []} /> : null}
                  {props.dockLayout.bottomActive === "results" ? <WorkflowSpecPanel steps={props.currentWorkflow?.steps ?? []} /> : null}
                  {props.dockLayout.bottomActive === "script" ? (
                    <ScriptPanel script={props.scriptOverride || props.compileResult?.script || ""} onChange={props.onScriptOverrideChange} onRun={props.onRun} />
                  ) : null}
                </div>
              </section>
            </>
          ) : (
            <button type="button" className="dock-restore dock-restore-bottom" onClick={() => props.onDockChange({ bottomCollapsed: false })}>
              {t("dock.expand")}
            </button>
          )}
        </div>

        {!props.dockLayout.rightCollapsed ? (
          <>
            <Splitter orientation="vertical" onDrag={props.onResizeRight} />
            <aside className="dock-zone right-dock" style={{ width: props.dockLayout.rightWidth }}>
              <DockTabs
                tabs={rightTabs}
                activeTab={props.dockLayout.rightActive}
                onChange={(rightActive) => props.onDockChange({ rightActive })}
                onToggleCollapsed={() => props.onDockChange({ rightCollapsed: true })}
              />
              <div className="dock-body">
                {props.dockLayout.rightActive === "inspector" ? (
                  <InspectorPanel selectedLayer={props.selectedLayer} selectedTool={props.tool} />
                ) : null}
                {props.dockLayout.rightActive === "parameters" ? (
                  <ToolInspectorPanel
                    tool={props.tool}
                    datasets={props.datasets}
                    state={props.quickIndexState}
                    roiUpload={props.roiUpload}
                    onDatasetChange={(value) => props.onQuickIndexChange({ datasetId: value })}
                    onIndexChange={(value) => props.onQuickIndexChange({ indexType: value })}
                    onStartChange={(value) => props.onQuickIndexChange({ start: value })}
                    onEndChange={(value) => props.onQuickIndexChange({ end: value })}
                    onFilenameChange={(value) => props.onQuickIndexChange({ filename: value })}
                    onScaleChange={(value) => props.onQuickIndexChange({ scale: value })}
                    onDestinationChange={(value) => props.onQuickIndexChange({ exportDestination: value })}
                    onUploadRoi={props.onUploadRoi}
                    onSave={props.onSaveWorkflow}
                  />
                ) : null}
                {props.dockLayout.rightActive === "ai" ? (
                  <div className="dock-panel-content">
                    <AiAcceleratorPanel
                      goal={props.goal}
                      aiConfigStatus={props.aiConfigStatus}
                      draft={props.aiDraft}
                      scriptUnits={props.aiScriptUnits}
                      notes={props.aiNotes}
                      loading={props.loading}
                      error={props.error}
                      onGoalChange={props.onGoalChange}
                      onGenerate={props.onSuggest}
                      onMaterialize={props.onMaterializeAi}
                    />
                    <div className="info-callout">{t("workspace.aiHint")}</div>
                  </div>
                ) : null}
              </div>
            </aside>
          </>
        ) : (
          <button type="button" className="dock-restore dock-restore-right" onClick={() => props.onDockChange({ rightCollapsed: false })}>
            {t("dock.expand")}
          </button>
        )}
      </div>
    </div>
  );
}
