from __future__ import annotations

from fastapi import HTTPException

from ..core.compiler.gee import GEECompiler
from ..core.models import CompileResponse, ValidationResponse, WorkflowSpec
from ..core.planner import ExecutionPlanner
from ..core.validator import WorkflowValidator
from ..storage.sqlite_repository import SqliteRepository


class WorkflowService:
    def __init__(self, repository: SqliteRepository, validator: WorkflowValidator, planner: ExecutionPlanner, compiler: GEECompiler) -> None:
        self.repository = repository
        self.validator = validator
        self.planner = planner
        self.compiler = compiler

    def create(self, workflow: WorkflowSpec) -> WorkflowSpec:
        return self.repository.save_workflow(workflow)

    def update(self, workflow_id: str, workflow: WorkflowSpec) -> WorkflowSpec:
        workflow.id = workflow_id
        return self.repository.save_workflow(workflow)

    def get(self, workflow_id: str) -> WorkflowSpec | None:
        return self.repository.get_workflow(workflow_id)

    def validate(self, workflow: WorkflowSpec) -> ValidationResponse:
        response = self.validator.validate(workflow)
        workflow.status = "validated" if response.valid else "draft"
        self.repository.save_workflow(workflow)
        return response

    def compile(self, workflow: WorkflowSpec) -> CompileResponse:
        validation = self.validate(workflow)
        if not validation.valid:
            raise HTTPException(status_code=400, detail={"diagnostics": [item.model_dump() for item in validation.diagnostics]})
        plan = self.planner.build(workflow)
        script, explanation = self.compiler.compile(workflow, plan)
        workflow.status = "compiled"
        self.repository.save_workflow(workflow)
        return CompileResponse(workflow=workflow, plan=plan, script=script, diagnostics=validation.diagnostics, explanation=explanation + plan.notes)

