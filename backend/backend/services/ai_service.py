from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from ..core.diagnostics import Diagnostic
from ..core.models import (
    AIConfig,
    AIConfigRequest,
    AIConfigStatus,
    AssetRef,
    ScriptUnit,
    StepOutput,
    Template,
    TemplateDraftResponse,
    WorkflowDraft,
    WorkflowGenerateResponse,
    WorkflowLinearStep,
    WorkflowMaterializeResponse,
    WorkflowSpec,
    WorkflowStep,
    WorkflowSuggestResponse,
)
from ..storage.sqlite_repository import SqliteRepository
from .llm_provider import AIProvider, AIProviderError, RemoteLLMProvider


def _output(name: str, data_type: str) -> StepOutput:
    return StepOutput(name=name, dataType=data_type)  # type: ignore[arg-type]


def _diagnostic(code: str, message: str, severity: str = "error", step_id: str | None = None, field_path: str | None = None) -> Diagnostic:
    return Diagnostic(code=code, message=message, severity=severity, stepId=step_id, fieldPath=field_path)


class AIService:
    def __init__(self, repository: SqliteRepository, provider: AIProvider | None = None) -> None:
        self.repository = repository
        self.provider = provider or RemoteLLMProvider()

    def get_config_status(self) -> AIConfigStatus:
        config = self.repository.get_ai_config()
        if config is None:
            return AIConfigStatus(message="AI provider is not configured.")
        return AIConfigStatus(
            provider=config.provider,
            model=config.model,
            baseUrl=config.baseUrl,
            enabled=config.enabled,
            hasKey=bool(config.apiKey),
            message="AI provider is ready." if config.enabled and config.apiKey else "AI provider is saved but not enabled.",
        )

    def save_config(self, request: AIConfigRequest) -> AIConfigStatus:
        config = AIConfig.model_validate(request.model_dump())
        self.repository.save_ai_config(config)
        return self.get_config_status()

    def save_script_unit(self, script_unit: ScriptUnit) -> ScriptUnit:
        return self.repository.save_script_unit(script_unit)

    def get_script_unit(self, script_unit_id: str) -> ScriptUnit | None:
        return self.repository.get_script_unit(script_unit_id)

    def register_asset_ref(self, asset_ref: AssetRef) -> AssetRef:
        return self.repository.save_asset_ref(asset_ref)

    def suggest_workflow(self, goal: str, project_id: str) -> WorkflowSuggestResponse:
        generated = self.generate_linear_workflow(goal, project_id)
        return WorkflowSuggestResponse(
            workflow=generated.workflowDraft.workflow,
            diagnostics=generated.diagnostics,
            explanation=generated.explanation,
        )

    def generate_linear_workflow(self, goal: str, project_id: str) -> WorkflowGenerateResponse:
        config = self.repository.get_ai_config()
        if config is None or not config.enabled or not config.apiKey:
            raise HTTPException(status_code=400, detail="AI provider is not configured.")

        asset_refs = self.repository.list_asset_refs(project_id)
        try:
            payload = self.provider.generate_json(config, self._system_prompt(), self._user_prompt(goal, project_id, asset_refs))
        except AIProviderError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        payload = self._normalize_payload(payload, goal, project_id)
        try:
            workflow = WorkflowSpec.model_validate(payload["workflowDraft"]["workflow"])
            linear_steps = [WorkflowLinearStep.model_validate(item) for item in payload["workflowDraft"].get("linearSteps", [])]
            script_units = [ScriptUnit.model_validate(item) for item in payload.get("scriptUnits", [])]
            explanation = [str(item) for item in payload.get("explanation", [])]
            diagnostics = [Diagnostic.model_validate(item) for item in payload.get("diagnostics", [])]
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"AI response failed schema validation: {exc}") from exc

        workflow.projectId = project_id
        draft = WorkflowDraft(
            projectId=project_id,
            name=payload["workflowDraft"].get("name", workflow.name),
            workflow=workflow,
            linearSteps=linear_steps,
            bindings=payload["workflowDraft"].get("bindings", {}),
            diagnostics=diagnostics,
        )
        validation_diagnostics = self._validate_generated_chain(draft, script_units, asset_refs)
        all_diagnostics = diagnostics + validation_diagnostics
        draft.diagnostics = all_diagnostics
        self.repository.save_workflow_draft(draft)
        for script_unit in script_units:
            self.repository.save_script_unit(script_unit)
        return WorkflowGenerateResponse(workflowDraft=draft, scriptUnits=script_units, diagnostics=all_diagnostics, explanation=explanation)

    def materialize_workflow(self, workflow_id: str, draft_id: str, project_id: str | None = None, workflow_name: str | None = None) -> WorkflowMaterializeResponse:
        draft = self.repository.get_workflow_draft(draft_id)
        if draft is None:
            raise HTTPException(status_code=404, detail="Workflow draft not found.")

        workflow = draft.workflow.model_copy(deep=True)
        workflow.projectId = project_id or draft.projectId
        workflow.name = workflow_name or workflow.name
        if workflow_id != "new":
            workflow.id = workflow_id

        linear_map = {step.id: step for step in draft.linearSteps}
        script_units: list[ScriptUnit] = []
        for step in workflow.steps:
            linear = linear_map.get(step.id)
            if linear is None:
                continue
            step.kind = linear.kind
            step.scriptUnitId = linear.scriptUnitId
            step.resourceRefs = linear.resourceRefs
            if linear.scriptUnitId:
                script_unit = self.repository.get_script_unit(linear.scriptUnitId)
                if script_unit is not None:
                    script_units.append(script_unit)

        saved = self.repository.save_workflow(workflow)
        return WorkflowMaterializeResponse(workflow=saved, scriptUnits=script_units, diagnostics=draft.diagnostics)

    def draft_template(self, goal: str) -> TemplateDraftResponse:
        lowered = goal.lower()
        index_type = "NDVI"
        if "water" in lowered:
            index_type = "NDWI"
        elif "urban" in lowered or "built" in lowered:
            index_type = "NDBI"
        template = Template(
            name=f"AI Draft {index_type} Template",
            kind="ai_draft",
            description=goal,
            stepBlueprints=[
                WorkflowStep(id="roi-input", name="ROI Input", op="input", params={"sourceType": "drawn_roi", "geometry": None}, inputs=[], outputs=[_output("roi", "FeatureCollection")]),
                WorkflowStep(id="dataset-input", name="Dataset Input", op="input", params={"sourceType": "gee_collection", "datasetId": "COPERNICUS/S2_SR_HARMONIZED"}, inputs=[], outputs=[_output("imagery", "ImageCollection")]),
                WorkflowStep(id="filter-step", name="Filter Collection", op="filter", params={"start": "2024-01-01", "end": "2024-12-31", "cloudMask": True}, inputs=["imagery", "roi"], outputs=[_output("filtered_imagery", "ImageCollection")]),
                WorkflowStep(id="reduce-step", name="Temporal Reduce", op="temporal_reduce", params={"reducer": "median"}, inputs=["filtered_imagery"], outputs=[_output("composite_image", "Image")]),
                WorkflowStep(id="index-step", name="Derived Index", op="index", params={"indexType": index_type}, inputs=["composite_image"], outputs=[_output("derived_index", "Image")]),
                WorkflowStep(id="stats-step", name="Region Stats", op="region_stats", params={"reducer": "mean"}, inputs=["derived_index", "roi"], outputs=[_output("summary_table", "Table")]),
                WorkflowStep(id="export-step", name="Export Result", op="export", params={"format": "GeoTIFF"}, inputs=["derived_index", "roi"], outputs=[_output("export_file", "File")]),
            ],
            parameterSchema={"datasetId": {"type": "string"}, "indexType": {"type": "string"}},
            defaults={"datasetId": "COPERNICUS/S2_SR_HARMONIZED", "indexType": index_type},
        )
        return TemplateDraftResponse(template=template, diagnostics=[], explanation=["AI created a template draft using the same workflow schema as built-ins.", "The draft can be saved and reused after review."])

    def _system_prompt(self) -> str:
        return (
            "You are generating GeoMind workflow drafts for Google Earth Engine.\n"
            "Return only JSON.\n"
            "The output must contain workflowDraft, scriptUnits, diagnostics, explanation.\n"
            "workflowDraft.workflow must be a valid WorkflowSpec with steps using only these ops: "
            "input, filter, temporal_reduce, index, band_math, region_stats, export.\n"
            "workflowDraft.linearSteps must be a linear chain with explicit inputs and outputs.\n"
            "Each linear step may only depend on previous outputs or explicit resourceRefs.\n"
            "If a step is ai_script_step it must have scriptUnitId and a matching ScriptUnit in scriptUnits.\n"
            "Prefer Sentinel-2 SR for optical remote sensing tasks unless the goal clearly requires something else.\n"
            "Do not invent hidden state or branching logic."
        )

    def _user_prompt(self, goal: str, project_id: str, asset_refs: list[AssetRef]) -> str:
        serialized_assets = [
            {
                "id": asset.id,
                "kind": asset.kind,
                "name": asset.name,
                "location": asset.location,
                "metadata": asset.metadata,
            }
            for asset in asset_refs
        ]
        return (
            f"Project ID: {project_id}\n"
            f"Goal: {goal}\n"
            f"Available assets: {serialized_assets}\n"
            "Return a practical linear workflow. If ROI or export information is missing, add diagnostics.\n"
            "For true color composites, use median temporal_reduce and a band_math/render binding for B4,B3,B2.\n"
            "Use resourceRefs to point at available asset ids.\n"
            "Every workflow step must include id, name, op, params, inputs, outputs.\n"
            "workflowDraft must include name, workflow, linearSteps, bindings."
        )

    def _normalize_payload(self, payload: dict[str, Any], goal: str, project_id: str) -> dict[str, Any]:
        workflow_draft = payload.get("workflowDraft", {})
        if not isinstance(workflow_draft, dict):
            workflow_draft = {}
            payload["workflowDraft"] = workflow_draft

        linear_steps = workflow_draft.get("linearSteps", [])
        linear_map: dict[str, dict[str, Any]] = {}
        if isinstance(linear_steps, list):
            normalized_linear_steps: list[dict[str, Any]] = []
            for item in linear_steps:
                if isinstance(item, dict) and item.get("id"):
                    item = item.copy()
                    step_id = str(item["id"])
                    raw_inputs = item.get("inputs", [])
                    if isinstance(raw_inputs, dict):
                        item["inputs"] = [str(value).split(".")[-1] for value in raw_inputs.values()]
                    raw_outputs = item.get("outputs", [])
                    if isinstance(raw_outputs, dict):
                        item["outputs"] = [str(value).split(".")[-1] for value in raw_outputs.values()]
                    item.setdefault("name", step_id.replace("-", " ").replace("_", " ").title() or "Step")
                    if not item.get("op"):
                        item["op"] = self._infer_op_from_step_id(step_id)
                    item.setdefault("kind", "template_step")
                    item.setdefault("providerHint", "gee")
                    item.setdefault("resourceRefs", [])
                    item.setdefault("params", {})
                    normalized_linear_steps.append(item)
                    linear_map[str(item["id"])] = item
            workflow_draft["linearSteps"] = normalized_linear_steps

        workflow = workflow_draft.get("workflow", {})
        if not isinstance(workflow, dict):
            workflow = {}
            workflow_draft["workflow"] = workflow

        workflow.setdefault("projectId", project_id)
        workflow.setdefault("name", workflow_draft.get("name") or goal[:80] or "AI Workflow")
        workflow.setdefault("bindings", workflow_draft.get("bindings") or {"goal": goal, "source": "ai"})
        workflow.setdefault("status", "draft")
        workflow.setdefault("schemaVersion", "1.0.0")

        normalized_steps: list[dict[str, Any]] = []
        for step in workflow.get("steps", []) if isinstance(workflow.get("steps"), list) else []:
            if not isinstance(step, dict):
                continue
            step_id = str(step.get("id", ""))
            linear = linear_map.get(step_id, {})
            step.setdefault("name", linear.get("name") or step_id.replace("-", " ").replace("_", " ").title() or "Step")
            step.setdefault("params", {})
            raw_inputs = step.get("inputs", linear.get("inputs") or [])
            if isinstance(raw_inputs, dict):
                step["inputs"] = [str(value).split(".")[-1] for value in raw_inputs.values()]
            elif isinstance(raw_inputs, list):
                step["inputs"] = raw_inputs
            else:
                step["inputs"] = linear.get("inputs") or []

            raw_outputs = step.get("outputs")
            if isinstance(raw_outputs, dict):
                step["outputs"] = [
                    {"name": str(value).split(".")[-1], "dataType": self._infer_output_type(step.get("op"), str(key))}
                    for key, value in raw_outputs.items()
                ]
            elif not raw_outputs and linear.get("outputs"):
                step["outputs"] = [{"name": output_name, "dataType": self._infer_output_type(step.get("op"), output_name)} for output_name in linear["outputs"]]
            step.setdefault("resourceRefs", linear.get("resourceRefs") or [])
            step.setdefault("kind", linear.get("kind") or "template_step")
            if linear.get("scriptUnitId") and not step.get("scriptUnitId"):
                step["scriptUnitId"] = linear["scriptUnitId"]
            step.setdefault("validationState", {"valid": True, "diagnostics": []})
            normalized_steps.append(step)
        workflow["steps"] = normalized_steps
        workflow_draft.setdefault("name", workflow.get("name"))
        workflow_draft.setdefault("bindings", workflow.get("bindings"))
        normalized_diagnostics: list[dict[str, Any]] = []
        for item in payload.get("diagnostics", []) if isinstance(payload.get("diagnostics"), list) else []:
            if not isinstance(item, dict):
                continue
            normalized_diagnostics.append(
                {
                    "code": item.get("code") or "ai.diagnostic",
                    "message": item.get("message") or item.get("detail") or "AI diagnostic",
                    "severity": str(item.get("severity") or item.get("level") or "warning").lower(),
                    "stepId": item.get("stepId"),
                    "fieldPath": item.get("fieldPath"),
                }
            )
        payload["diagnostics"] = normalized_diagnostics
        return payload

    def _infer_output_type(self, op: Any, output_name: str) -> str:
        if op == "input":
            if "roi" in output_name.lower():
                return "FeatureCollection"
            if "collection" in output_name.lower():
                return "ImageCollection"
            return "File"
        if op == "filter":
            return "ImageCollection"
        if op in {"temporal_reduce", "index", "band_math"}:
            return "Image"
        if op == "region_stats":
            return "Table"
        if op == "export":
            return "File"
        return "Image"

    def _infer_op_from_step_id(self, step_id: str) -> str:
        lowered = step_id.lower()
        if "input" in lowered:
            return "input"
        if "filter" in lowered:
            return "filter"
        if "reduce" in lowered or "median" in lowered:
            return "temporal_reduce"
        if "index" in lowered:
            return "index"
        if "band" in lowered or "render" in lowered or "truecolor" in lowered:
            return "band_math"
        if "stat" in lowered:
            return "region_stats"
        if "export" in lowered:
            return "export"
        return "band_math"

    def _validate_generated_chain(self, draft: WorkflowDraft, script_units: list[ScriptUnit], asset_refs: list[AssetRef]) -> list[Diagnostic]:
        diagnostics: list[Diagnostic] = []
        script_ids = {item.id for item in script_units}
        asset_ids = {item.id for item in asset_refs}
        available_outputs: set[str] = set()
        workflow_steps = {step.id: step for step in draft.workflow.steps}

        if not draft.linearSteps:
            diagnostics.append(_diagnostic("ai.workflow.empty", "AI did not return any linear steps.", field_path="linearSteps"))
            return diagnostics

        for linear in draft.linearSteps:
            if linear.id not in workflow_steps:
                diagnostics.append(_diagnostic("ai.workflow.step_missing", f"Linear step `{linear.id}` is missing from workflow.steps.", step_id=linear.id))
            for input_name in linear.inputs:
                if input_name not in available_outputs and input_name not in asset_ids:
                    diagnostics.append(_diagnostic("ai.workflow.input_unresolved", f"Input `{input_name}` is not produced by a previous step or asset.", step_id=linear.id))
            for resource_ref in linear.resourceRefs:
                if resource_ref not in asset_ids:
                    diagnostics.append(_diagnostic("ai.workflow.resource_unknown", f"Resource reference `{resource_ref}` is not known.", step_id=linear.id))
            if not linear.outputs:
                diagnostics.append(_diagnostic("ai.workflow.output_missing", "Each linear step must declare at least one output.", step_id=linear.id))
            if linear.kind == "ai_script_step" and not linear.scriptUnitId:
                diagnostics.append(_diagnostic("ai.workflow.script_missing", "AI script steps must reference a ScriptUnit.", step_id=linear.id))
            if linear.scriptUnitId and linear.scriptUnitId not in script_ids:
                diagnostics.append(_diagnostic("ai.workflow.script_unknown", f"ScriptUnit `{linear.scriptUnitId}` is not present.", step_id=linear.id))
            available_outputs.update(linear.outputs)

        return diagnostics
