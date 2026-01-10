import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { messController } from '../controllers/mess.controller';
import { mealPlanController } from '../controllers/meal-plan.controller';
import { foodItemController } from '../controllers/food-item.controller';
import { allergenController } from '../controllers/allergen.controller';
import { recipeController } from '../controllers/recipe.controller';
import { messStaffController } from '../controllers/mess-staff.controller';
// Phase 2: Critical Safety Systems
import { studentAllergyController } from '../controllers/student-allergy.controller';
import { allergenCheckerController } from '../controllers/allergen-checker.controller';
import { kitchenHygieneController } from '../controllers/kitchen-hygiene.controller';
import { menuApprovalController } from '../controllers/menu-approval.controller';
// Phase 3: Menu Planning & Meal Management
import { MenuController } from '../controllers/menu.controller';
import { MealController } from '../controllers/meal.controller';
import { MealVariantController } from '../controllers/meal-variant.controller';
import { MealChoiceController } from '../controllers/meal-choice.controller';
// Phase 4: Student Enrollment & Attendance
import { enrollmentController } from '../controllers/enrollment.controller';
import { mealAttendanceController } from '../controllers/meal-attendance.controller';
import { holidayCalendarController } from '../controllers/holiday-calendar.controller';
// Phase 5: Billing & Financial Integration
import { messBillController } from '../controllers/mess-bill.controller';
import { extraMealController } from '../controllers/extra-meal.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================================================
// MESS MANAGEMENT ROUTES
// ============================================================================

// Mess Facility Routes
router.post('/messes', authorize('ADMIN', 'SUPER_ADMIN'), messController.create);
router.get('/messes', messController.getAll);
router.get('/messes/:id', messController.getById);
router.get('/messes/:id/statistics', messController.getStatistics);
router.put('/messes/:id', authorize('ADMIN', 'SUPER_ADMIN'), messController.update);
router.delete('/messes/:id', authorize('ADMIN', 'SUPER_ADMIN'), messController.delete);

// ============================================================================
// MEAL PLAN ROUTES
// ============================================================================

router.post('/meal-plans', authorize('ADMIN', 'SUPER_ADMIN'), mealPlanController.create);
router.get('/meal-plans', mealPlanController.getAll);
router.get('/meal-plans/:id', mealPlanController.getById);
router.put('/meal-plans/:id', authorize('ADMIN', 'SUPER_ADMIN'), mealPlanController.update);
router.delete('/meal-plans/:id', authorize('ADMIN', 'SUPER_ADMIN'), mealPlanController.delete);
router.get('/messes/:messId/meal-plans', mealPlanController.getByMess);

// ============================================================================
// FOOD ITEM ROUTES
// ============================================================================

router.post('/food-items', authorize('ADMIN', 'SUPER_ADMIN'), foodItemController.create);
router.get('/food-items', foodItemController.getAll);
router.get('/food-items/:id', foodItemController.getById);
router.put('/food-items/:id', authorize('ADMIN', 'SUPER_ADMIN'), foodItemController.update);
router.delete('/food-items/:id', authorize('ADMIN', 'SUPER_ADMIN'), foodItemController.delete);
router.get('/food-items/category/:category', foodItemController.getByCategory);

// ============================================================================
// ALLERGEN ROUTES (CRITICAL SAFETY)
// ============================================================================

router.post('/allergens', authorize('ADMIN', 'SUPER_ADMIN'), allergenController.create);
router.get('/allergens', allergenController.getAll);
router.get('/allergens/:id', allergenController.getById);
router.put('/allergens/:id', authorize('ADMIN', 'SUPER_ADMIN'), allergenController.update);
router.delete('/allergens/:id', authorize('ADMIN', 'SUPER_ADMIN'), allergenController.delete);
router.get('/allergens/critical/list', allergenController.getCritical);
router.get('/students/:studentId/allergens', allergenController.getStudentAllergens);

// ============================================================================
// RECIPE ROUTES
// ============================================================================

router.post('/recipes', authorize('ADMIN', 'SUPER_ADMIN'), recipeController.create);
router.get('/recipes', recipeController.getAll);
router.get('/recipes/search/by-name', recipeController.search);
router.get('/recipes/:id', recipeController.getById);
router.put('/recipes/:id', authorize('ADMIN', 'SUPER_ADMIN'), recipeController.update);
router.delete('/recipes/:id', authorize('ADMIN', 'SUPER_ADMIN'), recipeController.delete);
router.post('/recipes/:recipeId/ingredients', authorize('ADMIN', 'SUPER_ADMIN'), recipeController.addIngredient);
router.post('/recipes/:id/calculate-cost', recipeController.calculateCost);

