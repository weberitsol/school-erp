import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Simulate the exact query from the API
  const schoolId = '8501d9f6-73b3-4197-95d7-73b4083822b4';
  const page = 0;
  const limit = 10;

  const where = {
    schoolId: schoolId,
  };

  const skip = (page || 0) * (limit || 10);
  const take = limit || 10;

  console.log('Query parameters:');
  console.log(`  schoolId: ${schoolId}`);
  console.log(`  skip: ${skip}`);
  console.log(`  take: ${take}`);
  console.log(`  where: ${JSON.stringify(where)}`);

  const [data, total] = await Promise.all([
    prisma.feeStructure.findMany({
      where,
      include: { class: true, academicYear: true },
      skip,
      take,
      orderBy: { name: 'asc' },
    }),
    prisma.feeStructure.count({ where }),
  ]);

  console.log(`\nResults:`);
  console.log(`  total: ${total}`);
  console.log(`  data.length: ${data.length}`);
  console.log(`  data: ${JSON.stringify(data, null, 2)}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
