"use client";

import { useCallback, useEffect, useRef } from "react";
import Supercluster from "supercluster";
import type { Map as MLMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { formatEuro } from "@/components/space-card";
import { allInHourlyCents } from "@/lib/price";
import type { SpaceDto } from "@/lib/types/space";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const AMSTERDAM_CENTER: [number, number] = [4.9041, 52.3676];

interface MapViewProps {
  spaces: SpaceDto[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function MapView({ spaces, selectedId, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const stateRef = useRef({ spaces, selectedId, onSelect });

  const renderMarkers = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];

    const { spaces, selectedId } = stateRef.current;
    if (!spaces.length) return;

    const features = spaces.map((space) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [space.lng, space.lat],
      },
      properties: {
        id: space.id,
        price: allInHourlyCents(space.hourlyPriceCents),
        selected: space.id === selectedId,
      },
    }));

    const index = new Supercluster({ radius: 55, maxZoom: 16, minPoints: 2 });
    index.load(features as unknown as Parameters<Supercluster["load"]>[0]);

    const bounds = map.getBounds();
    const clusters = index.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      Math.floor(map.getZoom())
    );

    const maplibregl = await import("maplibre-gl");

    for (const cluster of clusters) {
      const { geometry, properties } = cluster as unknown as {
        geometry: { coordinates: [number, number] };
        properties: Record<string, unknown>;
      };
      const element = document.createElement("button");
      element.type = "button";

      if (properties.cluster) {
        element.textContent = String(properties.point_count);
        element.className =
          "flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-sm font-semibold text-white shadow-lg ring-2 ring-white hover:bg-navy-700";
        element.addEventListener("click", () => {
          const expansion = index.getClusterExpansionZoom(Number(properties.cluster_id));
          map.easeTo({ center: geometry.coordinates, zoom: expansion });
        });
      } else {
        const isSelected = properties.selected === true;
        element.textContent = formatEuro(Number(properties.price));
        element.className = isSelected
          ? "rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-navy-900 shadow-lg ring-2 ring-white"
          : "rounded-full bg-white px-3 py-1.5 text-sm font-bold text-navy-900 shadow-lg ring-1 ring-navy-200 hover:bg-navy-50";
        element.addEventListener("click", () => {
          stateRef.current.onSelect(Number(properties.id));
        });
      }

      markersRef.current.push(
        new maplibregl.Marker({ element }).setLngLat(geometry.coordinates).addTo(map)
      );
    }
  }, []);

  useEffect(() => {
    stateRef.current = { spaces, selectedId, onSelect };
    if (mapRef.current) void renderMarkers();
  }, [spaces, selectedId, onSelect, renderMarkers]);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (disposed || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: AMSTERDAM_CENTER,
        zoom: 11,
        attributionControl: { compact: true },
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      map.on("load", () => void renderMarkers());
      map.on("moveend", () => void renderMarkers());
      map.on("zoomend", () => void renderMarkers());

      mapRef.current = map;
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [renderMarkers]);

  return <div ref={containerRef} className="h-full w-full" />;
}