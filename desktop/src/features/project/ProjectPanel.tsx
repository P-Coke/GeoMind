import { useI18n } from "../../shared/i18n";

export function ProjectPanel(props: {
  projectName: string;
  projectDescription: string;
  currentProjectName?: string;
  onProjectNameChange: (value: string) => void;
  onProjectDescriptionChange: (value: string) => void;
  onCreate: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="card">
      <div className="panel-title">{t("project.title")}</div>
      <input value={props.projectName} onChange={(e) => props.onProjectNameChange(e.target.value)} placeholder={t("project.name")} />
      <textarea value={props.projectDescription} onChange={(e) => props.onProjectDescriptionChange(e.target.value)} placeholder={t("project.description")} />
      <button onClick={props.onCreate}>{t("project.create")}</button>
      <p>{props.currentProjectName ?? t("project.noSelection")}</p>
    </div>
  );
}
