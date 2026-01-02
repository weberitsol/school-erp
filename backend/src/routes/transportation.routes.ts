import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  gpsLocationRateLimit,
  gpsActiveVehiclesRateLimit,
  gpsHistoryRateLimit,
} from '../middleware/gps-rate-limit.middleware';
import { vehicleController } from '../controllers/vehicle.controller';
import { driverController } from '../controllers/driver.controller';
import { routeController } from '../controllers/route.controller';
import { tripController } from '../controllers/trip.controller';
import { boardingController } from '../controllers/boarding.controller';
import { attendanceIntegrationController } from '../controllers/attendance-integration.controller';
import { gpsTrackingController } from '../controllers/gps-tracking.controller';
import { etaController } from '../controllers/eta.controller';

const router = Router();

// Apply authentication to all transportation routes
router.use(authenticate);

// ==================== VEHICLE ENDPOINTS ====================

// GET /transportation/vehicles - Get all vehicles (with filters, pagination)
router.get('/vehicles', vehicleController.getVehicles);

// POST /transportation/vehicles - Create new vehicle
router.post('/vehicles', authorize('ADMIN', 'SUPER_ADMIN'), vehicleController.createVehicle);

// GET /transportation/vehicles/:id - Get vehicle details
router.get('/vehicles/:id', vehicleController.getVehicleById);

// PUT /transportation/vehicles/:id - Update vehicle
router.put('/vehicles/:id', authorize('ADMIN', 'SUPER_ADMIN'), vehicleController.updateVehicle);

// DELETE /transportation/vehicles/:id - Delete vehicle (soft delete)
router.delete('/vehicles/:id', authorize('ADMIN', 'SUPER_ADMIN'), vehicleController.deleteVehicle);

// GET /transportation/vehicles/:id/maintenance - Get vehicle maintenance history
router.get('/vehicles/:id/maintenance', vehicleController.getMaintenanceHistory);

// GET /transportation/vehicles/:id/drivers - Get assigned drivers for a vehicle
router.get('/vehicles/:id/drivers', vehicleController.getVehicleDrivers);

// POST /transportation/vehicles/:id/drivers - Assign driver to vehicle
router.post(
  '/vehicles/:id/drivers',
  authorize('ADMIN', 'SUPER_ADMIN'),
  vehicleController.assignDriver
);

// DELETE /transportation/vehicles/:id/drivers - Unassign driver from vehicle
router.delete(
  '/vehicles/:id/drivers',
  authorize('ADMIN', 'SUPER_ADMIN'),
  vehicleController.unassignDriver
);

// ==================== DRIVER ENDPOINTS ====================

// GET /transportation/drivers - Get all drivers (with filters, pagination)
router.get('/drivers', driverController.getDrivers);

// POST /transportation/drivers - Create new driver
router.post('/drivers', authorize('ADMIN', 'SUPER_ADMIN'), driverController.createDriver);

// GET /transportation/drivers/check-expiry - Check licenses expiring soon
router.get('/drivers/check-expiry', authorize('ADMIN', 'SUPER_ADMIN'), driverController.checkLicenseExpiry);

// GET /transportation/drivers/:id - Get driver details
router.get('/drivers/:id', driverController.getDriverById);

// PUT /transportation/drivers/:id - Update driver
router.put('/drivers/:id', authorize('ADMIN', 'SUPER_ADMIN'), driverController.updateDriver);

// DELETE /transportation/drivers/:id - Delete driver (soft delete)
router.delete('/drivers/:id', authorize('ADMIN', 'SUPER_ADMIN'), driverController.deleteDriver);

// GET /transportation/drivers/:id/routes - Get driver's assigned routes
router.get('/drivers/:id/routes', driverController.getRoutes);

// POST /transportation/drivers/:id/routes - Assign driver to route
router.post(
  '/drivers/:id/routes',
  authorize('ADMIN', 'SUPER_ADMIN'),
  driverController.assignRoute
);

// DELETE /transportation/drivers/:id/routes - Unassign driver from route
router.delete(
  '/drivers/:id/routes',
  authorize('ADMIN', 'SUPER_ADMIN'),
  driverController.unassignRoute
);

// GET /transportation/drivers/:id/trips - Get driver's trips
router.get('/drivers/:id/trips', driverController.getTrips);

// ==================== ROUTE ENDPOINTS ====================

// GET /transportation/routes - Get all routes (with filters, pagination)
router.get('/routes', routeController.getRoutes);

// POST /transportation/routes - Create new route
router.post('/routes', authorize('ADMIN', 'SUPER_ADMIN'), routeController.createRoute);

// GET /transportation/routes/:id - Get route details
router.get('/routes/:id', routeController.getRouteById);

// PUT /transportation/routes/:id - Update route
router.put('/routes/:id', authorize('ADMIN', 'SUPER_ADMIN'), routeController.updateRoute);

// DELETE /transportation/routes/:id - Delete route (soft delete)
router.delete('/routes/:id', authorize('ADMIN', 'SUPER_ADMIN'), routeController.deleteRoute);

