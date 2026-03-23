import type { AssetRef, DatasetEntry, Project, Template } from "../../shared/types";
import { useI18n } from "../../shared/i18n";

export function BrowserPanel(props: {
  currentProject?: Project;
  templates: Template[];
  datasets: DatasetEntry[];
  assetRefs: AssetRef[];
  onAddAssetToMap: (assetId: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="dock-panel-content">
      <div className="kv-list">
        <div><span>{t("project.current")}</span><strong>{props.currentProject?.name ?? t("project.noSelection")}</strong></div>
        <div><span>{t("templates.saved")}</span><strong>{props.templates.length}</strong></div>
        <div><span>{t("catalog.datasets")}</span><strong>{props.datasets.length}</strong></div>
        <div><span>{t("browser.assets")}</span><strong>{props.assetRefs.length}</strong></div>
      </div>
      <div className="asset-list">
        {props.assetRefs.length === 0 ? <div className="muted-row">{t("browser.noAssets")}</div> : null}
        {props.assetRefs.map((asset) => (
          <div key={asset.id} className="asset-row">
            <div className="asset-row-main">
              <strong>{asset.name}</strong>
              <span>{asset.kind}</span>
            </div>
            <button type="button" onClick={() => props.onAddAssetToMap(asset.id)}>{t("browser.addToLayers")}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
