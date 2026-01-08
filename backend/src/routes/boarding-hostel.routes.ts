import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { boardingHostelController } from '../controllers/boarding-hostel.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Boarding Statistics
router.get('/stats', boardingHostelController.getBoardingStats);

// ===== FACILITIES =====

// POST /boarding/facilities - Create facility
router.post(
  '/facilities',
  authorize('ADMIN', 'SUPER_ADMIN'),
  boardingHostelController.createFacility
);

// GET /boarding/facilities - List facilities
router.get('/facilities', boardingHostelController.getAllFacilities);

// GET /boarding/facilities/:id - Get facility by ID
router.get('/facilities/:id', boardingHostelController.getFacilityById);

// ===== ROOMS =====

// POST /boarding/rooms - Create room
router.post(
  '/rooms',
  authorize('ADMIN', 'SUPER_ADMIN'),
  boardingHostelController.createRoom
);

// GET /boarding/rooms - List rooms
router.get('/rooms', boardingHostelController.getAllRooms);

// GET /boarding/rooms/:id - Get room by ID
router.get('/rooms/:id', boardingHostelController.getRoomById);

// PUT /boarding/rooms/:id - Update room
router.put(
  '/rooms/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  boardingHostelController.updateRoom
);

// ===== STUDENT BOARDING =====

// POST /boarding/register - Register student for boarding
router.post(
  '/register',
  authorize('ADMIN', 'SUPER_ADMIN'),
  boardingHostelController.registerStudentBoarding
);

// GET /boarding/active - Get active boardings
router.get('/active', boardingHostelController.getActiveBoardings);

// GET /boarding/student/:studentId - Get student's current boarding
router.get('/student/:studentId', boardingHostelController.getStudentBoarding);

// GET /boarding/student/:studentId/history - Get student's boarding history
router.get('/student/:studentId/history', boardingHostelController.getStudentBoardingHistory);

// POST /boarding/:boardingId/end - End student boarding
router.post(
  '/:boardingId/end',
  authorize('ADMIN', 'SUPER_ADMIN'),
  boardingHostelController.endStudentBoarding
);

export default router;
