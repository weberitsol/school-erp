'use client';

import { useEffect } from 'react';
import L from 'leaflet';

interface RouteStop {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
}

interface RoutePolylineProps {
  map: L.Map;
  stops: RouteStop[];
  color?: string;
}

export function RoutePolyline({ map, stops, color = '#3B82F6' }: RoutePolylineProps) {
  useEffect(() => {
    if (!stops || stops.length < 2) return;

    const coordinates = stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]);

    // Draw polyline
    const polyline = L.polyline(coordinates, {
      color,
      weight: 3,
      opacity: 0.7,
      dashArray: '5, 5',
    }).addTo(map);

    // Add stop markers
    stops.forEach((stop, index) => {
      const icon = L.divIcon({
        html: `
          <div style="
            background: white;
            border: 2px solid ${color};
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 11px;
            color: ${color};
          ">
            ${index + 1}
          </div>
        `,
        className: 'stop-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([stop.latitude, stop.longitude], { icon })
        .bindPopup(`<strong>${stop.name}</strong><br/>Stop ${index + 1}`)
        .addTo(map);
    });

    return () => {
      map.removeLayer(polyline);
    };
  }, [map, stops, color]);

  return null;
}
