import type { RunRecord } from "../../shared/types";
import { useI18n } from "../../shared/i18n";

export function RunsPage(props: { currentRun?: RunRecord; runs: RunRecord[]; onDownload: () => void }) {
  const { t } = useI18n();

  return (
    <div className="page-grid" data-testid="runs-page">
      <section className="card page-hero">
        <div className="panel-title">{t("page.runs.title")}</div>
        <p>{t("page.runs.subtitle")}</p>
      </section>
      <section className="card">
        <div className="panel-title">{t("runs.history")}</div>
        <div className="scroll-list">
          {props.runs.map((run) => (
            <div key={run.id} className="list-item stacked">
              <strong>{run.workflowSnapshot.name}</strong>
              <small>{run.status}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <div className="panel-title">{t("runs.exports")}</div>
        <div className="button-row">
          <button type="button" onClick={props.onDownload}>{t("toolbar.export")}</button>
        </div>
        {props.currentRun ? (
          <div className="kv-list">
            <div><span>ID</span><strong>{props.currentRun.id}</strong></div>
            <div><span>Status</span><strong>{props.currentRun.status}</strong></div>
            <div><span>{t("workspace.compiledFrom")}</span><strong>{props.currentRun.workflowSnapshot.name}</strong></div>
          </div>
        ) : (
          <div className="info-callout">{t("workspace.noRun")}</div>
        )}
      </section>
      <section className="card">
        <div className="panel-title">{t("runs.artifacts")}</div>
        <div className="scroll-list">
          {(props.currentRun?.artifacts ?? []).map((artifact) => (
            <div key={artifact.id} className="list-item">
              <strong>{artifact.type}</strong>
              <span>{artifact.pathOrUri}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
