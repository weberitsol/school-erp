import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Seeding database with test users...\n');

    // 1. Create or find a test school
    console.log('1️⃣ Creating/finding test school...');
    let school = await prisma.school.findFirst({
      where: { code: 'WEBER' },
    });

    if (!school) {
      school = await prisma.school.create({
        data: {
          name: 'Weber Academy',
          code: 'WEBER',
          email: 'admin@weberacademy.edu',
          phone: '+91-9999999999',
          address: '123 School Street',
          city: 'New Delhi',
          state: 'Delhi',
          country: 'India',
          pincode: '110001',
          boardType: 'CBSE',
          isActive: true,
        },
      });
      console.log(`✅ Created school: ${school.name} (${school.id})\n`);
    } else {
      console.log(`✅ Found existing school: ${school.name} (${school.id})\n`);
    }

    // 2. Create test admin user
    console.log('2️⃣ Creating test admin user...');
    const adminEmail = 'admin@weberacademy.edu';
    const adminPassword = 'Admin@12345';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN' as UserRole,
          isActive: true,
          schoolId: school.id,
        },
      });
      console.log(`✅ Created admin user: ${adminUser.email} (${adminUser.id})`);
      console.log(`   Password: ${adminPassword}\n`);
    } else {
      // Update password if user exists
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          isActive: true,
        },
      });
      console.log(`✅ Updated existing admin user: ${adminUser.email}`);
      console.log(`   Password: ${adminPassword}\n`);
    }

    // 3. Create Admin profile
    console.log('3️⃣ Creating admin profile...');
    let adminProfile = await prisma.admin.findUnique({
      where: { userId: adminUser.id },
    });

    if (!adminProfile) {
      adminProfile = await prisma.admin.create({
        data: {
          userId: adminUser.id,
          firstName: 'Admin',
          lastName: 'User',
          phone: '+91-9999999999',
          designation: 'School Administrator',
        },
      });
      console.log(`✅ Created admin profile (${adminProfile.id})\n`);
    } else {
      console.log(`✅ Admin profile already exists (${adminProfile.id})\n`);
    }

    // 4. Create test teacher user
    console.log('4️⃣ Creating test teacher user...');
    const teacherEmail = 'teacher@weberacademy.edu';
    const teacherPassword = 'Teacher@12345';
    const teacherHashedPassword = await bcrypt.hash(teacherPassword, 10);

    let teacherUser = await prisma.user.findUnique({
      where: { email: teacherEmail },
    });

    if (!teacherUser) {
      teacherUser = await prisma.user.create({
        data: {
          email: teacherEmail,
          password: teacherHashedPassword,
          role: 'TEACHER' as UserRole,
          isActive: true,
          schoolId: school.id,
        },
      });
      console.log(`✅ Created teacher user: ${teacherUser.email} (${teacherUser.id})`);
      console.log(`   Password: ${teacherPassword}\n`);
    } else {
      await prisma.user.update({
        where: { email: teacherEmail },
        data: {
          password: teacherHashedPassword,
          isActive: true,
        },
      });
      console.log(`✅ Updated existing teacher user: ${teacherUser.email}\n`);
    }

    // 5. Create test student user
    console.log('5️⃣ Creating test student user...');
    const studentEmail = 'student@weberacademy.edu';
    const studentPassword = 'Student@12345';
    const studentHashedPassword = await bcrypt.hash(studentPassword, 10);

    let studentUser = await prisma.user.findUnique({
      where: { email: studentEmail },
    });

    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          email: studentEmail,
          password: studentHashedPassword,
          role: 'STUDENT' as UserRole,
          isActive: true,
          schoolId: school.id,
        },
      });
      console.log(`✅ Created student user: ${studentUser.email} (${studentUser.id})`);
      console.log(`   Password: ${studentPassword}\n`);
    } else {
      await prisma.user.update({
        where: { email: studentEmail },
        data: {
          password: studentHashedPassword,
          isActive: true,
        },
      });
      console.log(`✅ Updated existing student user: ${studentUser.email}\n`);
    }

    // 6. Display login credentials
    console.log('━'.repeat(60));
    console.log('✅ Database seeding completed successfully!\n');
    console.log('📝 Test Login Credentials:');
    console.log('━'.repeat(60));
    console.log(`Admin:  ${adminEmail} / ${adminPassword}`);
    console.log(`Teacher: ${teacherEmail} / ${teacherPassword}`);
    console.log(`Student: ${studentEmail} / ${studentPassword}`);
    console.log('━'.repeat(60));
    console.log(`\n🏫 School ID: ${school.id}`);
    console.log(`👤 Admin User ID: ${adminUser.id}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
