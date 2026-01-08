import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function seedHRData() {
  try {
    console.log('🌱 Starting HR Module Seed...\n');

    // Get the first school
    const school = await prisma.school.findFirst();
    if (!school) {
      throw new Error('No school found in database. Please seed school data first.');
    }
    const schoolId = school.id;
    console.log(`📍 Using school: ${school.name} (${schoolId})\n`);

    // Clean up existing HR data
    console.log('🧹 Cleaning up existing HR data...');
    await prisma.payslip.deleteMany({});
    await prisma.employeeSeparation.deleteMany({});
    await prisma.employeeTransfer.deleteMany({});
    await prisma.employeePromotion.deleteMany({});
    await prisma.leaveBalance.deleteMany({});
    await prisma.performanceReview.deleteMany({});
    await prisma.salaryRevision.deleteMany({});
    await prisma.salary.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.reviewCycle.deleteMany({});
    await prisma.designation.deleteMany({});
    await prisma.department.deleteMany({ where: { schoolId: schoolId } });

    // Delete HR-related users
    const hrEmails = [
      'rajesh.kumar@company.com',
      'priya.sharma@company.com',
      'arjun.singh@company.com',
      'neha.patel@company.com',
      'vikram.verma@company.com',
    ];
    await prisma.user.deleteMany({ where: { email: { in: hrEmails } } });
    console.log('✅ Cleaned up existing data\n');

    // 1. Create Designations
    console.log('📋 Creating Designations...');
    const designations = await Promise.all([
      prisma.designation.create({
        data: {
          name: 'Software Engineer',
          code: 'SE',
          level: 1,
          minSalary: 40000,
          maxSalary: 70000,
          standardSalary: 50000,
          description: 'Entry-level software development position',
        },
      }),
      prisma.designation.create({
        data: {
          name: 'Senior Software Engineer',
          code: 'SSE',
          level: 2,
          minSalary: 70000,
          maxSalary: 120000,
          standardSalary: 90000,
          description: 'Senior-level software development position',
        },
      }),
      prisma.designation.create({
        data: {
          name: 'Engineering Manager',
          code: 'EM',
          level: 3,
          minSalary: 100000,
          maxSalary: 180000,
          standardSalary: 130000,
          description: 'Team lead and manager position',
        },
      }),
      prisma.designation.create({
        data: {
          name: 'HR Manager',
          code: 'HRM',
          level: 3,
          minSalary: 60000,
          maxSalary: 120000,
          standardSalary: 80000,
          description: 'Human Resources Management',
        },
      }),
      prisma.designation.create({
        data: {
          name: 'Finance Manager',
          code: 'FM',
          level: 3,
          minSalary: 70000,
          maxSalary: 140000,
          standardSalary: 100000,
          description: 'Financial Management',
        },
      }),
    ]);
    console.log(`✅ Created ${designations.length} designations\n`);

    // 2. Create Departments
    console.log('🏢 Creating Departments...');
    const departments = await Promise.all([
      prisma.department.create({
        data: {
          name: 'IT',
          code: 'IT',
          description: 'Information Technology Department',
          schoolId: schoolId,
        },
      }),
      prisma.department.create({
        data: {
          name: 'Human Resources',
          code: 'HR',
          description: 'Human Resources Department',
          schoolId: schoolId,
        },
      }),
      prisma.department.create({
        data: {
          name: 'Finance',
          code: 'FIN',
          description: 'Finance Department',
          schoolId: schoolId,
        },
      }),
    ]);
    console.log(`✅ Created ${departments.length} departments\n`);

    // 3. Create Users for Employees
    console.log('👥 Creating Users for Employees...');
    const hashedPassword = await bcrypt.hash('Test@1234', 10);

    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'rajesh.kumar@company.com',
          password: hashedPassword,
          role: 'TEACHER',
          schoolId: schoolId,
        },
      }),
      prisma.user.create({
        data: {
          email: 'priya.sharma@company.com',
          password: hashedPassword,
          role: 'ADMIN',
          schoolId: schoolId,
        },
      }),
      prisma.user.create({
        data: {
          email: 'arjun.singh@company.com',
          password: hashedPassword,
          role: 'TEACHER',
          schoolId: schoolId,
        },
      }),
      prisma.user.create({
        data: {
          email: 'neha.patel@company.com',
          password: hashedPassword,
          role: 'ADMIN',
          schoolId: schoolId,
        },
      }),
      prisma.user.create({
        data: {
          email: 'vikram.verma@company.com',
          password: hashedPassword,
          role: 'ADMIN',
          schoolId: schoolId,
        },
      }),
    ]);
    console.log(`✅ Created ${users.length} users\n`);

    // 3. Create Employees
    console.log('👨‍💼 Creating Employees...');
    const employees = await Promise.all([
      prisma.employee.create({
        data: {
          userId: users[0].id,
          firstName: 'Rajesh',
          lastName: 'Kumar',
          email: 'rajesh.kumar@company.com',
          phone: '9876543210',
          employeeNo: 'EMP-001',
          employmentType: 'FULL_TIME',
          designationId: designations[0].id,
          departmentId: departments[0].id, // IT Department
          joiningDate: new Date('2020-01-15'),
          basicSalary: 50000,
          status: 'ACTIVE',
          isActive: true,
          address: '123 Main Street',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
          dateOfBirth: new Date('1990-05-20'),
          gender: 'MALE',
          panNumber: 'ABCDE1234F',
          aadharNumber: '123456789012',
          bankAccountNumber: '1234567890',
          bankIfscCode: 'ICIC0000001',
        },
      }),
      prisma.employee.create({
        data: {
          userId: users[1].id,
          firstName: 'Priya',
          lastName: 'Sharma',
          email: 'priya.sharma@company.com',
          phone: '9876543211',
          employeeNo: 'EMP-002',
          employmentType: 'FULL_TIME',
          designationId: designations[2].id,
          departmentId: departments[0].id,
          reportingToId: undefined, // Will be set later
          joiningDate: new Date('2018-06-10'),
          basicSalary: 130000,
          status: 'ACTIVE',
          isActive: true,
          address: '456 Park Avenue',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560002',
          dateOfBirth: new Date('1988-03-15'),
          gender: 'FEMALE',
          panNumber: 'FGHIJ5678K',
          aadharNumber: '234567890123',
          bankAccountNumber: '2345678901',
          bankIfscCode: 'HDFC0000001',
        },
      }),
      prisma.employee.create({
        data: {
          userId: users[2].id,
          firstName: 'Arjun',
          lastName: 'Singh',
          email: 'arjun.singh@company.com',
          phone: '9876543212',
          employeeNo: 'EMP-003',
          employmentType: 'FULL_TIME',
          designationId: designations[1].id,
          departmentId: departments[0].id,
          reportingToId: undefined, // Will report to Priya
          joiningDate: new Date('2019-09-01'),
          basicSalary: 90000,
          status: 'ACTIVE',
          isActive: true,
          address: '789 River Road',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560003',
          dateOfBirth: new Date('1992-07-22'),
          gender: 'MALE',
          panNumber: 'LMNOP9012Q',
          aadharNumber: '345678901234',
          bankAccountNumber: '3456789012',
          bankIfscCode: 'AXIS0000001',
        },
      }),
      prisma.employee.create({
        data: {
          userId: users[3].id,
          firstName: 'Neha',
          lastName: 'Patel',
          email: 'neha.patel@company.com',
          phone: '9876543213',
          employeeNo: 'EMP-004',
          employmentType: 'FULL_TIME',
          designationId: designations[3].id,
          departmentId: departments[1].id, // HR Department
          joiningDate: new Date('2019-02-14'),
          basicSalary: 80000,
          status: 'ACTIVE',
          isActive: true,
          address: '321 Garden Lane',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560004',
          dateOfBirth: new Date('1991-11-08'),
          gender: 'FEMALE',
          panNumber: 'RSTUV3456W',
          aadharNumber: '456789012345',
          bankAccountNumber: '4567890123',
          bankIfscCode: 'SBIN0000001',
        },
      }),
      prisma.employee.create({
        data: {
          userId: users[4].id,
          firstName: 'Vikram',
          lastName: 'Verma',
          email: 'vikram.verma@company.com',
          phone: '9876543214',
          employeeNo: 'EMP-005',
          employmentType: 'FULL_TIME',
          designationId: designations[4].id,
          departmentId: departments[2].id, // Finance Department
          joiningDate: new Date('2017-08-20'),
          basicSalary: 100000,
          status: 'ACTIVE',
          isActive: true,
          address: '654 Forest Hills',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560005',
          dateOfBirth: new Date('1989-04-12'),
          gender: 'MALE',
          panNumber: 'XYZAB7890C',
          aadharNumber: '567890123456',
          bankAccountNumber: '5678901234',
          bankIfscCode: 'ICIC0000002',
        },
      }),
    ]);
    console.log(`✅ Created ${employees.length} employees\n`);

    // Update reporting relationships
    console.log('🔗 Setting up Reporting Relationships...');
    await prisma.employee.update({
      where: { id: employees[2].id },
      data: { reportingToId: employees[1].id }, // Arjun reports to Priya
    });
    await prisma.employee.update({
      where: { id: employees[0].id },
      data: { reportingToId: employees[1].id }, // Rajesh reports to Priya
    });
    console.log('✅ Reporting relationships set\n');

    // 4. Create Salaries
    console.log('💰 Creating Salaries...');
    const salaries = await Promise.all([
      prisma.salary.create({
        data: {
          employeeId: employees[0].id,
          basicSalary: new Decimal('50000'),
          dearness: new Decimal('5000'),
          houseRent: new Decimal('10000'),
          conveyance: new Decimal('2000'),
          medical: new Decimal('1000'),
          otherAllowances: new Decimal('2000'),
          grossSalary: new Decimal('70000'),
          pf: new Decimal('6250'),
          esi: new Decimal('325'),
          professionalTax: new Decimal('200'),
          incomeTax: new Decimal('5000'),
          otherDeductions: new Decimal('500'),
          totalDeductions: new Decimal('12275'),
          netSalary: new Decimal('57725'),
          month: 1,
          year: 2025,
          status: 'ACTIVE',
          effectiveFrom: new Date('2025-01-01'),
        },
      }),
      prisma.salary.create({
        data: {
          employeeId: employees[1].id,
          basicSalary: new Decimal('130000'),
          dearness: new Decimal('15000'),
          houseRent: new Decimal('30000'),
          conveyance: new Decimal('5000'),
          medical: new Decimal('3000'),
          otherAllowances: new Decimal('7000'),
          grossSalary: new Decimal('190000'),
          pf: new Decimal('16250'),
          esi: new Decimal('0'),
          professionalTax: new Decimal('2000'),
          incomeTax: new Decimal('25000'),
          otherDeductions: new Decimal('1500'),
          totalDeductions: new Decimal('44750'),
          netSalary: new Decimal('145250'),
          month: 1,
          year: 2025,
          status: 'ACTIVE',
          effectiveFrom: new Date('2025-01-01'),
        },
      }),
      prisma.salary.create({
        data: {
          employeeId: employees[2].id,
          basicSalary: new Decimal('90000'),
          dearness: new Decimal('9000'),
          houseRent: new Decimal('18000'),
          conveyance: new Decimal('3000'),
          medical: new Decimal('2000'),
          otherAllowances: new Decimal('3000'),
          grossSalary: new Decimal('125000'),
          pf: new Decimal('11250'),
          esi: new Decimal('625'),
          professionalTax: new Decimal('1000'),
          incomeTax: new Decimal('12000'),
          otherDeductions: new Decimal('800'),
          totalDeductions: new Decimal('25675'),
          netSalary: new Decimal('99325'),
          month: 1,
          year: 2025,
          status: 'ACTIVE',
          effectiveFrom: new Date('2025-01-01'),
        },
      }),
    ]);
    console.log(`✅ Created ${salaries.length} salary records\n`);

    // 5. Create Leave Balances
    console.log('🏖️ Creating Leave Balances...');
    const leaveBalances = await Promise.all([
      prisma.leaveBalance.create({
        data: {
          employeeId: employees[0].id,
          academicYear: '2024-2025',
          casualLeave: 12,
          casualLeaveUsed: 0,
          earnedLeave: 20,
          earnedLeaveUsed: 0,
          medicalLeave: 10,
          medicalLeaveUsed: 0,
          unpaidLeave: 0,
          studyLeave: 5,
          maternityLeave: 0,
          paternityLeave: 0,
          bereavementLeave: 3,
        },
      }),
      prisma.leaveBalance.create({
        data: {
          employeeId: employees[1].id,
          academicYear: '2024-2025',
          casualLeave: 12,
          casualLeaveUsed: 2,
          earnedLeave: 20,
          earnedLeaveUsed: 5,
          medicalLeave: 10,
          medicalLeaveUsed: 0,
          unpaidLeave: 0,
          studyLeave: 5,
          maternityLeave: 0,
          paternityLeave: 0,
          bereavementLeave: 3,
        },
      }),
      prisma.leaveBalance.create({
        data: {
          employeeId: employees[2].id,
          academicYear: '2024-2025',
          casualLeave: 12,
          casualLeaveUsed: 1,
          earnedLeave: 20,
          earnedLeaveUsed: 3,
          medicalLeave: 10,
          medicalLeaveUsed: 1,
          unpaidLeave: 0,
          studyLeave: 5,
          maternityLeave: 0,
          paternityLeave: 0,
          bereavementLeave: 3,
        },
      }),
    ]);
    console.log(`✅ Created ${leaveBalances.length} leave balance records\n`);

    // 6. Create Review Cycles
    console.log('📅 Creating Review Cycles...');
    const reviewCycles = await Promise.all([
      prisma.reviewCycle.create({
        data: {
          name: '2024-2025 Annual Review',
          cycleType: 'ANNUAL',
          academicYear: '2024-2025',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          isActive: false,
        },
      }),
      prisma.reviewCycle.create({
        data: {
          name: '2025-2026 Annual Review',
          cycleType: 'ANNUAL',
          academicYear: '2025-2026',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          isActive: true,
        },
      }),
    ]);
    console.log(`✅ Created ${reviewCycles.length} review cycles\n`);

    // 7. Create Performance Reviews
    console.log('⭐ Creating Performance Reviews...');
    const reviews = await Promise.all([
      prisma.performanceReview.create({
        data: {
          employeeId: employees[0].id,
          reviewCycleId: reviewCycles[0].id,
          reviewPeriod: 'Annual 2024',
          year: 2024,
          technicalSkills: 4,
          communication: 3,
          teamwork: 4,
          initiative: 3,
          reliability: 4,
          customerService: 3,
          overallRating: new Decimal('3.5'),
          reviewedById: users[1].id,
          reviewDate: new Date('2024-12-15'),
          promotionEligible: false,
          raisesPercentage: new Decimal('5.0'),
        },
      }),
      prisma.performanceReview.create({
        data: {
          employeeId: employees[2].id,
          reviewCycleId: reviewCycles[0].id,
          reviewPeriod: 'Annual 2024',
          year: 2024,
          technicalSkills: 5,
          communication: 4,
          teamwork: 5,
          initiative: 5,
          reliability: 5,
          customerService: 4,
          overallRating: new Decimal('4.7'),
          reviewedById: users[1].id,
          reviewDate: new Date('2024-12-16'),
          promotionEligible: true,
          raisesPercentage: new Decimal('15.0'),
        },
      }),
    ]);
    console.log(`✅ Created ${reviews.length} performance reviews\n`);

    // 8. Create Salary Revisions
    console.log('📈 Creating Salary Revisions...');
    const revisions = await Promise.all([
      prisma.salaryRevision.create({
        data: {
          employeeId: employees[0].id,
          previousBasicSalary: new Decimal('48000'),
          newBasicSalary: new Decimal('50000'),
          revisionPercentage: new Decimal('4.17'),
          fixedAmount: new Decimal('2000'),
          revisionReason: 'INCREMENT',
          effectiveFrom: new Date('2025-01-01'),
          approvedDate: new Date('2024-12-20'),
          approvedById: users[1].id,
        },
      }),
      prisma.salaryRevision.create({
        data: {
          employeeId: employees[2].id,
          previousBasicSalary: new Decimal('85000'),
          newBasicSalary: new Decimal('90000'),
          revisionPercentage: new Decimal('5.88'),
          fixedAmount: new Decimal('5000'),
          revisionReason: 'PERFORMANCE',
          effectiveFrom: new Date('2024-07-01'),
          approvedDate: new Date('2024-06-20'),
          approvedById: users[1].id,
        },
      }),
    ]);
    console.log(`✅ Created ${revisions.length} salary revisions\n`);

    // 9. Create Promotions
    console.log('🎯 Creating Promotions...');
    const promotions = await Promise.all([
      prisma.employeePromotion.create({
        data: {
          employeeId: employees[2].id,
          previousDesignationId: designations[1].id,
          newDesignationId: designations[2].id,
          newSalary: new Decimal('120000'),
          promotionDate: new Date('2025-02-01'),
          promotionReason: 'Exceptional performance and leadership potential',
          effectiveFrom: new Date('2025-02-01'),
          status: 'APPROVED',
          approvedById: users[1].id,
          approvalDate: new Date('2025-01-30'),
        },
      }),
    ]);
    console.log(`✅ Created ${promotions.length} promotions\n`);

    // 10. Create Transfers
    console.log('🔄 Creating Transfers...');
    const transfers = await Promise.all([
      prisma.employeeTransfer.create({
        data: {
          employeeId: employees[3].id,
          fromDepartmentId: departments[1].id,
          fromDepartment: 'HR Department',
          toDepartmentId: departments[0].id,
          toDepartment: 'IT Department',
          transferDate: new Date('2025-02-15'),
          transferReason: 'Career development in IT sector',
          status: 'PENDING',
          initiatedBy: users[1].id,
        },
      }),
    ]);
    console.log(`✅ Created ${transfers.length} transfers\n`);

    // 11. Create Payslips
    console.log('📄 Creating Payslips...');
    const payslips = await Promise.all([
      prisma.payslip.create({
        data: {
          employeeId: employees[0].id,
          month: 1,
          year: 2025,
          basicSalary: new Decimal('50000'),
          dearness: new Decimal('5000'),
          houseRent: new Decimal('10000'),
          conveyance: new Decimal('2000'),
          medical: new Decimal('1000'),
          otherAllowances: new Decimal('2000'),
          grossSalary: new Decimal('70000'),
          pf: new Decimal('6250'),
          esi: new Decimal('325'),
          professionalTax: new Decimal('200'),
          incomeTax: new Decimal('5000'),
          otherDeductions: new Decimal('500'),
          totalDeductions: new Decimal('12275'),
          netPayable: new Decimal('57725'),
          workingDays: 22,
          daysPresent: 20,
          daysAbsent: 2,
          status: 'FINALIZED',
        },
      }),
      prisma.payslip.create({
        data: {
          employeeId: employees[1].id,
          month: 1,
          year: 2025,
          basicSalary: new Decimal('130000'),
          dearness: new Decimal('15000'),
          houseRent: new Decimal('30000'),
          conveyance: new Decimal('5000'),
          medical: new Decimal('3000'),
          otherAllowances: new Decimal('7000'),
          grossSalary: new Decimal('190000'),
          pf: new Decimal('16250'),
          esi: new Decimal('0'),
          professionalTax: new Decimal('2000'),
          incomeTax: new Decimal('25000'),
          otherDeductions: new Decimal('1500'),
          totalDeductions: new Decimal('44750'),
          netPayable: new Decimal('145250'),
          workingDays: 22,
          daysPresent: 22,
          daysAbsent: 0,
          status: 'PAID',
        },
      }),
    ]);
    console.log(`✅ Created ${payslips.length} payslips\n`);

    console.log('✨ HR Module Seed Completed Successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Designations: ${designations.length}`);
    console.log(`   - Employees: ${employees.length}`);
    console.log(`   - Salaries: ${salaries.length}`);
    console.log(`   - Leave Balances: ${leaveBalances.length}`);
    console.log(`   - Performance Reviews: ${reviews.length}`);
    console.log(`   - Salary Revisions: ${revisions.length}`);
    console.log(`   - Promotions: ${promotions.length}`);
    console.log(`   - Transfers: ${transfers.length}`);
    console.log(`   - Payslips: ${payslips.length}`);
    console.log('\n🎉 Ready to test HR module endpoints!\n');
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedHRData();
