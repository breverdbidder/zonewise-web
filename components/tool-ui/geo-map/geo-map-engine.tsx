/**
 * geo-map-engine: ZoneWise uses Mapbox (not Leaflet).
 * This is a stub so the module compiles. GeoMap renders a redirect to ExplorerMap.
 */
"use client";
import React from "react";

export function GeoMapEngine() {
  return (
    <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-slate-700 text-slate-500 text-sm">
      Map view — use Explorer for full Mapbox experience
    </div>
  );
}
