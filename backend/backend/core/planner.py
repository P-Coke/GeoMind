from __future__ import annotations

from .models import ExecutionOperation, ExecutionPlan, ProviderDecision, WorkflowSpec


class ExecutionPlanner:
    planner_version = "1.0.0"
    policy_version = "1.0.0"

    def build(self, workflow: WorkflowSpec) -> ExecutionPlan:
        operations: list[ExecutionOperation] = []
        provider_decisions: list[ProviderDecision] = []
        previous_op_id: str | None = None

        for step in workflow.steps:
            for action, provider, params in self._expand_step(step.op, step.params):
                operation = ExecutionOperation(
                    action=action,
                    provider=provider,  # type: ignore[arg-type]
                    params=params,
                    dependsOn=[previous_op_id] if previous_op_id else [],
                    cacheKey=f"{workflow.id}:{step.id}:{action}",
                    consumes=step.inputs,
                    produces=step.outputs,
                )
                operations.append(operation)
                previous_op_id = operation.id
                provider_decisions.append(
                    ProviderDecision(stepId=step.id, operation=action, provider=provider, reason=self._provider_reason(step.op, step.params))
                )

        return ExecutionPlan(
            workflowId=workflow.id,
            plannerVersion=self.planner_version,
            policyVersion=self.policy_version,
            operations=operations,
            providerSummary=sorted({item.provider for item in operations}),
            providerDecisions=provider_decisions,
            notes=[
                "Execution plan is expanded from the semantic workflow.",
                "Providers are chosen by planner policy rather than by workflow steps.",
            ],
        )

    def _expand_step(self, op: str, params: dict) -> list[tuple[str, str, dict]]:
        provider = self._select_provider(op, params)
        if op == "input":
            source_type = params.get("sourceType")
            action = "load_local_input" if source_type in {"drawn_roi", "local_file"} else "load_dataset"
            return [(action, provider, params)]
        if op == "filter":
            items = [("filter_collection", provider, params)]
            if params.get("cloudMask"):
                items.append(("mask_cloud", provider, {"enabled": True}))
            return items
        if op == "temporal_reduce":
            return [("temporal_reduce", provider, params)]
        if op == "index":
            return [("compute_index", provider, params)]
        if op == "band_math":
            return [("apply_band_math", provider, params)]
        if op == "region_stats":
            return [("reduce_region", provider, params)]
        if op == "export":
            return [("export_result", provider, params)]
        return [("noop", provider, params)]

    def _select_provider(self, op: str, params: dict) -> str:
        source_type = params.get("sourceType")
        if source_type in {"drawn_roi", "local_file"}:
            return "local_python"
        if op in {"filter", "temporal_reduce", "index", "band_math", "region_stats", "export"}:
            return "gee"
        return "gee"

    def _provider_reason(self, op: str, params: dict) -> str:
        source_type = params.get("sourceType")
        if source_type in {"drawn_roi", "local_file"}:
            return "Local input requires local_python preprocessing."
        if op in {"filter", "temporal_reduce", "index", "band_math", "region_stats", "export"}:
            return "Remote imagery operations are assigned to GEE policy."
        return "Default provider policy."

