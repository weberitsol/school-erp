import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://school_erp:school_erp_password@postgres:5432/school_erp',
    },
  },
});

async function main() {
  try {
    console.log('🌱 Seeding fee structures...\n');

    // The one and only school in the database
    const schoolId = '066cbecc-d948-4c56-b33f-edf73a1606b7';

    // Get or create academic year
    let academicYear = await prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    });

    if (!academicYear) {
      console.log('Creating academic year...');
      academicYear = await prisma.academicYear.create({
        data: {
          name: '2024-25',
          schoolId,
          startDate: new Date('2024-06-01'),
          endDate: new Date('2025-05-31'),
          isCurrent: true,
        },
      });
    }

    console.log(`Using academic year: ${academicYear.name}`);

    // Get or create a class
    let class11 = await prisma.class.findFirst({
      where: { schoolId, code: '11' },
    });

    if (!class11) {
      console.log('Creating Class 11...');
      class11 = await prisma.class.create({
        data: {
          name: 'Class 11',
          code: '11',
          displayOrder: 11,
          schoolId,
          isActive: true,
        },
      });
    }

    console.log(`Using class: ${class11.name}\n`);

    // Create fee structures
    console.log('Creating fee structures...');
    const fee1 = await prisma.feeStructure.create({
      data: {
        name: 'Monthly Tuition Fee',
        description: 'Monthly tuition fee for all classes',
        schoolId,
        academicYearId: academicYear.id,
        classId: class11.id,
        amount: 5000,
        frequency: 'MONTHLY',
        dueDay: 5,
        lateFee: 500,
        lateFeeAfterDays: 5,
      },
    });
    console.log(`✅ Created: ${fee1.name}`);

    const fee2 = await prisma.feeStructure.create({
      data: {
        name: 'Sports Fee',
        description: 'Annual sports fee',
        schoolId,
        academicYearId: academicYear.id,
        classId: class11.id,
        amount: 1000,
        frequency: 'ANNUALLY',
        dueDay: 15,
        lateFee: 100,
        lateFeeAfterDays: 10,
      },
    });
    console.log(`✅ Created: ${fee2.name}`);

    // Verify
    const count = await prisma.feeStructure.count({ where: { schoolId } });
    console.log(`\n✅ Total fee structures in database: ${count}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
