from __future__ import annotations

from ..core.models import Template
from ..storage.sqlite_repository import SqliteRepository


class TemplateService:
    def __init__(self, repository: SqliteRepository) -> None:
        self.repository = repository

    def create(self, template: Template) -> Template:
        return self.repository.save_template(template)

    def list(self) -> list[Template]:
        return self.repository.list_templates()

    def get(self, template_id: str) -> Template | None:
        return self.repository.get_template(template_id)

