import type { DatasetEntry } from "../../shared/types";

export function ToolboxPanel(props: {
  datasets: DatasetEntry[];
  datasetId: string;
  indexType: string;
  start: string;
  end: string;
  onDatasetChange: (value: string) => void;
  onIndexChange: (value: string) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onSave: () => void;
  onCompile: () => void;
}) {
  return (
    <div className="card">
      <h3>Toolbox Wizard</h3>
      <label>Dataset</label>
      <select aria-label="Dataset" value={props.datasetId} onChange={(event) => props.onDatasetChange(event.target.value)}>
        <option value="">Select dataset</option>
        {props.datasets.map((dataset) => (
          <option key={dataset.id} value={dataset.id}>
            {dataset.name}
          </option>
        ))}
      </select>
      <label>Index</label>
      <select aria-label="Index" value={props.indexType} onChange={(event) => props.onIndexChange(event.target.value)}>
        <option value="NDVI">NDVI</option>
        <option value="NDWI">NDWI</option>
        <option value="NDBI">NDBI</option>
      </select>
      <label>Start</label>
      <input aria-label="Start" type="date" value={props.start} onChange={(e) => props.onStartChange(e.target.value)} />
      <label>End</label>
      <input aria-label="End" type="date" value={props.end} onChange={(e) => props.onEndChange(e.target.value)} />
      <button onClick={props.onSave}>Save wizard flow</button>
      <button onClick={props.onCompile}>Compile plan</button>
    </div>
  );
}
