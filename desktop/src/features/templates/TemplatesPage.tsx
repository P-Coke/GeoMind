import type { Template } from "../../shared/types";
import { useI18n } from "../../shared/i18n";

export function TemplatesPage(props: { templates: Template[] }) {
  const { t } = useI18n();
  const builtIn = props.templates.filter((template) => template.kind === "built_in");
  const saved = props.templates.filter((template) => template.kind === "user_saved");
  const drafts = props.templates.filter((template) => template.kind === "ai_draft");

  return (
    <div className="page-grid" data-testid="templates-page">
      <section className="card page-hero">
        <div className="panel-title">{t("page.templates.title")}</div>
        <p>{t("page.templates.subtitle")}</p>
      </section>
      <section className="card">
        <div className="panel-title">{t("templates.saved")}</div>
        <div className="scroll-list">
          {saved.length > 0 ? saved.map((template) => <div key={template.id} className="list-item"><strong>{template.name}</strong><span>{template.version}</span></div>) : <div className="info-callout">{t("workspace.noTemplates")}</div>}
        </div>
      </section>
      <section className="card">
        <div className="panel-title">{t("templates.aiDrafts")}</div>
        <div className="scroll-list">
          {drafts.length > 0 ? drafts.map((template) => <div key={template.id} className="list-item"><strong>{template.name}</strong><span>{template.version}</span></div>) : <div className="info-callout">{t("workspace.noTemplates")}</div>}
        </div>
      </section>
      <section className="card">
        <div className="panel-title">{t("templates.skills")}</div>
        <div className="info-callout">geomind-development</div>
        {builtIn.length > 0 ? <div className="muted-count">{t("templates.builtIn")}: {builtIn.length}</div> : null}
      </section>
    </div>
  );
}
