import { useEffect, useRef } from "react";
import GeoJSON from "ol/format/GeoJSON";
import Graticule from "ol/layer/Graticule";
import OlMap from "ol/Map";
import View from "ol/View";
import Draw from "ol/interaction/Draw";
import VectorLayer from "ol/layer/Vector";
import type BaseLayer from "ol/layer/Base";
import type { Feature } from "ol";
import type { Geometry } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { createEmpty, extend as extendExtent } from "ol/extent";
import VectorSource from "ol/source/Vector";
import { Stroke } from "ol/style";
import { createMapLayer, updateMapLayer } from "../map/layerAdapters";
import type { LayerNode } from "../types";

export function MapPanel(props: {
  layers: LayerNode[];
  onRoiChange: (geojson: string) => void;
}) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<OlMap | null>(null);
  const drawLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const runtimeLayersRef = useRef<globalThis.Map<string, BaseLayer>>(new globalThis.Map());
  const onRoiChangeRef = useRef(props.onRoiChange);

  useEffect(() => {
    onRoiChangeRef.current = props.onRoiChange;
  }, [props.onRoiChange]);

  useEffect(() => {
    if (!mapElement.current) {
      return;
    }

    const drawSource = new VectorSource();
    const drawLayer = new VectorLayer({ source: drawSource });
    drawLayerRef.current = drawLayer;

    const map = new OlMap({
      target: mapElement.current,
      layers: [
        new Graticule({ strokeStyle: new Stroke({ color: "rgba(79, 104, 144, 0.18)", width: 1 }) }),
        drawLayer
      ],
      view: new View({ center: fromLonLat([105, 35]), zoom: 4 })
    });

    const draw = new Draw({ source: drawSource, type: "Polygon" });
    draw.on("drawend", (event) => {
      drawSource.clear();
      drawSource.addFeature(event.feature);
      const feature = event.feature as Feature<Geometry>;
      const geojson = new GeoJSON().writeFeature(feature, {
        featureProjection: "EPSG:3857",
        dataProjection: "EPSG:4326"
      });
      onRoiChangeRef.current(geojson);
    });
    map.addInteraction(draw);

    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => {
      map.updateSize();
    });
    resizeObserver.observe(mapElement.current);

    return () => {
      resizeObserver.disconnect();
      map.setTarget(undefined);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const runtimeLayers = runtimeLayersRef.current;
    const currentIds = new Set(props.layers.map((layer) => layer.id));

    for (const [layerId, runtimeLayer] of runtimeLayers.entries()) {
      if (!currentIds.has(layerId)) {
        map.removeLayer(runtimeLayer);
        runtimeLayers.delete(layerId);
      }
    }

    props.layers.forEach((layer) => {
      const existing = runtimeLayers.get(layer.id);
      if (existing) {
        updateMapLayer(existing, layer);
        return;
      }
      const runtimeLayer = createMapLayer(layer);
      if (!runtimeLayer) {
        return;
      }
      updateMapLayer(runtimeLayer, layer);
      map.getLayers().insertAt(layer.kind === "base" ? 0 : map.getLayers().getLength() - 1, runtimeLayer);
      runtimeLayers.set(layer.id, runtimeLayer);
    });
    map.updateSize();
  }, [props.layers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const localRoiLayer = props.layers.find((layer) => layer.kind === "local" && typeof layer.metadata?.geojson === "string");
    if (!localRoiLayer?.metadata?.geojson) {
      return;
    }
    const features = new GeoJSON().readFeatures(localRoiLayer.metadata.geojson as string, {
      featureProjection: "EPSG:3857",
      dataProjection: "EPSG:4326",
    });
    if (features.length === 0) {
      return;
    }
    const extent = createEmpty();
    features.forEach((feature) => {
      const geometry = feature.getGeometry();
      if (geometry) {
        extendExtent(extent, geometry.getExtent());
      }
    });
    map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 250, maxZoom: 13 });
  }, [props.layers]);

  return (
    <div ref={mapElement} className="map-panel" data-testid="map-panel" />
  );
}
