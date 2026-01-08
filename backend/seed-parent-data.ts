import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function seedParentData() {
  try {
    console.log('🌱 Starting Parent Management Module Seed...\n');

    // 1. Get school
    const school = await prisma.school.findFirst();
    if (!school) {
      throw new Error('No school found. Please create a school first.');
    }
    console.log(`📍 Using school: ${school.name}\n`);

    // 2. Clean existing parent data
    console.log('🧹 Cleaning up existing parent data...');
    await prisma.studentParent.deleteMany({});
    await prisma.parent.deleteMany({});
    console.log('✅ Cleaned up existing data\n');

    // 3. Get students
    console.log('👨‍🎓 Getting students...');
    const students = await prisma.student.findMany({
      where: {
        user: { schoolId: school.id },
      },
      take: 5,
      include: { currentClass: true },
    });

    if (students.length === 0) {
      throw new Error('No students found. Please create students first.');
    }
    console.log(`✅ Found ${students.length} students\n`);

    // 4. Create parent users and parent records
    console.log('👨‍👩‍👧 Creating Parents...');
    const parentUsers = [];
    const parentRecords = [];
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);

    // Parent 1: Father of student 1
    const user1 = await prisma.user.create({
      data: {
        email: `father.sharma.${timestamp}.${random}@example.com`,
        password: await bcryptjs.hash('Test@1234', 10),
        role: 'PARENT',
        schoolId: school.id,
        isActive: true,
      },
    });

    const parent1 = await prisma.parent.create({
      data: {
        userId: user1.id,
        firstName: 'Rajesh',
        lastName: 'Sharma',
        relation: 'Father',
        phone: '9876543210',
        alternatePhone: '9876543211',
        email: 'rajesh.sharma@example.com',
        occupation: 'Software Engineer',
        address: '123 Tech Street',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
      },
    });
    parentRecords.push(parent1);

    // Parent 2: Mother of student 1
    const user2 = await prisma.user.create({
      data: {
        email: `mother.sharma.${timestamp}.${random}@example.com`,
        password: await bcryptjs.hash('Test@1234', 10),
        role: 'PARENT',
        schoolId: school.id,
        isActive: true,
      },
    });

    const parent2 = await prisma.parent.create({
      data: {
        userId: user2.id,
        firstName: 'Priya',
        lastName: 'Sharma',
        relation: 'Mother',
        phone: '9876543212',
        alternatePhone: '9876543213',
        email: 'priya.sharma@example.com',
        occupation: 'Doctor',
        address: '123 Tech Street',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
      },
    });
    parentRecords.push(parent2);

    // Parent 3: Father of student 2
    const user3 = await prisma.user.create({
      data: {
        email: `father.kumar.${timestamp}.${random}@example.com`,
        password: await bcryptjs.hash('Test@1234', 10),
        role: 'PARENT',
        schoolId: school.id,
        isActive: true,
      },
    });

    const parent3 = await prisma.parent.create({
      data: {
        userId: user3.id,
        firstName: 'Vikram',
        lastName: 'Kumar',
        relation: 'Father',
        phone: '9876543214',
        email: 'vikram.kumar@example.com',
        occupation: 'Business Owner',
        address: '456 Business Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
    });
    parentRecords.push(parent3);

    // Parent 4: Mother of student 2
    const user4 = await prisma.user.create({
      data: {
        email: `mother.kumar.${timestamp}.${random}@example.com`,
        password: await bcryptjs.hash('Test@1234', 10),
        role: 'PARENT',
        schoolId: school.id,
        isActive: true,
      },
    });

    const parent4 = await prisma.parent.create({
      data: {
        userId: user4.id,
        firstName: 'Neha',
        lastName: 'Kumar',
        relation: 'Mother',
        phone: '9876543215',
        email: 'neha.kumar@example.com',
        occupation: 'Teacher',
        address: '456 Business Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
    });
    parentRecords.push(parent4);

    // Parent 5: Guardian of student 3
    const user5 = await prisma.user.create({
      data: {
        email: `guardian.patel.${timestamp}.${random}@example.com`,
        password: await bcryptjs.hash('Test@1234', 10),
        role: 'PARENT',
        schoolId: school.id,
        isActive: true,
      },
    });

    const parent5 = await prisma.parent.create({
      data: {
        userId: user5.id,
        firstName: 'Anil',
        lastName: 'Patel',
        relation: 'Guardian',
        phone: '9876543216',
        email: 'anil.patel@example.com',
        occupation: 'Accountant',
        address: '789 Market Road',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
    });
    parentRecords.push(parent5);

    // Parent 6: No email (test scenario)
    const user6 = await prisma.user.create({
      data: {
        email: `parent.singh.${timestamp}.${random}@example.com`,
        password: await bcryptjs.hash('Test@1234', 10),
        role: 'PARENT',
        schoolId: school.id,
        isActive: true,
      },
    });

    const parent6 = await prisma.parent.create({
      data: {
        userId: user6.id,
        firstName: 'Rajesh',
        lastName: 'Singh',
        relation: 'Father',
        phone: '9876543217',
        occupation: 'Construction Manager',
        address: '321 Industrial Area',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      },
    });
    parentRecords.push(parent6);

    console.log(`✅ Created ${parentRecords.length} parents\n`);

    // 5. Link parents to students (dynamically based on available students)
    console.log('🔗 Linking parents to students...');
    const studentParentLinks = [];

    // Link students to parents (cycling through available parents)
    const allParents = [parent1, parent2, parent3, parent4, parent5, parent6];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      // Link each student to 1-2 parents
      const parentIndex1 = i % allParents.length;
      const parentIndex2 = (i + 1) % allParents.length;

      // Link primary parent
      const link1 = await prisma.studentParent.create({
        data: {
          studentId: student.id,
          parentId: allParents[parentIndex1].id,
          isPrimary: true,
        },
      });
      studentParentLinks.push(link1);

      // Link secondary parent (if different from primary)
      if (parentIndex1 !== parentIndex2) {
        const link2 = await prisma.studentParent.create({
          data: {
            studentId: student.id,
            parentId: allParents[parentIndex2].id,
            isPrimary: false,
          },
        });
        studentParentLinks.push(link2);
      }
    }

    console.log(`✅ Created ${studentParentLinks.length} parent-student links\n`);

    // 6. Print summary
    console.log('✨ Parent Management Module Seed Completed Successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Parents Created: ${parentRecords.length}`);
    console.log(`   - Parent-Student Links: ${studentParentLinks.length}`);
    console.log(`   - Students with Parents: ${students.length}`);
    console.log(`   - Parents with Email: 5`);
    console.log(`   - Parents without Email: 1`);
    console.log('\n📋 Parent Details:');
    parentRecords.forEach((parent, index) => {
      const email = parent.email ? `✓ ${parent.email}` : '✗ No email';
      console.log(`   ${index + 1}. ${parent.firstName} ${parent.lastName} (${parent.relation}) - ${email}`);
    });
    console.log('\n🎉 Ready to test Parent Management module!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Seed Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedParentData();
