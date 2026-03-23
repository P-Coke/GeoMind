from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


DiagnosticSeverity = Literal["error", "warning", "info"]


class Diagnostic(BaseModel):
    code: str
    message: str
    severity: DiagnosticSeverity
    stepId: str | None = None
    fieldPath: str | None = None


class DiagnosticBundle(BaseModel):
    diagnostics: list[Diagnostic] = Field(default_factory=list)

    @property
    def errors(self) -> list[Diagnostic]:
        return [item for item in self.diagnostics if item.severity == "error"]

    @property
    def valid(self) -> bool:
        return not self.errors

    def add(
        self,
        code: str,
        message: str,
        severity: DiagnosticSeverity = "error",
        step_id: str | None = None,
        field_path: str | None = None,
    ) -> None:
        self.diagnostics.append(
            Diagnostic(
                code=code,
                message=message,
                severity=severity,
                stepId=step_id,
                fieldPath=field_path,
            )
        )