// ============================================================================
// MESS STAFF ROUTES
// ============================================================================

router.post('/staff', authorize('ADMIN', 'SUPER_ADMIN'), messStaffController.create);
router.get('/staff', messStaffController.getAll);
router.get('/staff/:id', messStaffController.getById);
router.put('/staff/:id', authorize('ADMIN', 'SUPER_ADMIN'), messStaffController.update);
router.delete('/staff/:id', authorize('ADMIN', 'SUPER_ADMIN'), messStaffController.delete);
router.get('/messes/:messId/staff', messStaffController.getByMess);
router.post('/staff/:id/certification', authorize('ADMIN', 'SUPER_ADMIN'), messStaffController.addCertification);
router.post('/staff/:id/training', authorize('ADMIN', 'SUPER_ADMIN'), messStaffController.recordTraining);
router.post('/staff/:id/deactivate', authorize('ADMIN', 'SUPER_ADMIN'), messStaffController.deactivate);
router.get('/messes/:messId/staff-stats', messStaffController.getStats);

// ============================================================================
// PHASE 2: CRITICAL SAFETY SYSTEMS
// ============================================================================

// ============================================================================
// STUDENT ALLERGY ROUTES (Doctor-verified allergies)
// ============================================================================

router.post(
  '/enrollments/:id/allergies',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentAllergyController.create
);
router.get('/enrollments/:id/allergies', studentAllergyController.getByStudent);
router.get('/allergies', studentAllergyController.getAll);
router.get('/allergies/:id', studentAllergyController.getById);
router.put(
  '/allergies/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentAllergyController.update
);
router.post(
  '/allergies/:id/verify',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentAllergyController.verify
);
router.post(
  '/allergies/:id/reject',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentAllergyController.reject
);
router.delete(
  '/allergies/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentAllergyController.delete
);
router.get(
  '/students/:studentId/critical-allergies',
  studentAllergyController.getCriticalAlergies
);

// ============================================================================
// ALLERGEN CHECKER ROUTES (CRITICAL SAFETY - Meal validation)
// ============================================================================

router.post('/allergies/check-meal', allergenCheckerController.checkMealVariant);
router.post('/allergies/check-variants', allergenCheckerController.checkMultipleVariants);
router.get('/students/:studentId/safe-variants', allergenCheckerController.getSafeMealVariants);
router.get('/allergies/history', allergenCheckerController.getCheckHistory);
router.post(
  '/allergies/override',
  authorize('ADMIN', 'SUPER_ADMIN'),
  allergenCheckerController.overrideCheck
);

// ============================================================================
// KITCHEN HYGIENE ROUTES (CRITICAL SAFETY - Daily checks)
// ============================================================================

router.post(
  '/hygiene-checks',
  authorize('ADMIN', 'SUPER_ADMIN'),
  kitchenHygieneController.create
);
router.get('/hygiene-checks', kitchenHygieneController.getAll);
router.get('/hygiene-checks/:id', kitchenHygieneController.getById);
router.get('/messes/:messId/today-check', kitchenHygieneController.getTodayCheck);
router.put(
  '/hygiene-checks/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  kitchenHygieneController.update
);
router.post(
  '/hygiene-checks/:id/record-correction',
  authorize('ADMIN', 'SUPER_ADMIN'),
  kitchenHygieneController.recordCorrection
);
router.get('/messes/:messId/compliance-report', kitchenHygieneController.getComplianceReport);
router.get(
  '/messes/:messId/can-serve',
  kitchenHygieneController.canServeMeals
);
router.delete(
  '/hygiene-checks/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  kitchenHygieneController.delete
);

// ============================================================================
// MENU APPROVAL ROUTES (Workflow & nutritional verification)
// ============================================================================

router.post(
  '/menus/submit',
  authorize('ADMIN', 'SUPER_ADMIN'),
  menuApprovalController.submit
);
router.get('/menu-approvals', menuApprovalController.getAll);
router.get('/menu-approvals/:id', menuApprovalController.getById);
router.get('/menus/:menuId/approval', menuApprovalController.getByMenu);
router.get('/menu-approvals/pending/list', menuApprovalController.getPending);
router.post(
  '/menu-approvals/:id/approve',
  authorize('ADMIN', 'SUPER_ADMIN'),
  menuApprovalController.approve
);
router.post(
  '/menu-approvals/:id/reject',
  authorize('ADMIN', 'SUPER_ADMIN'),
  menuApprovalController.reject
);
router.get('/menus/:menuId/nutrition-summary', menuApprovalController.calculateNutrition);
router.get('/menus/:menuId/allergen-warnings', menuApprovalController.identifyAllergenWarnings);
router.get('/menus/:menuId/can-serve', menuApprovalController.canServe);
router.delete(
  '/menu-approvals/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  menuApprovalController.delete
);

