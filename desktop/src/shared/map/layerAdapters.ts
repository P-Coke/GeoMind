import GeoJSON from "ol/format/GeoJSON";
import type BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import type { Feature } from "ol";
import type { Geometry } from "ol/geom";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import { Fill, Stroke, Style } from "ol/style";
import { findBasemapVariant } from "./basemaps";
import type { LayerNode } from "../types";

const roiStyle = new Style({
  stroke: new Stroke({ color: "#1a73e8", width: 2 }),
  fill: new Fill({ color: "rgba(26, 115, 232, 0.12)" })
});

const eePreviewStyle = new Style({
  stroke: new Stroke({ color: "#188038", width: 2 }),
  fill: new Fill({ color: "rgba(24, 128, 56, 0.16)" })
});

function readFeatures(geojson: string): Feature<Geometry>[] {
  return new GeoJSON().readFeatures(geojson, {
    featureProjection: "EPSG:3857",
    dataProjection: "EPSG:4326"
  });
}

function createVectorLayer(layer: LayerNode, style: Style) {
  const source = new VectorSource();
  const geojson = typeof layer.metadata?.geojson === "string" ? layer.metadata.geojson : "";
  if (geojson) {
    source.addFeatures(readFeatures(geojson));
  }
  return new VectorLayer({
    source,
    style
  });
}

export function createMapLayer(layer: LayerNode): BaseLayer | null {
  if (layer.kind === "base") {
    const basemapConfig = layer.metadata?.basemap;
    if (!basemapConfig) {
      return null;
    }
    const basemap = findBasemapVariant(basemapConfig.providerId, basemapConfig.variantId);
    if (!basemap) {
      return null;
    }
    return new TileLayer({
      source: new XYZ({
        url: basemapConfig.urlTemplate || basemap.urlTemplate,
        attributions: basemap.attribution,
        crossOrigin: "anonymous"
      })
    });
  }

  if (layer.kind === "local") {
    return createVectorLayer(layer, roiStyle);
  }

  if (layer.kind === "ee") {
    if (typeof layer.metadata?.eeRender?.tileUrl === "string") {
      return new TileLayer({
        source: new XYZ({
          url: layer.metadata.eeRender.tileUrl as string,
          crossOrigin: "anonymous"
        })
      });
    }
    return createVectorLayer(layer, eePreviewStyle);
  }

  return null;
}

export function updateMapLayer(runtimeLayer: BaseLayer, layer: LayerNode) {
  runtimeLayer.setVisible(layer.visible);
  runtimeLayer.setOpacity(layer.opacity);

  if (runtimeLayer instanceof VectorLayer) {
    const source = runtimeLayer.getSource();
    const geojson = typeof layer.metadata?.geojson === "string" ? layer.metadata.geojson : "";
    if (source && geojson) {
      source.clear(true);
      source.addFeatures(readFeatures(geojson));
    }
  }

  if (runtimeLayer instanceof TileLayer && typeof layer.metadata?.eeRender?.tileUrl === "string") {
    const source = runtimeLayer.getSource();
    if (source instanceof XYZ && source.getUrls()?.[0] !== layer.metadata.eeRender.tileUrl) {
      runtimeLayer.setSource(new XYZ({ url: layer.metadata.eeRender.tileUrl as string, crossOrigin: "anonymous" }));
    }
  }
}
