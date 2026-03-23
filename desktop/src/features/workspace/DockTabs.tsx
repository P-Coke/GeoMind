export interface DockTab<T extends string> {
  id: T;
  label: string;
}

export function DockTabs<T extends string>(props: {
  tabs: DockTab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  return (
    <div className="dock-tabs">
      <div className="dock-tab-list">
        {props.tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`dock-tab ${props.activeTab === tab.id ? "active" : ""}`}
            onClick={() => props.onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {props.onToggleCollapsed ? (
        <button type="button" className="dock-collapse" onClick={props.onToggleCollapsed}>
          {props.collapsed ? "▸" : "▾"}
        </button>
      ) : null}
    </div>
  );
}
