import { useI18n } from "../../shared/i18n";

export function ScriptPanel(props: { script: string; onChange: (value: string) => void; onRun: () => void }) {
  const { t } = useI18n();

  return (
    <div className="card script-card">
      <div className="panel-title">{t("console.script")}</div>
      <textarea value={props.script} onChange={(e) => props.onChange(e.target.value)} />
      <button onClick={props.onRun}>{t("toolbar.run")}</button>
    </div>
  );
}
