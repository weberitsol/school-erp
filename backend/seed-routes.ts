import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCHOOL_ID = '066cbecc-d948-4c56-b33f-edf73a1606b7'; // Weber Academy

async function seedRoutes() {
  try {
    console.log('Starting routes seeding...');

    // Get the school
    const school = await prisma.school.findUnique({
      where: { id: SCHOOL_ID },
    });

    if (!school) {
      throw new Error('School not found');
    }

    console.log(`Found school: ${school.name}`);

    const routeData = [
      {
        name: 'Morning East Route',
        description: 'East Gate Bus Stand to School Main Campus',
        startTime: '07:00',
        endTime: '07:45',
        status: 'ACTIVE' as const,
      },
      {
        name: 'Morning South Route',
        description: 'South Market Area to School Main Campus',
        startTime: '07:15',
        endTime: '08:00',
        status: 'ACTIVE' as const,
      },
      {
        name: 'Evening North Route',
        description: 'School Main Campus to North Residential Area',
        startTime: '16:00',
        endTime: '16:50',
        status: 'ACTIVE' as const,
      },
      {
        name: 'Morning West Route',
        description: 'West Industrial Area to School Main Campus',
        startTime: '06:30',
        endTime: '07:30',
        status: 'ACTIVE' as const,
      },
      {
        name: 'Evening South Route',
        description: 'School Main Campus to South Market Area',
        startTime: '16:15',
        endTime: '17:00',
        status: 'ACTIVE' as const,
      },
    ];

    for (const route of routeData) {
      // Check if route already exists
      const existing = await prisma.route.findFirst({
        where: {
          name: route.name,
          schoolId: SCHOOL_ID,
        },
      });

      if (existing) {
        console.log(`Route already exists: ${route.name}`);
        continue;
      }

      // Create route
      const createdRoute = await prisma.route.create({
        data: {
          name: route.name,
          description: route.description,
          startTime: route.startTime,
          endTime: route.endTime,
          schoolId: SCHOOL_ID,
          status: route.status,
        },
      });

      console.log(`✓ Created route: ${createdRoute.name}`);
    }

    // Fetch and display all routes
    const allRoutes = await prisma.route.findMany({
      where: { schoolId: SCHOOL_ID },
      orderBy: { name: 'asc' },
    });

    console.log('\n✓ All routes:');
    allRoutes.forEach((route) => {
      console.log(`  - ${route.name}: ${route.startTime} → ${route.endTime}`);
    });

    console.log(`\n✓ Successfully seeded ${allRoutes.length} routes`);
  } catch (error) {
    console.error('Error seeding routes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedRoutes();
