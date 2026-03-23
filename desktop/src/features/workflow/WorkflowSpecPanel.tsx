import type { WorkflowStep } from "../../shared/types";
import { useI18n } from "../../shared/i18n";

export function WorkflowSpecPanel(props: { steps: WorkflowStep[] }) {
  const { t } = useI18n();

  return (
    <div className="card">
      <div className="panel-title">{t("workspace.results")}</div>
      <div className="scroll-list">
        {props.steps.map((step) => (
          <div key={step.id} className="list-item">
            <div>
              <strong>{step.name}</strong>
              <p>{step.op}</p>
            </div>
            <span>{step.outputs.map((item) => item.name).join(", ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
