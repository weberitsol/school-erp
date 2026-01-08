import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const schoolId = '8501d9f6-73b3-4197-95d7-73b4083822b4';

  // Get fee structures
  const feeStructures = await prisma.feeStructure.findMany({
    where: { schoolId },
    include: { class: true, academicYear: true },
  });

  // Simulate API response
  const response = { success: true, data: feeStructures, total: feeStructures.length };

  // Serialize to JSON (like the API would)
  const json = JSON.stringify(response);

  console.log('Response size:', json.length, 'bytes');
  console.log('Response (first 500 chars):', json.substring(0, 500));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
