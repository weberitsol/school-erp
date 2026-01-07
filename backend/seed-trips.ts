import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCHOOL_ID = '066cbecc-d948-4c56-b33f-edf73a1606b7'; // Weber Academy

async function seedTrips() {
  try {
    console.log('Starting trip seeding...');

    // Get the school
    const school = await prisma.school.findUnique({
      where: { id: SCHOOL_ID },
    });

    if (!school) {
      throw new Error('School not found');
    }

    console.log(`Found school: ${school.name}`);

    // Get all routes, vehicles, and drivers
    const routes = await prisma.route.findMany({
      where: { schoolId: SCHOOL_ID },
    });

    const vehicles = await prisma.vehicle.findMany({
      where: { schoolId: SCHOOL_ID },
    });

    const drivers = await prisma.driver.findMany({
      where: { schoolId: SCHOOL_ID },
    });

    console.log(`Found ${routes.length} routes, ${vehicles.length} vehicles, ${drivers.length} drivers`);

    if (routes.length === 0 || vehicles.length === 0 || drivers.length === 0) {
      throw new Error('Missing required data: routes, vehicles, or drivers');
    }

    // Create trips for tomorrow and the day after
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Set to midnight to ensure it's a proper date (no time component)
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(0, 0, 0, 0);

    const tripData = [
      // Morning Route - East (Tomorrow)
      {
        tripDate: tomorrow,
        routeId: routes[0]?.id,
        vehicleId: vehicles[0]?.id,
        driverId: drivers[0]?.id,
        status: 'SCHEDULED' as const,
      },
      // Morning Route - South (Tomorrow)
      {
        tripDate: tomorrow,
        routeId: routes[1]?.id,
        vehicleId: vehicles[1]?.id,
        driverId: drivers[1]?.id,
        status: 'SCHEDULED' as const,
      },
      // Evening Route - North (Tomorrow)
      {
        tripDate: tomorrow,
        routeId: routes[3]?.id,
        vehicleId: vehicles[2]?.id,
        driverId: drivers[2]?.id,
        status: 'SCHEDULED' as const,
      },
      // Morning Route - West (Day After)
      {
        tripDate: dayAfter,
        routeId: routes[3]?.id,
        vehicleId: vehicles[3]?.id,
        driverId: drivers[0]?.id,
        status: 'SCHEDULED' as const,
      },
      // Evening Route - South (Day After)
      {
        tripDate: dayAfter,
        routeId: routes[4]?.id,
        vehicleId: vehicles[1]?.id,
        driverId: drivers[1]?.id,
        status: 'SCHEDULED' as const,
      },
    ];

    const createdTrips = [];

    for (const trip of tripData) {
      // Check if trip already exists
      const existing = await prisma.trip.findFirst({
        where: {
          tripDate: trip.tripDate,
          routeId: trip.routeId,
          driverId: trip.driverId,
        },
      });

      if (existing) {
        console.log(
          `Trip already exists for ${trip.tripDate.toDateString()} on route ${trip.routeId}`
        );
        continue;
      }

      // Create trip
      const createdTrip = await prisma.trip.create({
        data: {
          tripDate: trip.tripDate,
          routeId: trip.routeId,
          vehicleId: trip.vehicleId,
          driverId: trip.driverId,
          status: trip.status,
          schoolId: SCHOOL_ID,
        },
      });

      createdTrips.push(createdTrip);

      console.log(
        `✓ Created trip: ${createdTrip.tripDate} (${createdTrip.status}) - Route ID: ${createdTrip.routeId} - Vehicle ID: ${createdTrip.vehicleId} - Driver ID: ${createdTrip.driverId}`
      );
    }

    // Fetch and display all trips
    const allTrips = await prisma.trip.findMany({
      where: { schoolId: SCHOOL_ID },
      orderBy: { tripDate: 'asc' },
    });

    console.log('\n✓ All trips:');
    allTrips.forEach((trip) => {
      console.log(
        `  - ${trip.tripDate} (${trip.status}) - Route: ${trip.routeId}, Vehicle: ${trip.vehicleId}, Driver: ${trip.driverId}`
      );
    });

    console.log(`\n✓ Successfully seeded ${createdTrips.length} new trips`);
    console.log(`Total trips in database: ${allTrips.length}`);
  } catch (error) {
    console.error('Error seeding trips:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedTrips();
