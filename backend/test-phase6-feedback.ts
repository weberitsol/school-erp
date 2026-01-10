/**
 * ⚠️ PHASE 6 FEEDBACK, COMPLAINTS & VENDOR MANAGEMENT TESTS
 * Meal Feedback, Feedback Actions, Mess Complaints, and Vendor Management
 */

import { PrismaClient } from '@prisma/client';
import { feedbackService } from './src/services/feedback.service';
import { feedbackActionService } from './src/services/feedback-action.service';
import { messComplaintService } from './src/services/mess-complaint.service';
import { vendorService } from './src/services/vendor.service';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({
      name,
      status: 'FAIL',
      error: error.message,
    });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

async function runTests() {
  console.log('Starting Phase 6 Integration Tests...\n');

  // Setup: Create test data
  let testSchool: any;
  let testStudent: any;
  let testStudent2: any;
  let testMeal: any;
  let testVendor: any;

  try {
    // Create test school
    testSchool = await prisma.school.create({
      data: {
        name: 'Test School Phase 6',
        code: `PHSIX${Date.now()}`,
        country: 'India',
      },
    });

    // Create test users and students
    const testUser = await prisma.user.create({
      data: {
        email: `student-phase6-${Date.now()}@test.com`,
        password: 'test',
        role: 'STUDENT',
        schoolId: testSchool.id,
      },
    });

    const testUser2 = await prisma.user.create({
      data: {
        email: `student2-phase6-${Date.now()}@test.com`,
        password: 'test',
        role: 'STUDENT',
        schoolId: testSchool.id,
      },
    });

    testStudent = await prisma.student.create({
      data: {
        userId: testUser.id,
        admissionNo: `TST${Date.now()}`,
        firstName: 'Test',
        lastName: 'Student',
        dateOfBirth: new Date('2010-01-01'),
        gender: 'MALE',
      },
    });

    testStudent2 = await prisma.student.create({
      data: {
        userId: testUser2.id,
        admissionNo: `TST2${Date.now()}`,
        firstName: 'Test2',
        lastName: 'Student2',
        dateOfBirth: new Date('2010-01-01'),
        gender: 'FEMALE',
      },
    });

    // Create test mess facility
    const testMess = await prisma.mess.create({
      data: {
        name: 'Test Mess Phase 6',
        code: `MESS${Date.now()}`,
        capacity: 100,
        schoolId: testSchool.id,
      },
    });

    // Create test menu
    const testMenu = await prisma.menu.create({
      data: {
        messId: testMess.id,
        date: new Date(),
        dayOfWeek: 'MONDAY',
        season: 'Winter',
        status: 'APPROVED',
        schoolId: testSchool.id,
      },
    });

    // Create test meal
    testMeal = await prisma.meal.create({
      data: {
        menuId: testMenu.id,
        name: 'Test Meal',
        mealType: 'LUNCH',
        serveTimeStart: '12:00',
        serveTimeEnd: '13:30',
        schoolId: testSchool.id,
      },
    });

    console.log('✓ Test data created successfully\n');
  } catch (error: any) {
    console.error('⚠️ Failed to create test data:', error.message);
    process.exit(1);
  }

  // ============================================================================
  // TEST 1: Meal Feedback CRUD Operations
  // ============================================================================
  await test('Create meal feedback', async () => {
    const feedback = await feedbackService.createFeedback({
      mealId: testMeal.id,
      studentId: testStudent.id,
      schoolId: testSchool.id,
      rating: 'EXCELLENT',
      comments: 'Excellent meal quality',
    });

    if (!feedback.id || feedback.rating !== 'EXCELLENT') {
      throw new Error('Feedback not created properly');
    }
  });

  await test('Get all feedbacks', async () => {
    const response = await feedbackService.getFeedback({
      schoolId: testSchool.id,
    });

    if (!response.data || response.total === 0) {
      throw new Error('Feedbacks not retrieved');
    }
  });

  await test('Update feedback', async () => {
    const feedbacks = await feedbackService.getFeedback({
      schoolId: testSchool.id,
    });

    if (feedbacks.data.length === 0) {
      throw new Error('No feedbacks to update');
    }

    const updated = await feedbackService.updateFeedback(feedbacks.data[0].id, {
      rating: 'GOOD',
      comments: 'Updated comment',
    });

    if (updated.rating !== 'GOOD') {
      throw new Error('Feedback not updated properly');
    }
  });

  await test('Get meal feedback stats', async () => {
    const stats = await feedbackService.getMealFeedbackStats(testMeal.id);

    if (!stats || stats.totalFeedbacks === 0) {
      throw new Error('Stats not calculated properly');
    }
  });

  await test('Get school feedback stats', async () => {
    const stats = await feedbackService.getSchoolFeedbackStats(testSchool.id);

    if (!stats || stats.totalFeedbacks === 0) {
      throw new Error('School stats not calculated');
    }
  });

  // ============================================================================
  // TEST 2: Feedback Action Tracking
  // ============================================================================
  await test('Create feedback action', async () => {
    const feedbacks = await feedbackService.getFeedback({
      schoolId: testSchool.id,
    });

    const action = await feedbackActionService.createAction({
      feedbackId: feedbacks.data[0].id,
      schoolId: testSchool.id,
      actionDescription: 'Improve meal quality',
      actionDate: new Date(),
    });

    if (!action.id || action.status !== 'OPEN') {
      throw new Error('Action not created properly');
    }
  });

  await test('Update feedback action', async () => {
    const actions = await feedbackActionService.getActions({
      schoolId: testSchool.id,
    });

    if (actions.data.length === 0) {
      throw new Error('No actions found');
    }

    const updated = await feedbackActionService.updateAction(actions.data[0].id, {
      actionDescription: 'Updated action description',
    });

    if (updated.actionDescription !== 'Updated action description') {
      throw new Error('Action not updated');
    }
  });

  await test('Complete feedback action', async () => {
    const actions = await feedbackActionService.getActions({
      schoolId: testSchool.id,
    });

    const completed = await feedbackActionService.completeAction(actions.data[0].id);

    if (completed.status !== 'COMPLETED') {
      throw new Error('Action not marked as completed');
    }
  });

  await test('Get open actions', async () => {
    const actions = await feedbackActionService.getOpenActions(testSchool.id);

    if (!Array.isArray(actions)) {
      throw new Error('Open actions not retrieved');
    }
  });

  await test('Get action statistics', async () => {
    const stats = await feedbackActionService.getActionStats(testSchool.id);

    if (!stats || stats.totalActions === undefined) {
      throw new Error('Action stats not calculated');
    }
  });

  // ============================================================================
  // TEST 3: Mess Complaint Management
  // ============================================================================
  await test('Create mess complaint', async () => {
    const complaint = await messComplaintService.createComplaint({
      studentId: testStudent.id,
      schoolId: testSchool.id,
      title: 'Food quality issue',
      description: 'The meal was not fresh',
      category: 'FOOD_QUALITY',
    });

    if (!complaint.id || complaint.status !== 'OPEN') {
      throw new Error('Complaint not created properly');
    }
  });

  await test('Get all complaints', async () => {
    const response = await messComplaintService.getComplaints({
      schoolId: testSchool.id,
    });

    if (!response.data || response.total === 0) {
      throw new Error('Complaints not retrieved');
    }
  });

  await test('Update complaint status', async () => {
    const complaints = await messComplaintService.getComplaints({
      schoolId: testSchool.id,
    });

    const updated = await messComplaintService.updateComplaintStatus(
      complaints.data[0].id,
      'IN_PROGRESS',
      'We are investigating'
    );

    if (updated.status !== 'IN_PROGRESS') {
      throw new Error('Status not updated');
    }
  });

  await test('Get open complaints', async () => {
    // Create another complaint in OPEN status
    await messComplaintService.createComplaint({
      studentId: testStudent2.id,
      schoolId: testSchool.id,
      title: 'Portion size complaint',
      description: 'Portions were too small',
      category: 'QUANTITY',
    });

    const response = await messComplaintService.getOpenComplaints(testSchool.id);

    if (!response.data || response.total === 0) {
      throw new Error('Open complaints not retrieved');
    }
  });

  await test('Get complaint statistics', async () => {
    const stats = await messComplaintService.getComplaintStats(testSchool.id);

    if (!stats || stats.totalComplaints === 0) {
      throw new Error('Complaint stats not calculated');
    }
  });

  await test('Get complaint summary', async () => {
    const summary = await messComplaintService.getComplaintSummary(testSchool.id);

    if (!summary || !summary.OPEN) {
      throw new Error('Complaint summary not calculated');
    }
  });

  // ============================================================================
  // TEST 4: Vendor Management
  // ============================================================================
  await test('Create vendor', async () => {
    const vendor = await vendorService.createVendor({
      name: 'Test Vendor',
      code: `VEND${Date.now()}`,
      vendorType: 'FOOD_SUPPLIER',
      schoolId: testSchool.id,
      contactPerson: 'John Doe',
      email: 'vendor@test.com',
      phone: '1234567890',
    });

    if (!vendor.id || !vendor.isActive) {
      throw new Error('Vendor not created properly');
    }

    testVendor = vendor;
  });

  await test('Get all vendors', async () => {
    const response = await vendorService.getVendors({
      schoolId: testSchool.id,
    });

    if (!response.data || response.total === 0) {
      throw new Error('Vendors not retrieved');
    }
  });

  await test('Update vendor', async () => {
    const updated = await vendorService.updateVendor(testVendor.id, {
      contactPerson: 'Jane Doe',
      email: 'jane@test.com',
    });

    if (updated.contactPerson !== 'Jane Doe') {
      throw new Error('Vendor not updated');
    }
  });

  await test('Update vendor performance rating', async () => {
    const updated = await vendorService.updatePerformanceRating(testVendor.id, 4.5);

    if (!updated.performanceRating) {
      throw new Error('Performance rating not updated');
    }
  });

  await test('Update vendor quality score', async () => {
    const updated = await vendorService.updateQualityScore(testVendor.id, 85);

    if (updated.qualityScore !== 85) {
      throw new Error('Quality score not updated');
    }
  });

  await test('Update vendor delivery score', async () => {
    const updated = await vendorService.updateDeliveryScore(testVendor.id, 90);

    if (updated.deliveryScore !== 90) {
      throw new Error('Delivery score not updated');
    }
  });

  await test('Deactivate vendor', async () => {
    const deactivated = await vendorService.deactivateVendor(testVendor.id);

    if (deactivated.isActive) {
      throw new Error('Vendor not deactivated');
    }
  });

  await test('Reactivate vendor', async () => {
    const reactivated = await vendorService.reactivateVendor(testVendor.id);

    if (!reactivated.isActive) {
      throw new Error('Vendor not reactivated');
    }
  });

  await test('Get active vendors', async () => {
    const response = await vendorService.getActiveVendors(testSchool.id);

    if (!response.data || response.total === 0) {
      throw new Error('Active vendors not retrieved');
    }
  });

  await test('Get vendor statistics', async () => {
    const stats = await vendorService.getVendorStats(testSchool.id);

    if (!stats || stats.totalVendors === 0) {
      throw new Error('Vendor stats not calculated');
    }
  });

  await test('Get top rated vendors', async () => {
    const vendors = await vendorService.getTopRatedVendors(testSchool.id, 5);

    if (!Array.isArray(vendors)) {
      throw new Error('Top rated vendors not retrieved');
    }
  });

  // ============================================================================
  // Cleanup
  // ============================================================================
  console.log('\nCleaning up test data...');
  try {
    await prisma.mealFeedback.deleteMany({
      where: { schoolId: testSchool.id },
    });
    await prisma.feedbackAction.deleteMany({
      where: { schoolId: testSchool.id },
    });
    await prisma.messComplaint.deleteMany({
      where: { schoolId: testSchool.id },
    });
    await prisma.vendor.deleteMany({
      where: { schoolId: testSchool.id },
    });
    await prisma.meal.deleteMany({
      where: { schoolId: testSchool.id },
    });
    await prisma.menu.deleteMany({
      where: { schoolId: testSchool.id },
    });
    await prisma.mess.deleteMany({
      where: { schoolId: testSchool.id },
    });
    await prisma.student.deleteMany({
      where: { user: { schoolId: testSchool.id } },
    });
    await prisma.user.deleteMany({
      where: { schoolId: testSchool.id, email: { contains: 'phase6' } },
    });
    await prisma.school.delete({
      where: { id: testSchool.id },
    });
    console.log('Test data cleaned up\n');
  } catch (error: any) {
    console.error('Cleanup error:', error.message);
  }

  // Print results
  console.log('============================================================================');
  console.log('PHASE 6 TEST RESULTS');
  console.log('============================================================================\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n${passed}/${results.length} tests passed`);

  if (failed > 0) {
    console.log(`${failed} test(s) failed`);
    process.exit(1);
  }

  process.exit(0);
}

runTests().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
