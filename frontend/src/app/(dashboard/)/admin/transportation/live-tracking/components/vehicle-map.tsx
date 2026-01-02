'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  });
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  model?: string;
  status: string;
  type: string;
  location?: {
    latitude: number;
    longitude: number;
    speed: number;
    accuracy: number;
    timestamp: Date;
  };
  activeTrip?: any;
}

interface VehicleMapProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  wsConnected: boolean;
}

export default function VehicleMap({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  wsConnected,
}: VehicleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([40.7128, -74.0060], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      // Cleanup is handled by Next.js
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Update or create markers for each vehicle
    vehicles.forEach((vehicle) => {
      if (!vehicle.location) return;

      const { latitude, longitude } = vehicle.location;
      const key = vehicle.id;

      // Create or update marker
      if (markersRef.current[key]) {
        markersRef.current[key].setLatLng([latitude, longitude]);
      } else {
        // Create icon based on vehicle status
        const iconColor = getIconColor(vehicle.status, vehicle.activeTrip);
        const customIcon = L.divIcon({
          html: `
            <div style="
              background: ${iconColor};
              border: 3px solid white;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: white;
              font-size: 12px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
              🚌
            </div>
          `,
          className: 'vehicle-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        const marker = L.marker([latitude, longitude], { icon: customIcon })
          .bindPopup(`
            <div style="font-size: 12px;">
              <strong>${vehicle.registrationNumber}</strong><br/>
              <span>${vehicle.status}</span><br/>
              <span>Speed: ${vehicle.location.speed.toFixed(1)} km/h</span>
              ${vehicle.activeTrip ? `<br/><span>Route: ${vehicle.activeTrip.route?.name || 'N/A'}</span>` : ''}
            </div>
          `)
          .on('click', () => onSelectVehicle(vehicle))
          .addTo(map);

        markersRef.current[key] = marker;
      }

      // Highlight selected vehicle
      if (selectedVehicle?.id === vehicle.id) {
        markersRef.current[key].openPopup();
      }
    });

    // Remove markers for vehicles no longer in the list
    Object.keys(markersRef.current).forEach((key) => {
      if (!vehicles.find((v) => v.id === key)) {
        map.removeLayer(markersRef.current[key]);
        delete markersRef.current[key];
      }
    });

    // Auto-center on selected vehicle
    if (selectedVehicle?.location) {
      map.setView([selectedVehicle.location.latitude, selectedVehicle.location.longitude], 15);
    } else if (vehicles.length > 0) {
      // Fit all vehicles in view
      const bounds = L.latLngBounds(
        vehicles
          .filter((v) => v.location)
          .map((v) => [v.location!.latitude, v.location!.longitude])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [vehicles, selectedVehicle, onSelectVehicle]);

  const getIconColor = (status: string, hasTrip: boolean): string => {
    if (!hasTrip) return '#9CA3AF'; // Gray - idle
    switch (status) {
      case 'ACTIVE':
        return '#10B981'; // Green - active
      case 'MAINTENANCE':
        return '#EAB308'; // Yellow - maintenance
      case 'OUT_OF_SERVICE':
        return '#EF4444'; // Red - out of service
      default:
        return '#6366F1'; // Indigo - default
    }
  };

  return <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 0 }} />;
}
