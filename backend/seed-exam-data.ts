import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function seedExamData() {
  try {
    console.log('🌱 Starting Examination Module Seed...\n');

    // 1. Get school
    const school = await prisma.school.findFirst();
    if (!school) {
      throw new Error('No school found. Please create a school first.');
    }
    console.log(`📍 Using school: ${school.name}\n`);

    // 2. Clean existing exam data
    console.log('🧹 Cleaning up existing exam data...');
    await prisma.examResult.deleteMany({});
    await prisma.exam.deleteMany({});
    console.log('✅ Cleaned up existing data\n');

    // 3. Get academic year
    console.log('📅 Setting up Academic Year...');
    let academicYear = await prisma.academicYear.findFirst({
      where: { schoolId: school.id },
      orderBy: { name: 'desc' },
    });
    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          name: '2024-25',
          startDate: new Date('2024-06-01'),
          endDate: new Date('2025-05-31'),
          schoolId: school.id,
          isActive: true,
        },
      });
    }
    console.log(`✅ Using Academic Year: ${academicYear.name}\n`);

    // 4. Get classes and subjects
    console.log('🏫 Getting classes and subjects...');
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id },
    });

    if (classes.length === 0) {
      throw new Error('No classes found. Please create classes first.');
    }

    const firstClass = classes[0];

    // Get subjects from the school (not necessarily linked to class)
    const subjects = await prisma.subject.findMany({
      where: { schoolId: school.id },
      take: 5,
    });

    if (subjects.length === 0) {
      throw new Error('No subjects found in the school. Please create subjects first.');
    }

    console.log(`✅ Found ${classes.length} classes and ${subjects.length} subjects\n`);

    // 5. Get teachers
    console.log('👨‍🏫 Getting teachers...');
    const teachers = await prisma.teacher.findMany({
      where: {
        user: {
          schoolId: school.id,
        },
      },
      take: 5,
    });

    if (teachers.length === 0) {
      throw new Error('No teachers found. Please create teachers first.');
    }
    console.log(`✅ Found ${teachers.length} teachers\n`);

    // 6. Create exams
    console.log('📝 Creating Exams...');
    const examPromises = [
      // Mid-term exam for first subject
      prisma.exam.create({
        data: {
          name: `Mid-Term ${subjects[0].name} Exam`,
          examType: 'MIDTERM',
          academicYearId: academicYear.id,
          classId: firstClass.id,
          subjectId: subjects[0].id,
          date: new Date('2024-10-15'),
          startTime: '10:00 AM',
          endTime: '11:30 AM',
          maxMarks: new Decimal('100'),
          passingMarks: new Decimal('40'),
          weightage: new Decimal('40'),
          createdById: teachers[0].id,
        },
      }),
      // Mid-term exam for second subject
      prisma.exam.create({
        data: {
          name: `Mid-Term ${subjects[1]?.name || subjects[0].name} Exam`,
          examType: 'MIDTERM',
          academicYearId: academicYear.id,
          classId: firstClass.id,
          subjectId: subjects[1]?.id || subjects[0].id,
          date: new Date('2024-10-16'),
          startTime: '02:00 PM',
          endTime: '03:30 PM',
          maxMarks: new Decimal('100'),
          passingMarks: new Decimal('40'),
          weightage: new Decimal('40'),
          createdById: teachers[Math.min(1, teachers.length - 1)].id,
        },
      }),
      // Final exam for first subject
      prisma.exam.create({
        data: {
          name: `Final ${subjects[0].name} Exam`,
          examType: 'FINAL',
          academicYearId: academicYear.id,
          classId: firstClass.id,
          subjectId: subjects[0].id,
          date: new Date('2024-12-18'),
          startTime: '10:00 AM',
          endTime: '12:00 PM',
          maxMarks: new Decimal('100'),
          passingMarks: new Decimal('40'),
          weightage: new Decimal('60'),
          createdById: teachers[0].id,
        },
      }),
      // Final exam for second subject
      prisma.exam.create({
        data: {
          name: `Final ${subjects[1]?.name || subjects[0].name} Exam`,
          examType: 'FINAL',
          academicYearId: academicYear.id,
          classId: firstClass.id,
          subjectId: subjects[1]?.id || subjects[0].id,
          date: new Date('2024-12-19'),
          startTime: '02:00 PM',
          endTime: '04:00 PM',
          maxMarks: new Decimal('100'),
          passingMarks: new Decimal('40'),
          weightage: new Decimal('60'),
          createdById: teachers[Math.min(1, teachers.length - 1)].id,
        },
      }),
      // Quiz for third subject
      prisma.exam.create({
        data: {
          name: `Quiz - ${subjects[2]?.name || subjects[0].name} Chapter 1`,
          examType: 'UNIT_TEST',
          academicYearId: academicYear.id,
          classId: firstClass.id,
          subjectId: subjects[2]?.id || subjects[0].id,
          date: new Date('2024-09-20'),
          startTime: '11:00 AM',
          endTime: '11:30 AM',
          maxMarks: new Decimal('25'),
          passingMarks: new Decimal('10'),
          weightage: new Decimal('15'),
          createdById: teachers[Math.min(2, teachers.length - 1)].id,
        },
      }),
    ];

    const exams = await Promise.all(examPromises);
    console.log(`✅ Created ${exams.length} exams\n`);

    // 7. Get students from first class
    console.log('👨‍🎓 Getting students...');
    const students = await prisma.student.findMany({
      where: { currentClassId: firstClass.id },
      take: 8,
    });

    if (students.length === 0) {
      throw new Error('No students found in the selected class.');
    }
    console.log(`✅ Found ${students.length} students\n`);

    // 8. Create exam results for each exam
    console.log('📊 Creating Exam Results...');
    let totalResultsCreated = 0;

    for (const exam of exams) {
      const results = [];

      for (let i = 0; i < students.length; i++) {
        const student = students[i];

        // Generate realistic marks
        let marks: number;
        if (i === 0) {
          // First student is topper
          marks = 85 + Math.random() * 15;
        } else if (i === students.length - 1) {
          // Last student struggles
          marks = 30 + Math.random() * 20;
        } else {
          // Others are average to good
          marks = 50 + Math.random() * 40;
        }

        // Determine grade
        const marksDecimal = new Decimal(Math.round(marks * 100) / 100);
        const passingMarks = exam.passingMarks;
        let grade = 'F';

        if (marksDecimal.gte(passingMarks.times(new Decimal('0.9')))) {
          grade = 'A';
        } else if (marksDecimal.gte(passingMarks.times(new Decimal('0.8')))) {
          grade = 'B';
        } else if (marksDecimal.gte(passingMarks.times(new Decimal('0.7')))) {
          grade = 'C';
        } else if (marksDecimal.gte(passingMarks.times(new Decimal('0.6')))) {
          grade = 'D';
        } else if (marksDecimal.gte(passingMarks)) {
          grade = 'E';
        }

        const result = await prisma.examResult.create({
          data: {
            examId: exam.id,
            studentId: student.id,
            marksObtained: marksDecimal,
            grade,
            remarks: i === 0 ? 'Excellent performance' : i === students.length - 1 ? 'Need improvement' : 'Good attempt',
            isAbsent: false,
            enteredById: teachers[0].id,
          },
        });

        results.push(result);
      }

      totalResultsCreated += results.length;
      console.log(`   - ${exam.name}: ${results.length} results`);
    }
    console.log(`✅ Created ${totalResultsCreated} exam results\n`);

    // 9. Publish some exam results (mid-term exams)
    console.log('📢 Publishing exam results...');
    const midTermExams = exams.filter((e) => e.examType === 'MIDTERM');
    for (const exam of midTermExams) {
      await prisma.exam.update({
        where: { id: exam.id },
        data: { isPublished: true },
      });
    }
    console.log(`✅ Published ${midTermExams.length} exam results\n`);

    // 10. Summary
    console.log('✨ Examination Module Seed Completed Successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Exams Created: ${exams.length}`);
    console.log(`   - Exam Results: ${totalResultsCreated}`);
    console.log(`   - Students with Results: ${students.length}`);
    console.log(`   - Published Exams: ${midTermExams.length}`);
    console.log(`   - Pending Exams: ${exams.length - midTermExams.length}\n`);
    console.log('🎉 Ready to test Examination module!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Seed Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedExamData();
