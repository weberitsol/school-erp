import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyParentData() {
  try {
    console.log('📊 Verifying Parent Management Module Data...\n');

    // Count parents
    const parents = await prisma.parent.findMany({
      include: {
        user: true,
        children: {
          include: { student: true },
        },
      },
    });

    console.log(`✅ Parents: ${parents.length}`);
    parents.forEach((parent) => {
      const childrenStr = parent.children.map((c) => c.student.firstName).join(', ') || 'None';
      const email = parent.email ? '✓' : '✗';
      console.log(`   - ${email} ${parent.firstName} ${parent.lastName} (${parent.relation}) - Children: ${childrenStr}`);
    });

    // Count parent-student links
    const links = await prisma.studentParent.findMany({
      include: {
        parent: true,
        student: true,
      },
    });

    console.log(`\n✅ Parent-Student Links: ${links.length}`);
    links.forEach((link) => {
      const primary = link.isPrimary ? '(Primary)' : '(Secondary)';
      console.log(`   - ${link.parent.firstName} ${link.parent.lastName} → ${link.student.firstName} ${primary}`);
    });

    // Statistics
    const totalWithEmail = parents.filter((p) => p.email).length;
    const fatherCount = parents.filter((p) => p.relation === 'Father').length;
    const motherCount = parents.filter((p) => p.relation === 'Mother').length;
    const guardianCount = parents.filter((p) => p.relation === 'Guardian').length;

    console.log('\n📈 Statistics:');
    console.log(`   - Total Parents: ${parents.length}`);
    console.log(`   - Fathers: ${fatherCount}`);
    console.log(`   - Mothers: ${motherCount}`);
    console.log(`   - Guardians: ${guardianCount}`);
    console.log(`   - With Email: ${totalWithEmail}`);
    console.log(`   - Without Email: ${parents.length - totalWithEmail}`);
    console.log(`   - Email Coverage: ${Math.round((totalWithEmail / parents.length) * 100)}%`);

    console.log('\n🎉 Parent data verification complete!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyParentData();
