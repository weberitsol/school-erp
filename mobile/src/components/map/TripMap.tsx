/**
 * TripMap Component - React Native Maps display with stops and route
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { Trip, RouteStop } from '../../types/api.types';
import * as Location from 'expo-location';

interface TripMapProps {
  trip: Trip;
  currentLocation?: Location.LocationObject | null;
  isLoading?: boolean;
}

export function TripMap({ trip, currentLocation, isLoading = false }: TripMapProps) {
  const mapRef = React.useRef<MapView>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [mapReady, setMapReady] = useState(false);

  // Build route polyline from stops
  useEffect(() => {
    if (trip.route?.stops && trip.route.stops.length > 0) {
      const coordinates = trip.route.stops
        .sort((a, b) => (a as RouteStop).sequence - (b as RouteStop).sequence)
        .map((stop: any) => ({
          latitude: stop.stop?.latitude || 0,
          longitude: stop.stop?.longitude || 0,
        }))
        .filter((coord) => coord.latitude !== 0 && coord.longitude !== 0);

      setRouteCoordinates(coordinates);
    }
  }, [trip.route?.stops]);

  // Animate to current location when it updates
  useEffect(() => {
    if (mapReady && currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [currentLocation, mapReady]);

  // Calculate initial region from stops
  const getInitialRegion = () => {
    if (routeCoordinates.length === 0 && currentLocation) {
      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    if (routeCoordinates.length === 0) {
      // Default region (somewhere in India)
      return {
        latitude: 28.6139,
        longitude: 77.2090,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
    }

    // Calculate bounds from all stops
    const lats = routeCoordinates.map((c) => c.latitude);
    const lons = routeCoordinates.map((c) => c.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    const latDelta = (maxLat - minLat) * 1.3;
    const lonDelta = (maxLon - minLon) * 1.3;

    return {
      latitude: centerLat,
      longitude: centerLon,
      latitudeDelta: Math.max(latDelta, 0.1),
      longitudeDelta: Math.max(lonDelta, 0.1),
    };
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation={false}
        showsMyLocationButton={true}
        onMapReady={() => setMapReady(true)}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {/* Route polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#3B82F6"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
            geodesic
          />
        )}

        {/* Current driver location */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            title="Your Location"
            description="Current vehicle position"
            pinColor="#3B82F6"
          />
        )}

        {/* Route stops */}
        {trip.route?.stops &&
          trip.route.stops.map((stop: any, index: number) => {
            const stopData = stop.stop || stop;
            if (!stopData.latitude || !stopData.longitude) return null;

            const isPickup = stopData.stopType === 'PICKUP' || stopData.stopType === 'BOTH';
            const isDrop = stopData.stopType === 'DROP' || stopData.stopType === 'BOTH';

            return (
              <View key={stop.id || index}>
                {/* Pickup stop marker */}
                {isPickup && (
                  <Marker
                    coordinate={{
                      latitude: stopData.latitude,
                      longitude: stopData.longitude,
                    }}
                    title={`Pickup: ${stopData.name}`}
                    description={stopData.address}
                    pinColor="#10B981"
                  />
                )}

                {/* Drop stop marker */}
                {isDrop && (
                  <Marker
                    coordinate={{
                      latitude: stopData.latitude,
                      longitude: stopData.longitude,
                    }}
                    title={`Dropoff: ${stopData.name}`}
                    description={stopData.address}
                    pinColor="#EF4444"
                  />
                )}
              </View>
            );
          })}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <LegendText text="Your Location" />
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <LegendText text="Pickup Stop" />
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <LegendText text="Drop Stop" />
        </View>
      </View>
    </View>
  );
}

function LegendText({ text }: { text: string }) {
  return <>{text}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: '90%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
