import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller';
import { designationController } from '../controllers/designation.controller';
import { salaryController } from '../controllers/salary.controller';
import { payslipController } from '../controllers/payslip.controller';
import { salaryRevisionController } from '../controllers/salary-revision.controller';
import { leaveBalanceController } from '../controllers/leave-balance.controller';
import { performanceReviewController } from '../controllers/performance-review.controller';
import { employeePromotionController } from '../controllers/employee-promotion.controller';
import { employeeTransferController } from '../controllers/employee-transfer.controller';
import { employeeSeparationController } from '../controllers/employee-separation.controller';

const router = Router();

// ============================================================================
// EMPLOYEE MANAGEMENT ROUTES
// ============================================================================

// Employees
router.post('/employees', employeeController.createEmployee);
router.get('/employees', employeeController.getEmployees);
router.get('/employees/count/active', employeeController.getActiveEmployeeCount);
router.get('/employees/:id', employeeController.getEmployeeById);
router.put('/employees/:id', employeeController.updateEmployee);
router.delete('/employees/:id', employeeController.deleteEmployee);
router.get('/employees/number/:employeeNo', employeeController.getEmployeeByEmployeeNo);
router.get('/employees/department/:departmentId', employeeController.getEmployeesByDepartment);
router.get('/employees/:managerId/subordinates', employeeController.getSubordinates);
router.put('/employees/:id/status', employeeController.updateEmployeeStatus);

// Designations
router.post('/designations', designationController.createDesignation);
router.get('/designations', designationController.getDesignations);
router.get('/designations/hierarchy', designationController.getDesignationHierarchy);
router.get('/designations/:id', designationController.getDesignationById);
router.put('/designations/:id', designationController.updateDesignation);
router.delete('/designations/:id', designationController.deleteDesignation);
router.post('/designations/validate-salary', designationController.validateSalaryRange);
router.get('/designations/level/:level', designationController.getDesignationsByLevel);

// ============================================================================
// PAYROLL & SALARY ROUTES
// ============================================================================

// Salaries
router.post('/salaries', salaryController.createSalary);
router.get('/salaries', salaryController.getSalaries);
router.get('/salaries/:id', salaryController.getSalaryById);
router.put('/salaries/:id', salaryController.updateSalary);
router.delete('/salaries/:id', salaryController.deleteSalary);
router.get('/salaries/employee/:employeeId/current', salaryController.getCurrentSalary);
router.get('/salaries/employee/:employeeId/history', salaryController.getEmployeeSalaryHistory);
router.post('/salaries/payroll/calculate', salaryController.calculateTotalPayroll);
router.post('/salaries/:id/recalculate', salaryController.recalculateSalary);

// Payslips
router.post('/payslips', payslipController.createPayslip);
router.post('/payslips/generate', payslipController.generatePayslips);
router.get('/payslips', payslipController.getPayslips);
router.get('/payslips/stats', payslipController.getPayslipStats);
router.get('/payslips/:id', payslipController.getPayslipById);
router.put('/payslips/:id', payslipController.updatePayslip);
router.post('/payslips/:id/finalize', payslipController.finalizePayslip);
router.post('/payslips/:id/mark-paid', payslipController.markPayslipAsPaid);
router.post('/payslips/:id/cancel', payslipController.cancelPayslip);

// Salary Revisions
router.post('/salary-revisions', salaryRevisionController.createSalaryRevision);
router.get('/salary-revisions', salaryRevisionController.getSalaryRevisions);
router.get('/salary-revisions/:id', salaryRevisionController.getSalaryRevisionById);
router.put('/salary-revisions/:id', salaryRevisionController.updateSalaryRevision);
router.delete('/salary-revisions/:id', salaryRevisionController.deleteSalaryRevision);
router.get('/salary-revisions/employee/:employeeId/latest', salaryRevisionController.getLatestSalaryRevision);
router.get('/salary-revisions/employee/:employeeId/increase', salaryRevisionController.calculateTotalSalaryIncrease);
router.get('/salary-revisions/stats/by-reason', salaryRevisionController.getRevisionStatsByReason);

// ============================================================================
// LEAVE MANAGEMENT ROUTES
// ============================================================================

