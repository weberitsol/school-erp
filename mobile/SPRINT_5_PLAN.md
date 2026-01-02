# Sprint 5: Mobile Parent/Student Tracking App

## Overview

Build a React Native parent/student app that enables real-time tracking of the school bus, estimated arrival times, and safety notifications. This app runs alongside the existing driver app in the same codebase with role-based navigation.

## User Requirements

✅ **Confirmed Features:**
- Parent login with email/password
- View child's assigned route and vehicle
- Real-time GPS tracking of bus on map
- Estimated arrival time (ETA) at pickup/drop stops
- Trip status notifications
- Trip history with attendance records
- Emergency contact information
- In-app notifications for critical updates

## Implementation Strategy

**Approach:** Build parent app using existing patterns from driver app:
- Use same API service layer
- Socket.IO for real-time bus tracking
- React Native Maps for location display
- AsyncStorage for offline data caching
- Zustand for state management

**Role-Based Navigation:**
- Modify `RootNavigator.tsx` to check user role
- Route TEACHER/DRIVER → DriverNavigator
- Route PARENT/STUDENT → ParentNavigator

## Phase-by-Phase Execution Plan

### Story 5.1: Navigation Setup & Parent Auth Service
**Priority:** Critical (Foundation)
**Estimated Effort:** 4 hours

**Objectives:**
1. Modify RootNavigator to support role-based routing
2. Create ParentNavigator with bottom tab structure
3. Create ParentAuthService for parent-specific login
4. Handle parent profile loading

**Tasks:**
1. Update `RootNavigator.tsx`:
   - Get user role from token or profile
   - Route to DriverNavigator if TEACHER/DRIVER
   - Route to ParentNavigator if PARENT/STUDENT

2. Create `mobile/src/navigation/ParentNavigator.tsx`:
   - Bottom tab navigator with 3 tabs:
     - **Home** - View assigned child/route
     - **Track** - Live bus tracking map
     - **Settings** - Preferences and logout
   - Stack navigation for details screens

3. Create/Update parent auth service (`mobile/src/services/parent-auth.service.ts`):
   - Parent login specific logic
   - Get parent profile with children
   - Get child's route assignments

4. Create parent store (`mobile/src/store/parent.store.ts`):
   - Selected child ID
   - Current route info
   - Trip history
   - Notifications

