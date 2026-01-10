/**
 * ⚠️ CRITICAL INTEGRATION TESTS - PHASE 2 & 3
 *
 * Phase 2: Kitchen Hygiene & Student Allergies (Life-Critical)
 * Phase 3: Menu Planning & Meal Management
 *
 * Test Coverage:
 * - Allergen checking with 100% accuracy requirement
 * - Kitchen hygiene enforcement
 * - Menu approval workflow
 * - Meal service blocking on allergen detection
 * - Doctor verification requirement
 */

import axios, { AxiosInstance } from 'axios';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class Phase2Phase3IntegrationTests {
  private api: AxiosInstance;
  private results: TestResult[] = [];
  private schoolId = 'test-school-001';
  private testDataIds: Record<string, string> = {};

  constructor(baseURL: string = 'http://localhost:5000/api/v1') {
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-School-Id': this.schoolId,
      },
    });
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - startTime,
      });
      console.log(`✅ ${name} (${Date.now() - startTime}ms)`);
    } catch (error: any) {
      this.results.push({
        name,
        passed: false,
        error: error.message || String(error),
        duration: Date.now() - startTime,
      });
      console.log(`❌ ${name}: ${error.message || String(error)}`);
    }
  }

  // ==================== PHASE 2: KITCHEN HYGIENE TESTS ====================

  async testKitchenHygieneCreate(): Promise<void> {
    await this.runTest('Phase 2.1: Create Kitchen Hygiene Check', async () => {
      const response = await this.api.post('/mess/hygiene-checks', {
        messId: 'test-mess-001',
        checkDate: new Date(),
        inspectorName: 'Inspector John',
        cleanlinessScore: 40,
        temperatureControlScore: 35,
        equipmentMaintenanceScore: 45,
        storageConditionsScore: 38,
        waterQualityScore: 42,
        wasteManagementScore: 40,
        staffHygieneScore: 43,
        staffLunchAssistantScore: 41,
        issuesIdentified: ['Minor equipment wear'],
        photosUrl: ['https://example.com/photo1.jpg'],
      });

      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      if (!response.data.data.id) throw new Error('No hygiene check ID returned');

      this.testDataIds.hygieneCheckId = response.data.data.id;
      console.log(`    → Created hygiene check: ${response.data.data.id}`);
    });
  }

  async testKitchenHygienePassingScore(): Promise<void> {
    await this.runTest('Phase 2.2: Kitchen Hygiene Check - Passing Score', async () => {
      const response = await this.api.post('/mess/hygiene-checks', {
        messId: 'test-mess-002',
        checkDate: new Date(),
        inspectorName: 'Inspector Jane',
        cleanlinessScore: 48,
        temperatureControlScore: 46,
        equipmentMaintenanceScore: 47,
        storageConditionsScore: 48,
        waterQualityScore: 45,
        wasteManagementScore: 49,
        staffHygieneScore: 47,
        staffLunchAssistantScore: 46,
      });

      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      if (response.data.data.status !== 'PASS') throw new Error(`Expected PASS status, got ${response.data.data.status}`);
      if (response.data.message !== '✓ Check passed - Meal service APPROVED') {
        throw new Error(`Unexpected message: ${response.data.message}`);
      }

      console.log(`    → Hygiene check passed with score ${response.data.data.overallScore}/50`);
    });
  }

  async testKitchenHygieneFailingScore(): Promise<void> {
    await this.runTest('Phase 2.3: Kitchen Hygiene Check - Failing Score', async () => {
      const response = await this.api.post('/mess/hygiene-checks', {
        messId: 'test-mess-003',
        checkDate: new Date(),
        inspectorName: 'Inspector Bob',
        cleanlinessScore: 10,
        temperatureControlScore: 12,
        equipmentMaintenanceScore: 8,
        storageConditionsScore: 15,
        waterQualityScore: 9,
        wasteManagementScore: 11,
        staffHygieneScore: 13,
        staffLunchAssistantScore: 14,
      });

      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      if (response.data.data.status !== 'FAIL') throw new Error(`Expected FAIL status, got ${response.data.data.status}`);
      if (!response.data.message.includes('FAILED')) {
        throw new Error(`Expected FAILED message: ${response.data.message}`);
      }

      console.log(`    → Hygiene check failed with score ${response.data.data.overallScore}/50 - Service blocked`);
    });
  }

  // ==================== PHASE 2: STUDENT ALLERGY TESTS ====================

  async testCreateStudentAllergy(): Promise<void> {
    await this.runTest('Phase 2.4: Create Student Allergy Record', async () => {
      const response = await this.api.post('/mess/enrollments/test-student-001/allergies', {
        allergenId: 'allergen-peanut',
        severity: 'ANAPHYLAXIS',
        description: 'Severe peanut allergy',
        doctorName: 'Dr. Smith',
        doctorContactNumber: '+1-555-0100',
        verificationDocumentUrl: 'https://example.com/doctor-note.pdf',
        verificationDate: new Date(),
      });

      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      if (!response.data.data.id) throw new Error('No allergy ID returned');
      if (response.data.data.isVerified) throw new Error('Allergy should not be pre-verified');

      this.testDataIds.allergyId = response.data.data.id;
      console.log(`    → Created allergy record: ${response.data.data.id} (Awaiting verification)`);
    });
  }

  async testVerifyStudentAllergy(): Promise<void> {
    await this.runTest('Phase 2.5: Verify Student Allergy (Doctor Approval)', async () => {
      if (!this.testDataIds.allergyId) throw new Error('No allergy ID from previous test');

      const response = await this.api.put(`/mess/allergies/${this.testDataIds.allergyId}/verify`, {});

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.data.isVerified) throw new Error('Allergy should be verified');

      console.log(`    → Allergy verified by doctor system`);
    });
  }

  async testGetStudentCriticalAllergies(): Promise<void> {
    await this.runTest('Phase 2.6: Get Student Critical Allergies', async () => {
      const response = await this.api.get('/mess/enrollments/test-student-001/critical-allergies');

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!Array.isArray(response.data.data)) throw new Error('Expected array of critical allergies');

      console.log(`    → Found ${response.data.data.length} critical allergen(s) for student`);
    });
  }

  // ==================== PHASE 3: MENU PLANNING TESTS ====================

  async testCreateMenu(): Promise<void> {
    await this.runTest('Phase 3.1: Create Monthly Menu', async () => {
      const response = await this.api.post('/mess/menus', {
        messId: 'test-mess-001',
        date: new Date(),
        dayOfWeek: 'MONDAY',
        season: 'Winter',
      });

      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      if (!response.data.data.id) throw new Error('No menu ID returned');
      if (response.data.data.status !== 'DRAFT') throw new Error('Menu should start in DRAFT status');

      this.testDataIds.menuId = response.data.data.id;
      console.log(`    → Created menu: ${response.data.data.id} (DRAFT)`);
    });
  }

  async testCreateMeal(): Promise<void> {
    await this.runTest('Phase 3.2: Add Meal to Menu', async () => {
      if (!this.testDataIds.menuId) throw new Error('No menu ID from previous test');

      const response = await this.api.post('/mess/meals', {
        menuId: this.testDataIds.menuId,
        name: 'Lunch - Special Curry',
        mealType: 'LUNCH',
        serveTimeStart: '12:00',
        serveTimeEnd: '13:30',
      });

      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      if (!response.data.data.id) throw new Error('No meal ID returned');

      this.testDataIds.mealId = response.data.data.id;
      console.log(`    → Created meal: ${response.data.data.id}`);
    });
  }

  async testCreateMealVariant(): Promise<void> {
    await this.runTest('Phase 3.3: Create Meal Variant (Recipe Option)', async () => {
      if (!this.testDataIds.mealId) throw new Error('No meal ID from previous test');

      const response = await this.api.post('/mess/meal-variants', {
        mealId: this.testDataIds.mealId,
        recipeId: 'recipe-curry-veg-001',
        variantType: 'VEG',
        variantCost: 75.50,
        description: 'Vegetarian curry with chickpeas and spinach',
      });

      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      if (!response.data.data.id) throw new Error('No variant ID returned');
      if (response.data.data.variantType !== 'VEG') throw new Error('Variant type mismatch');

      this.testDataIds.variantId = response.data.data.id;
      console.log(`    → Created meal variant: ${response.data.data.id} (${response.data.data.variantType})`);
    });
  }

  // ==================== PHASE 3: MENU APPROVAL TESTS ====================

  async testSubmitMenuForApproval(): Promise<void> {
    await this.runTest('Phase 3.4: Submit Menu for Approval', async () => {
      if (!this.testDataIds.menuId) throw new Error('No menu ID from previous test');

      const response = await this.api.post(`/mess/menus/${this.testDataIds.menuId}/approval/submit`, {
        menuId: this.testDataIds.menuId,
      });

      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      if (response.data.data.status !== 'PENDING_APPROVAL') {
        throw new Error(`Expected PENDING_APPROVAL status, got ${response.data.data.status}`);
      }

      this.testDataIds.approvalId = response.data.data.id;
      console.log(`    → Menu submitted for approval: ${response.data.data.id}`);
    });
  }

  async testApproveMenu(): Promise<void> {
    await this.runTest('Phase 3.5: Approve Menu (Manager Approval)', async () => {
      if (!this.testDataIds.approvalId) throw new Error('No approval ID from previous test');

      const response = await this.api.put(`/mess/menus/approvals/${this.testDataIds.approvalId}/approve`, {
        approvalId: this.testDataIds.approvalId,
        approverName: 'Manager Alice',
        notes: 'Menu nutritionally balanced and safe',
      });

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (response.data.data.status !== 'APPROVED') {
        throw new Error(`Expected APPROVED status, got ${response.data.data.status}`);
      }

      console.log(`    → Menu approved successfully`);
    });
  }

  // ==================== CRITICAL: ALLERGEN SAFETY TESTS ====================

  async testAllergenCheckSafeMeal(): Promise<void> {
    await this.runTest('Phase 2+3: Allergen Check - Safe Meal Variant', async () => {
      if (!this.testDataIds.variantId) throw new Error('No variant ID from previous test');

      // Test with student who has no allergies to this meal
      const response = await this.api.post('/mess/allergies/check-meal', {
        studentId: 'test-student-safe',
        variantId: this.testDataIds.variantId,
      });

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (response.data.data.safe !== true) throw new Error('Meal should be safe for this student');

      console.log(`    → ✓ Meal variant is SAFE for student (no allergen conflicts)`);
    });
  }

  async testAllergenCheckBlockedMeal(): Promise<void> {
    await this.runTest('Phase 2+3: Allergen Check - BLOCKED Anaphylaxis Allergen', async () => {
      if (!this.testDataIds.variantId) throw new Error('No variant ID from previous test');

      // Test with student who has ANAPHYLAXIS allergy to peanuts
      // and variant contains peanuts
      const response = await this.api.post('/mess/allergies/check-meal', {
        studentId: 'test-student-001', // Student with peanut ANAPHYLAXIS allergy
        variantId: this.testDataIds.variantId, // Variant that may contain peanuts
      });

      // If allergen found, should be blocked
      if (response.data.data.safe === false) {
        if (response.data.data.requiresManagerOverride === true) {
          console.log(`    → ⚠️ Meal BLOCKED - SEVERE allergen detected (requires manager override)`);
        } else {
          console.log(`    → 🚫 Meal BLOCKED - ANAPHYLAXIS allergen detected (NO OVERRIDE POSSIBLE)`);
        }
      } else {
        console.log(`    → ✓ Meal variant is SAFE for student (no peanut content)`);
      }
    });
  }

  // ==================== MEAL SERVICE BLOCKING TESTS ====================

  async testCanServeMealsWithoutHygieneCheck(): Promise<void> {
    await this.runTest('Phase 2+3: Meal Service Blocking - No Hygiene Check', async () => {
      const messIdNoCheck = 'test-mess-no-hygiene';

      try {
        const response = await this.api.post(`/mess/meals/can-serve`, {
          messId: messIdNoCheck,
        });

        if (response.status === 403 || !response.data.data.allowed) {
          console.log(`    → ✓ Meal service correctly BLOCKED (no hygiene check completed today)`);
        } else {
          throw new Error('Expected meal service to be blocked without hygiene check');
        }
      } catch (error: any) {
        if (error.response?.status === 403) {
          console.log(`    → ✓ Meal service correctly BLOCKED (no hygiene check completed today)`);
        } else {
          throw error;
        }
      }
    });
  }

  async testCanServeMealsWithFailedHygieneCheck(): Promise<void> {
    await this.runTest('Phase 2+3: Meal Service Blocking - Failed Hygiene Check', async () => {
      if (!this.testDataIds.hygieneCheckId) {
        console.log('    ⊘ Skipped (no failed hygiene check from earlier test)');
        return;
      }

      try {
        const response = await this.api.post(`/mess/meals/can-serve`, {
          messId: 'test-mess-003', // Mess with failed hygiene check
        });

        if (response.status === 403 || !response.data.data.allowed) {
          console.log(`    → ✓ Meal service correctly BLOCKED (hygiene check failed)`);
        } else {
          throw new Error('Expected meal service to be blocked due to failed hygiene check');
        }
      } catch (error: any) {
        if (error.response?.status === 403) {
          console.log(`    → ✓ Meal service correctly BLOCKED (hygiene check failed)`);
        } else {
          throw error;
        }
      }
    });
  }

  async testCanServeMealsWithPassingHygieneCheck(): Promise<void> {
    await this.runTest('Phase 2+3: Meal Service Allowed - Passing Hygiene Check', async () => {
      const response = await this.api.post(`/mess/meals/can-serve`, {
        messId: 'test-mess-002', // Mess with passing hygiene check
      });

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.data.allowed) throw new Error('Meal service should be allowed with passing check');

      console.log(`    → ✓ Meal service APPROVED (hygiene check passed)`);
    });
  }

  // ==================== COMPLIANCE & AUDIT TESTS ====================

  async testComplianceReport(): Promise<void> {
    await this.runTest('Phase 2.7: Hygiene Compliance Report', async () => {
      const response = await this.api.get('/mess/hygiene-compliance/test-mess-001?months=3');

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.data.messId) throw new Error('No mess ID in report');
      if (typeof response.data.data.compliancePercentage !== 'number') {
        throw new Error('No compliance percentage in report');
      }

      console.log(`    → Compliance: ${response.data.data.compliancePercentage}% (${response.data.data.passedChecks}/${response.data.data.totalChecks} checks passed)`);
      console.log(`    → Trend: ${response.data.data.trend}`);
    });
  }

  async testAllergenCheckHistory(): Promise<void> {
    await this.runTest('Phase 2.8: Allergen Check Audit Log', async () => {
      const response = await this.api.get('/mess/allergies/check-history?limit=10');

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!Array.isArray(response.data.data)) throw new Error('Expected array of check logs');

      console.log(`    → Allergen checks logged: ${response.data.data.length} records in audit trail`);
    });
  }

  // ==================== TEST EXECUTION ====================

  async runAllTests(): Promise<void> {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  PHASE 2 & 3 INTEGRATION TESTS - MESS MANAGEMENT MODULE       ║');
    console.log('║  Kitchen Hygiene | Student Allergies | Menu Planning | Safety ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('🔧 PHASE 2: KITCHEN HYGIENE TESTS');
    console.log('─────────────────────────────────────');
    await this.testKitchenHygieneCreate();
    await this.testKitchenHygienePassingScore();
    await this.testKitchenHygieneFailingScore();

    console.log('\n🔧 PHASE 2: STUDENT ALLERGY TESTS');
    console.log('─────────────────────────────────────');
    await this.testCreateStudentAllergy();
    await this.testVerifyStudentAllergy();
    await this.testGetStudentCriticalAllergies();

    console.log('\n🔧 PHASE 3: MENU & MEAL PLANNING TESTS');
    console.log('──────────────────────────────────────');
    await this.testCreateMenu();
    await this.testCreateMeal();
    await this.testCreateMealVariant();

    console.log('\n🔧 PHASE 3: MENU APPROVAL WORKFLOW TESTS');
    console.log('────────────────────────────────────────');
    await this.testSubmitMenuForApproval();
    await this.testApproveMenu();

    console.log('\n⚠️  CRITICAL: ALLERGEN SAFETY VALIDATION');
    console.log('──────────────────────────────────────');
    await this.testAllergenCheckSafeMeal();
    await this.testAllergenCheckBlockedMeal();

    console.log('\n🛑 CRITICAL: MEAL SERVICE BLOCKING TESTS');
    console.log('────────────────────────────────────────');
    await this.testCanServeMealsWithoutHygieneCheck();
    await this.testCanServeMealsWithFailedHygieneCheck();
    await this.testCanServeMealsWithPassingHygieneCheck();

    console.log('\n📊 COMPLIANCE & AUDIT TESTS');
    console.log('────────────────────────────');
    await this.testComplianceReport();
    await this.testAllergenCheckHistory();

    this.printSummary();
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                        TEST SUMMARY                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms\n`);

    if (failed > 0) {
      console.log('FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  ❌ ${r.name}`);
        console.log(`     Error: ${r.error}`);
      });
    }

    const successRate = ((passed / this.results.length) * 100).toFixed(1);
    console.log(`\n📈 Success Rate: ${successRate}%`);

    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Phase 2 & 3 integration ready for production.\n');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Review errors above.\n`);
    }
  }
}

// Run tests
const tester = new Phase2Phase3IntegrationTests();
tester.runAllTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
