import { useI18n } from "../../shared/i18n";
import type { LayerNode } from "../../shared/types";
import type { ToolDefinition } from "../toolbox/toolRegistry";

export function InspectorPanel(props: { selectedLayer?: LayerNode; selectedTool: ToolDefinition }) {
  const { t } = useI18n();

  if (!props.selectedLayer) {
    return (
      <div className="dock-panel-content">
        <div className="panel-title">{t("inspector.title")}</div>
        <div className="info-callout">{t("inspector.noSelection")}</div>
        <div className="kv-list">
          <div><span>{t("inspector.tool")}</span><strong>{props.selectedTool.id}</strong></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dock-panel-content">
      <div className="panel-title">{t("inspector.title")}</div>
      <div className="kv-list">
        <div><span>{t("inspector.layerName")}</span><strong>{props.selectedLayer.name}</strong></div>
        <div><span>{t("inspector.layerType")}</span><strong>{props.selectedLayer.kind}</strong></div>
        {props.selectedLayer.kind !== "base" ? <div><span>{t("inspector.layerOpacity")}</span><strong>{Math.round(props.selectedLayer.opacity * 100)}%</strong></div> : null}
        <div><span>{t("inspector.layerSource")}</span><strong>{props.selectedLayer.sourceRef ?? "-"}</strong></div>
      </div>
    </div>
  );
}
