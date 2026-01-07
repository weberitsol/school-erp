import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const SCHOOL_ID = '066cbecc-d948-4c56-b33f-edf73a1606b7'; // Weber Academy

async function seedDrivers() {
  try {
    console.log('Starting driver seeding...');

    // Get the school
    const school = await prisma.school.findUnique({
      where: { id: SCHOOL_ID },
    });

    if (!school) {
      throw new Error('School not found');
    }

    console.log(`Found school: ${school.name}`);

    // Create drivers with their users
    const drivers = [
      {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh.driver@weberacademy.edu',
        phone: '9876543210',
        licenseNumber: 'DL01AB1234',
        licenseExpiry: '2026-12-31',
      },
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.driver@weberacademy.edu',
        phone: '9876543211',
        licenseNumber: 'DL02AB1235',
        licenseExpiry: '2025-06-30',
      },
      {
        firstName: 'Vikram',
        lastName: 'Singh',
        email: 'vikram.driver@weberacademy.edu',
        phone: '9876543212',
        licenseNumber: 'DL03AB1236',
        licenseExpiry: '2026-09-15',
      },
    ];

    for (const driverData of drivers) {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: driverData.email },
      });

      if (!user) {
        // Hash password
        const hashedPassword = await hash('driver123', 10);

        // Create user
        user = await prisma.user.create({
          data: {
            email: driverData.email,
            password: hashedPassword,
            role: 'TEACHER', // Using TEACHER role for drivers
            schoolId: SCHOOL_ID,
            isActive: true,
          },
        });

        console.log(`Created user: ${driverData.email}`);
      } else {
        console.log(`User already exists: ${driverData.email}`);
      }

      // Check if teacher profile already exists
      let teacher = await prisma.teacher.findUnique({
        where: { userId: user.id },
      });

      if (!teacher) {
        // Create teacher profile for the driver
        teacher = await prisma.teacher.create({
          data: {
            userId: user.id,
            firstName: driverData.firstName,
            lastName: driverData.lastName,
            phone: driverData.phone,
            employeeId: `DRV-${driverData.licenseNumber}`,
            gender: 'MALE', // Default gender
            isActive: true,
          },
        });

        console.log(`Created teacher profile for: ${driverData.email}`);
      }

      // Check if driver already exists
      const existingDriver = await prisma.driver.findUnique({
        where: { userId: user.id },
      });

      if (existingDriver) {
        console.log(`Driver already exists for: ${driverData.email}`);
        continue;
      }

      // Create driver
      const driver = await prisma.driver.create({
        data: {
          userId: user.id,
          phone: driverData.phone,
          licenseNumber: driverData.licenseNumber,
          licenseExpiry: new Date(driverData.licenseExpiry),
          schoolId: SCHOOL_ID,
          status: 'ACTIVE',
          isActive: true,
        },
      });

      console.log(`✓ Created driver: ${driverData.firstName} ${driverData.lastName} (${driverData.licenseNumber})`);
    }

    // Fetch and display all drivers
    const allDrivers = await prisma.driver.findMany({
      where: { schoolId: SCHOOL_ID },
      include: { user: { include: { teacher: true } } },
    });

    console.log('\n✓ All drivers:');
    allDrivers.forEach((driver) => {
      const firstName = driver.user.teacher?.firstName || 'Unknown';
      const lastName = driver.user.teacher?.lastName || 'Unknown';
      console.log(
        `  - ${firstName} ${lastName} (${driver.licenseNumber})`
      );
    });

    console.log(`\n✓ Successfully seeded ${allDrivers.length} drivers`);
  } catch (error) {
    console.error('Error seeding drivers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDrivers();
