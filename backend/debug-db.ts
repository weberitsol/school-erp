import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get the school
    const school = await prisma.school.findFirst();
    if (!school) {
      console.error('No school found');
      process.exit(1);
    }

    console.log('School:', school.id, school.name);

    // Check current count
    const countBefore = await prisma.feeStructure.count({ where: { schoolId: school.id } });
    console.log(`FeeStructures for this school (before): ${countBefore}`);

    // Create a new one
    const newFee = await prisma.feeStructure.create({
      data: {
        name: `Test Fee ${Date.now()}`,
        schoolId: school.id,
        academicYearId: '67646627-4909-4732-b8c9-afe5fe607f9b',
        classId: '4ed45c08-c54e-4e92-aaaa-d91177c7004c',
        amount: 9999,
        frequency: 'MONTHLY',
        dueDay: 1,
      },
    });

    console.log('Created fee:', newFee.id, newFee.name);

    // Check count after
    const countAfter = await prisma.feeStructure.count({ where: { schoolId: school.id } });
    console.log(`FeeStructures for this school (after): ${countAfter}`);

    // Query it back
    const found = await prisma.feeStructure.findUnique({
      where: { id: newFee.id },
    });

    console.log('Found fee:', found?.id, found?.name);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
