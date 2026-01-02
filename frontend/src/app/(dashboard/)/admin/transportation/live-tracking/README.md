# Vehicle Tracking Dashboard

## Overview

The Vehicle Tracking Dashboard provides real-time monitoring of all school buses, their locations, current trips, and driver information. It's designed for transportation administrators and supervisors to track vehicle movements and manage transportation operations efficiently.

## Features

### 1. **Real-Time Vehicle Monitoring**
- Live GPS location tracking of all vehicles using Leaflet map
- Real-time speed and accuracy indicators
- Vehicle status visualization (Active, Maintenance, Out of Service)
- WebSocket-based real-time updates with fallback to polling

### 2. **Interactive Map**
- OpenStreetMap-based interactive map
- Color-coded vehicle markers:
  - **Green**: Active vehicles with active trips
  - **Yellow**: Vehicles under maintenance
  - **Red**: Out-of-service vehicles
  - **Gray**: Idle vehicles
- Auto-fit map to show all vehicles
- Center on selected vehicle
- Click markers to view vehicle details

### 3. **Vehicle Statistics**
- Total vehicles count
- Active vehicles count
- Vehicles currently on trips
- Vehicles under maintenance
- Auto-refreshing statistics

### 4. **Status Filtering**
- Filter by vehicle status:
  - All vehicles
  - Active vehicles (with trips)
  - Maintenance vehicles
  - Inactive vehicles

### 5. **Vehicle List View**
- Scrollable vehicle list with:
  - Registration number and model
  - Current status badge
  - GPS coordinates
  - Current speed with color-coded warnings
  - Active trip information (if applicable)
- Click any vehicle to view full details

### 6. **Detailed Vehicle Information Panel**
When a vehicle is selected, view comprehensive details:

#### Vehicle Details
- Vehicle type
- Seating capacity
- Current speed (with color coding)
- GPS accuracy (in meters)
- Last update timestamp

#### Trip Information (if vehicle is on active trip)
- Route name
- Trip status
- Students boarded / Total students
- Students alighted

#### Driver Information
- Driver name
- License number
- Contact phone
- Driver status

### 7. **Auto-Refresh Controls**
- Manual refresh button
- Toggle auto-refresh mode (10-second intervals)
- Visual indicator for WebSocket connection status

## Usage Guide

### Starting the Dashboard
1. Navigate to: `/admin/transportation/live-tracking`
2. The dashboard loads all vehicles and displays them on the map

### Viewing Vehicle Details
1. Click on a vehicle marker on the map OR
2. Click on a vehicle card in the vehicle list
3. The selected vehicle will:
   - Be highlighted on the map
   - Show detailed information in the panel below
   - Auto-center the map view

### Filtering Vehicles
1. Use the status filter buttons at the top
2. Available filters:
   - **All**: Shows all vehicles
   - **Active**: Shows only active vehicles with trips
   - **Maintenance**: Shows only vehicles under maintenance
   - **Inactive**: Shows idle or out-of-service vehicles

### Monitoring Live Updates
- **With WebSocket**: Real-time updates appear instantly
- **Without WebSocket**: Updates every 10 seconds via polling
- Toggle auto-refresh with the "Auto-Refresh" button

### Understanding Status Colors

#### Vehicle Status (Top Right of Card)
- Green: ACTIVE
- Yellow: MAINTENANCE
- Red: OUT_OF_SERVICE
- Gray: Default/Inactive

#### Speed Indicators
- Green: Safe speed (0-40 km/h)
- Yellow: Moderate speed (40-60 km/h)
- Red: High speed (>60 km/h)

## API Integration

The dashboard uses the following endpoints:

### GET /api/v1/transportation/vehicles
Fetches all vehicles

### GET /api/v1/transportation/vehicles/:id/location
Gets current location of a specific vehicle

### GET /api/v1/transportation/trips/active
Gets all active trips (vehicles currently on route)

### WebSocket: transport:location:*
Real-time location updates via Socket.IO

## Components

### `page.tsx` - Main Dashboard
- State management for vehicles and filters
- Vehicle data loading and updates
- Statistics calculation
- Vehicle filtering logic

### `vehicle-map.tsx` - Map Component
- Leaflet map initialization
- Marker creation and updates
- Popup information display
- Map center/zoom management

### `route-polyline.tsx` - Route Visualization
- Draw route polylines on map
- Display numbered stop markers
- Show stop names on hover

## Data Structure

### VehicleWithLocation Interface
```typescript
{
  id: string;
  registrationNumber: string;
  model?: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  type: string;
  capacity: number;
  location?: {
    latitude: number;
    longitude: number;
    speed: number;
    accuracy: number;
    timestamp: Date;
  };
  activeTrip?: {
    id: string;
    route: { id: string; name: string };
    status: string;
    boardedCount: number;
    studentCount: number;
    alightedCount: number;
  };
  currentDriver?: {
    id: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    phone: string;
    status: string;
  };
}
```

## Performance Considerations

1. **Polling Interval**: 10 seconds (configurable)
2. **Map Update**: Only updates when location changes
3. **Marker Clustering**: Handled by Leaflet
4. **Memory**: Cleaned up automatically when vehicles leave view

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

1. WebSocket connection requires Redis (gracefully falls back to polling)
2. Maximum of 1000 vehicles recommended for smooth performance
3. Historical route data not displayed (shows current location only)
4. Limited to 30-day location history in backend

## Future Enhancements

- [ ] Route history playback
- [ ] Geofence alerts
- [ ] ETA to destinations
- [ ] Student notification integration
- [ ] Performance analytics
- [ ] Multi-map view
- [ ] Export trip reports
- [ ] Mobile app integration

## Troubleshooting

### Map not loading
- Check if Leaflet CSS is imported
- Verify Leaflet library is installed: `npm list leaflet`
- Check browser console for errors

### Vehicles not showing
- Verify API endpoints are working: GET `/api/v1/transportation/vehicles`
- Check if vehicles have location data
- Verify authentication token is valid

### WebSocket not connecting
- Check if Socket.IO server is running
- Verify Redis connection on backend
- Check browser network tab for WebSocket errors

### Slow performance
- Reduce number of vehicles displayed
- Increase polling interval
- Clear browser cache
- Check system memory usage

## Support

For issues or questions, contact the development team or create an issue in the project repository.