// GET /transportation/routes/:id/stops - Get route stops with sequences
router.get('/routes/:id/stops', routeController.getRouteStops);

// POST /transportation/routes/:id/stops - Add stop to route
router.post(
  '/routes/:id/stops',
  authorize('ADMIN', 'SUPER_ADMIN'),
  routeController.addStopToRoute
);

// DELETE /transportation/routes/:id/stops - Remove stop from route
router.delete(
  '/routes/:id/stops',
  authorize('ADMIN', 'SUPER_ADMIN'),
  routeController.removeStopFromRoute
);

// PUT /transportation/routes/:id/stops/sequence - Update stop sequence in route
router.put(
  '/routes/:id/stops/sequence',
  authorize('ADMIN', 'SUPER_ADMIN'),
  routeController.updateRouteStopSequence
);

// ==================== STOP ENDPOINTS ====================

// GET /transportation/stops - Get all stops (with filters, pagination)
router.get('/stops', routeController.getStops);

// POST /transportation/stops - Create new stop
router.post('/stops', authorize('ADMIN', 'SUPER_ADMIN'), routeController.createStop);

// GET /transportation/stops/:id - Get stop details
router.get('/stops/:id', routeController.getStopById);

// PUT /transportation/stops/:id - Update stop
router.put('/stops/:id', authorize('ADMIN', 'SUPER_ADMIN'), routeController.updateStop);

// DELETE /transportation/stops/:id - Delete stop
router.delete('/stops/:id', authorize('ADMIN', 'SUPER_ADMIN'), routeController.deleteStop);

// ==================== TRIP MANAGEMENT ENDPOINTS ====================

// POST /transportation/trips - Create new trip
router.post('/trips', authorize('ADMIN', 'SUPER_ADMIN'), tripController.createTrip);

// GET /transportation/trips - List trips with filters and pagination
router.get('/trips', tripController.listTrips);

// GET /transportation/trips/:id - Get trip details
router.get('/trips/:id', tripController.getTripDetails);

// PUT /transportation/trips/:id - Update trip
router.put('/trips/:id', authorize('ADMIN', 'SUPER_ADMIN'), tripController.updateTrip);

// POST /transportation/trips/:id/start - Start a trip (transition to IN_PROGRESS)
router.post('/trips/:id/start', authorize('ADMIN', 'TEACHER'), tripController.startTrip);

// POST /transportation/trips/:id/complete - Complete a trip (transition to COMPLETED)
router.post('/trips/:id/complete', authorize('ADMIN', 'TEACHER'), tripController.completeTrip);

// POST /transportation/trips/:id/cancel - Cancel a trip
router.post('/trips/:id/cancel', authorize('ADMIN', 'SUPER_ADMIN'), tripController.cancelTrip);

// GET /transportation/trips/date/:date - Get trips for a specific date
router.get('/trips/date/:date', tripController.getTripsForDate);

// GET /transportation/trips/active - Get all active trips (IN_PROGRESS)
router.get('/trips/active', tripController.getActiveTrips);

// GET /transportation/trips/:id/students - Get students on a trip
router.get('/trips/:id/students', tripController.getTripStudents);

// GET /transportation/statistics - Get trip statistics
router.get('/statistics', tripController.getTripStatistics);

// ==================== BOARDING & ATTENDANCE ENDPOINTS ====================

// POST /transportation/trips/:tripId/boarding/pickup - Record student boarding at pickup
router.post(
  '/trips/:tripId/boarding/pickup',
  authorize('ADMIN', 'TEACHER'),
  boardingController.recordBoardingAtPickup
);

// POST /transportation/trips/:tripId/alighting/dropoff - Record student alighting at dropoff
router.post(
  '/trips/:tripId/alighting/dropoff',
  authorize('ADMIN', 'TEACHER'),
  boardingController.recordAlightingAtDropoff
);

// POST /transportation/trips/:tripId/attendance/absent - Mark student absent
router.post(
  '/trips/:tripId/attendance/absent',
  authorize('ADMIN', 'TEACHER'),
  boardingController.markStudentAbsent
);

// GET /transportation/trips/:tripId/boarding/summary - Get boarding summary for trip
router.get('/trips/:tripId/boarding/summary', boardingController.getTripBoardingSummary);

// GET /transportation/trips/:tripId/students/:studentId/boarding - Get student boarding history
router.get(
  '/trips/:tripId/students/:studentId/boarding',
  boardingController.getStudentBoardingHistory
);

// POST /transportation/trips/:tripId/boarding/auto - Auto-board students at pickup (geofence)
router.post(
  '/trips/:tripId/boarding/auto',
  authorize('ADMIN', 'TEACHER'),
  boardingController.autoMarkBoardingAtPickupStop
);

// GET /transportation/trips/:tripId/boarding/pending - Get students not yet boarded
router.get('/trips/:tripId/boarding/pending', boardingController.getPendingBoardingStudents);

// GET /transportation/trips/:tripId/alighting/pending - Get students not yet alighted
router.get('/trips/:tripId/alighting/pending', boardingController.getPendingAlightingStudents);

