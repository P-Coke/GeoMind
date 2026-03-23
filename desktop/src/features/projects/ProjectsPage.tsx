import { ProjectPanel } from "../project/ProjectPanel";
import type { Project } from "../../shared/types";
import { useI18n } from "../../shared/i18n";

export function ProjectsPage(props: {
  projectName: string;
  projectDescription: string;
  projects: Project[];
  currentProject?: Project;
  onProjectNameChange: (value: string) => void;
  onProjectDescriptionChange: (value: string) => void;
  onCreate: () => void;
  onSelectProject: (projectId: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="page-grid" data-testid="projects-page">
      <section className="card page-hero">
        <div className="panel-title">{t("page.projects.title")}</div>
        <p>{t("page.projects.subtitle")}</p>
      </section>
      <ProjectPanel
        projectName={props.projectName}
        projectDescription={props.projectDescription}
        currentProjectName={props.currentProject?.name}
        onProjectNameChange={props.onProjectNameChange}
        onProjectDescriptionChange={props.onProjectDescriptionChange}
        onCreate={props.onCreate}
      />
      <section className="card">
        <div className="panel-title">{t("project.recent")}</div>
        <div className="scroll-list">
          {props.projects.map((project) => (
            <button key={project.id} type="button" className={`project-row ${project.id === props.currentProject?.id ? "active" : ""}`} onClick={() => props.onSelectProject(project.id)}>
              <strong>{project.name}</strong>
              <small>{project.description || project.id}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
