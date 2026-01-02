'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Filter,
  Maximize2,
  ChevronDown,
  Zap,
  Clock,
  Users,
  Navigation,
  Phone,
  Gauge,
  Route,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { transportationApi, Vehicle, VehicleLocation, Trip } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useVehicleSocket } from '@/hooks/use-vehicle-socket';

// Dynamic import for map component
const VehicleMap = dynamic(() => import('./components/vehicle-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin mb-4">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

type StatusFilter = 'all' | 'active' | 'maintenance' | 'inactive';

interface VehicleWithLocation extends Vehicle {
  location?: VehicleLocation;
  activeTrip?: Trip;
  currentDriver?: any;
}

export default function LiveTrackingPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();
  const { isConnected: wsConnected, locationUpdates, getVehicleLocation } = useVehicleSocket(
    accessToken,
    true
  );

  const [vehicles, setVehicles] = useState<VehicleWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithLocation | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default NYC

  const loadVehicles = useCallback(async () => {
    if (!accessToken) return;

    try {
      setIsRefreshing(true);
      const response = await transportationApi.getVehicles(accessToken);

      if (response.success && response.data) {
        const vehiclesWithLocations = await Promise.all(
          response.data.map(async (vehicle: Vehicle) => {
            try {
              // Get location from WebSocket cache first, then fall back to API
              let location = getVehicleLocation(vehicle.id);
              if (!location) {
                const locationRes = await transportationApi.getVehicleLocation(
                  vehicle.id,
                  accessToken
                );
                location = locationRes.success ? locationRes.data : undefined;
              }

              const tripsRes = await transportationApi.getActiveTripsByVehicle(
                vehicle.id,
                accessToken
              );

              const activeTrip = tripsRes.success && tripsRes.data?.[0] ? tripsRes.data[0] : undefined;

              return {
                ...vehicle,
                location,
                activeTrip,
                currentDriver: activeTrip?.driver || undefined,
              };
            } catch (error) {
              return vehicle;
            }
          })
        );

        setVehicles(vehiclesWithLocations);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to load vehicles',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load vehicles',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [accessToken, toast, getVehicleLocation]);

  // Load initial data
  useEffect(() => {
    loadVehicles();

    if (autoRefresh) {
      const interval = setInterval(loadVehicles, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [loadVehicles, autoRefresh]);

  // Apply real-time location updates from WebSocket
  useEffect(() => {
    if (locationUpdates.size === 0) return;

    setVehicles((prevVehicles) =>
      prevVehicles.map((vehicle) => {
        const wsLocation = locationUpdates.get(vehicle.id);
        if (wsLocation) {
          return {
            ...vehicle,
            location: {
              ...wsLocation,
              timestamp: wsLocation.timestamp,
            } as any,
          };
        }
        return vehicle;
      })
    );
  }, [locationUpdates]);

  const filteredVehicles = vehicles.filter((v) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return v.status === 'ACTIVE' && v.activeTrip;
    if (statusFilter === 'maintenance') return v.status === 'MAINTENANCE';
    if (statusFilter === 'inactive') return v.status !== 'ACTIVE' || !v.activeTrip;
    return true;
  });

  const stats = {
    total: vehicles.length,
    active: vehicles.filter((v) => v.status === 'ACTIVE').length,
    onTrip: vehicles.filter((v) => v.activeTrip).length,
    maintenance: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'OUT_OF_SERVICE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpeedColor = (speed?: number): string => {
    if (!speed) return 'text-gray-600';
    if (speed > 60) return 'text-red-600';
    if (speed > 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Vehicle Tracking</h1>
          <p className="text-gray-600 mt-1">Real-time bus location and trip status monitoring</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadVehicles}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium',
              autoRefresh
                ? 'bg-blue-100 text-blue-800'
                : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            )}
          >
            <Zap className="w-4 h-4 mr-2" />
            Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Vehicles</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
            </div>
            <MapPin className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">On Trip</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.onTrip}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Maintenance</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.maintenance}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filter and Controls */}
      <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
        <div className="flex gap-2">
          {(['all', 'active', 'maintenance', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-lg">
          <div className="relative h-[500px] bg-gray-100">
            <VehicleMap
              vehicles={filteredVehicles as any}
              selectedVehicle={selectedVehicle as any}
              onSelectVehicle={(vehicle) => setSelectedVehicle(vehicle as VehicleWithLocation)}
              wsConnected={wsConnected}
            />
            {!wsConnected && (
              <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                WebSocket disconnected - Using polling
              </div>
            )}
          </div>
        </div>

        {/* Vehicle List */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 px-2">Vehicles</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No vehicles found</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className={cn(
                  'p-4 rounded-lg border-2 cursor-pointer transition-all',
                  selectedVehicle?.id === vehicle.id
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                )}
              >
                {/* Vehicle Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{vehicle.registrationNumber}</p>
                      <p className="text-xs text-gray-600">{vehicle.model}</p>
                    </div>
                    <span className={cn('text-xs font-semibold px-2 py-1 rounded', getStatusColor(vehicle.status))}>
                      {vehicle.status}
                    </span>
                  </div>

                  {/* Location Info */}
                  {vehicle.location && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {vehicle.location.latitude.toFixed(3)}, {vehicle.location.longitude.toFixed(3)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={cn('w-3 h-3', getSpeedColor(vehicle.location.speed))} />
                        <span className={getSpeedColor(vehicle.location.speed)}>
                          {vehicle.location.speed.toFixed(1)} km/h
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Trip Info */}
                  {vehicle.activeTrip && (
                    <div className="bg-blue-50 rounded p-2 text-xs text-blue-900">
                      <p className="font-medium">{vehicle.activeTrip.route.name}</p>
                      <p>
                        {vehicle.activeTrip.boardedCount}/{vehicle.activeTrip.studentCount} students boarded
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Vehicle Details */}
      {selectedVehicle && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                {selectedVehicle.registrationNumber}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{selectedVehicle.model || 'Bus'}</p>
            </div>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Vehicle Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Route className="w-4 h-4 text-gray-600" />
                <p className="text-xs font-semibold text-gray-600 uppercase">Type</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">{selectedVehicle.type}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-600" />
                <p className="text-xs font-semibold text-gray-600 uppercase">Capacity</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">{selectedVehicle.capacity}</p>
            </div>

            {selectedVehicle.location && (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-gray-600" />
                    <p className="text-xs font-semibold text-gray-600 uppercase">Speed</p>
                  </div>
                  <p className={cn('text-lg font-semibold', getSpeedColor(selectedVehicle.location.speed))}>
                    {selectedVehicle.location.speed.toFixed(1)} km/h
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <p className="text-xs font-semibold text-gray-600 uppercase">Accuracy</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{selectedVehicle.location.accuracy.toFixed(0)}m</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <p className="text-xs font-semibold text-gray-600 uppercase">Updated</p>
                  </div>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedVehicle.location.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Trip Information */}
          {selectedVehicle.activeTrip && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Trip Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Route</p>
                  <p className="text-lg font-semibold text-blue-900">{selectedVehicle.activeTrip.route.name}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-xs font-semibold text-green-600 uppercase mb-2">Status</p>
                  <p className="text-lg font-semibold text-green-900">{selectedVehicle.activeTrip.status}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-xs font-semibold text-purple-600 uppercase mb-2">Boarded</p>
                  <p className="text-lg font-semibold text-purple-900">
                    {selectedVehicle.activeTrip.boardedCount || 0}/{selectedVehicle.activeTrip.studentCount || 0}
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs font-semibold text-orange-600 uppercase mb-2">Alighted</p>
                  <p className="text-lg font-semibold text-orange-900">{selectedVehicle.activeTrip.alightedCount || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Driver Information */}
          {selectedVehicle.currentDriver && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                Driver Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Name</p>
                  <p className="text-gray-900 font-medium">
                    {selectedVehicle.currentDriver.firstName || ''} {selectedVehicle.currentDriver.lastName || ''}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2">License</p>
                  <p className="text-gray-900 font-medium">{selectedVehicle.currentDriver.licenseNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <p className="text-xs font-semibold text-gray-600 uppercase">Phone</p>
                  </div>
                  <p className="text-gray-900 font-medium">{selectedVehicle.currentDriver.phone || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Status</p>
                  <span className={cn('text-sm font-semibold px-2 py-1 rounded', getStatusColor(selectedVehicle.currentDriver.status || 'INACTIVE'))}>
                    {selectedVehicle.currentDriver.status || 'INACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
