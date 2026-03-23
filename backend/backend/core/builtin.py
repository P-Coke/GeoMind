from __future__ import annotations

from .models import StepOutput, Template, WorkflowStep


def make_step(
    step_id: str,
    name: str,
    op: str,
    params: dict,
    inputs: list[str],
    outputs: list[tuple[str, str]],
) -> WorkflowStep:
    return WorkflowStep(
        id=step_id,
        name=name,
        op=op,  # type: ignore[arg-type]
        params=params,
        inputs=inputs,
        outputs=[StepOutput(name=output_name, dataType=data_type) for output_name, data_type in outputs],  # type: ignore[arg-type]
    )


BUILTIN_DATASETS = [
    {
        "id": "COPERNICUS/S2_SR_HARMONIZED",
        "name": "Sentinel-2 Surface Reflectance",
        "description": "High-resolution multispectral imagery with harmonized surface reflectance.",
        "provider": "gee",
        "bands": ["B2", "B3", "B4", "B8", "B11"],
        "defaultScale": 10,
    },
    {
        "id": "LANDSAT/LC09/C02/T1_L2",
        "name": "Landsat 9 Collection 2 L2",
        "description": "Landsat 9 Level 2 imagery for regional monitoring.",
        "provider": "gee",
        "bands": ["SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6"],
        "defaultScale": 30,
    },
]


BUILTIN_TEMPLATES = [
    Template(
        id="template_ndvi_monitoring",
        name="NDVI Monitoring",
        kind="built_in",
        description="Standard ROI-driven NDVI analysis with summary stats and export.",
        stepBlueprints=[
            make_step("roi-input", "ROI Input", "input", {"sourceType": "drawn_roi", "geometry": None}, [], [("roi", "FeatureCollection")]),
            make_step("dataset-input", "Dataset Input", "input", {"sourceType": "gee_collection", "datasetId": "COPERNICUS/S2_SR_HARMONIZED"}, [], [("imagery", "ImageCollection")]),
            make_step("filter-step", "Filter Collection", "filter", {"start": "2024-01-01", "end": "2024-12-31", "cloudMask": True}, ["imagery", "roi"], [("filtered_imagery", "ImageCollection")]),
            make_step("reduce-step", "Temporal Reduce", "temporal_reduce", {"reducer": "median"}, ["filtered_imagery"], [("composite_image", "Image")]),
            make_step("index-step", "Vegetation Index", "index", {"indexType": "NDVI"}, ["composite_image"], [("derived_index", "Image")]),
            make_step("stats-step", "Region Stats", "region_stats", {"reducer": "mean"}, ["derived_index", "roi"], [("summary_table", "Table")]),
            make_step("export-step", "Export Result", "export", {"format": "GeoTIFF"}, ["derived_index", "roi"], [("export_file", "File")]),
        ],
        parameterSchema={
            "datasetId": {"type": "string"},
            "indexType": {"type": "string", "enum": ["NDVI", "NDWI", "NDBI"]},
            "start": {"type": "string"},
            "end": {"type": "string"},
            "format": {"type": "string"},
        },
        defaults={
            "datasetId": "COPERNICUS/S2_SR_HARMONIZED",
            "indexType": "NDVI",
            "start": "2024-01-01",
            "end": "2024-12-31",
            "format": "GeoTIFF",
        },
    ),
    Template(
        id="template_ndwi_water",
        name="Water Surface Tracking",
        kind="built_in",
        description="NDWI-based surface water quick analysis.",
        stepBlueprints=[
            make_step("roi-input", "ROI Input", "input", {"sourceType": "drawn_roi", "geometry": None}, [], [("roi", "FeatureCollection")]),
            make_step("dataset-input", "Dataset Input", "input", {"sourceType": "gee_collection", "datasetId": "COPERNICUS/S2_SR_HARMONIZED"}, [], [("imagery", "ImageCollection")]),
            make_step("filter-step", "Filter Collection", "filter", {"start": "2024-04-01", "end": "2024-10-31", "cloudMask": True}, ["imagery", "roi"], [("filtered_imagery", "ImageCollection")]),
            make_step("reduce-step", "Temporal Reduce", "temporal_reduce", {"reducer": "median"}, ["filtered_imagery"], [("composite_image", "Image")]),
            make_step("index-step", "Water Index", "index", {"indexType": "NDWI"}, ["composite_image"], [("derived_index", "Image")]),
            make_step("stats-step", "Region Stats", "region_stats", {"reducer": "mean"}, ["derived_index", "roi"], [("summary_table", "Table")]),
            make_step("export-step", "Export Result", "export", {"format": "GeoTIFF"}, ["derived_index", "roi"], [("export_file", "File")]),
        ],
        parameterSchema={"indexType": {"type": "string", "enum": ["NDWI"]}},
        defaults={"indexType": "NDWI"},
    ),
]

