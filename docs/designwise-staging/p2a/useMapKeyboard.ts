// src/hooks/useMapKeyboard.ts
// P2A-3: A11yWise — Keyboard navigation for Mapbox GL map
// Enables: arrow keys pan, +/- zoom, Tab cycle parcels, Enter select, Esc deselect

import { useCallback, useEffect, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';

interface UseMapKeyboardOptions {
  map: MapboxMap | null;
  parcels: Array<{ id: string; lng: number; lat: number }>;
  onParcelSelect: (parcelId: string) => void;
  onParcelDeselect: () => void;
  panAmount?: number;
  zoomAmount?: number;
}

export function useMapKeyboard({
  map,
  parcels,
  onParcelSelect,
  onParcelDeselect,
  panAmount = 100,
  zoomAmount = 1,
}: UseMapKeyboardOptions) {
  const focusedIndex = useRef(-1);
  const announcerRef = useRef<HTMLDivElement | null>(null);

  // Create ARIA live region for announcements
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    let announcer = document.getElementById('map-announcer') as HTMLDivElement;
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'map-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }
    announcerRef.current = announcer;

    return () => {
      announcer?.remove();
    };
  }, []);

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = message;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!map) return;

      // Only handle when map container or its children are focused
      const mapContainer = map.getContainer();
      if (!mapContainer.contains(document.activeElement)) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          map.panBy([0, -panAmount], { duration: 200 });
          announce('Panned north');
          break;

        case 'ArrowDown':
          e.preventDefault();
          map.panBy([0, panAmount], { duration: 200 });
          announce('Panned south');
          break;

        case 'ArrowLeft':
          e.preventDefault();
          map.panBy([-panAmount, 0], { duration: 200 });
          announce('Panned west');
          break;

        case 'ArrowRight':
          e.preventDefault();
          map.panBy([panAmount, 0], { duration: 200 });
          announce('Panned east');
          break;

        case '+':
        case '=':
          e.preventDefault();
          map.zoomIn({ duration: 200 });
          announce(`Zoomed in to level ${Math.round(map.getZoom() + zoomAmount)}`);
          break;

        case '-':
        case '_':
          e.preventDefault();
          map.zoomOut({ duration: 200 });
          announce(`Zoomed out to level ${Math.round(map.getZoom() - zoomAmount)}`);
          break;

        case 'Tab':
          if (parcels.length === 0) break;
          e.preventDefault();

          if (e.shiftKey) {
            focusedIndex.current = focusedIndex.current <= 0
              ? parcels.length - 1
              : focusedIndex.current - 1;
          } else {
            focusedIndex.current = focusedIndex.current >= parcels.length - 1
              ? 0
              : focusedIndex.current + 1;
          }

          const parcel = parcels[focusedIndex.current];
          if (parcel) {
            map.flyTo({
              center: [parcel.lng, parcel.lat],
              duration: 300,
            });
            announce(`Parcel ${focusedIndex.current + 1} of ${parcels.length}: ${parcel.id}`);
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex.current >= 0 && focusedIndex.current < parcels.length) {
            const selected = parcels[focusedIndex.current];
            if (selected) {
              onParcelSelect(selected.id);
              announce(`Selected parcel ${selected.id}`);
            }
          }
          break;

        case 'Escape':
          e.preventDefault();
          focusedIndex.current = -1;
          onParcelDeselect();
          announce('Selection cleared');
          break;
      }
    },
    [map, parcels, onParcelSelect, onParcelDeselect, panAmount, zoomAmount, announce]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Return ARIA props for the map container
  return {
    mapAriaProps: {
      role: 'application' as const,
      tabIndex: 0,
      'aria-label': 'Interactive zoning map. Use arrow keys to pan, plus and minus to zoom, Tab to cycle parcels, Enter to select, Escape to deselect.',
      'aria-roledescription': 'zoning map',
    },
  };
}
