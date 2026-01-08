/**
 * HR Module Services - Central Export
 *
 * This file exports all HR-related services for easy importing throughout the application.
 *
 * Usage:
 * import { employeeService, salaryService, ... } from '@/services/hr';
 */

// Core Employee Management
export { employeeService } from '../employee.service';
export { designationService } from '../designation.service';

// Salary & Payroll
export { salaryService } from '../salary.service';
export { payslipService } from '../payslip.service';
export { salaryRevisionService } from '../salary-revision.service';

// Leave Management
export { leaveBalanceService } from '../leave-balance.service';

// Performance Management
export { performanceReviewService } from '../performance-review.service';

// Employee Movement
export { employeePromotionService } from '../employee-promotion.service';
export { employeeTransferService } from '../employee-transfer.service';

// Employee Separation & Exit
export { employeeSeparationService } from '../employee-separation.service';

// Type Exports
export type {
  // Employee
  EmployeeFilters,
  CreateEmployeeData,
  UpdateEmployeeData,
} from '../employee.service';

export type {
  // Salary
  SalaryFilters,
  CreateSalaryData,
  UpdateSalaryData,
} from '../salary.service';

export type {
  // Payslip
  PayslipFilters,
  CreatePayslipData,
  UpdatePayslipData,
} from '../payslip.service';

export type {
  // Leave Balance
  LeaveBalanceFilters,
  CreateLeaveBalanceData,
  UpdateLeaveBalanceData,
  LeaveDeductionData,
} from '../leave-balance.service';

export type {
  // Performance Review
  PerformanceReviewFilters,
  CreatePerformanceReviewData,
  UpdatePerformanceReviewData,
} from '../performance-review.service';

export type {
  // Promotion
  PromotionFilters,
  CreatePromotionData,
  UpdatePromotionData,
} from '../employee-promotion.service';

export type {
  // Transfer
  TransferFilters,
  CreateTransferData,
  UpdateTransferData,
} from '../employee-transfer.service';

export type {
  // Separation
  SeparationFilters,
  CreateSeparationData,
  UpdateSeparationData,
  SettlementCalculationData,
} from '../employee-separation.service';
