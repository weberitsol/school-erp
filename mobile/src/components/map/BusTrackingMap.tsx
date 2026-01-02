/**
 * Bus Tracking Map Component - Real-time bus location on map
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

export interface MapStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'PICKUP' | 'DROP' | 'BOTH';
}

export interface BusTrackingMapProps {
  busLatitude: number;
  busLongitude: number;
  pickupStop?: MapStop;
  dropStop?: MapStop;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  parentLatitude?: number;
  parentLongitude?: number;
  onMapReady?: () => void;
}

export const BusTrackingMap = React.forwardRef<MapView, BusTrackingMapProps>(
  (
    {
      busLatitude,
      busLongitude,
      pickupStop,
      dropStop,
      routeCoordinates,
      parentLatitude,
      parentLongitude,
      onMapReady,
    },
    mapRef
  ) => {
    const bounceAnimRef = useRef(new Animated.Value(0));

    // Animate bus marker
    useEffect(() => {
      Animated.sequence([
        Animated.timing(bounceAnimRef.current, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimRef.current, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, [busLatitude, busLongitude]);

    const bounceStyle = {
      transform: [
        {
          scale: bounceAnimRef.current.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.2],
          }),
        },
      ],
    };

    const handleMapReady = () => {
      // Fit all markers in view
      if (mapRef && 'current' in mapRef && mapRef.current) {
        const coordinates = [
          { latitude: busLatitude, longitude: busLongitude },
        ];

        if (pickupStop) {
          coordinates.push({
            latitude: pickupStop.latitude,
            longitude: pickupStop.longitude,
          });
        }

        if (dropStop) {
          coordinates.push({
            latitude: dropStop.latitude,
            longitude: dropStop.longitude,
          });
        }

        if (coordinates.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(coordinates, {
              edgePadding: {
                top: 100,
                right: 100,
                bottom: 100,
                left: 100,
              },
              animated: true,
            });
          }, 500);
        }
      }

      onMapReady?.();
    };

    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: busLatitude,
            longitude: busLongitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onMapReady={handleMapReady}
        >
          {/* Route polyline */}
          {routeCoordinates && routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#3B82F6"
              strokeWidth={3}
              lineDashPattern={[5, 5]}
              geodesic
            />
          )}

          {/* Bus marker */}
          <Marker
            coordinate={{
              latitude: busLatitude,
              longitude: busLongitude,
            }}
            title="Bus Location"
            description="Current position"
          >
            <Animated.View style={bounceStyle}>
              <View style={styles.busMarker}>
                <MaterialIcons name="directions-bus" size={24} color="#FFFFFF" />
              </View>
            </Animated.View>
          </Marker>

          {/* Pickup stop marker */}
          {pickupStop && (
            <Marker
              coordinate={{
                latitude: pickupStop.latitude,
                longitude: pickupStop.longitude,
              }}
              title="Pickup Stop"
              description={pickupStop.name}
            >
              <View style={styles.pickupMarker}>
                <MaterialIcons name="my-location" size={20} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Drop stop marker */}
          {dropStop && (
            <Marker
              coordinate={{
                latitude: dropStop.latitude,
                longitude: dropStop.longitude,
              }}
              title="Drop Stop"
              description={dropStop.name}
            >
              <View style={styles.dropMarker}>
                <MaterialIcons name="location-on" size={20} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Parent location marker (optional) */}
          {parentLatitude && parentLongitude && (
            <Marker
              coordinate={{
                latitude: parentLatitude,
                longitude: parentLongitude,
              }}
              title="Your Location"
              description="Parent location"
            >
              <View style={styles.parentMarker}>
                <MaterialIcons name="person-pin" size={20} color="#FFFFFF" />
              </View>
            </Marker>
          )}
        </MapView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  busMarker: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  pickupMarker: {
    width: 36,
    height: 36,
    backgroundColor: '#10B981',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  dropMarker: {
    width: 36,
    height: 36,
    backgroundColor: '#EF4444',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  parentMarker: {
    width: 36,
    height: 36,
    backgroundColor: '#F59E0B',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
});
