import { useState } from "react";
import { AppIcon } from "../../shared/components/AppIcon";
import { useI18n } from "../../shared/i18n";
import type { LayerNode } from "../../shared/types";

type GroupId = "base" | "ee" | "local";

const groupKeyMap: Record<GroupId, "map.baseLayers" | "map.eeLayers" | "map.localLayers"> = {
  base: "map.baseLayers",
  ee: "map.eeLayers",
  local: "map.localLayers"
};

function iconForLayerKind(kind: LayerNode["kind"]) {
  switch (kind) {
    case "base":
      return "base-layer";
    case "ee":
      return "ee-layer";
    case "local":
      return "local-layer";
    default:
      return "local-layer";
  }
}

export function LayersPanel(props: {
  layers: LayerNode[];
  selectedLayerId?: string;
  collapsedGroups: Record<GroupId, boolean>;
  onAddBasemap: () => void;
  onToggleGroup: (groupId: GroupId) => void;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onRenameLayer: (layerId: string, name: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  onMoveLayer: (layerId: string, direction: "up" | "down") => void;
}) {
  const { t } = useI18n();
  const [renamingId, setRenamingId] = useState<string>();
  const [draftName, setDraftName] = useState("");

  const groups: GroupId[] = ["base", "ee", "local"];

  return (
    <div className="dock-panel-content layers-panel" data-testid="layers-tree">
      {groups.map((groupId) => {
        const items = props.layers.filter((layer) => layer.groupId === groupId);
        return (
          <section key={groupId} className="tree-group">
            <div className="tree-group-header">
              <button type="button" className="tree-group-toggle" onClick={() => props.onToggleGroup(groupId)}>
              <AppIcon name={props.collapsedGroups[groupId] ? "chevron-right" : "chevron-down"} className="tree-chevron" />
              <strong>{t(groupKeyMap[groupId])}</strong>
              </button>
              {groupId === "base" ? (
                <span className="group-header-actions">
                  <button type="button" className="icon-button" aria-label={t("layers.addBasemap")} onClick={props.onAddBasemap}>
                    +
                  </button>
                </span>
              ) : null}
            </div>
            {!props.collapsedGroups[groupId] ? (
              <div className="tree-group-body">
                {items.length === 0 ? <div className="muted-row">{t("layers.none")}</div> : null}
                {items.map((layer) => {
                  const selected = props.selectedLayerId === layer.id;
                  const renaming = renamingId === layer.id;
                  return (
                    <div key={layer.id} className={`layer-row ${selected ? "active" : ""}`}>
                      <button type="button" className="icon-button" aria-label={t("layers.visibility")} onClick={() => props.onToggleVisibility(layer.id)}>
                        <AppIcon name={layer.visible ? "visibility" : "visibility-off"} />
                      </button>
                      <button type="button" className="layer-main" onClick={() => props.onSelectLayer(layer.id)}>
                        {renaming ? (
                          <input
                            value={draftName}
                            autoFocus
                            onChange={(event) => setDraftName(event.target.value)}
                            onBlur={() => {
                              props.onRenameLayer(layer.id, draftName || layer.name);
                              setRenamingId(undefined);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                props.onRenameLayer(layer.id, draftName || layer.name);
                                setRenamingId(undefined);
                              }
                            }}
                          />
                        ) : (
                          <>
                            <AppIcon name={iconForLayerKind(layer.kind)} className="layer-icon" />
                            <span>{layer.name}</span>
                          </>
                        )}
                      </button>
                      <div className="layer-actions">
                        {layer.kind !== "base" ? (
                          <>
                            <button type="button" className="icon-button" aria-label={t("layers.up")} onClick={() => props.onMoveLayer(layer.id, "up")}>
                              <AppIcon name="up" />
                            </button>
                            <button type="button" className="icon-button" aria-label={t("layers.down")} onClick={() => props.onMoveLayer(layer.id, "down")}>
                              <AppIcon name="down" />
                            </button>
                          </>
                        ) : null}
                        <button type="button" className="icon-button" aria-label={t("layers.rename")} onClick={() => {
                          setRenamingId(layer.id);
                          setDraftName(layer.name);
                        }}>
                          <AppIcon name="rename" />
                        </button>
                        <button type="button" className="icon-button" aria-label={t("layers.delete")} onClick={() => props.onDeleteLayer(layer.id)}>
                          <AppIcon name="delete" />
                        </button>
                      </div>
                      {layer.kind !== "base" ? (
                        <input
                          className="layer-opacity"
                          aria-label={`${layer.name}-${t("layers.opacity")}`}
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(layer.opacity * 100)}
                          onChange={(event) => props.onOpacityChange(layer.id, Number(event.target.value) / 100)}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
