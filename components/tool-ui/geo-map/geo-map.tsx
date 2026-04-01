/**
 * GeoMap: ZoneWise uses Mapbox via ExplorerMap.
 * This component redirects to the explorer for full map functionality.
 */
"use client";
import React from "react";
import { cn } from "./_adapter";
import type { GeoMapProps } from "./schema";

export const GeoMap = React.memo(function GeoMap({ id, className }: Pick<GeoMapProps, "id" | "className">) {
  return (
    <div
      data-tool-ui-id={id}
      data-slot="geo-map"
      className={cn(
        "flex items-center justify-center min-h-48 rounded-xl border border-dashed text-muted-foreground text-sm",
        className,
      )}
    >
      Interactive map — <a href="/explorer" className="ml-1 underline text-[#F59E0B]">Open Explorer</a>
    </div>
  );
});
