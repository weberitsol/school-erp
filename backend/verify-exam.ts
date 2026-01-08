import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyExamData() {
  try {
    console.log('📊 Verifying Examination Module Data...\n');

    // Count exams
    const exams = await prisma.exam.findMany({
      include: { subject: true, class: true },
    });
    console.log(`✅ Exams: ${exams.length}`);
    exams.forEach((exam) => {
      console.log(`   - ${exam.name} (${exam.examType}): Max ${exam.maxMarks} marks, Pass ${exam.passingMarks}`);
    });

    // Count results
    const results = await prisma.examResult.findMany({
      include: { student: true, exam: true },
    });
    console.log(`\n✅ Exam Results: ${results.length}`);
    results.forEach((result) => {
      const marks = result.marksObtained || 'Absent';
      console.log(`   - ${result.student.firstName}: ${result.exam.name} - ${marks}/${result.exam.maxMarks} (Grade: ${result.grade})`);
    });

    // Count published exams
    const publishedExams = await prisma.exam.count({
      where: { isPublished: true },
    });
    console.log(`\n✅ Published Exams: ${publishedExams}`);
    console.log(`   - Pending: ${exams.length - publishedExams}`);

    console.log('\n🎉 Examination data verification complete!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyExamData();
