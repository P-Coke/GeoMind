from __future__ import annotations

from dataclasses import dataclass

from .models import DataType, StepOp


@dataclass(frozen=True)
class OperationDefinition:
    op: StepOp
    required_params: tuple[str, ...]
    allowed_input_types: tuple[DataType, ...]
    allowed_output_types: tuple[DataType, ...]


OPERATION_REGISTRY: dict[StepOp, OperationDefinition] = {
    "input": OperationDefinition("input", ("sourceType",), (), ("ImageCollection", "FeatureCollection", "File", "Raster", "Table")),
    "filter": OperationDefinition("filter", (), ("ImageCollection", "FeatureCollection"), ("ImageCollection", "FeatureCollection")),
    "temporal_reduce": OperationDefinition("temporal_reduce", ("reducer",), ("ImageCollection",), ("Image",)),
    "index": OperationDefinition("index", ("indexType",), ("Image",), ("Image",)),
    "band_math": OperationDefinition("band_math", ("expression",), ("Image",), ("Image",)),
    "region_stats": OperationDefinition("region_stats", ("reducer",), ("Image", "FeatureCollection"), ("Table",)),
    "export": OperationDefinition("export", ("format",), ("Image", "FeatureCollection", "Table", "Raster"), ("File",)),
}
