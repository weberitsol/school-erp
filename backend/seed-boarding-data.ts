import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function seedBoardingData() {
  try {
    console.log('🌱 Starting Boarding/Hostel Module Seed...\n');

    // 1. Get school
    const school = await prisma.school.findFirst();
    if (!school) {
      throw new Error('No school found. Please create a school first.');
    }
    console.log(`📍 Using school: ${school.name}\n`);

    // 2. Clean existing boarding data
    console.log('🧹 Cleaning up existing boarding data...');
    await prisma.studentBoarding.deleteMany({});
    await prisma.hostelRoom.deleteMany({});
    await prisma.boardingFacility.deleteMany({});
    console.log('✅ Cleaned up existing data\n');

    // 3. Get some students
    console.log('👨‍🎓 Getting students...');
    const students = await prisma.student.findMany({
      where: { user: { schoolId: school.id } },
      take: 8,
    });

    if (students.length === 0) {
      throw new Error('No students found. Please create students first.');
    }
    console.log(`✅ Found ${students.length} students\n`);

    // 4. Create boarding facilities
    console.log('🏢 Creating Boarding Facilities...');

    const facility1 = await prisma.boardingFacility.create({
      data: {
        name: 'Main Hostel Block A',
        description: 'Primary residential building with dining and recreation areas',
        type: 'DINING',
        schoolId: school.id,
        available: true,
      },
    });

    const facility2 = await prisma.boardingFacility.create({
      data: {
        name: 'Study Hall Complex',
        description: 'Dedicated study and research facility',
        type: 'STUDY',
        schoolId: school.id,
        available: true,
      },
    });

    const facility3 = await prisma.boardingFacility.create({
      data: {
        name: 'Recreation Center',
        description: 'Sports and recreational activities center',
        type: 'RECREATION',
        schoolId: school.id,
        available: true,
      },
    });

    const facility4 = await prisma.boardingFacility.create({
      data: {
        name: 'Medical Center',
        description: '24/7 medical support and healthcare',
        type: 'MEDICAL',
        schoolId: school.id,
        available: true,
      },
    });

    const facility5 = await prisma.boardingFacility.create({
      data: {
        name: 'Security & Gate House',
        description: 'Security and visitor management',
        type: 'SECURITY',
        schoolId: school.id,
        available: true,
      },
    });

    console.log('✅ Created 5 boarding facilities\n');

    // 5. Create hostel rooms
    console.log('🛏️  Creating Hostel Rooms...');

    const rooms: any[] = [];

    // Floor 1 - Double rooms
    const room1 = await prisma.hostelRoom.create({
      data: {
        roomNumber: '101',
        floorNumber: 1,
        capacity: 2,
        type: 'DOUBLE',
        schoolId: school.id,
        boardingFacilityId: facility1.id,
        amenities: ['WiFi', 'AC', 'Attached Bathroom', 'Study Desk'],
        available: true,
      },
    });
    rooms.push(room1);

    const room2 = await prisma.hostelRoom.create({
      data: {
        roomNumber: '102',
        floorNumber: 1,
        capacity: 2,
        type: 'DOUBLE',
        schoolId: school.id,
        boardingFacilityId: facility1.id,
        amenities: ['WiFi', 'AC', 'Attached Bathroom', 'Study Desk'],
        available: true,
      },
    });
    rooms.push(room2);

    // Floor 2 - Triple rooms
    const room3 = await prisma.hostelRoom.create({
      data: {
        roomNumber: '201',
        floorNumber: 2,
        capacity: 3,
        type: 'TRIPLE',
        schoolId: school.id,
        boardingFacilityId: facility1.id,
        amenities: ['WiFi', 'AC', 'Attached Bathroom', 'Study Desks'],
        available: true,
      },
    });
    rooms.push(room3);

    const room4 = await prisma.hostelRoom.create({
      data: {
        roomNumber: '202',
        floorNumber: 2,
        capacity: 3,
        type: 'TRIPLE',
        schoolId: school.id,
        boardingFacilityId: facility1.id,
        amenities: ['WiFi', 'AC', 'Attached Bathroom', 'Study Desks'],
        available: true,
      },
    });
    rooms.push(room4);

    // Floor 3 - Single rooms (premium)
    const room5 = await prisma.hostelRoom.create({
      data: {
        roomNumber: '301',
        floorNumber: 3,
        capacity: 1,
        type: 'SINGLE',
        schoolId: school.id,
        boardingFacilityId: facility1.id,
        amenities: ['WiFi', 'AC', 'Attached Bathroom', 'Study Desk', 'Balcony'],
        available: true,
      },
    });
    rooms.push(room5);

    // Additional room
    const room6 = await prisma.hostelRoom.create({
      data: {
        roomNumber: '103',
        floorNumber: 1,
        capacity: 4,
        type: 'DORMITORY',
        schoolId: school.id,
        boardingFacilityId: facility1.id,
        amenities: ['WiFi', 'AC', 'Common Bathroom', 'Study Area'],
        available: true,
      },
    });
    rooms.push(room6);

    console.log(`✅ Created ${rooms.length} hostel rooms\n`);

    // 6. Register students for boarding
    console.log('📝 Registering Students for Boarding...');

    const boardingRecords: any[] = [];

    for (let i = 0; i < Math.min(students.length, 6); i++) {
      const student = students[i];
      const room = rooms[i % rooms.length];
      const boardingStartDate = new Date('2025-01-01');
      const boardingFeeAmount = new Decimal(8000 + (i * 500)); // Varying fees

      const boarding = await prisma.studentBoarding.create({
        data: {
          studentId: student.id,
          roomId: room.id,
          schoolId: school.id,
          boardingStartDate,
          boardingFeeAmount,
          emergencyContactName: `Guardian ${i + 1}`,
          emergencyContactPhone: `989${1000000 + i}`,
          medicalRequirements: i === 2 ? 'Vegetarian diet required' : undefined,
        },
      });
      boardingRecords.push(boarding);
      console.log(`   ✅ Registered ${student.firstName || 'Student'} to Room ${room.roomNumber}`);
    }

    console.log(`\n✅ Registered ${boardingRecords.length} students for boarding\n`);

    // 7. Get statistics
    console.log('📈 Boarding Summary:');
    const totalRooms = await prisma.hostelRoom.count();
    const occupiedRooms = await prisma.hostelRoom.count({
      where: {
        studentBoardings: {
          some: {
            boardingEndDate: null,
          },
        },
      },
    });
    const totalStudents = await prisma.studentBoarding.count({
      where: { boardingEndDate: null },
    });
    const totalFacilities = await prisma.boardingFacility.count();

    console.log(`   - Total Facilities: ${totalFacilities}`);
    console.log(`   - Total Rooms: ${totalRooms}`);
    console.log(`   - Occupied Rooms: ${occupiedRooms}`);
    console.log(`   - Available Rooms: ${totalRooms - occupiedRooms}`);
    console.log(`   - Current Boarders: ${totalStudents}`);
    console.log(
      `   - Occupancy Rate: ${Math.round((occupiedRooms / totalRooms) * 100)}%`
    );

    // 8. Print facility details
    console.log('\n🏢 Facility Details:');
    const facilities = await prisma.boardingFacility.findMany({
      orderBy: { createdAt: 'asc' },
    });

    facilities.forEach((facility, index) => {
      console.log(`   ${index + 1}. ${facility.name} (${facility.type})`);
    });

    // 9. Print room assignment
    console.log('\n🛏️  Room Assignments:');
    const assignedRooms = await prisma.hostelRoom.findMany({
      include: {
        studentBoardings: {
          where: { boardingEndDate: null },
          include: { student: true },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });

    assignedRooms.forEach((room) => {
      if (room.studentBoardings.length > 0) {
        const studentNames = room.studentBoardings.map(b => b.student.firstName).join(', ');
        const occupancy = `${room.studentBoardings.length}/${room.capacity}`;
        console.log(`   Room ${room.roomNumber}: ${studentNames} (${occupancy})`);
      }
    });

    console.log('\n🎉 Boarding Module Seed Completed Successfully!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Seed Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedBoardingData();
