from __future__ import annotations

from ..core.models import RunRecord, RunSummaryResponse, WorkflowSpec, utc_now
from ..providers.gee_provider import GEEProvider
from ..storage.sqlite_repository import SqliteRepository
from .workflow_service import WorkflowService


class RunService:
    def __init__(self, repository: SqliteRepository, workflow_service: WorkflowService, gee_provider: GEEProvider) -> None:
        self.repository = repository
        self.workflow_service = workflow_service
        self.gee_provider = gee_provider

    def run(self, workflow: WorkflowSpec, user_script_override: str | None) -> RunSummaryResponse:
        compiled = self.workflow_service.compile(workflow)
        script = user_script_override or compiled.script
        status, logs, artifacts = self.gee_provider.run(workflow, compiled.plan, script)
        run = RunRecord(
            workflowId=workflow.id,
            compiledScript=compiled.script,
            userScriptOverride=user_script_override,
            workflowSnapshot=compiled.workflow.model_copy(deep=True),
            executionPlanSnapshot=compiled.plan.model_copy(deep=True),
            compiledScriptSnapshot=compiled.script,
            status=status,
            logs=logs,
            artifacts=artifacts,
            finishedAt=utc_now(),
        )
        for artifact in run.artifacts:
            artifact.runId = run.id
        self.repository.save_run(run)
        workflow.status = status
        self.repository.save_workflow(workflow)
        return RunSummaryResponse(run=run, snapshotRefs={"workflowId": workflow.id, "planId": compiled.plan.id, "runId": run.id})

    def get(self, run_id: str) -> RunRecord | None:
        return self.repository.get_run(run_id)

    def list(self) -> list[RunRecord]:
        return self.repository.list_runs()
