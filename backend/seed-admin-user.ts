import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Setting up admin user for testing...\n');

    // Password to use
    const adminPassword = 'Admin@12345';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Get or create the existing admin user
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@weberacademy.edu' },
    });

    if (adminUser) {
      // Update password
      adminUser = await prisma.user.update({
        where: { email: 'admin@weberacademy.edu' },
        data: { password: hashedPassword },
      });
      console.log('✅ Updated admin user password');
    } else {
      // Create admin user
      const school = await prisma.school.findFirst();
      if (!school) {
        throw new Error('No school found. Please seed school first.');
      }

      adminUser = await prisma.user.create({
        data: {
          email: 'admin@weberacademy.edu',
          password: hashedPassword,
          role: 'ADMIN',
          schoolId: school.id,
          isActive: true,
        },
      });
      console.log('✅ Created new admin user');
    }

    // Display the hashed password for verification
    console.log('\n📝 Verification:');
    console.log(`Email: admin@weberacademy.edu`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Hash: ${hashedPassword}`);

    // Test bcrypt verify
    const isValid = await bcrypt.compare(adminPassword, hashedPassword);
    console.log(`Bcrypt verify test: ${isValid ? '✅ PASS' : '❌ FAIL'}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
