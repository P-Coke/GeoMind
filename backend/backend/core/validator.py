from __future__ import annotations

from collections import defaultdict, deque

from .diagnostics import DiagnosticBundle
from .models import ValidationResponse, WorkflowSpec
from .registries import OPERATION_REGISTRY


class WorkflowValidator:
    def validate(self, workflow: WorkflowSpec) -> ValidationResponse:
        bundle = DiagnosticBundle()
        if not workflow.steps:
            bundle.add("workflow.empty", "Workflow must contain at least one step.", "error")
            return ValidationResponse(valid=False, diagnostics=bundle.diagnostics)

        produced_by: dict[str, str] = {}
        graph: dict[str, list[str]] = defaultdict(list)
        indegree: dict[str, int] = {step.id: 0 for step in workflow.steps}

        for step in workflow.steps:
            definition = OPERATION_REGISTRY.get(step.op)
            if definition is None:
                bundle.add("workflow.op.unsupported", f"Unsupported op `{step.op}`.", "error", step.id, "op")
                continue

            for required_param in definition.required_params:
                if step.params.get(required_param) in (None, ""):
                    bundle.add("workflow.param.required", f"Missing required param `{required_param}`.", "error", step.id, f"params.{required_param}")

            if not step.outputs:
                bundle.add("workflow.output.missing", "At least one output is required.", "error", step.id, "outputs")

            for output in step.outputs:
                if output.name in produced_by:
                    bundle.add("workflow.output.duplicate", f"Output `{output.name}` is already produced by `{produced_by[output.name]}`.", "error", step.id, "outputs")
                produced_by[output.name] = step.id

            if step.op == "input" and step.inputs:
                bundle.add("workflow.input.upstream", "Input steps cannot consume upstream outputs.", "error", step.id, "inputs")

        for step in workflow.steps:
            for input_name in step.inputs:
                owner = produced_by.get(input_name)
                if owner is None:
                    bundle.add("workflow.input.missing_reference", f"Input `{input_name}` is not produced by any upstream step.", "error", step.id, "inputs")
                    continue
                if owner == step.id:
                    bundle.add("workflow.input.self_reference", f"Step cannot consume its own output `{input_name}`.", "error", step.id, "inputs")
                    continue
                graph[owner].append(step.id)
                indegree[step.id] += 1

            if step.op == "filter" and (not step.params.get("start") or not step.params.get("end")):
                bundle.add("workflow.filter.range_missing", "Filter step should define `start` and `end`.", "warning", step.id, "params")

        queue = deque(step_id for step_id, degree in indegree.items() if degree == 0)
        visited = 0
        while queue:
            current = queue.popleft()
            visited += 1
            for neighbor in graph.get(current, []):
                indegree[neighbor] -= 1
                if indegree[neighbor] == 0:
                    queue.append(neighbor)

        if visited != len(workflow.steps):
            bundle.add("workflow.graph.cycle", "Workflow graph contains a cycle.", "error")

        for step in workflow.steps:
            step.validationState.diagnostics = [item for item in bundle.diagnostics if item.stepId == step.id]
            step.validationState.valid = not any(item.severity == "error" for item in step.validationState.diagnostics)

        return ValidationResponse(valid=bundle.valid, diagnostics=bundle.diagnostics)

