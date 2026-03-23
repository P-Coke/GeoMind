import type { AIConfigStatus, ScriptUnit, WorkflowDraft } from "../../shared/types";
import { useI18n } from "../../shared/i18n";

export function AiAcceleratorPanel(props: {
  goal: string;
  aiConfigStatus?: AIConfigStatus;
  draft?: WorkflowDraft;
  scriptUnits: ScriptUnit[];
  notes: string[];
  loading: boolean;
  error?: string;
  onGoalChange: (value: string) => void;
  onGenerate: () => void;
  onMaterialize: () => void;
}) {
  const { t } = useI18n();
  const ready = Boolean(props.aiConfigStatus?.enabled && props.aiConfigStatus?.hasKey);

  return (
    <div className="ai-panel">
      <div className="info-callout">
        {ready ? `${props.aiConfigStatus?.provider} / ${props.aiConfigStatus?.model}` : t("ai.notReady")}
      </div>
      <label>
        <span>{t("ai.goal")}</span>
        <textarea value={props.goal} onChange={(e) => props.onGoalChange(e.target.value)} />
      </label>
      <div className="button-row">
        <button type="button" onClick={props.onGenerate} disabled={!ready || props.loading}>
          {t("ai.generate")}
        </button>
        <button type="button" onClick={props.onMaterialize} disabled={!props.draft}>
          {t("ai.materialize")}
        </button>
      </div>

      {props.loading ? <div className="info-callout">Generating workflow draft...</div> : null}
      {props.error ? <div className="status error">{props.error}</div> : null}
      {!props.draft && props.notes.length > 0 ? (
        <div className="ai-draft-review">
          <div className="panel-title">AI Notes</div>
          <div className="scroll-list">
            {props.notes.map((note, index) => (
              <div key={`${index}-${note}`} className="info-callout">{note}</div>
            ))}
          </div>
        </div>
      ) : null}

      {props.draft ? (
        <div className="ai-draft-review">
          <div className="panel-title">{t("ai.generatedSteps")}</div>
          <div className="ai-step-list">
            {props.draft.linearSteps.map((step) => {
              const scriptUnit = props.scriptUnits.find((item) => item.id === step.scriptUnitId);
              return (
                <div key={step.id} className="tree-card">
                  <strong>{step.name}</strong>
                  <div>{step.op}</div>
                  <div>{step.kind}</div>
                  <div>Inputs: {step.inputs.join(", ") || "-"}</div>
                  <div>Outputs: {step.outputs.join(", ") || "-"}</div>
                  {scriptUnit ? <pre className="script-snippet">{scriptUnit.script.slice(0, 320)}</pre> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
