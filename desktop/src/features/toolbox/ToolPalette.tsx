import { toolRegistry, type ToolCategory, type ToolDefinition, type ToolId } from "./toolRegistry";
import { AppIcon } from "../../shared/components/AppIcon";
import { useI18n } from "../../shared/i18n";

const categoryOrder: ToolCategory[] = ["data", "preprocess", "index", "statistics", "export", "ai"];

export function ToolPalette(props: {
  selectedToolId: ToolId;
  search: string;
  collapsedCategories: Record<ToolCategory, boolean>;
  onSearchChange: (value: string) => void;
  onToggleCategory: (category: ToolCategory) => void;
  onSelectTool: (tool: ToolDefinition) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="panel-stack" data-testid="tool-palette">
      <input value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder={t("tool.search")} aria-label={t("tool.search")} />
      {categoryOrder.map((category) => {
        const tools = toolRegistry.filter((tool) => {
          if (tool.category !== category) {
            return false;
          }
          const query = props.search.trim().toLowerCase();
          if (!query) {
            return true;
          }
          return t(tool.displayKey as never).toLowerCase().includes(query) || t(tool.descriptionKey as never).toLowerCase().includes(query);
        });
        if (tools.length === 0) {
          return null;
        }
        return (
          <section key={category} className="tree-group">
            <button type="button" className="tree-group-header" onClick={() => props.onToggleCategory(category)}>
              <AppIcon name={props.collapsedCategories[category] ? "chevron-right" : "chevron-down"} className="tree-chevron" />
              <strong>{t(`tool.category.${category}` as const)}</strong>
            </button>
            {!props.collapsedCategories[category] ? (
              <div className="palette-list tree-group-body">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    className={`tool-item ${props.selectedToolId === tool.id ? "active" : ""}`}
                    onClick={() => props.onSelectTool(tool)}
                  >
                    <span className="tool-icon"><AppIcon name={tool.icon} /></span>
                    <span className="tool-copy">
                      <strong>{t(tool.displayKey as never)}</strong>
                      <small>{t(tool.descriptionKey as never)}</small>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
