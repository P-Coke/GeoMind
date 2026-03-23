from __future__ import annotations

from pathlib import Path

from fastapi import HTTPException

from ..auth.manager import GEEAuthManager
from ..core.compiler.gee import GEECompiler
from ..core.models import Project, RunRecord, Template, WorkflowSpec
from ..core.planner import ExecutionPlanner
from ..core.validator import WorkflowValidator
from ..providers.gee_provider import GEEProvider
from ..providers.local_python_provider import LocalPythonProvider
from ..services.ai_service import AIService
from ..services.project_service import ProjectService
from ..services.run_service import RunService
from ..services.template_service import TemplateService
from ..services.workflow_service import WorkflowService
from ..storage.sqlite_repository import SqliteRepository


class Container:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = data_dir
        repository = SqliteRepository(data_dir / "gee_ai.sqlite3")
        validator = WorkflowValidator()
        planner = ExecutionPlanner()
        compiler = GEECompiler()
        auth_manager = GEEAuthManager(data_dir)
        gee_provider = GEEProvider(auth_manager, data_dir)
        local_provider = LocalPythonProvider()

        self.repository = repository
        self.auth_manager = auth_manager
        self.project_service = ProjectService(repository)
        self.template_service = TemplateService(repository)
        self.workflow_service = WorkflowService(repository, validator, planner, compiler)
        self.run_service = RunService(repository, self.workflow_service, gee_provider)
        self.ai_service = AIService(repository)
        self.gee_provider = gee_provider
        self.local_provider = local_provider


container = Container(Path(__file__).resolve().parents[3] / "data")


def require_project(project_id: str) -> Project:
    project = container.project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def require_workflow(workflow_id: str) -> WorkflowSpec:
    workflow = container.workflow_service.get(workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


def require_template(template_id: str) -> Template:
    template = container.template_service.get(template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


def require_run(run_id: str) -> RunRecord:
    run = container.run_service.get(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return run
