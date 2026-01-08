/**
 * Database Seeding Script for Document Generation Testing
 * This script seeds the database with realistic test data for:
 * - Online Tests (with questions)
 * - Chapters (for study materials)
 * - Students (with grades for report cards)
 */

import { PrismaClient, UserRole, Gender, QuestionType, DifficultyLevel, TestType, ExamType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDocumentGenerationTestData() {
  console.log('\n📚 Seeding Document Generation Test Data...\n');

  try {
    // Get or create school
    let school = await prisma.school.findFirst({
      where: { code: 'WEBER001' }
    });

    if (!school) {
      school = await prisma.school.create({
        data: {
          name: 'Weber Academy',
          code: 'WEBER001',
          address: '123 Education Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: '400001',
          phone: '+91 9876543210',
          email: 'info@weberacademy.edu',
          boardType: 'CBSE',
          isActive: true,
        },
      });
      console.log(`✅ School created: ${school.name}`);
    }

    // Get or create academic year
    let academicYear = await prisma.academicYear.findFirst({
      where: { year: '2024-2025' }
    });

    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          year: '2024-2025',
          startDate: new Date('2024-04-01'),
          endDate: new Date('2025-03-31'),
          schoolId: school.id,
          isActive: true,
        },
      });
      console.log(`✅ Academic year created: ${academicYear.year}`);
    }

    // Get or create admin user
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@weberacademy.edu' }
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@weberacademy.edu',
          password: hashedPassword,
          role: UserRole.ADMIN,
          schoolId: school.id,
          isActive: true,
        },
      });
      console.log(`✅ Admin user created`);
    }

    // Create or get teacher user
    let teacherUser = await prisma.user.findUnique({
      where: { email: 'teacher@weberacademy.edu' }
    });

    if (!teacherUser) {
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      teacherUser = await prisma.user.create({
        data: {
          email: 'teacher@weberacademy.edu',
          password: hashedPassword,
          role: UserRole.TEACHER,
          schoolId: school.id,
          isActive: true,
        },
      });
      console.log(`✅ Teacher user created`);
    }

    // Get or create class
    let class11 = await prisma.class.findFirst({
      where: { name: 'Class 11 (A)' }
    });

    if (!class11) {
      class11 = await prisma.class.create({
        data: {
          name: 'Class 11 (A)',
          code: 'C11A',
          schoolId: school.id,
          isActive: true,
        },
      });
      console.log(`✅ Class 11 (A) created`);
    }

    // Get or create subjects
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
    const createdSubjects: any = {};

    for (const subjectName of subjects) {
      let subject = await prisma.subject.findFirst({
        where: { name: subjectName, schoolId: school.id }
      });

      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            name: subjectName,
            code: subjectName.substring(0, 3).toUpperCase(),
            schoolId: school.id,
            isActive: true,
          },
        });
        console.log(`✅ Subject created: ${subjectName}`);
      }
      createdSubjects[subjectName] = subject;
    }

    // ==================== CREATE TESTS ====================
    console.log('\n📝 Creating Tests with Questions...');

    // Test 1: Mathematics
    const mathsTest = await prisma.onlineTest.create({
      data: {
        title: 'Mathematics Chapter 1: Functions and Relations',
        description: 'Comprehensive test on functions, relations, and their properties',
        subjectId: createdSubjects['Mathematics'].id,
        classId: class11.id,
        createdById: teacherUser.id,
        totalMarks: 100,
        passingMarks: 40,
        durationMinutes: 90,
        testType: TestType.PRACTICE,
        status: 'PUBLISHED',
      },
    });

    console.log(`✅ Test created: ${mathsTest.title}`);

    // Create questions for Maths test
    const mathQuestions = [
      {
        questionText: 'Which of the following is a function?',
        questionType: QuestionType.MCQ,
        options: [
          { id: 'a', text: 'A relation where each input has one output' },
          { id: 'b', text: 'A relation where input can have multiple outputs' },
          { id: 'c', text: 'A set of all ordered pairs' },
          { id: 'd', text: 'None of the above' },
        ],
        correctAnswer: 'a',
        answerExplanation: 'A function is defined as a relation where each input has exactly one output.',
        difficulty: DifficultyLevel.EASY,
        marks: 1,
      },
      {
        questionText: 'Find the domain of f(x) = 1/(x-2)',
        questionType: QuestionType.SHORT_ANSWER,
        correctAnswer: 'All real numbers except 2',
        answerExplanation: 'The function is undefined when the denominator is zero, i.e., when x = 2.',
        difficulty: DifficultyLevel.MEDIUM,
        marks: 2,
      },
      {
        questionText: 'Prove that f(x) = 2x + 3 is a one-to-one function.',
        questionType: QuestionType.LONG_ANSWER,
        correctAnswer: 'Assume f(a) = f(b). Then 2a + 3 = 2b + 3. Therefore, 2a = 2b, which gives a = b. Hence, f is one-to-one.',
        answerExplanation: 'Using the definition of one-to-one function, we can prove this by assuming two inputs produce the same output.',
        difficulty: DifficultyLevel.HARD,
        marks: 5,
      },
    ];

    for (let i = 0; i < mathQuestions.length; i++) {
      const q = mathQuestions[i];
      const question = await prisma.question.create({
        data: {
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          answerExplanation: q.answerExplanation,
          difficulty: q.difficulty,
          subjectId: createdSubjects['Mathematics'].id,
          classId: class11.id,
          createdById: teacherUser.id,
          isActive: true,
        },
      });

      await prisma.testQuestion.create({
        data: {
          testId: mathsTest.id,
          questionId: question.id,
          marks: q.marks,
          sequenceOrder: i + 1,
        },
      });
    }

    console.log(`✅ Added ${mathQuestions.length} questions to Maths test`);

    // Test 2: Physics
    const physicsTest = await prisma.onlineTest.create({
      data: {
        title: 'Physics: Motion and Forces',
        description: 'Test covering Newton\'s laws of motion and their applications',
        subjectId: createdSubjects['Physics'].id,
        classId: class11.id,
        createdById: teacherUser.id,
        totalMarks: 100,
        passingMarks: 35,
        durationMinutes: 120,
        testType: TestType.PRACTICE,
        status: 'PUBLISHED',
      },
    });

    console.log(`✅ Test created: ${physicsTest.title}`);

    // Create questions for Physics test
    const physicsQuestions = [
      {
        questionText: 'What is Newton\'s second law of motion?',
        questionType: QuestionType.MCQ,
        options: [
          { id: 'a', text: 'F = ma' },
          { id: 'b', text: 'v = u + at' },
          { id: 'c', text: 'Every action has an equal and opposite reaction' },
          { id: 'd', text: 'An object in motion stays in motion' },
        ],
        correctAnswer: 'a',
        difficulty: DifficultyLevel.EASY,
        marks: 1,
      },
      {
        questionText: 'A car of mass 1000 kg accelerates at 5 m/s². What is the force applied?',
        questionType: QuestionType.SHORT_ANSWER,
        correctAnswer: '5000 N',
        difficulty: DifficultyLevel.MEDIUM,
        marks: 2,
      },
      {
        questionText: 'Derive the equations of motion using calculus.',
        questionType: QuestionType.LONG_ANSWER,
        correctAnswer: 'Using integration of acceleration to get velocity and displacement.',
        difficulty: DifficultyLevel.HARD,
        marks: 5,
      },
    ];

    for (let i = 0; i < physicsQuestions.length; i++) {
      const q = physicsQuestions[i];
      const question = await prisma.question.create({
        data: {
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          subjectId: createdSubjects['Physics'].id,
          classId: class11.id,
          createdById: teacherUser.id,
          isActive: true,
        },
      });

      await prisma.testQuestion.create({
        data: {
          testId: physicsTest.id,
          questionId: question.id,
          marks: q.marks,
          sequenceOrder: i + 1,
        },
      });
    }

    console.log(`✅ Added ${physicsQuestions.length} questions to Physics test`);

    // ==================== CREATE CHAPTERS ====================
    console.log('\n📚 Creating Chapters...');

    const chapters = [
      { name: 'Chapter 1: Sets and Functions', subject: 'Mathematics', description: 'Introduction to sets, relations, and functions' },
      { name: 'Chapter 2: Inverse Trigonometric Functions', subject: 'Mathematics', description: 'Properties and applications of inverse trig functions' },
      { name: 'Chapter 1: Physical World', subject: 'Physics', description: 'Nature of physics and scope of physical laws' },
      { name: 'Chapter 2: Units and Measurements', subject: 'Physics', description: 'System of units and measurement of physical quantities' },
      { name: 'Chapter 1: Some Basic Concepts of Chemistry', subject: 'Chemistry', description: 'Matter, properties, and basic chemistry concepts' },
      { name: 'Chapter 2: Structure of Atom', subject: 'Chemistry', description: 'Atomic structure and electron configuration' },
    ];

    for (const chapterData of chapters) {
      const chapter = await prisma.chapter.create({
        data: {
          name: chapterData.name,
          description: chapterData.description,
          subjectId: createdSubjects[chapterData.subject].id,
          classId: class11.id,
          createdById: teacherUser.id,
          isActive: true,
        },
      });
      console.log(`✅ Chapter created: ${chapterData.name}`);
    }

    // ==================== CREATE STUDENTS ====================
    console.log('\n👥 Creating Students...');

    const studentData = [
      { firstName: 'Amit', lastName: 'Sharma', email: 'amit.sharma@student.edu', admissionNo: 'STU2024001' },
      { firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@student.edu', admissionNo: 'STU2024002' },
      { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh.kumar@student.edu', admissionNo: 'STU2024003' },
      { firstName: 'Neha', lastName: 'Singh', email: 'neha.singh@student.edu', admissionNo: 'STU2024004' },
      { firstName: 'Rohan', lastName: 'Gupta', email: 'rohan.gupta@student.edu', admissionNo: 'STU2024005' },
    ];

    const createdStudents = [];

    for (const studentInfo of studentData) {
      let studentUser = await prisma.user.findUnique({
        where: { email: studentInfo.email }
      });

      if (!studentUser) {
        const hashedPassword = await bcrypt.hash('student123', 10);
        studentUser = await prisma.user.create({
          data: {
            email: studentInfo.email,
            password: hashedPassword,
            role: UserRole.STUDENT,
            schoolId: school.id,
            isActive: true,
          },
        });
      }

      const student = await prisma.student.upsert({
        where: { admissionNo: studentInfo.admissionNo },
        update: {},
        create: {
          admissionNo: studentInfo.admissionNo,
          firstName: studentInfo.firstName,
          lastName: studentInfo.lastName,
          gender: Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE,
          dateOfBirth: new Date('2006-05-15'),
          currentClassId: class11.id,
          userId: studentUser.id,
          schoolId: school.id,
          isActive: true,
        },
      });

      createdStudents.push(student);
      console.log(`✅ Student created: ${student.firstName} ${student.lastName} (${studentInfo.admissionNo})`);
    }

    // ==================== CREATE EXAM WITH RESULTS ====================
    console.log('\n📅 Creating Exam and Results...');

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        name: 'Mid Term Examination 2024',
        examType: ExamType.MIDTERM,
        academicYearId: academicYear.id,
        classId: class11.id,
        subjectId: createdSubjects['Mathematics'].id,
        date: new Date('2024-05-15'),
        createdById: teacherUser.id,
        isActive: true,
      },
    });

    console.log(`✅ Exam created: ${exam.name}`);

    // Create results for each student
    for (const student of createdStudents) {
      const marksObtained = Math.floor(Math.random() * 60) + 40; // 40-100
      const totalMarks = 100;
      const percentage = (marksObtained / totalMarks) * 100;

      let grade = 'E';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C';

      await prisma.examResult.create({
        data: {
          studentId: student.id,
          examId: exam.id,
          marksObtained,
          totalMarks,
          percentage,
          grade,
        },
      });
    }

    console.log(`✅ Exam results created for ${createdStudents.length} students`);

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE SEEDING COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📊 Test Data Summary:');
    console.log(`   • Tests: 2 (Mathematics, Physics)`);
    console.log(`   • Questions: ${mathQuestions.length + physicsQuestions.length}`);
    console.log(`   • Chapters: ${chapters.length}`);
    console.log(`   • Students: ${createdStudents.length}`);
    console.log(`   • Exam Results: ${createdStudents.length}`);
    console.log('\n🎯 Ready for Testing:');
    console.log('   ✅ Generate Question Papers from Tests');
    console.log('   ✅ Generate Report Cards from Student Results');
    console.log('   ✅ Generate Certificates for Students');
    console.log('   ✅ Generate Study Materials from Chapters');
    console.log('\n📝 Login Credentials:');
    console.log('   Email: admin@weberacademy.edu');
    console.log('   Password: admin123\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedDocumentGenerationTestData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
