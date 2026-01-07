import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCHOOL_ID = '066cbecc-d948-4c56-b33f-edf73a1606b7'; // Weber Academy

async function seedSchool() {
  try {
    console.log('Starting school seeding...');

    // Check if school already exists
    const existingSchool = await prisma.school.findUnique({
      where: { id: SCHOOL_ID },
    });

    if (existingSchool) {
      console.log(`School already exists: ${existingSchool.name}`);
      return;
    }

    // Create school
    const school = await prisma.school.create({
      data: {
        id: SCHOOL_ID,
        name: 'Weber Academy',
        code: 'WA2024',
        address: '123 Education Street',
        city: 'City',
        state: 'State',
        country: 'India',
        pincode: '12345',
        phone: '1-800-SCHOOL-1',
        email: 'admin@weberacademy.edu',
        website: 'https://weberacademy.edu',
        establishedYear: 2020,
        boardType: 'CBSE',
        isActive: true,
      },
    });

    console.log(`✓ Created school: ${school.name}`);
  } catch (error) {
    console.error('Error seeding school:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedSchool();
