import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCHOOL_ID = '066cbecc-d948-4c56-b33f-edf73a1606b7'; // Weber Academy

async function seedVehicles() {
  try {
    console.log('Starting vehicles seeding...');

    // Get the school
    const school = await prisma.school.findUnique({
      where: { id: SCHOOL_ID },
    });

    if (!school) {
      throw new Error('School not found');
    }

    console.log(`Found school: ${school.name}`);

    const vehicleData = [
      {
        registrationNumber: 'DL-01-AB-1234',
        type: 'BUS' as const,
        capacity: 50,
        purchaseDate: new Date('2022-01-15'),
        status: 'ACTIVE' as const,
      },
      {
        registrationNumber: 'DL-02-AB-1235',
        type: 'BUS' as const,
        capacity: 45,
        purchaseDate: new Date('2023-03-20'),
        status: 'ACTIVE' as const,
      },
      {
        registrationNumber: 'DL-03-AB-1236',
        type: 'VAN' as const,
        capacity: 8,
        purchaseDate: new Date('2023-06-10'),
        status: 'ACTIVE' as const,
      },
      {
        registrationNumber: 'DL-04-AB-1237',
        type: 'BUS' as const,
        capacity: 60,
        purchaseDate: new Date('2022-09-05'),
        status: 'ACTIVE' as const,
      },
    ];

    for (const vehicle of vehicleData) {
      // Check if vehicle already exists
      const existing = await prisma.vehicle.findUnique({
        where: {
          registrationNumber: vehicle.registrationNumber,
        },
      });

      if (existing) {
        console.log(`Vehicle already exists: ${vehicle.registrationNumber}`);
        continue;
      }

      // Create vehicle
      const createdVehicle = await prisma.vehicle.create({
        data: {
          registrationNumber: vehicle.registrationNumber,
          type: vehicle.type,
          capacity: vehicle.capacity,
          purchaseDate: vehicle.purchaseDate,
          schoolId: SCHOOL_ID,
          status: vehicle.status,
          isActive: true,
        },
      });

      console.log(`✓ Created vehicle: ${createdVehicle.type} (${createdVehicle.registrationNumber}) - Capacity: ${createdVehicle.capacity}`);
    }

    // Fetch and display all vehicles
    const allVehicles = await prisma.vehicle.findMany({
      where: { schoolId: SCHOOL_ID },
      orderBy: { registrationNumber: 'asc' },
    });

    console.log('\n✓ All vehicles:');
    allVehicles.forEach((vehicle) => {
      console.log(`  - ${vehicle.type} (${vehicle.registrationNumber}) - Capacity: ${vehicle.capacity}`);
    });

    console.log(`\n✓ Successfully seeded ${allVehicles.length} vehicles`);
  } catch (error) {
    console.error('Error seeding vehicles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedVehicles();
