import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================================');
  console.log('SEEDING SAMPLE TRANSPORTATION ROUTES AND VEHICLES');
  console.log('================================================================================\n');

  try {
    // Get a school ID (assuming the first school exists from initial seeding)
    const school = await prisma.school.findFirst();
    if (!school) {
      console.error('[ERROR] No school found. Please ensure schools are seeded first.');
      process.exit(1);
    }

    console.log(`[1] Using School: ${school.name} (ID: ${school.id})`);

    // Create sample routes
    console.log('\n[2] Creating sample transportation routes...');

    const routeData = [
      {
        schoolId: school.id,
        name: 'Morning Route - North',
        startTime: '08:00',
        endTime: '09:00',
        status: 'ACTIVE' as const,
        description: 'Morning pickup from north residential area',
      },
      {
        schoolId: school.id,
        name: 'Morning Route - South',
        startTime: '08:00',
        endTime: '09:00',
        status: 'ACTIVE' as const,
        description: 'Morning pickup from south residential area',
      },
      {
        schoolId: school.id,
        name: 'Morning Route - East',
        startTime: '08:15',
        endTime: '09:15',
        status: 'ACTIVE' as const,
        description: 'Morning pickup from east residential area',
      },
      {
        schoolId: school.id,
        name: 'Evening Route - North',
        startTime: '15:00',
        endTime: '16:00',
        status: 'ACTIVE' as const,
        description: 'Evening dropoff to north residential area',
      },
      {
        schoolId: school.id,
        name: 'Evening Route - South',
        startTime: '15:00',
        endTime: '16:00',
        status: 'ACTIVE' as const,
        description: 'Evening dropoff to south residential area',
      },
    ];

    const routes = [];
    for (let i = 0; i < routeData.length; i++) {
      const route = await prisma.route.create({
        data: routeData[i],
      });
      routes.push(route);
      console.log(`    Route ${i + 1}: ${route.name} (${route.startTime}-${route.endTime}) - Created`);
    }

    console.log(`\n    Total routes created: ${routes.length}`);

    // Create sample vehicles
    console.log('\n[3] Creating sample transportation vehicles...');

    const vehicleData = [
      {
        schoolId: school.id,
        registrationNumber: 'KA-01-AB-1001',
        type: 'BUS' as const,
        capacity: 45,
        status: 'ACTIVE' as const,
        purchaseDate: new Date('2020-01-15'),
      },
      {
        schoolId: school.id,
        registrationNumber: 'KA-01-AB-1002',
        type: 'BUS' as const,
        capacity: 45,
        status: 'ACTIVE' as const,
        purchaseDate: new Date('2020-06-20'),
      },
      {
        schoolId: school.id,
        registrationNumber: 'KA-01-AB-2001',
        type: 'VAN' as const,
        capacity: 20,
        status: 'ACTIVE' as const,
        purchaseDate: new Date('2021-03-10'),
      },
      {
        schoolId: school.id,
        registrationNumber: 'KA-01-AB-2002',
        type: 'VAN' as const,
        capacity: 20,
        status: 'ACTIVE' as const,
        purchaseDate: new Date('2021-08-25'),
      },
      {
        schoolId: school.id,
        registrationNumber: 'KA-01-AB-3001',
        type: 'CAR' as const,
        capacity: 8,
        status: 'ACTIVE' as const,
        purchaseDate: new Date('2022-05-12'),
      },
    ];

    const vehicles = [];
    for (let i = 0; i < vehicleData.length; i++) {
      const vehicle = await prisma.vehicle.create({
        data: vehicleData[i],
      });
      vehicles.push(vehicle);
      console.log(
        `    Vehicle ${i + 1}: ${vehicle.registrationNumber} (${vehicle.type}) - Capacity: ${vehicle.capacity} - Created`
      );
    }

    console.log(`\n    Total vehicles created: ${vehicles.length}`);

    // Verify created data
    console.log('\n[4] Verifying created data...');

    const totalRoutes = await prisma.route.count({ where: { schoolId: school.id } });
    const totalVehicles = await prisma.vehicle.count({ where: { schoolId: school.id } });

    console.log(`    Total routes in database: ${totalRoutes}`);
    console.log(`    Total vehicles in database: ${totalVehicles}`);

    console.log('\n' + '='.repeat(80));
    console.log(
      `SUCCESS - Created ${routes.length} routes and ${vehicles.length} vehicles!`
    );
    console.log('='.repeat(80));
  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