router.post('/leave-balances', leaveBalanceController.createLeaveBalance);
router.get('/leave-balances', leaveBalanceController.getLeaveBalances);
router.get('/leave-balances/:id', leaveBalanceController.getLeaveBalanceById);
router.put('/leave-balances/:id', leaveBalanceController.updateLeaveBalance);
router.delete('/leave-balances/:id', leaveBalanceController.deleteLeaveBalance);
router.post('/leave-balances/:id/deduct', leaveBalanceController.deductLeave);
router.post('/leave-balances/:id/restore', leaveBalanceController.restoreLeave);
router.get('/leave-balances/:id/available/:leaveType', leaveBalanceController.getAvailableLeave);
router.get('/leave-balances/employee/:employeeId/current', leaveBalanceController.getCurrentLeaveBalance);
router.post('/leave-balances/:id/carry-over', leaveBalanceController.processCarryOver);

// ============================================================================
// PERFORMANCE MANAGEMENT ROUTES
// ============================================================================

router.post('/performance-reviews', performanceReviewController.createPerformanceReview);
router.get('/performance-reviews', performanceReviewController.getPerformanceReviews);
router.get('/performance-reviews/eligible', performanceReviewController.getPromotionEligibleEmployees);
router.get('/performance-reviews/:id', performanceReviewController.getPerformanceReviewById);
router.put('/performance-reviews/:id', performanceReviewController.updatePerformanceReview);
router.delete('/performance-reviews/:id', performanceReviewController.deletePerformanceReview);
router.get('/performance-reviews/cycle/:cycleId/stats', performanceReviewController.getCyclePerformanceStats);
router.get('/performance-reviews/department/:departmentId/stats', performanceReviewController.getDepartmentPerformanceStats);

// ============================================================================
// EMPLOYEE MOVEMENT ROUTES
// ============================================================================

// Promotions
router.post('/promotions', employeePromotionController.createPromotion);
router.get('/promotions', employeePromotionController.getPromotions);
router.get('/promotions/:id', employeePromotionController.getPromotionById);
router.put('/promotions/:id', employeePromotionController.updatePromotion);
router.delete('/promotions/:id', employeePromotionController.deletePromotion);
router.post('/promotions/:id/approve', employeePromotionController.approvePromotion);
router.post('/promotions/date-range', employeePromotionController.getPromotionsByDateRange);
router.get('/promotions/stats/by-designation', employeePromotionController.getPromotionStatsByDesignation);

// Transfers
router.post('/transfers', employeeTransferController.createTransfer);
router.get('/transfers', employeeTransferController.getTransfers);
router.get('/transfers/pending', employeeTransferController.getPendingTransfers);
router.get('/transfers/:id', employeeTransferController.getTransferById);
router.put('/transfers/:id', employeeTransferController.updateTransfer);
router.delete('/transfers/:id', employeeTransferController.deleteTransfer);
router.get('/transfers/employee/:employeeId', employeeTransferController.getEmployeeTransfers);
router.get('/transfers/employee/:employeeId/latest', employeeTransferController.getLatestTransfer);
router.post('/transfers/:id/approve', employeeTransferController.approveTransfer);
router.post('/transfers/:id/reject', employeeTransferController.rejectTransfer);
router.post('/transfers/date-range', employeeTransferController.getTransfersByDateRange);
router.get('/transfers/department/:departmentId', employeeTransferController.getDepartmentTransfers);
router.get('/transfers/stats/by-department', employeeTransferController.getTransferStatsByDepartment);

// ============================================================================
// EMPLOYEE SEPARATION & EXIT ROUTES
// ============================================================================

router.post('/separations', employeeSeparationController.createSeparation);
router.get('/separations', employeeSeparationController.getSeparations);
router.get('/separations/pending', employeeSeparationController.getPendingSettlements);
router.get('/separations/stats', employeeSeparationController.getSeparationStats);
router.get('/separations/stats/average-settlement', employeeSeparationController.getAvgSettlementAmount);
router.get('/separations/:id', employeeSeparationController.getSeparationById);
router.put('/separations/:id', employeeSeparationController.updateSeparation);
router.post('/separations/:id/calculate-settlement', employeeSeparationController.calculateSettlement);
router.post('/separations/:id/approve-settlement', employeeSeparationController.approveFinalSettlement);
router.post('/separations/:id/generate-certificate', employeeSeparationController.generateExperienceCertificate);
router.get('/separations/employee/:employeeId', employeeSeparationController.getEmployeeSeparations);
router.get('/separations/type/:type', employeeSeparationController.getSeparationsByType);
router.post('/separations/date-range', employeeSeparationController.getSeparationsByDateRange);

export default router;
