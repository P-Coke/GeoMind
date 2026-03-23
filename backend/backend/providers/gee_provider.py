from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import requests

from ..auth.manager import GEEAuthManager
from ..core.builtin import BUILTIN_DATASETS
from ..core.models import Artifact, ExecutionPlan, GeeAuthStatus, WorkflowSpec, utc_now

try:
    import ee
except ImportError:  # pragma: no cover - depends on local environment
    ee = None


class GEEProvider:
    def __init__(self, auth_manager: GEEAuthManager, data_dir: Path) -> None:
        self.auth_manager = auth_manager
        self.data_dir = data_dir
        self.export_dir = data_dir / "exports"
        self.export_dir.mkdir(parents=True, exist_ok=True)

    def auth_status(self) -> GeeAuthStatus:
        return self.auth_manager.get_status()

    def datasets(self) -> list[dict]:
        return BUILTIN_DATASETS

    def run(self, workflow: WorkflowSpec, plan: ExecutionPlan, script: str) -> tuple[str, list[str], list[Artifact]]:
        status = self.auth_manager.get_status()
        if not status.authenticated or status.mode != "service_account" or ee is None:
            logs, artifacts = self._fallback_run(workflow, plan, script, status)
            return "completed", logs, artifacts

        try:
            self._initialize_ee()
            context = self._build_context(workflow)
            target_image, vis_params = self._build_target_image(context)
            logs = [
                f"[{utc_now()}] Prepared plan {plan.id} for workflow {workflow.name}.",
                f"[{utc_now()}] Planner version: {plan.plannerVersion}.",
                f"[{utc_now()}] Auth mode: {status.mode}.",
                f"[{utc_now()}] Dataset: {context['datasetId']}.",
                f"[{utc_now()}] Export destination: {context['destination']}.",
            ]
            artifacts = [self._create_map_tile_artifact(workflow, target_image, vis_params)]
            export_artifact = self._export_artifact(workflow, target_image, context)
            if export_artifact is not None:
                artifacts.append(export_artifact)
            logs.append(f"[{utc_now()}] Real GEE execution completed.")
            return "completed", logs, artifacts
        except Exception as exc:  # pragma: no cover - depends on live EE
            logs = [
                f"[{utc_now()}] Real GEE execution failed.",
                f"[{utc_now()}] {exc}",
            ]
            return "failed", logs, []

    def _initialize_ee(self) -> None:
        config = self.auth_manager.get_service_account_config()
        credentials_path = config.get("credentialsPath")
        project_id = config.get("projectId")
        account_email = config.get("accountEmail")
        if not credentials_path or not project_id or not account_email:
            raise RuntimeError("Service account configuration is incomplete.")
        credentials = ee.ServiceAccountCredentials(account_email, credentials_path)
        ee.Initialize(credentials=credentials, project=project_id)

    def _build_context(self, workflow: WorkflowSpec) -> dict[str, Any]:
        roi_step = next((step for step in workflow.steps if step.op == "input" and step.params.get("sourceType") in {"drawn_roi", "uploaded_geojson", "uploaded_shapefile"}), None)
        dataset_step = next((step for step in workflow.steps if step.op == "input" and step.params.get("sourceType") == "gee_collection"), None)
        filter_step = next((step for step in workflow.steps if step.op == "filter"), None)
        reduce_step = next((step for step in workflow.steps if step.op == "temporal_reduce"), None)
        index_step = next((step for step in workflow.steps if step.op == "index"), None)
        export_step = next((step for step in workflow.steps if step.op == "export"), None)

        geometry_payload = roi_step.params.get("geometry") if roi_step else workflow.bindings.get("roiGeoJson", "")
        if not geometry_payload:
            raise RuntimeError("ROI geometry is missing.")
        dataset_id = dataset_step.params.get("datasetId") if dataset_step else workflow.bindings.get("datasetId", "COPERNICUS/S2_SR_HARMONIZED")
        start = filter_step.params.get("start") if filter_step else workflow.bindings.get("start", "2024-01-01")
        end = filter_step.params.get("end") if filter_step else workflow.bindings.get("end", "2024-12-31")
        reducer = reduce_step.params.get("reducer") if reduce_step else "median"
        destination = export_step.params.get("destination") if export_step else workflow.bindings.get("destination", "local_download")
        filename = export_step.params.get("filename") if export_step else workflow.name.replace(" ", "_")
        scale = int(export_step.params.get("scale", 10)) if export_step else 10
        render_preset = export_step.params.get("renderPreset") if export_step else workflow.bindings.get("renderPreset", "")
        index_type = index_step.params.get("indexType") if index_step else workflow.bindings.get("indexType")

        geometry = json.loads(geometry_payload) if isinstance(geometry_payload, str) else geometry_payload
        return {
            "geometry": geometry,
            "datasetId": dataset_id,
            "start": start,
            "end": end,
            "reducer": reducer,
            "destination": destination,
            "filename": filename,
            "scale": scale,
            "renderPreset": render_preset,
            "indexType": index_type,
        }

    def _build_target_image(self, context: dict[str, Any]):
        roi = ee.FeatureCollection(context["geometry"]).geometry()
        collection = ee.ImageCollection(context["datasetId"]).filterDate(context["start"], context["end"]).filterBounds(roi)
        image = getattr(collection, context["reducer"])().clip(roi)

        if context.get("indexType") == "NDVI":
            target_image = image.normalizedDifference(["B8", "B4"]).rename("NDVI")
            vis_params = {"min": -0.2, "max": 0.8, "palette": ["#8b0000", "#fdd835", "#1b5e20"]}
        elif context.get("indexType") == "NDWI":
            target_image = image.normalizedDifference(["B3", "B8"]).rename("NDWI")
            vis_params = {"min": -0.2, "max": 0.8, "palette": ["#5e35b1", "#42a5f5", "#e3f2fd"]}
        elif context.get("indexType") == "NDBI":
            target_image = image.normalizedDifference(["B11", "B8"]).rename("NDBI")
            vis_params = {"min": -0.4, "max": 0.4, "palette": ["#263238", "#fb8c00", "#ffcc80"]}
        else:
            target_image = image.select(["B4", "B3", "B2"])
            vis_params = {"bands": ["B4", "B3", "B2"], "min": 0, "max": 3000}

        return target_image, vis_params

    def _create_map_tile_artifact(self, workflow: WorkflowSpec, image, vis_params: dict[str, Any]) -> Artifact:
        map_id = image.getMapId(vis_params)
        tile_url = map_id["tile_fetcher"].url_format
        band_combination = vis_params.get("bands", [workflow.bindings.get("indexType", "derived")])
        return Artifact(
            runId="pending",
            type="map_tile",
            pathOrUri=tile_url,
            previewMetadata={
                "layerName": workflow.name,
                "visParams": vis_params,
                "bandCombination": band_combination,
            },
        )

    def _export_artifact(self, workflow: WorkflowSpec, image, context: dict[str, Any]) -> Artifact | None:
        roi = ee.FeatureCollection(context["geometry"]).geometry()
        filename = str(context["filename"])
        scale = int(context["scale"])

        if context["destination"] == "google_drive":
            task = ee.batch.Export.image.toDrive(
                image=image,
                description=filename,
                folder="GeoMind",
                region=roi,
                scale=scale,
                maxPixels=1e13,
                fileFormat="GeoTIFF",
            )
            task.start()
            return Artifact(
                runId="pending",
                type="export_task",
                pathOrUri=f"gee://drive/{filename}",
                previewMetadata={
                    "taskId": task.id,
                    "description": filename,
                    "destination": "google_drive",
                    "status": "submitted",
                },
            )

        download_url = image.getDownloadURL({
            "name": filename,
            "scale": scale,
            "region": roi.toGeoJSONString(),
            "format": "GEO_TIFF",
        })
        target_path = self.export_dir / f"{filename}.zip"
        response = requests.get(download_url, timeout=120)
        response.raise_for_status()
        target_path.write_bytes(response.content)
        return Artifact(
            runId="pending",
            type="download_file",
            pathOrUri=str(target_path),
            previewMetadata={
                "fileName": target_path.name,
                "destination": "local_download",
                "renderPreset": context.get("renderPreset") or "true_color",
            },
        )

    def _fallback_run(self, workflow: WorkflowSpec, plan: ExecutionPlan, script: str, status: GeeAuthStatus) -> tuple[list[str], list[Artifact]]:
        logs = [
            f"[{utc_now()}] Prepared plan {plan.id} for workflow {workflow.name}.",
            f"[{utc_now()}] Planner version: {plan.plannerVersion}.",
            f"[{utc_now()}] Operations: {', '.join(item.action for item in plan.operations)}.",
            f"[{utc_now()}] Auth mode: {status.mode}.",
            f"[{utc_now()}] Falling back to local preview because real GEE execution is unavailable.",
            f"[{utc_now()}] Script length: {len(script)} characters.",
        ]
        artifacts = [
            Artifact(
                runId="pending",
                type="map_tile",
                pathOrUri="",
                previewMetadata={
                    "layerName": workflow.name,
                    "visParams": {"bands": ["B4", "B3", "B2"], "min": 0, "max": 3000},
                    "bandCombination": ["B4", "B3", "B2"],
                },
            ),
            Artifact(
                runId="pending",
                type="download_file",
                pathOrUri="",
                previewMetadata={
                    "fileName": f"{workflow.name.replace(' ', '_')}.zip",
                    "destination": "local_download",
                    "placeholder": True,
                },
            ),
        ]
        return logs, artifacts
