from __future__ import annotations

import csv
import json
import tempfile
import zipfile
from pathlib import Path

import shapefile


class LocalPythonProvider:
    def describe_input(self, path: str) -> dict:
        input_path = Path(path)
        if not input_path.exists():
            return {"exists": False, "path": str(input_path)}

        suffix = input_path.suffix.lower()
        base = {"exists": True, "path": str(input_path), "size": input_path.stat().st_size}
        if suffix in {".geojson", ".json"}:
            payload = json.loads(input_path.read_text(encoding="utf-8"))
            return {
                **base,
                "kind": "vector",
                "type": payload.get("type"),
                "featureCount": len(payload.get("features", [])),
            }
        if suffix == ".csv":
            with input_path.open("r", encoding="utf-8", newline="") as handle:
                rows = list(csv.reader(handle))
            return {
                **base,
                "kind": "table",
                "rows": max(0, len(rows) - 1),
                "columns": rows[0] if rows else [],
            }
        return {**base, "kind": "raster_or_binary", "suffix": suffix}

    def extract_roi(self, path: str) -> dict:
        input_path = Path(path)
        if not input_path.exists():
            raise FileNotFoundError(f"ROI file not found: {input_path}")

        suffix = input_path.suffix.lower()
        if suffix in {".geojson", ".json"}:
            payload = json.loads(input_path.read_text(encoding="utf-8"))
            feature_count = len(payload.get("features", [])) if payload.get("type") == "FeatureCollection" else 1
            return {
                "fileName": input_path.name,
                "sourceType": "uploaded_geojson",
                "filePath": str(input_path),
                "featureCount": feature_count,
                "geojson": json.dumps(payload, ensure_ascii=False),
                "metadata": {
                    "kind": "vector",
                    "type": payload.get("type"),
                    "featureCount": feature_count,
                },
            }
        if suffix == ".zip":
            return self._extract_shapefile_zip(input_path)
        raise ValueError(f"Unsupported ROI file format: {suffix}")

    def _extract_shapefile_zip(self, input_path: Path) -> dict:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            with zipfile.ZipFile(input_path) as archive:
                archive.extractall(temp_path)

            shp_files = list(temp_path.rglob("*.shp"))
            if not shp_files:
                raise ValueError("Shapefile ZIP must contain a .shp file.")

            shp_path = shp_files[0]
            reader = shapefile.Reader(str(shp_path))
            features: list[dict] = []
            field_names = [field[0] for field in reader.fields[1:]]
            for shape_record in reader.iterShapeRecords():
                geometry = shape_record.shape.__geo_interface__
                properties = dict(zip(field_names, shape_record.record))
                features.append({
                    "type": "Feature",
                    "geometry": geometry,
                    "properties": properties,
                })

            feature_collection = {
                "type": "FeatureCollection",
                "features": features,
            }
            return {
                "fileName": input_path.name,
                "sourceType": "uploaded_shapefile",
                "filePath": str(input_path),
                "featureCount": len(features),
                "geojson": json.dumps(feature_collection, ensure_ascii=False),
                "metadata": {
                    "kind": "vector",
                    "type": "FeatureCollection",
                    "featureCount": len(features),
                },
            }
