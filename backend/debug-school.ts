import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  const feeStructures = await prisma.feeStructure.findMany();
  
  console.log('Admin schoolId:', admin?.schoolId);
  console.log('Fee structures:', feeStructures.map(f => ({ id: f.id, schoolId: f.schoolId, name: f.name })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
