import type { AppIconName } from "../../shared/components/AppIcon";
import type { DatasetEntry, ExportDestination, StepOutput, WorkflowSpec, WorkflowStep } from "../../shared/types";

export type ToolCategory = "data" | "preprocess" | "index" | "statistics" | "export" | "ai";
export type ToolId = "quick-index" | "true-color-composite" | "preprocess-template" | "statistics-template" | "export-template" | "ai-drafting";

export interface QuickIndexState {
  datasetId: string;
  indexType: string;
  start: string;
  end: string;
  roiGeoJson: string;
  roiSourceType: "drawn_roi" | "uploaded_geojson" | "uploaded_shapefile";
  roiFilePath?: string;
  exportDestination: ExportDestination;
  filename: string;
  scale: number;
}

export interface ToolDefinition {
  id: ToolId;
  category: ToolCategory;
  displayKey: string;
  descriptionKey: string;
  icon: AppIconName;
  workflowBuilder?: (projectId: string, state: QuickIndexState) => WorkflowSpec;
}

function output(name: string, dataType: StepOutput["dataType"]): StepOutput {
  return { name, dataType };
}

function step(id: string, name: string, op: WorkflowStep["op"], params: Record<string, unknown>, inputs: string[], outputs: StepOutput[]): WorkflowStep {
  return {
    id,
    name,
    op,
    params,
    inputs,
    outputs,
    executionHints: {},
    validationState: { valid: true, diagnostics: [] }
  };
}

function buildRoiStep(state: QuickIndexState): WorkflowStep {
  return step(
    "roi-input",
    "ROI Input",
    "input",
    {
      sourceType: state.roiSourceType,
      geometry: state.roiGeoJson || "{\"type\":\"FeatureCollection\",\"features\":[]}",
      filePath: state.roiFilePath || ""
    },
    [],
    [output("roi", "FeatureCollection")]
  );
}

export function createQuickIndexWorkflow(projectId: string, state: QuickIndexState): WorkflowSpec {
  const steps: WorkflowStep[] = [
    buildRoiStep(state),
    step("dataset-input", "Dataset Input", "input", { sourceType: "gee_collection", datasetId: state.datasetId }, [], [output("imagery", "ImageCollection")]),
    step("filter-step", "Filter Collection", "filter", { start: state.start, end: state.end, cloudMask: true }, ["imagery", "roi"], [output("filtered_imagery", "ImageCollection")]),
    step("reduce-step", "Temporal Reduce", "temporal_reduce", { reducer: "median" }, ["filtered_imagery"], [output("composite_image", "Image")]),
    step("index-step", "Derived Index", "index", { indexType: state.indexType }, ["composite_image"], [output("derived_index", "Image")]),
    step("stats-step", "Region Stats", "region_stats", { reducer: "mean" }, ["derived_index", "roi"], [output("summary_table", "Table")]),
    step(
      "export-step",
      "Export Result",
      "export",
      {
        format: "GeoTIFF",
        destination: state.exportDestination,
        filename: state.filename,
        scale: state.scale
      },
      ["derived_index", "roi"],
      [output("export_file", "File")]
    )
  ];

  return {
    id: "",
    projectId,
    name: `${state.indexType} Quick Analysis`,
    steps,
    bindings: {
      datasetId: state.datasetId,
      start: state.start,
      end: state.end,
      indexType: state.indexType,
      destination: state.exportDestination,
      filename: state.filename,
      scale: state.scale
    },
    status: "draft",
    schemaVersion: "1.0.0"
  };
}

export function createTrueColorWorkflow(projectId: string, state: QuickIndexState): WorkflowSpec {
  const steps: WorkflowStep[] = [
    buildRoiStep(state),
    step("dataset-input", "Dataset Input", "input", { sourceType: "gee_collection", datasetId: state.datasetId }, [], [output("imagery", "ImageCollection")]),
    step("filter-step", "Filter Collection", "filter", { start: state.start, end: state.end, cloudMask: true }, ["imagery", "roi"], [output("filtered_imagery", "ImageCollection")]),
    step("reduce-step", "Temporal Reduce", "temporal_reduce", { reducer: "median" }, ["filtered_imagery"], [output("composite_image", "Image")]),
    step("render-step", "True Color Binding", "band_math", { expression: "image", renderPreset: "true_color", bands: ["B4", "B3", "B2"] }, ["composite_image"], [output("rendered_image", "Image")]),
    step(
      "export-step",
      "Export Result",
      "export",
      {
        format: "GeoTIFF",
        destination: state.exportDestination,
        filename: state.filename,
        scale: state.scale,
        renderPreset: "true_color"
      },
      ["rendered_image", "roi"],
      [output("export_file", "File")]
    )
  ];

  return {
    id: "",
    projectId,
    name: "True Color Composite",
    steps,
    bindings: {
      datasetId: state.datasetId,
      start: state.start,
      end: state.end,
      renderPreset: "true_color",
      destination: state.exportDestination,
      filename: state.filename,
      scale: state.scale,
      roiGeoJson: state.roiGeoJson
    },
    status: "draft",
    schemaVersion: "1.0.0"
  };
}

export const toolRegistry: ToolDefinition[] = [
  {
    id: "true-color-composite",
    category: "data",
    displayKey: "tool.trueColor.name",
    descriptionKey: "tool.trueColor.description",
    icon: "workspace",
    workflowBuilder: createTrueColorWorkflow
  },
  {
    id: "quick-index",
    category: "index",
    displayKey: "tool.quickIndex.name",
    descriptionKey: "tool.quickIndex.description",
    icon: "parameters",
    workflowBuilder: createQuickIndexWorkflow
  },
  {
    id: "preprocess-template",
    category: "preprocess",
    displayKey: "tool.preprocess.name",
    descriptionKey: "tool.preprocess.description",
    icon: "toolbox"
  },
  {
    id: "statistics-template",
    category: "statistics",
    displayKey: "tool.statistics.name",
    descriptionKey: "tool.statistics.description",
    icon: "runs"
  },
  {
    id: "export-template",
    category: "export",
    displayKey: "tool.export.name",
    descriptionKey: "tool.export.description",
    icon: "catalog"
  },
  {
    id: "ai-drafting",
    category: "ai",
    displayKey: "tool.ai.name",
    descriptionKey: "tool.ai.description",
    icon: "ai"
  }
];

export function preferredDatasetOptions(datasets: DatasetEntry[]) {
  return datasets.filter((dataset) => dataset.id === "COPERNICUS/S2_SR_HARMONIZED" || dataset.id.startsWith("LANDSAT"));
}
