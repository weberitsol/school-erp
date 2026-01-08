import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyBoardingData() {
  try {
    console.log('📊 Verifying Boarding/Hostel Module Data...\n');

    // Get facilities
    const facilities = await prisma.boardingFacility.findMany({
      orderBy: { createdAt: 'asc' },
      include: { rooms: true },
    });

    console.log(`✅ Boarding Facilities: ${facilities.length}\n`);
    facilities.forEach((facility) => {
      console.log(
        `   - ${facility.name} (${facility.type}) - ${facility.rooms.length} rooms`
      );
    });

    // Get rooms
    const rooms = await prisma.hostelRoom.findMany({
      include: {
        studentBoardings: {
          where: { boardingEndDate: null },
          include: { student: true },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });

    console.log(`\n✅ Hostel Rooms: ${rooms.length}`);
    rooms.forEach((room) => {
      const occupancy = room.studentBoardings.length;
      const occupancyPercent = Math.round((occupancy / room.capacity) * 100);
      const students = room.studentBoardings
        .map((b) => b.student.firstName)
        .join(', ') || 'Vacant';
      console.log(
        `   Room ${room.roomNumber} (${room.type}): ${students} [${occupancy}/${room.capacity} - ${occupancyPercent}%]`
      );
    });

    // Get active boardings
    const boardings = await prisma.studentBoarding.findMany({
      where: { boardingEndDate: null },
      include: {
        student: true,
        room: true,
      },
      orderBy: { boardingStartDate: 'asc' },
    });

    console.log(`\n✅ Active Student Boardings: ${boardings.length}`);
    boardings.forEach((boarding) => {
      const feeAmount = boarding.boardingFeeAmount.toString();
      const startDate = new Date(boarding.boardingStartDate).toLocaleDateString();
      console.log(
        `   - ${boarding.student.firstName}: Room ${boarding.room.roomNumber}, Fee: ₹${feeAmount}, Start: ${startDate}`
      );
      if (boarding.medicalRequirements) {
        console.log(`     Medical: ${boarding.medicalRequirements}`);
      }
    });

    // Statistics
    console.log('\n📈 Boarding Statistics:');
    const totalStudents = boardings.length;
    const occupiedRooms = rooms.filter((r) => r.studentBoardings.length > 0).length;
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupancyRate = Math.round((totalStudents / totalCapacity) * 100);

    console.log(`   - Total Students Boarded: ${totalStudents}`);
    console.log(`   - Total Rooms: ${rooms.length}`);
    console.log(`   - Occupied Rooms: ${occupiedRooms}`);
    console.log(`   - Available Rooms: ${rooms.length - occupiedRooms}`);
    console.log(`   - Total Capacity: ${totalCapacity}`);
    console.log(`   - Overall Occupancy Rate: ${occupancyRate}%`);

    // Facility types
    console.log('\n🏢 Facilities by Type:');
    const facilityTypes: Record<string, number> = {};
    facilities.forEach((f) => {
      facilityTypes[f.type] = (facilityTypes[f.type] || 0) + 1;
    });
    Object.entries(facilityTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    // Room types
    console.log('\n🛏️  Rooms by Type:');
    const roomTypes: Record<string, number> = {};
    rooms.forEach((r) => {
      roomTypes[r.type] = (roomTypes[r.type] || 0) + 1;
    });
    Object.entries(roomTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    console.log('\n🎉 Boarding data verification complete!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyBoardingData();
