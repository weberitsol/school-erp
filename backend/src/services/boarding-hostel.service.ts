import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateBoardingFacilityData {
  name: string;
  description?: string;
  schoolId: string;
  type: string; // e.g., "DINING", "STUDY", "RECREATION", "MEDICAL", "SECURITY"
  available?: boolean;
}

interface CreateRoomData {
  roomNumber: string;
  floorNumber: number;
  capacity: number;
  type: string; // "SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"
  schoolId: string;
  boardingFacilityId?: string;
  amenities?: string[];
  available?: boolean;
}

interface UpdateRoomData {
  roomNumber?: string;
  floorNumber?: number;
  capacity?: number;
  type?: string;
  amenities?: string[];
  available?: boolean;
}

interface StudentBoardingData {
  studentId: string;
  roomId: string;
  boardingStartDate: Date;
  boardingEndDate?: Date;
  boardingFeeAmount: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalRequirements?: string;
}

export class BoardingHostelService {
  // Create boarding facility
  async createBoardingFacility(data: CreateBoardingFacilityData) {
    try {
      if (!data.name || !data.type) {
        throw new Error('Missing required fields: name, type');
      }

      const facility = await prisma.boardingFacility.create({
        data: {
          name: data.name,
          description: data.description,
          schoolId: data.schoolId,
          type: data.type,
          available: data.available !== false,
        },
      });

      return facility;
    } catch (error: any) {
      throw new Error(`Failed to create boarding facility: ${error.message}`);
    }
  }