// PUT /transportation/trips/:tripId/students/:studentId/boarding/photo - Update boarding photo
router.put(
  '/trips/:tripId/students/:studentId/boarding/photo',
  authorize('ADMIN', 'TEACHER'),
  boardingController.updateBoardingPhoto
);

// POST /transportation/trips/:tripId/attendance/finalize - Finalize trip attendance
router.post(
  '/trips/:tripId/attendance/finalize',
  authorize('ADMIN', 'SUPER_ADMIN'),
  boardingController.finalizeTripAttendance
);

// ==================== ATTENDANCE INTEGRATION ENDPOINTS ====================

// POST /transportation/trips/:tripId/attendance/sync - Sync trip attendance to system
router.post(
  '/trips/:tripId/attendance/sync',
  authorize('ADMIN', 'SUPER_ADMIN'),
  attendanceIntegrationController.syncTripAttendance
);

// GET /transportation/students/:studentId/attendance/:date - Get student attendance on date
router.get(
  '/students/:studentId/attendance/:date',
  attendanceIntegrationController.getStudentAttendanceOnDate
);

// GET /transportation/classes/:classId/attendance/:date - Get class attendance summary
router.get(
  '/classes/:classId/attendance/:date',
  attendanceIntegrationController.getSectionAttendanceSummary
);

// POST /transportation/students/:studentId/notify-absence - Send absence notification
router.post(
  '/students/:studentId/notify-absence',
  authorize('ADMIN', 'TEACHER'),
  attendanceIntegrationController.notifyParentOfAbsence
);

// POST /transportation/classes/:classId/notify-absences/:date - Notify teachers of absences
router.post(
  '/classes/:classId/notify-absences/:date',
  authorize('ADMIN', 'TEACHER'),
  attendanceIntegrationController.notifySectionTeachersOfAbsences
);

// GET /transportation/students/:studentId/attendance-history - Get attendance history
router.get(
  '/students/:studentId/attendance-history',
  attendanceIntegrationController.getStudentAttendanceHistory
);

// POST /transportation/attendance/batch-sync - Batch sync multiple trips
router.post(
  '/attendance/batch-sync',
  authorize('ADMIN', 'SUPER_ADMIN'),
  attendanceIntegrationController.batchSyncTripsToAttendance
);

// DELETE /transportation/trips/:tripId/attendance/revert - Revert attendance sync
// GET /transportation/attendance/stats-by-section - Get attendance statistics by section
router.get(
  '/attendance/stats-by-section',
  attendanceIntegrationController.getAttendanceStatsBySection
);

// GET /transportation/attendance/absence-summary - Get absence summary
router.get(
  '/attendance/absence-summary',
  attendanceIntegrationController.getStudentAbsenceSummary
);

// ==================== GPS TRACKING ENDPOINTS ====================

// POST /transportation/location - Capture GPS location from driver app
// Rate limited: 10 updates per minute per vehicle
router.post('/location', gpsLocationRateLimit, gpsTrackingController.captureLocation);

// GET /transportation/vehicles/active - Get all active vehicles with current locations
router.get('/vehicles/active', gpsActiveVehiclesRateLimit, gpsTrackingController.getActiveVehicles);

// GET /transportation/vehicles/:id/location - Get current location of a vehicle
router.get('/vehicles/:id/location', gpsTrackingController.getCurrentLocation);

// GET /transportation/vehicles/:id/location-history - Get historical location data
router.get(
  '/vehicles/:id/location-history',
  gpsHistoryRateLimit,
  gpsTrackingController.getLocationHistory
);

// POST /transportation/vehicles/:id/location/offline - Mark vehicle as offline
router.post(
  '/vehicles/:id/location/offline',
  authorize('ADMIN', 'SUPER_ADMIN'),
  gpsTrackingController.markOffline
);

// GET /transportation/distance - Calculate distance between two GPS coordinates
// Query params: lat1, lon1, lat2, lon2
router.get('/distance', gpsTrackingController.calculateDistance);

// ==================== ETA & ROUTE PROGRESS ENDPOINTS ====================

// GET /transportation/trips/:tripId/eta - Get comprehensive ETA breakdown for entire trip
router.get('/trips/:tripId/eta', etaController.getRouteETABreakdown);

// GET /transportation/trips/:tripId/progress - Get trip progress with multi-segment ETA
router.get('/trips/:tripId/progress', etaController.getTripProgressWithETA);

// GET /transportation/trips/:tripId/stops/:stopId/eta - Get detailed ETA for a specific stop
router.get('/trips/:tripId/stops/:stopId/eta', etaController.getStopETA);

// POST /transportation/speed-record - Record speed reading for historical analysis
router.post('/speed-record', etaController.recordSpeedReading);

// GET /transportation/trips/:tripId/eta-accuracy - Get ETA accuracy metrics
router.get('/trips/:tripId/eta-accuracy', etaController.getETAAccuracy);

// GET /transportation/vehicles/:vehicleId/speed-profile - Get current speed profile for a vehicle
router.get('/vehicles/:vehicleId/speed-profile', etaController.getVehicleSpeedProfile);

export default router;