**Backend APIs Used:**
- POST `/api/v1/auth/login` (existing)
- GET `/api/v1/parents/profile` (with children)
- GET `/api/v1/students/:id/route` (child's route)

**Acceptance Criteria:**
- ✅ Parent can log in with email/password
- ✅ Navigation routes to ParentNavigator based on role
- ✅ Parent profile shows list of children
- ✅ Can select child to view their route
- ✅ Parent data persists using Zustand store

---

### Story 5.2: Home Screen & Child Selection
**Priority:** High
**Estimated Effort:** 4 hours

**Objectives:**
1. Display parent's children
2. Allow selection of child to track
3. Show child's current route and vehicle info
4. Display next scheduled trip

**Tasks:**
1. Create Parent Home Screen (`mobile/src/screens/parent/HomeScreen.tsx`):
   - List of children (if parent has multiple)
   - Selected child highlighted
   - Child's current route info:
     - Route name
     - Vehicle registration number
     - Current trip status (Not Started, In Progress, Completed)
   - Next trip scheduled time
   - "START TRACKING" button (navigates to Track screen)
   - Empty state if no route assigned today

2. Create `mobile/src/services/parent-trip.service.ts`:
   - `getChildRoute(childId)` - Get current route assignment
   - `getTodayTrips(childId)` - Get trips scheduled for today
   - `getRouteDetails(routeId)` - Get route with all stops
   - `getVehicleInfo(vehicleId)` - Get vehicle info with driver

3. Create Child Selection Component (`mobile/src/components/parent/ChildCard.tsx`):
   - Child name, class, section
   - Assigned route badge
   - Selection indicator
   - Tap to select

4. Create Route Info Component (`mobile/src/components/parent/RouteInfoCard.tsx`):
   - Route name and number
   - Vehicle details
   - Trip status
   - Pickup/drop times

**Backend APIs Used:**
- GET `/api/v1/parents/profile` (get children)
- GET `/api/v1/students/:id/route` (current route)
- GET `/api/v1/routes/:id` (route details)
- GET `/api/v1/vehicles/:id` (vehicle info)
- GET `/api/v1/trips` (filtered by child and today)

**Acceptance Criteria:**
- ✅ Home screen displays all parent's children
- ✅ Can select child to track
- ✅ Route info displays correctly
- ✅ Trip status shows current state
- ✅ Empty state when no route assigned
- ✅ Data refreshes on screen focus

---

### Story 5.3: Live Bus Tracking Map
**Priority:** High
**Estimated Effort:** 6 hours

**Objectives:**
1. Display bus location on real-time map
2. Show child's pickup and drop stops
3. Display parent's current location (optional)
4. Show ETA to pickup and drop stops
5. Handle offline gracefully

**Tasks:**
1. Create Tracking Screen (`mobile/src/screens/parent/TrackingScreen.tsx`):
   - React Native Maps component
   - Bus location marker (blue)
   - Pickup stop marker (green) with ETA
   - Drop stop marker (red) with ETA
   - Parent location marker (yellow, optional)
   - Route polyline showing bus path
   - Connection status indicator
   - ETA countdown timer

2. Create Socket.IO Tracking Service (`mobile/src/services/parent-socket.service.ts`):
   - Connect to Socket.IO with JWT
   - Subscribe to `vehicle:{vehicleId}` room
   - Receive real-time location updates
   - Disconnect on unmount

3. Create Map Component (`mobile/src/components/map/BusTrackingMap.tsx`):
   - Leaflet/React Native Maps integration
   - Auto-center on bus or parent location
   - Handle zoom/pan gestures
   - Update markers as location changes

4. Create ETA Calculation Utility (`mobile/src/utils/eta.util.ts`):
   - Calculate distance using Haversine formula
   - Estimate travel time based on average speed (40 km/h)
   - Update countdown timer every 10 seconds

5. Create Connection Status Component (`mobile/src/components/parent/ConnectionStatus.tsx`):
   - Shows "Live" (green) or "Last location" (gray) with timestamp
   - Pulsing animation when live
   - Tap to show signal strength

**Backend APIs Used:**
- GET `/api/v1/vehicles/:id/location` (current location)
- Socket.IO: `vehicle:{vehicleId}` room (real-time updates)
- GET `/api/v1/routes/:id/stops` (stop coordinates)

**Acceptance Criteria:**
- ✅ Map displays bus location and updates in real-time
- ✅ Both pickup and drop stops visible on map
- ✅ ETA calculated and displayed for both stops
- ✅ ETA countdown updates every 10 seconds
- ✅ Connection status shows Live/Offline state
- ✅ Map auto-centers on bus location
- ✅ Offline state shows last known location with timestamp
- ✅ User can pan/zoom map freely

---

### Story 5.4: Trip Status & Notifications
**Priority:** High
**Estimated Effort:** 4 hours

**Objectives:**
1. Display real-time trip progress
2. Show student boarding/alighting status
3. Trigger notifications at key milestones
4. Show estimated vs actual times

**Tasks:**
1. Create Trip Status Component (`mobile/src/components/parent/TripStatusCard.tsx`):
   - Current trip status (Not Started, Picked Up, En Route, Arrived at Drop, Dropped Off)
   - Timeline view:
     - Scheduled pickup time → Status
     - Scheduled drop time → Status
     - Actual pickup time (once boarded)
     - Actual drop time (once alighted)
   - Time remaining until drop-off

2. Create Notification Service (`mobile/src/services/notification.service.ts`):
   - `registerForNotifications()` - Register device for push notifications
   - `showLocalNotification(title, message)` - Show in-app notification
   - Listen to Socket.IO events for trip milestones
   - Trigger notifications at:
     - Trip started
     - Student picked up (boarded)
     - Approaching child's drop stop (within 2km)
     - Student dropped off (alighted)

3. Update Socket.IO to handle trip events:
   - Listen to `student-boarded` event
   - Listen to `student-alighted` event
   - Listen to `trip-status-changed` event

4. Create In-App Notification Component (`mobile/src/components/common/NotificationBanner.tsx`):
   - Toast-style notification at top of screen
   - Shows milestone notifications
   - Auto-dismisses after 5 seconds
   - Tap to expand for more details

**Backend APIs Used:**
- GET `/api/v1/trips/:id` (trip details)
- Socket.IO: Trip status events
- POST `/api/v1/notifications/register` (device registration)

**Acceptance Criteria:**
- ✅ Trip status displays all milestones
- ✅ Timeline shows scheduled vs actual times
- ✅ Notifications trigger at key events
- ✅ Notifications work when app is in background/foreground
- ✅ Notification shows child's name and event details
- ✅ In-app banner displays and auto-dismisses
- ✅ Connection loss doesn't break notification handling

---

### Story 5.5: Trip History & Attendance
**Priority:** Medium
**Estimated Effort:** 3 hours

**Objectives:**
1. Display child's past trips
2. Show boarding/alighting status
3. Display trip duration and punctuality
4. Track attendance pattern

**Tasks:**
1. Create Trip History Screen (`mobile/src/screens/parent/TripHistoryScreen.tsx`):
   - FlatList of past trips (last 30 days)
   - Filters: Date range, week view
   - Trip cards showing:
     - Trip date and day
     - Route name
     - Pickup time (scheduled vs actual)
     - Drop time (scheduled vs actual)
     - Boarding status (boarded/absent)
     - Alighting status (alighted/absent)
   - Tap for detailed trip view

2. Create History Item Component (`mobile/src/components/parent/HistoryTripCard.tsx`):
   - Compact trip summary
   - Color coding: Green (on-time), Orange (late), Red (absent)
   - Tap to expand for full details

3. Create Trip Details Modal (`mobile/src/components/parent/TripDetailsModal.tsx`):
   - Full trip information
   - Photo if captured during boarding/alighting
   - Driver details and contact
   - Route map with actual path taken

4. Create Attendance Stats Component (`mobile/src/components/parent/AttendanceStats.tsx`):
   - Attendance percentage (last 30 days)
   - On-time pickup percentage
   - Punctual drop-off percentage
   - Absence count

**Backend APIs Used:**
- GET `/api/v1/students/:id/trips` (with filters)
- GET `/api/v1/trips/:id/details` (full trip info)
- GET `/api/v1/students/:id/attendance-stats`

**Acceptance Criteria:**
- ✅ History displays all past trips (sorted newest first)
- ✅ Trip cards show status indicators with colors
- ✅ Date filter works (7, 30, 90 days)
- ✅ Tap trip card opens detailed view
- ✅ Details show all time info and photos
- ✅ Attendance stats calculated correctly
- ✅ Smooth scroll performance with 100+ trips

---

### Story 5.6: Settings & Notifications Preferences
**Priority:** Medium
**Estimated Effort:** 2 hours

**Objectives:**
1. Customize notification preferences
2. Display parent profile
3. Manage child selections
4. Logout

**Tasks:**
1. Create Parent Settings Screen (`mobile/src/screens/parent/SettingsScreen.tsx`):
   - **Profile Section**: Parent name, email, phone
   - **Notification Preferences**:
     - Push notifications toggle
     - Enable trip updates notification
     - Enable milestone notifications
     - Enable delayed notifications (if >10 min late)
   - **Children Management**:
     - List of children
     - Can select/deselect children to track
   - **About**: App version, last sync time
   - **Logout**: Red button with confirmation

2. Create Notification Preferences Component:
   - Toggle switches for each notification type
   - Persist to AsyncStorage with key `'notification_preferences'`

3. Update Settings Service:
   - `getNotificationPreferences()` - Load from AsyncStorage
   - `saveNotificationPreferences(prefs)` - Save to AsyncStorage
   - `updateChildSelection(childIds)` - Update tracked children

**Backend APIs Used:**
- GET `/api/v1/parents/profile`
- POST `/api/v1/notifications/preferences` (optional backend sync)

**Acceptance Criteria:**
- ✅ Settings screen displays parent profile
- ✅ Notification toggles persist across app restarts
- ✅ Can select/deselect children to track
- ✅ Logout clears tokens and returns to login
- ✅ All settings persist in AsyncStorage

---

## File Structure (Sprint 5)

```
mobile/
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx          # MODIFY: Add role-based routing
│   │   ├── DriverNavigator.tsx        # Existing
│   │   ├── ParentNavigator.tsx        # NEW: Parent bottom tabs
│   │   └── AuthNavigator.tsx          # Existing
│   │
│   ├── screens/
│   │   ├── parent/
│   │   │   ├── HomeScreen.tsx         # Child selection and route info
│   │   │   ├── TrackingScreen.tsx     # Real-time bus map
│   │   │   ├── TripHistoryScreen.tsx  # Past trips with attendance
│   │   │   └── SettingsScreen.tsx     # Preferences and logout
│   │   └── driver/                    # Existing (Stories 4.1-4.6)
│   │
│   ├── components/
│   │   ├── parent/
│   │   │   ├── ChildCard.tsx          # Child selection card
│   │   │   ├── RouteInfoCard.tsx      # Route and vehicle info
│   │   │   ├── TripStatusCard.tsx     # Trip timeline and status
│   │   │   ├── HistoryTripCard.tsx    # Compact trip summary
│   │   │   ├── TripDetailsModal.tsx   # Detailed trip view
│   │   │   ├── AttendanceStats.tsx    # Attendance percentages
│   │   │   ├── ConnectionStatus.tsx   # Live/Offline indicator
│   │   │   └── NotificationBanner.tsx # Toast notification
│   │   ├── map/
│   │   │   └── BusTrackingMap.tsx     # React Native Maps wrapper
│   │   └── trip/                      # Existing (from driver app)
│   │
│   ├── services/
│   │   ├── parent-auth.service.ts     # Parent authentication
│   │   ├── parent-trip.service.ts     # Trip data for parents
│   │   ├── parent-socket.service.ts   # Real-time tracking
│   │   ├── notification.service.ts    # Push & local notifications
│   │   ├── api.service.ts             # Existing (shared)
│   │   └── gps-tracking.service.ts    # Existing (driver only)
│   │
│   ├── store/
│   │   ├── parent.store.ts            # Parent app state
│   │   ├── trip.store.ts              # Existing (driver)
│   │   └── auth.store.ts              # Existing (shared)
│   │
│   ├── hooks/
│   │   ├── useNetworkStatus.ts        # Existing
│   │   ├── useLocationPermissions.ts  # Existing (driver only)
│   │   └── useBusTracking.ts          # Parent bus tracking hook
│   │
│   ├── utils/
│   │   ├── eta.util.ts                # ETA calculation
│   │   └── geofence.util.ts           # Existing (driver)
│   │
│   └── types/
│       └── api.types.ts               # Extend with parent types
│
└── app.json                           # Update: Add notification permissions
```

## Dependencies to Install

```bash
cd mobile

# Notifications (if not already installed)
npx expo install expo-notifications

# Maps (if not already installed)
npx expo install react-native-maps

# Socket.IO (if not already installed)
npm install socket.io-client
```

## API Integration Map

| Screen | Backend Endpoints |
|--------|------------------|
| **HomeScreen** | GET `/api/v1/parents/profile`<br>GET `/api/v1/students/:id/route`<br>GET `/api/v1/routes/:id`<br>GET `/api/v1/trips` (filtered by child, today) |
| **TrackingScreen** | GET `/api/v1/vehicles/:id/location`<br>GET `/api/v1/routes/:id/stops`<br>Socket.IO: `vehicle:{vehicleId}` |
| **TripStatusCard** | GET `/api/v1/trips/:id`<br>Socket.IO: Trip status events |
| **TripHistoryScreen** | GET `/api/v1/students/:id/trips` (with date filters)<br>GET `/api/v1/students/:id/attendance-stats` |
| **SettingsScreen** | GET `/api/v1/parents/profile`<br>POST `/api/v1/notifications/preferences` |

## Role-Based Navigation Logic

```typescript
// In RootNavigator.tsx
const checkAuthStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      setRole(null);
      return;
    }

    // Decode JWT to get role
    const decoded = jwtDecode(token);
    const userRole = decoded.role; // TEACHER, PARENT, STUDENT, etc.

    setRole(userRole);
  } catch (error) {
    setRole(null);
  }
};

// In return statement:
{
  isAuthenticated && role === 'TEACHER' && <DriverNavigator />
}
{
  isAuthenticated && (role === 'PARENT' || role === 'STUDENT') && <ParentNavigator />
}
{
  !isAuthenticated && <AuthNavigator />
}
```

## Socket.IO Integration

**Parent App Connection:**
```typescript
import io from 'socket.io-client';

const socket = io('http://192.168.0.106:5000/transport', {
  auth: {
    token: accessToken
  },
  transports: ['websocket']
});

// Subscribe to vehicle tracking
socket.emit('subscribe', `vehicle:${vehicleId}`);

// Listen to location updates
socket.on('location-update', (data) => {
  // Update map marker with new coordinates
});

// Listen to trip status changes
socket.on('student-boarded', (data) => {
  // Show notification "Child picked up"
});

socket.on('student-alighted', (data) => {
  // Show notification "Child dropped off"
});
```

## ETA Calculation Logic

```typescript
// Using Haversine formula
function calculateETA(
  busLat: number,
  busLon: number,
  stopLat: number,
  stopLon: number,
  averageSpeed: number = 40 // km/h
): { distance: number; eta: number } {
  const distance = calculateHaversineDistance(busLat, busLon, stopLat, stopLon);

  // Convert distance (km) to time (minutes)
  const eta = (distance / averageSpeed) * 60;

  return { distance, eta: Math.round(eta) };
}
```

## Notification Milestones

1. **Trip Started**: "Your child's bus is on the way!"
2. **Student Picked Up**: "Your child has been picked up at [Stop Name]"
3. **Approaching Drop Stop** (within 2km): "Bus approaching [Child's Drop Stop], arriving in ~X minutes"
4. **Student Dropped Off**: "Your child has been dropped off at [Stop Name]"
5. **Delayed Alert** (if >10 min late): "Bus is running 15 minutes late. New ETA: HH:MM"

## Testing Checklist

**Manual Testing:**
- [ ] Parent login with valid credentials
- [ ] Home screen shows all children
- [ ] Can select child to track
- [ ] Route info displays correctly
- [ ] TrackingScreen shows bus location on map
- [ ] Bus marker updates in real-time (every 15 seconds)
- [ ] ETA displays and counts down correctly
- [ ] Pickup and drop stop markers visible
- [ ] Connection status shows Live/Last location
- [ ] Tap stops to see details
- [ ] Milestone notifications trigger
- [ ] Trip history displays 30 past trips
- [ ] Attendance stats calculated correctly
- [ ] Settings save notification preferences
- [ ] Offline mode shows last known location
- [ ] Logout clears tokens and returns to login

**Performance Testing:**
- [ ] Map renders smoothly with 30+ stops
- [ ] Socket.IO updates don't cause lag
- [ ] History scroll smooth with 100+ trips
- [ ] No memory leaks on repeated navigation

## Implementation Order

```
Day 1: Story 5.1 (Navigation + Parent Auth)
Day 2: Story 5.2 (Home Screen + Child Selection)
Day 3: Story 5.3 (Live Bus Tracking Map)
Day 4: Story 5.4 (Trip Status & Notifications)
Day 5: Story 5.5 (Trip History & Attendance)
Day 6: Story 5.6 (Settings & Preferences)
Day 7: Testing & Bug Fixes
```

## Success Criteria

✅ Parent can log in and view all assigned children
✅ Real-time bus tracking displays on map with <5s latency
✅ ETA calculated and displayed for pickup/drop stops
✅ Milestone notifications triggered and displayed correctly
✅ Trip history shows all past trips with attendance records
✅ Offline mode displays last known bus location
✅ Settings persist across app restarts
✅ Smooth map performance with 30+ stops
✅ Socket.IO connection stable with auto-reconnect
✅ Logout returns to authentication screen

---

## Next Steps

**Start Story 5.1:** Modify RootNavigator for role-based routing and create ParentNavigator
