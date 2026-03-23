import type { ExecutionOperation } from "../../shared/types";
import { useI18n } from "../../shared/i18n";

export function ExecutionPlanPanel(props: { operations: ExecutionOperation[] }) {
  const { t } = useI18n();

  return (
    <div className="card">
      <div className="panel-title">{t("console.execution")}</div>
      <div className="scroll-list">
        {props.operations.map((operation) => (
          <div key={operation.id} className="list-item">
            <div>
              <strong>{operation.action}</strong>
              <p>{operation.provider}</p>
            </div>
            <span>{operation.consumes.join(", ") || "root"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
