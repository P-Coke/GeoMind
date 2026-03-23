import { useI18n } from "../../shared/i18n";

export function AiNotesPanel(props: { notes: string[]; logs: string[] }) {
  const { t } = useI18n();

  return (
    <div className="card">
      <div className="panel-title">{t("workspace.ai")}</div>
      <div className="scroll-list">
        {props.notes.map((note, index) => (
          <p key={`${note}-${index}`}>{note}</p>
        ))}
      </div>
      <div className="panel-title secondary">{t("console.logs")}</div>
      <div className="scroll-list">
        {props.logs.map((log, index) => (
          <p key={`${log}-${index}`}>{log}</p>
        ))}
      </div>
    </div>
  );
}
