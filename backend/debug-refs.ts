import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const feeStructures = await prisma.feeStructure.findMany({
    include: { class: true, academicYear: true }
  });

  console.log('Fee Structures with relations:');
  feeStructures.forEach((f: any) => {
    console.log(`\n${f.name}:`);
    console.log(`  classId: ${f.classId}`);
    console.log(`  class: ${f.class ? f.class.name : 'NULL'}`);
    console.log(`  academicYearId: ${f.academicYearId}`);
    console.log(`  academicYear: ${f.academicYear ? f.academicYear.name : 'NULL'}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
