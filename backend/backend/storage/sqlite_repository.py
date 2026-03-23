from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import TypeVar

from pydantic import BaseModel

from ..core.builtin import BUILTIN_TEMPLATES
from ..core.models import AIConfig, AssetRef, Project, RunRecord, ScriptUnit, Template, WorkflowDraft, WorkflowSpec

T = TypeVar("T", bound=BaseModel)


class SqliteRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
        self._seed_templates()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS workflows (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS ai_config (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS script_units (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS workflow_drafts (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS asset_refs (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                """
            )

    def _seed_templates(self) -> None:
        existing = {item.id for item in self.list_templates()}
        for template in BUILTIN_TEMPLATES:
            if template.id not in existing:
                self.save_template(template)

    def _save(self, table: str, model: BaseModel) -> None:
        with self._connect() as conn:
            conn.execute(
                f"INSERT OR REPLACE INTO {table} (id, payload) VALUES (?, ?)",
                (getattr(model, "id"), model.model_dump_json()),
            )

    def _get(self, table: str, item_id: str, model_type: type[T]) -> T | None:
        with self._connect() as conn:
            row = conn.execute(f"SELECT payload FROM {table} WHERE id = ?", (item_id,)).fetchone()
        if row is None:
            return None
        return model_type.model_validate(json.loads(row["payload"]))

    def _list(self, table: str, model_type: type[T]) -> list[T]:
        with self._connect() as conn:
            rows = conn.execute(f"SELECT payload FROM {table}").fetchall()
        return [model_type.model_validate(json.loads(row["payload"])) for row in rows]

    def save_project(self, project: Project) -> Project:
        self._save("projects", project)
        return project

    def get_project(self, project_id: str) -> Project | None:
        return self._get("projects", project_id, Project)

    def list_projects(self) -> list[Project]:
        return self._list("projects", Project)

    def save_template(self, template: Template) -> Template:
        self._save("templates", template)
        return template

    def get_template(self, template_id: str) -> Template | None:
        return self._get("templates", template_id, Template)

    def list_templates(self) -> list[Template]:
        return self._list("templates", Template)

    def save_workflow(self, workflow: WorkflowSpec) -> WorkflowSpec:
        self._save("workflows", workflow)
        return workflow

    def get_workflow(self, workflow_id: str) -> WorkflowSpec | None:
        return self._get("workflows", workflow_id, WorkflowSpec)

    def save_run(self, run: RunRecord) -> RunRecord:
        self._save("runs", run)
        return run

    def get_run(self, run_id: str) -> RunRecord | None:
        return self._get("runs", run_id, RunRecord)

    def list_runs(self) -> list[RunRecord]:
        return self._list("runs", RunRecord)

    def save_ai_config(self, config: AIConfig) -> AIConfig:
        with self._connect() as conn:
            conn.execute("INSERT OR REPLACE INTO ai_config (id, payload) VALUES (?, ?)", ("default", config.model_dump_json()))
        return config

    def get_ai_config(self) -> AIConfig | None:
        with self._connect() as conn:
            row = conn.execute("SELECT payload FROM ai_config WHERE id = ?", ("default",)).fetchone()
        if row is None:
            return None
        return AIConfig.model_validate(json.loads(row["payload"]))

    def save_script_unit(self, script_unit: ScriptUnit) -> ScriptUnit:
        self._save("script_units", script_unit)
        return script_unit

    def get_script_unit(self, script_unit_id: str) -> ScriptUnit | None:
        return self._get("script_units", script_unit_id, ScriptUnit)

    def list_script_units(self) -> list[ScriptUnit]:
        return self._list("script_units", ScriptUnit)

    def save_workflow_draft(self, draft: WorkflowDraft) -> WorkflowDraft:
        self._save("workflow_drafts", draft)
        return draft

    def get_workflow_draft(self, draft_id: str) -> WorkflowDraft | None:
        return self._get("workflow_drafts", draft_id, WorkflowDraft)

    def list_workflow_drafts(self) -> list[WorkflowDraft]:
        return self._list("workflow_drafts", WorkflowDraft)

    def save_asset_ref(self, asset_ref: AssetRef) -> AssetRef:
        self._save("asset_refs", asset_ref)
        return asset_ref

    def get_asset_ref(self, asset_ref_id: str) -> AssetRef | None:
        return self._get("asset_refs", asset_ref_id, AssetRef)

    def list_asset_refs(self, project_id: str | None = None) -> list[AssetRef]:
        items = self._list("asset_refs", AssetRef)
        if project_id is None:
            return items
        return [item for item in items if item.projectId in {None, project_id}]