// ============================================================================
// PHASE 3: MENU PLANNING & MEAL MANAGEMENT
// ============================================================================

// ============================================================================
// MENU ROUTES
// ============================================================================

router.post('/menus', authorize('ADMIN', 'SUPER_ADMIN'), MenuController.create);
router.get('/menus', MenuController.getAll);
router.get('/menus/by-date/:messId/:date', MenuController.getByDate);
router.get('/menus/range/:messId', MenuController.getByDateRange);
router.get('/menus/:id', MenuController.getById);
router.put('/menus/:id', authorize('ADMIN', 'SUPER_ADMIN'), MenuController.update);
router.put('/menus/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), MenuController.updateStatus);
router.post('/menus/:id/publish', authorize('ADMIN', 'SUPER_ADMIN'), MenuController.publish);
router.delete('/menus/:id', authorize('ADMIN', 'SUPER_ADMIN'), MenuController.delete);
router.get('/menus/:id/statistics', MenuController.getStatistics);
router.post('/menus/clone-from-date', authorize('ADMIN', 'SUPER_ADMIN'), MenuController.cloneFromDate);

// ============================================================================
// MEAL ROUTES
// ============================================================================

router.post('/meals', authorize('ADMIN', 'SUPER_ADMIN'), MealController.create);
router.get('/meals', MealController.getAll);
router.get('/meals/by-menu/:menuId', MealController.getByMenu);
router.get('/meals/date-range/:messId', MealController.getMealsByDateRange);
router.get('/meals/:id', MealController.getById);
router.put('/meals/:id', authorize('ADMIN', 'SUPER_ADMIN'), MealController.update);
router.put('/meals/:id/serving-status', authorize('ADMIN', 'SUPER_ADMIN'), MealController.updateServingStatus);
router.delete('/meals/:id', authorize('ADMIN', 'SUPER_ADMIN'), MealController.delete);
router.get('/meals/:id/statistics', MealController.getStatistics);
router.get('/meals/:id/serving-window', MealController.getServingWindow);

// ============================================================================
// MEAL VARIANT ROUTES
// ============================================================================

router.post('/meal-variants', authorize('ADMIN', 'SUPER_ADMIN'), MealVariantController.create);
router.get('/meal-variants', MealVariantController.getAll);
router.get('/meal-variants/by-meal/:mealId', MealVariantController.getByMeal);
router.get('/meal-variants/grouped/:mealId', MealVariantController.getVariantsByMealGrouped);
router.get('/meal-variants/:id', MealVariantController.getById);
router.put('/meal-variants/:id', authorize('ADMIN', 'SUPER_ADMIN'), MealVariantController.update);
router.delete('/meal-variants/:id', authorize('ADMIN', 'SUPER_ADMIN'), MealVariantController.delete);
router.get('/meal-variants/:id/allergens', MealVariantController.getVariantWithAllergens);
router.get('/meal-variants/:id/statistics', MealVariantController.getVariantStatistics);
router.post('/meal-variants/:id/clone-to-meal', authorize('ADMIN', 'SUPER_ADMIN'), MealVariantController.cloneToMeal);

// ============================================================================
// MEAL CHOICE ROUTES (Student variant selection with allergen safety)
// ============================================================================

router.post('/meal-choices', MealChoiceController.create);
router.get('/meal-choices', MealChoiceController.getAll);
router.get('/meal-choices/available-variants/:studentId', MealChoiceController.getAvailableVariants);
router.get('/meal-choices/by-student/:studentId', MealChoiceController.getByStudent);
router.post('/meal-choices/verify-allergy/:id', MealChoiceController.verifyAllergy);
router.get('/meal-choices/:id', MealChoiceController.getById);
router.put('/meal-choices/:id', MealChoiceController.update);
router.delete('/meal-choices/:id', MealChoiceController.delete);

// ============================================================================
// PHASE 4: STUDENT ENROLLMENT & ATTENDANCE
// ============================================================================

// ============================================================================
// ENROLLMENT ROUTES
// ============================================================================

router.post('/enrollments', authorize('ADMIN', 'SUPER_ADMIN'), enrollmentController.create);
router.get('/enrollments', enrollmentController.getAll);
router.get('/enrollments/:id', enrollmentController.getById);
router.get('/students/:studentId/enrollments', enrollmentController.getStudentEnrollments);
router.put('/enrollments/:id', authorize('ADMIN', 'SUPER_ADMIN'), enrollmentController.update);
router.post('/enrollments/:id/end', authorize('ADMIN', 'SUPER_ADMIN'), enrollmentController.endEnrollment);
router.delete('/enrollments/:id', authorize('ADMIN', 'SUPER_ADMIN'), enrollmentController.delete);
router.get('/messes/:messId/enrollment-stats', enrollmentController.getMessStatistics);

// ============================================================================
// MEAL ATTENDANCE ROUTES (with allergen safety filtering)
// ============================================================================

router.post('/attendance/mark', mealAttendanceController.markAttendance);
router.get('/attendance', mealAttendanceController.getAll);
router.get('/attendance/:id', mealAttendanceController.getById);
router.get('/attendance/enrollment/:enrollmentId/monthly', mealAttendanceController.getMonthlyAttendance);
router.get('/attendance/enrollment/:enrollmentId/stats', mealAttendanceController.getAttendanceStats);
router.get('/meals/:mealId/safe-variants/:studentId', mealAttendanceController.getSafeVariants);
router.put('/attendance/:id', authorize('ADMIN', 'SUPER_ADMIN'), mealAttendanceController.update);
router.delete('/attendance/:id', authorize('ADMIN', 'SUPER_ADMIN'), mealAttendanceController.delete);

// ============================================================================
// HOLIDAY CALENDAR ROUTES
// ============================================================================

router.post('/holidays', authorize('ADMIN', 'SUPER_ADMIN'), holidayCalendarController.create);
router.post('/holidays/bulk', authorize('ADMIN', 'SUPER_ADMIN'), holidayCalendarController.bulkCreate);
router.get('/holidays', holidayCalendarController.getAll);
router.get('/holidays/:id', holidayCalendarController.getById);
router.get('/holidays/month/:year/:month', holidayCalendarController.getMonthHolidays);
router.get('/holidays/check/is-holiday', holidayCalendarController.isHoliday);
router.get('/holidays/upcoming', holidayCalendarController.getUpcomingHolidays);
router.get('/holidays/stats/:year', holidayCalendarController.getHolidayStats);
router.put('/holidays/:id', authorize('ADMIN', 'SUPER_ADMIN'), holidayCalendarController.update);
router.delete('/holidays/:id', authorize('ADMIN', 'SUPER_ADMIN'), holidayCalendarController.delete);

// ============================================================================
// PHASE 5: BILLING & FINANCIAL INTEGRATION
// ============================================================================

// ============================================================================
// MESS BILLS ROUTES
// ============================================================================

router.post('/bills/generate', authorize('ADMIN', 'SUPER_ADMIN'), messBillController.generateBill);
router.post('/bills/bulk-generate', authorize('ADMIN', 'SUPER_ADMIN'), messBillController.generateBulkBills);
router.get('/bills', messBillController.getBills);
router.get('/bills/overdue', authorize('ADMIN', 'SUPER_ADMIN'), messBillController.getOverdueBills);
router.get('/bills/stats', authorize('ADMIN', 'SUPER_ADMIN'), messBillController.getBillStats);
router.get('/bills/:id', messBillController.getBillById);
router.put('/bills/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), messBillController.updateBillStatus);
router.post('/bills/:id/payment', messBillController.recordPayment);
router.post('/bills/:id/sync-finance', authorize('ADMIN', 'SUPER_ADMIN'), messBillController.syncToFinance);
router.put('/bills/:id/cancel', authorize('ADMIN', 'SUPER_ADMIN'), messBillController.cancelBill);

// ============================================================================
// EXTRA MEAL BOOKINGS ROUTES
// ============================================================================

router.post('/extra-meals', extraMealController.bookExtraMeal);
router.get('/extra-meals', extraMealController.getExtraMeals);
router.get('/extra-meals/:id', extraMealController.getExtraMealById);
router.put('/extra-meals/:id', authorize('ADMIN', 'SUPER_ADMIN'), extraMealController.updateExtraMeal);
router.delete('/extra-meals/:id', authorize('ADMIN', 'SUPER_ADMIN'), extraMealController.cancelExtraMeal);
router.get('/enrollments/:enrollmentId/extra-meals/cost', extraMealController.getMonthlyExtraMealCost);
router.put('/extra-meals/:id/approve', authorize('ADMIN', 'SUPER_ADMIN'), extraMealController.approveExtraMeal);
router.put('/extra-meals/:id/mark-served', authorize('ADMIN', 'SUPER_ADMIN'), extraMealController.markAsServed);

export default router;
