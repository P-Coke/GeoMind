from __future__ import annotations

from ..core.models import Project, utc_now
from ..storage.sqlite_repository import SqliteRepository


class ProjectService:
    def __init__(self, repository: SqliteRepository) -> None:
        self.repository = repository

    def create(self, project: Project) -> Project:
        project.updatedAt = utc_now()
        return self.repository.save_project(project)

    def update(self, project_id: str, project: Project) -> Project:
        project.id = project_id
        project.updatedAt = utc_now()
        return self.repository.save_project(project)

    def list(self) -> list[Project]:
        return self.repository.list_projects()

    def get(self, project_id: str) -> Project | None:
        return self.repository.get_project(project_id)

