import type { DatasetEntry, ExportDestination, RoiUploadResponse } from "../../shared/types";
import { useI18n } from "../../shared/i18n";
import type { QuickIndexState, ToolDefinition } from "./toolRegistry";

export function ToolInspectorPanel(props: {
  tool: ToolDefinition;
  datasets: DatasetEntry[];
  state: QuickIndexState;
  roiUpload?: RoiUploadResponse;
  onDatasetChange: (value: string) => void;
  onIndexChange: (value: string) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onFilenameChange: (value: string) => void;
  onScaleChange: (value: number) => void;
  onDestinationChange: (value: ExportDestination) => void;
  onUploadRoi: (file: File) => void;
  onSave: () => void;
}) {
  const { t } = useI18n();
  const isQuickIndex = props.tool.id === "quick-index";
  const isTrueColor = props.tool.id === "true-color-composite";

  return (
    <div className="card inspector-card" data-testid="tool-inspector">
      <div className="panel-title">{t("workspace.parameters")}</div>
      <div className="inspector-header">
        <strong>{t(props.tool.displayKey as never)}</strong>
        <p>{t(props.tool.descriptionKey as never)}</p>
      </div>

      {isQuickIndex || isTrueColor ? (
        <div className="form-grid">
          <label>
            <span>{t("tool.roi.upload")}</span>
            <input
              aria-label={t("tool.roi.upload")}
              type="file"
              accept=".geojson,.json,.zip"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  props.onUploadRoi(file);
                }
              }}
            />
          </label>
          <div className="info-callout">
            {props.roiUpload ? `${props.roiUpload.fileName} · ${props.roiUpload.featureCount}` : t("tool.roi.hint")}
          </div>
          <label>
            <span>{t("tool.quickIndex.dataset")}</span>
            <select aria-label={t("tool.quickIndex.dataset")} value={props.state.datasetId} onChange={(event) => props.onDatasetChange(event.target.value)}>
              <option value="">Select dataset</option>
              {props.datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
          </label>
          {!isTrueColor ? (
            <label>
              <span>{t("tool.quickIndex.index")}</span>
              <select aria-label={t("tool.quickIndex.index")} value={props.state.indexType} onChange={(event) => props.onIndexChange(event.target.value)}>
                <option value="NDVI">NDVI</option>
                <option value="NDWI">NDWI</option>
                <option value="NDBI">NDBI</option>
              </select>
            </label>
          ) : null}
          <label>
            <span>{t("tool.quickIndex.start")}</span>
            <input aria-label={t("tool.quickIndex.start")} type="date" value={props.state.start} onChange={(event) => props.onStartChange(event.target.value)} />
          </label>
          <label>
            <span>{t("tool.quickIndex.end")}</span>
            <input aria-label={t("tool.quickIndex.end")} type="date" value={props.state.end} onChange={(event) => props.onEndChange(event.target.value)} />
          </label>
          <label>
            <span>{t("tool.export.destination")}</span>
            <select aria-label={t("tool.export.destination")} value={props.state.exportDestination} onChange={(event) => props.onDestinationChange(event.target.value as ExportDestination)}>
              <option value="local_download">{t("tool.export.local")}</option>
              <option value="google_drive">{t("tool.export.drive")}</option>
            </select>
          </label>
          <label>
            <span>{t("tool.export.filename")}</span>
            <input aria-label={t("tool.export.filename")} value={props.state.filename} onChange={(event) => props.onFilenameChange(event.target.value)} />
          </label>
          <label>
            <span>{t("tool.export.scale")}</span>
            <input aria-label={t("tool.export.scale")} type="number" value={props.state.scale} onChange={(event) => props.onScaleChange(Number(event.target.value))} />
          </label>
          <div className="info-callout">{isTrueColor ? t("tool.trueColor.status") : t("tool.quickIndex.status")}</div>
          <button type="button" onClick={props.onSave}>
            {isTrueColor ? t("tool.trueColor.save") : t("tool.quickIndex.save")}
          </button>
        </div>
      ) : (
        <div className="tool-placeholder">
          <p>{t("tool.planned")}</p>
        </div>
      )}
    </div>
  );
}
