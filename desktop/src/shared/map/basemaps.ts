import type { BasemapProviderDefinition, BasemapVariantDefinition } from "../types";

export type BasemapId = string;

export const basemapProviders: BasemapProviderDefinition[] = [
  {
    id: "google",
    name: "Google",
    variants: [
      {
        id: "imagery",
        name: "Google Imagery",
        styleType: "imagery",
        urlTemplate: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        attribution: "Google",
      },
      {
        id: "vector",
        name: "Google Vector",
        styleType: "vector",
        urlTemplate: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        attribution: "Google",
      },
    ],
  },
  {
    id: "esri",
    name: "Esri",
    variants: [
      {
        id: "imagery",
        name: "Esri Imagery",
        styleType: "imagery",
        urlTemplate: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
      },
      {
        id: "vector",
        name: "Esri Light Gray",
        styleType: "vector",
        urlTemplate: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
      },
    ],
  },
  {
    id: "amap",
    name: "AMap",
    variants: [
      {
        id: "imagery",
        name: "AMap Imagery",
        styleType: "imagery",
        urlTemplate: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
        attribution: "AMap",
      },
      {
        id: "vector",
        name: "AMap Vector",
        styleType: "vector",
        urlTemplate: "https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
        attribution: "AMap",
      },
    ],
  },
];

export function findBasemapVariant(providerId: string, variantId: string): BasemapVariantDefinition | undefined {
  return basemapProviders.find((provider) => provider.id === providerId)?.variants.find((variant) => variant.id === variantId);
}