  // Get all boarding facilities
  async getAllFacilities(filters?: any) {
    try {
      const where: any = {};

      if (filters?.schoolId) {
        where.schoolId = filters.schoolId;
      }

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.available !== undefined) {
        where.available = filters.available;
      }

      const facilities = await prisma.boardingFacility.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 20) : 0,
        take: filters?.limit || 20,
      });

      const total = await prisma.boardingFacility.count({ where });

      return { data: facilities, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch boarding facilities: ${error.message}`);
    }
  }

  // Get boarding facility by ID
  async getFacilityById(id: string) {
    try {
      const facility = await prisma.boardingFacility.findUnique({
        where: { id },
        include: {
          rooms: {
            include: {
              studentBoardings: true,
            },
          },
        },
      });

      if (!facility) throw new Error('Boarding facility not found');
      return facility;
    } catch (error: any) {
      throw new Error(`Failed to fetch facility: ${error.message}`);
    }
  }

  // Create room in hostel
  async createRoom(data: CreateRoomData) {
    try {
      if (!data.roomNumber || !data.floorNumber || !data.capacity || !data.type) {
        throw new Error('Missing required fields: roomNumber, floorNumber, capacity, type');
      }

      // Verify facility exists if provided
      if (data.boardingFacilityId) {
        const facility = await prisma.boardingFacility.findUnique({
          where: { id: data.boardingFacilityId },
        });
        if (!facility) throw new Error('Boarding facility not found');
      }

      const room = await prisma.hostelRoom.create({
        data: {
          roomNumber: data.roomNumber,
          floorNumber: data.floorNumber,
          capacity: data.capacity,
          type: data.type,
          schoolId: data.schoolId,
          boardingFacilityId: data.boardingFacilityId,
          amenities: data.amenities || [],
          available: data.available !== false,
        },
      });

      return room;
    } catch (error: any) {
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  // Get all rooms
  async getAllRooms(filters?: any) {
    try {
      const where: any = {};

      if (filters?.schoolId) {
        where.schoolId = filters.schoolId;
      }

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.available !== undefined) {
        where.available = filters.available;
      }

      if (filters?.floorNumber) {
        where.floorNumber = parseInt(filters.floorNumber);
      }

      const rooms = await prisma.hostelRoom.findMany({
        where,
        include: {
          studentBoardings: {
            include: {
              student: true,
            },
          },
        },
        orderBy: { roomNumber: 'asc' },
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 20) : 0,
        take: filters?.limit || 20,
      });

      const total = await prisma.hostelRoom.count({ where });

      return { data: rooms, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch rooms: ${error.message}`);
    }
  }

  // Get room by ID
  async getRoomById(id: string) {
    try {
      const room = await prisma.hostelRoom.findUnique({
        where: { id },
        include: {
          studentBoardings: {
            include: {
              student: {
                include: {
                  user: true,
                  currentClass: true,
                },
              },
            },
          },
        },
      });

      if (!room) throw new Error('Room not found');
      return room;
    } catch (error: any) {
      throw new Error(`Failed to fetch room: ${error.message}`);
    }
  }

  // Update room
  async updateRoom(id: string, data: UpdateRoomData) {
    try {
      const room = await prisma.hostelRoom.findUnique({ where: { id } });
      if (!room) throw new Error('Room not found');

      const updated = await prisma.hostelRoom.update({
        where: { id },
        data: {
          roomNumber: data.roomNumber,
          floorNumber: data.floorNumber,
          capacity: data.capacity,
          type: data.type,
          amenities: data.amenities,
          available: data.available,
        },
        include: {
          studentBoardings: true,
        },
      });

      return updated;
    } catch (error: any) {
      throw new Error(`Failed to update room: ${error.message}`);
    }
  }

  // Register student for boarding
  async registerStudentBoarding(data: StudentBoardingData, schoolId: string) {
    try {
      // Verify student exists
      const student = await prisma.student.findUnique({
        where: { id: data.studentId },
      });
      if (!student) throw new Error('Student not found');

      // Verify room exists
      const room = await prisma.hostelRoom.findUnique({
        where: { id: data.roomId },
      });
      if (!room) throw new Error('Room not found');

      // Check if room has capacity
      const currentOccupancy = await prisma.studentBoarding.count({
        where: {
          roomId: data.roomId,
          boardingEndDate: null,
        },
      });
      if (currentOccupancy >= room.capacity) {
        throw new Error('Room is at full capacity');
      }

      // Check if student is already boarded
      const existing = await prisma.studentBoarding.findFirst({
        where: {
          studentId: data.studentId,
          boardingEndDate: null,
        },
      });
      if (existing) {
        throw new Error('Student is already registered for boarding');
      }

      const boarding = await prisma.studentBoarding.create({
        data: {
          studentId: data.studentId,
          roomId: data.roomId,
          schoolId,
          boardingStartDate: data.boardingStartDate,
          boardingEndDate: data.boardingEndDate,
          boardingFeeAmount: data.boardingFeeAmount,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          medicalRequirements: data.medicalRequirements,
        },
        include: {
          student: {
            include: {
              user: true,
              currentClass: true,
            },
          },
          room: true,
        },
      });

      return boarding;
    } catch (error: any) {
      throw new Error(`Failed to register boarding: ${error.message}`);
    }
  }

  // Get active boardings (currently assigned)
  async getActiveBoardings(filters?: any) {
    try {
      const where: any = {
        boardingEndDate: null,
      };

      if (filters?.schoolId) {
        where.schoolId = filters.schoolId;
      }

      if (filters?.roomId) {
        where.roomId = filters.roomId;
      }

      const boardings = await prisma.studentBoarding.findMany({
        where,
        include: {
          student: {
            include: {
              user: true,
              currentClass: true,
            },
          },
          room: true,
        },
        orderBy: { boardingStartDate: 'desc' },
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 20) : 0,
        take: filters?.limit || 20,
      });

      const total = await prisma.studentBoarding.count({ where });

      return { data: boardings, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch active boardings: ${error.message}`);
    }
  }

  // Get student boarding details
  async getStudentBoarding(studentId: string) {
    try {
      const boarding = await prisma.studentBoarding.findFirst({
        where: {
          studentId,
          boardingEndDate: null,
        },
        include: {
          student: {
            include: {
              user: true,
              currentClass: true,
            },
          },
          room: {
            include: {
              boardingFacility: true,
            },
          },
        },
      });

      if (!boarding) throw new Error('Student boarding not found');
      return boarding;
    } catch (error: any) {
      throw new Error(`Failed to fetch student boarding: ${error.message}`);
    }
  }

  // End student boarding
  async endStudentBoarding(boardingId: string, endDate: Date) {
    try {
      const boarding = await prisma.studentBoarding.findUnique({
        where: { id: boardingId },
      });
      if (!boarding) throw new Error('Boarding record not found');

      const updated = await prisma.studentBoarding.update({
        where: { id: boardingId },
        data: {
          boardingEndDate: endDate,
        },
        include: {
          student: true,
          room: true,
        },
      });

      return updated;
    } catch (error: any) {
      throw new Error(`Failed to end boarding: ${error.message}`);
    }
  }

  // Get boarding statistics
  async getBoardingStats(schoolId?: string) {
    try {
      const where = schoolId ? { schoolId } : {};

      const totalStudents = await prisma.studentBoarding.count({
        where: {
          ...where,
          boardingEndDate: null,
        },
      });

      const totalRooms = await prisma.hostelRoom.count({
        where: schoolId ? { schoolId } : {},
      });

      const occupiedRooms = await prisma.hostelRoom.count({
        where: {
          ...(schoolId ? { schoolId } : {}),
          studentBoardings: {
            some: {
              boardingEndDate: null,
            },
          },
        },
      });

      const totalFacilities = await prisma.boardingFacility.count({
        where: schoolId ? { schoolId } : {},
      });

      // Get average room occupancy
      const allRooms = await prisma.hostelRoom.findMany({
        where: schoolId ? { schoolId } : {},
        include: {
          _count: {
            select: {
              studentBoardings: {
                where: { boardingEndDate: null },
              },
            },
          },
        },
      });

      const avgOccupancy =
        allRooms.length > 0
          ? Math.round(
              (allRooms.reduce((sum, r) => sum + r._count.studentBoardings, 0) /
                allRooms.reduce((sum, r) => sum + r.capacity, 0)) *
                100
            )
          : 0;

      return {
        totalStudents,
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
        occupancyPercentage: avgOccupancy,
        totalFacilities,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch boarding statistics: ${error.message}`);
    }
  }

  // Get boarding history for student
  async getStudentBoardingHistory(studentId: string) {
    try {
      const boardings = await prisma.studentBoarding.findMany({
        where: { studentId },
        include: {
          room: {
            include: {
              boardingFacility: true,
            },
          },
        },
        orderBy: { boardingStartDate: 'desc' },
      });

      if (!boardings) throw new Error('No boarding history found');
      return boardings;
    } catch (error: any) {
      throw new Error(`Failed to fetch boarding history: ${error.message}`);
    }
  }
}

export const boardingHostelService = new BoardingHostelService();
