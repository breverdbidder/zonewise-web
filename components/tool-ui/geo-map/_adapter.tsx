/**
 * Adapter: geo-map uses Leaflet externally.
 * ZoneWise uses Mapbox — this adapter stubs the Leaflet exports so the
 * module tree compiles. The GeoMap component renders a placeholder pointing
 * to the ExplorerMap.
 */
export { cn } from "@/lib/utils";

// Stub Leaflet components — geo-map renders a Mapbox redirect instead
export const MapContainer = () => null;
export const TileLayer = () => null;
export const CircleMarker = () => null;
export const Marker = () => null;
export const Polyline = () => null;
export const Popup = () => null;
export const ZoomControl = () => null;
export const useMap = () => ({});
export const useMapEvents = () => ({});

// Tooltip stub (conflicts with shadcn Tooltip if re-exported from react-leaflet)
export const Tooltip = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

import React from "react";
