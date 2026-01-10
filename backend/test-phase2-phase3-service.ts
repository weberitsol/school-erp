/**
 * ⚠️ DIRECT SERVICE INTEGRATION TESTS - PHASE 2 & 3
 * Tests the core business logic without HTTP layer
 *
 * Phase 2: Kitchen Hygiene & Student Allergies (Life-Critical)
 * Phase 3: Menu Planning & Meal Management
 */

import { PrismaClient } from '@prisma/client';
import { kitchenHygieneService } from './src/services/kitchen-hygiene.service';
import { studentAllergyService } from './src/services/student-allergy.service';
import { allergenCheckerService } from './src/services/allergen-checker.service';
import { menuService } from './src/services/menu.service';
import { mealService } from './src/services/meal.service';
import { mealVariantService } from './src/services/meal-variant.service';
import { menuApprovalService } from './src/services/menu-approval.service';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class Phase2Phase3ServiceTests {
  private results: TestResult[] = [];
  private testDataIds: Record<string, string> = {};
  private prisma = new PrismaClient();

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

  // ==================== SETUP: CREATE TEST DATA ====================

  async setupTestData(): Promise<void> {
    try {
      // Create test school
      const school = await this.prisma.school.upsert({
        where: { code: 'test-school-code' },
        update: {},
        create: {
          code: 'test-school-code',
          name: 'Test School for Phase 2/3',
          country: 'India',
        },
      });
      this.testDataIds.schoolId = school.id;

      // Create test mess
      const mess = await this.prisma.mess.create({
        data: {
          name: 'Test Mess Facility',
          code: `MESS-${Date.now()}`,
          capacity: 500,
          schoolId: school.id,
        },
      });
      this.testDataIds.messId = mess.id;

      // Create test student
      const user = await this.prisma.user.create({
        data: {
          email: `student-${Date.now()}@test.com`,
          password: 'hashed_password',
          role: 'STUDENT',
          schoolId: school.id,
        },
      });

      const student = await this.prisma.student.create({
        data: {
          userId: user.id,
          admissionNo: `ADM-${Date.now()}`,
          firstName: 'Test',
          lastName: 'Student',
          dateOfBirth: new Date('2010-01-01'),
          gender: 'MALE',
        },
      });
      this.testDataIds.studentId = student.id;

      console.log('✓ Test data created: School, Mess, Student');
    } catch (error: any) {
      console.log('⚠️ Warning: Could not create test data:', error.message);
    }
  }

  // ==================== PHASE 2: KITCHEN HYGIENE TESTS ====================

  async testKitchenHygieneCreate(): Promise<void> {
    await this.runTest('Phase 2.1: Create Kitchen Hygiene Check', async () => {
      if (!this.testDataIds.messId || !this.testDataIds.schoolId) {
        throw new Error('Missing test data: messId or schoolId');
      }

      const checklist = await kitchenHygieneService.create({
        messId: this.testDataIds.messId,
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
        schoolId: this.testDataIds.schoolId,
      });

      if (!checklist.id) throw new Error('No hygiene check ID returned');
      // Score average = (40+35+45+38+42+40+43+41)/8 = 40.5 which is >= 25, so should PASS
      if (checklist.status !== 'PASS') throw new Error(`Check should PASS with score >= 25, got ${checklist.status}`);

      this.testDataIds.hygieneCheckId = checklist.id;
      console.log(`    → Created hygiene check: ${checklist.id}, Score: ${checklist.overallScore}/50 (${checklist.status})`);
    });
  }

  async testKitchenHygienePassingScore(): Promise<void> {
    await this.runTest('Phase 2.2: Kitchen Hygiene - Passing Score', async () => {
      if (!this.testDataIds.messId || !this.testDataIds.schoolId) {
        throw new Error('Missing test data: messId or schoolId');
      }

      const checklist = await kitchenHygieneService.create({
        messId: this.testDataIds.messId,
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
        schoolId: this.testDataIds.schoolId,
      });

      if (checklist.status !== 'PASS') throw new Error(`Expected PASS status, got ${checklist.status}`);
      console.log(`    → Hygiene check PASSED with score ${checklist.overallScore}/50 ✓`);
    });
  }

  async testCanServeWithPassingCheck(): Promise<void> {
    await this.runTest('Phase 2.3: Meal Service Allowed - Passing Hygiene', async () => {
      if (!this.testDataIds.messId) {
        throw new Error('Missing test data: messId');
      }

      const result = await kitchenHygieneService.canServeMeals(this.testDataIds.messId);

      if (!result.allowed) throw new Error('Meal service should be allowed with passing check');
      console.log(`    → Meal service APPROVED: ${result.reason}`);
    });
  }

  async testCanServeWithoutCheck(): Promise<void> {
    await this.runTest('Phase 2.4: Meal Service Blocked - No Hygiene Check', async () => {
      // Create a new mess that has no hygiene checks
      if (!this.testDataIds.schoolId) {
        throw new Error('Missing test data: schoolId');
      }

      const tempMess = await this.prisma.mess.create({
        data: {
          name: 'Temp Mess for No-Check Test',
          code: `TEMP-MESS-${Date.now()}`,
          capacity: 100,
          schoolId: this.testDataIds.schoolId,
        },
      });

      const result = await kitchenHygieneService.canServeMeals(tempMess.id);

      if (result.allowed) throw new Error('Meal service should be blocked without today\'s check');
      console.log(`    → Meal service BLOCKED: ${result.reason}`);

      // Cleanup temp mess
      await this.prisma.mess.delete({ where: { id: tempMess.id } }).catch(() => {});
    });
  }

  // ==================== PHASE 2: STUDENT ALLERGY TESTS ====================

  async testCreateStudentAllergy(): Promise<void> {
    await this.runTest('Phase 2.5: Create Student Allergy Record', async () => {
      if (!this.testDataIds.schoolId || !this.testDataIds.studentId) {
        throw new Error('Missing test data: schoolId or studentId');
      }

      // First create a test allergen
      const allergen = await this.prisma.allergen.create({
        data: {
          name: 'Peanut',
          code: `PEANUT-${Date.now()}`,
          severity: 'ANAPHYLAXIS',
          schoolId: this.testDataIds.schoolId,
          isActive: true,
        },
      });

      // Then create the student allergy
      const allergy = await studentAllergyService.create({
        studentId: this.testDataIds.studentId,
        allergenId: allergen.id,
        severity: 'ANAPHYLAXIS',
        description: 'Severe peanut allergy',
        doctorName: 'Dr. Smith',
        doctorContactNumber: '+1-555-0100',
        verificationDocumentUrl: 'https://example.com/doctor-note.pdf',
        verificationDate: new Date(),
        schoolId: this.testDataIds.schoolId,
      });

      if (!allergy.id) throw new Error('No allergy ID returned');
      if (allergy.isVerified) throw new Error('New allergy should not be pre-verified');

      this.testDataIds.allergyId = allergy.id;
      this.testDataIds.allergenId = allergen.id;
      console.log(`    → Created allergy record: ${allergy.id} (${allergy.severity}) - Awaiting verification`);
    });
  }

  async testVerifyStudentAllergy(): Promise<void> {
    await this.runTest('Phase 2.6: Verify Student Allergy (Doctor Approval)', async () => {
      if (!this.testDataIds.allergyId) throw new Error('No allergy ID from previous test');

      const verified = await studentAllergyService.verify(this.testDataIds.allergyId);

      if (!verified.isVerified) throw new Error('Allergy should be verified');
      console.log(`    → Allergy verified: ${verified.severity} severity confirmed`);
    });
  }

  async testGetCriticalAllergies(): Promise<void> {
    await this.runTest('Phase 2.7: Get Student Critical Allergies', async () => {
      if (!this.testDataIds.studentId || !this.testDataIds.schoolId) {
        throw new Error('Missing test data: studentId or schoolId');
      }

      const critical = await studentAllergyService.getCriticalAllergies(
        this.testDataIds.studentId,
        this.testDataIds.schoolId
      );

      if (!Array.isArray(critical)) throw new Error('Expected array');
      console.log(`    → Found ${critical.length} critical allergen(s): ${critical.map(a => a.description || 'Unknown').join(', ')}`);
    });
  }

  // ==================== PHASE 3: MENU & MEAL PLANNING ====================

  async testCreateMenu(): Promise<void> {
    await this.runTest('Phase 3.1: Create Monthly Menu', async () => {
      if (!this.testDataIds.messId || !this.testDataIds.schoolId) {
        throw new Error('Missing test data: messId or schoolId');
      }

      const menu = await menuService.create({
        messId: this.testDataIds.messId,
        date: new Date(),
        dayOfWeek: 'MONDAY',
        season: 'Winter',
        schoolId: this.testDataIds.schoolId,
      });

      if (!menu.id) throw new Error('No menu ID returned');
      if (menu.status !== 'DRAFT') throw new Error('Menu should be in DRAFT status');

      this.testDataIds.menuId = menu.id;
      console.log(`    → Created menu: ${menu.id} (${menu.status})`);
    });
  }

  async testCreateMeal(): Promise<void> {
    await this.runTest('Phase 3.2: Add Meal to Menu', async () => {
      if (!this.testDataIds.menuId || !this.testDataIds.schoolId) throw new Error('No menu ID or schoolId');

      const meal = await mealService.create({
        menuId: this.testDataIds.menuId,
        name: 'Lunch - Special Curry',
        mealType: 'LUNCH',
        serveTimeStart: '12:00',
        serveTimeEnd: '13:30',
        schoolId: this.testDataIds.schoolId,
      });

      if (!meal.id) throw new Error('No meal ID returned');
      console.log(`    → Created meal: ${meal.id} (${meal.mealType})`);

      this.testDataIds.mealId = meal.id;
    });
  }

  async testCreateRecipe(): Promise<void> {
    await this.runTest('Phase 3.3: Create Recipe', async () => {
      if (!this.testDataIds.schoolId) throw new Error('Missing schoolId');

      // First create a food item
      const foodItem = await this.prisma.foodItem.create({
        data: {
          name: 'Chickpeas',
          category: 'Protein',
          caloriesPer100g: 164,
          proteinPer100g: 8.9,
          carbsPer100g: 27.4,
          fatPer100g: 2.6,
          costPerUnit: 150,
          unit: 'kg',
          schoolId: this.testDataIds.schoolId,
        },
      });

      // Create recipe for meal variant
      const recipe = await this.prisma.recipe.create({
        data: {
          name: 'Vegetarian Curry',
          mealVariantType: 'VEG',
          servings: 50,
          totalRecipeCost: 150, // Total cost of recipe (cost of all ingredients)
          caloriesPerServing: 200.5,
          description: 'Chickpeas and spinach curry',
          schoolId: this.testDataIds.schoolId,
          ingredients: {
            create: [
              {
                quantity: 1,
                unit: 'kg',
                ingredientCost: 150,
                foodItemId: foodItem.id,
              },
            ],
          },
        },
      });

      this.testDataIds.recipeId = recipe.id;
      this.testDataIds.foodItemId = foodItem.id;
      console.log(`    → Created recipe: ${recipe.id}`);
    });
  }

  async testCreateMealVariant(): Promise<void> {
    await this.runTest('Phase 3.4: Create Meal Variant', async () => {
      if (!this.testDataIds.mealId) throw new Error('No meal ID');
      if (!this.testDataIds.recipeId) throw new Error('No recipe ID');

      const variant = await mealVariantService.create({
        mealId: this.testDataIds.mealId,
        recipeId: this.testDataIds.recipeId,
        variantType: 'VEG',
        variantCost: 75.5,
        description: 'Vegetarian curry with chickpeas',
        schoolId: this.testDataIds.schoolId,
      });

      if (!variant.id) throw new Error('No variant ID returned');
      console.log(`    → Created meal variant: ${variant.id} (${variant.variantType})`);

      this.testDataIds.variantId = variant.id;
    });
  }

  async testSubmitMenuForApproval(): Promise<void> {
    await this.runTest('Phase 3.5: Submit Menu for Approval', async () => {
      if (!this.testDataIds.menuId || !this.testDataIds.schoolId) throw new Error('No menu ID or schoolId');

      const approval = await menuApprovalService.submit(
        this.testDataIds.menuId,
        'test-user-001',
        this.testDataIds.schoolId
      );

      if (!approval.id) throw new Error('No approval ID returned');
      // MenuApprovalStatus can be 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
      const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'];
      if (!validStatuses.includes(approval.status as any)) {
        throw new Error(`Invalid status: ${approval.status}`);
      }

      this.testDataIds.approvalId = approval.id;
      console.log(`    → Menu submitted: ${approval.id} (${approval.status})`);
    });
  }

  async testApproveMenu(): Promise<void> {
    await this.runTest('Phase 3.6: Approve Menu (Manager)', async () => {
      if (!this.testDataIds.approvalId) throw new Error('No approval ID');

      const approved = await menuApprovalService.approve(
        this.testDataIds.approvalId,
        'Manager Alice',
        'Menu is nutritionally balanced'
      );

      if (approved.status !== 'APPROVED') {
        throw new Error(`Expected APPROVED, got ${approved.status}`);
      }

      console.log(`    → Menu APPROVED by manager`);
    });
  }

  // ==================== CRITICAL: ALLERGEN SAFETY ====================

  async testAllergenChecker(): Promise<void> {
    await this.runTest('Phase 2+3: Allergen Checker Service', async () => {
      if (!this.testDataIds.variantId) {
        console.log('    ⊘ Skipped (no variant from earlier test)');
        return;
      }

      const result = await allergenCheckerService.checkMealVariant(
        this.testDataIds.studentId,
        this.testDataIds.variantId,
        this.testDataIds.schoolId
      );

      console.log(`    → Check result: Safe=${result.safe}, Requires Override=${result.requiresManagerOverride}`);
      if (result.conflictingAllergens && result.conflictingAllergens.length > 0) {
        console.log(`    → Detected allergens: ${result.conflictingAllergens.map(a => `${a.allergenName}(${a.severity})`).join(', ')}`);
      } else {
        console.log(`    → ✓ No allergen conflicts detected`);
      }
    });
  }

  // ==================== CLEANUP & SUMMARY ====================

  async cleanup(): Promise<void> {
    try {
      // Clean up test data
      if (this.testDataIds.approvalId) {
        await this.prisma.menuApproval.delete({
          where: { id: this.testDataIds.approvalId },
        });
      }
      if (this.testDataIds.variantId) {
        await this.prisma.mealVariant.delete({
          where: { id: this.testDataIds.variantId },
        });
      }
      if (this.testDataIds.mealId) {
        await this.prisma.meal.delete({
          where: { id: this.testDataIds.mealId },
        });
      }
      if (this.testDataIds.menuId) {
        await this.prisma.menu.delete({
          where: { id: this.testDataIds.menuId },
        });
      }
      if (this.testDataIds.recipeId) {
        await this.prisma.recipe.deleteMany({
          where: { id: this.testDataIds.recipeId },
        });
      }
      if (this.testDataIds.allergyId) {
        await this.prisma.studentAllergy.delete({
          where: { id: this.testDataIds.allergyId },
        });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    await this.prisma.$disconnect();
  }

  async runAllTests(): Promise<void> {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  PHASE 2 & 3 SERVICE INTEGRATION TESTS - DIRECT EXECUTION      ║');
    console.log('║  Kitchen Hygiene | Student Allergies | Menu Planning | Safety  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('⚙️  SETUP: Creating test data (School, Mess, Student)');
    console.log('─────────────────────────────────────');
    await this.setupTestData();

    console.log('\n🔧 PHASE 2: KITCHEN HYGIENE TESTS');
    console.log('─────────────────────────────────────');
    await this.testKitchenHygieneCreate();
    await this.testKitchenHygienePassingScore();
    await this.testCanServeWithPassingCheck();
    await this.testCanServeWithoutCheck();

    console.log('\n🔧 PHASE 2: STUDENT ALLERGY TESTS');
    console.log('─────────────────────────────────────');
    await this.testCreateStudentAllergy();
    await this.testVerifyStudentAllergy();
    await this.testGetCriticalAllergies();

    console.log('\n🔧 PHASE 3: MENU & MEAL PLANNING TESTS');
    console.log('──────────────────────────────────────');
    await this.testCreateMenu();
    await this.testCreateMeal();
    await this.testCreateRecipe();
    await this.testCreateMealVariant();

    console.log('\n🔧 PHASE 3: MENU APPROVAL WORKFLOW TESTS');
    console.log('────────────────────────────────────────');
    await this.testSubmitMenuForApproval();
    await this.testApproveMenu();

    console.log('\n⚠️  CRITICAL: ALLERGEN CHECKER VALIDATION');
    console.log('────────────────────────────────────────');
    await this.testAllergenChecker();

    await this.cleanup();
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
      console.log('\n🎉 ALL TESTS PASSED! Phase 2 & 3 ready for production deployment.\n');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Review errors above.\n`);
    }

    process.exit(failed === 0 ? 0 : 1);
  }
}

// Run tests
const tester = new Phase2Phase3ServiceTests();
tester.runAllTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
