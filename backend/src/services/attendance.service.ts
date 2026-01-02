import { PrismaClient, AttendanceStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface MarkStudentAttendanceDto {
  studentId: string;
  sectionId: string;
  date: Date;
  status: AttendanceStatus;
  remarks?: string;
  markedById?: string;
}

export interface BulkMarkAttendanceDto {
  sectionId: string;
  date: Date;
  attendances: {
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }[];
  markedById?: string;
}

export interface MarkTeacherAttendanceDto {
  teacherId: string;
  date: Date;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
}

export interface AttendanceFilters {
  sectionId?: string;
  classId?: string;
  studentId?: string;
  teacherId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: AttendanceStatus;
}

class AttendanceService {
  // Mark single student attendance
  async markStudentAttendance(data: MarkStudentAttendanceDto) {
    const attendance = await prisma.studentAttendance.upsert({
      where: {
        studentId_date: {
          studentId: data.studentId,
          date: data.date,
        },
      },
      update: {
        status: data.status,
        remarks: data.remarks,
        markedById: data.markedById,
        markedAt: new Date(),
      },
      create: {
        studentId: data.studentId,
        sectionId: data.sectionId,
        date: data.date,
        status: data.status,
        remarks: data.remarks,
        markedById: data.markedById,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            rollNo: true,
          },
        },
      },
    });

    return attendance;
  }

  // Bulk mark student attendance (for a whole section)
  async bulkMarkStudentAttendance(data: BulkMarkAttendanceDto) {
    const results = {
      success: [] as string[],
      failed: [] as { studentId: string; error: string }[],
    };

    for (const attendance of data.attendances) {
      try {
        await prisma.studentAttendance.upsert({
          where: {
            studentId_date: {
              studentId: attendance.studentId,
              date: data.date,
            },
          },
          update: {
            status: attendance.status,
            remarks: attendance.remarks,
            markedById: data.markedById,
            markedAt: new Date(),
          },
          create: {
            studentId: attendance.studentId,
            sectionId: data.sectionId,
            date: data.date,
            status: attendance.status,
            remarks: attendance.remarks,
            markedById: data.markedById,
          },
        });
        results.success.push(attendance.studentId);
      } catch (error: any) {
        results.failed.push({
          studentId: attendance.studentId,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }

  // Get student attendance
  async getStudentAttendance(filters: AttendanceFilters) {
    const { sectionId, studentId, startDate, endDate, status } = filters;

    const where: Prisma.StudentAttendanceWhereInput = {
      ...(sectionId && { sectionId }),
      ...(studentId && { studentId }),
      ...(status && { status }),
      ...(startDate &&
        endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const attendances = await prisma.studentAttendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { student: { rollNo: 'asc' } }],
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            rollNo: true,
            profileImage: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            class: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return attendances;
  }

  // Get attendance for a specific date and section
  async getAttendanceByDateAndSection(sectionId: string, date: Date) {
    // Get all students in the section
    const students = await prisma.student.findMany({
      where: {
        currentSectionId: sectionId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        rollNo: true,
        profileImage: true,
      },
      orderBy: { rollNo: 'asc' },
    });

    // Get attendance records for the date
    const attendances = await prisma.studentAttendance.findMany({
      where: {
        sectionId,
        date,
      },
    });

    // Map attendance to students
    const attendanceMap = new Map(
      attendances.map((a) => [a.studentId, a])
    );

    const result = students.map((student) => ({
      student,
      attendance: attendanceMap.get(student.id) || null,
    }));

    // Calculate summary
    const total = students.length;
    const present = attendances.filter((a) => a.status === 'PRESENT').length;
    const absent = attendances.filter((a) => a.status === 'ABSENT').length;
    const late = attendances.filter((a) => a.status === 'LATE').length;
    const halfDay = attendances.filter((a) => a.status === 'HALF_DAY').length;
    const unmarked = total - attendances.length;

    return {
      date,
      sectionId,
      students: result,
      summary: {
        total,
        present,
        absent,
        late,
        halfDay,
        unmarked,
        percentage: total > 0 ? ((present + late + halfDay) / total) * 100 : 0,
      },
    };
  }

  // Get attendance report for a section
  async getSectionAttendanceReport(
    sectionId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Get all students in the section
    const students = await prisma.student.findMany({
      where: {
        currentSectionId: sectionId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        rollNo: true,
      },
      orderBy: { rollNo: 'asc' },
    });

    // Get all attendance records in date range
    const attendances = await prisma.studentAttendance.findMany({
      where: {
        sectionId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate per-student stats
    const studentStats = students.map((student) => {
      const studentAttendances = attendances.filter(
        (a) => a.studentId === student.id
      );

      const present = studentAttendances.filter(
        (a) => a.status === 'PRESENT'
      ).length;
      const absent = studentAttendances.filter(
        (a) => a.status === 'ABSENT'
      ).length;
      const late = studentAttendances.filter((a) => a.status === 'LATE').length;
      const halfDay = studentAttendances.filter(
        (a) => a.status === 'HALF_DAY'
      ).length;
      const total = studentAttendances.length;

      return {
        student,
        stats: {
          present,
          absent,
          late,
          halfDay,
          total,
          percentage: total > 0 ? ((present + late + halfDay) / total) * 100 : 0,
        },
      };
    });

    // Overall stats
    const totalDays = attendances.length / students.length;
    const overallPresent = attendances.filter(
      (a) => a.status === 'PRESENT'
    ).length;
    const overallAbsent = attendances.filter(
      (a) => a.status === 'ABSENT'
    ).length;
    const overallLate = attendances.filter((a) => a.status === 'LATE').length;

    return {
      sectionId,
      dateRange: { startDate, endDate },
      students: studentStats,
      summary: {
        totalStudents: students.length,
        totalDays: Math.round(totalDays),
        averageAttendance:
          attendances.length > 0
            ? ((overallPresent + overallLate) / attendances.length) * 100
            : 0,
      },
    };
  }

  // Mark teacher attendance
  async markTeacherAttendance(data: MarkTeacherAttendanceDto) {
    const attendance = await prisma.teacherAttendance.upsert({
      where: {
        teacherId_date: {
          teacherId: data.teacherId,
          date: data.date,
        },
      },
      update: {
        status: data.status,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        remarks: data.remarks,
      },
      create: {
        teacherId: data.teacherId,
        date: data.date,
        status: data.status,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        remarks: data.remarks,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
    });

    return attendance;
  }

  // Get teacher attendance
  async getTeacherAttendance(filters: AttendanceFilters) {
    const { teacherId, startDate, endDate, status } = filters;

    const where: Prisma.TeacherAttendanceWhereInput = {
      ...(teacherId && { teacherId }),
      ...(status && { status }),
      ...(startDate &&
        endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const attendances = await prisma.teacherAttendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return attendances;
  }

  // Bulk mark teacher attendance
  async bulkMarkTeacherAttendance(
    date: Date,
    attendances: MarkTeacherAttendanceDto[]
  ) {
    const results = {
      success: [] as string[],
      failed: [] as { teacherId: string; error: string }[],
    };

    for (const attendance of attendances) {
      try {
        await this.markTeacherAttendance({ ...attendance, date });
        results.success.push(attendance.teacherId);
      } catch (error: any) {
        results.failed.push({
          teacherId: attendance.teacherId,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }

  // Get attendance statistics for dashboard
  async getAttendanceStats(schoolId: string, date: Date) {
    // Student stats
    const studentAttendances = await prisma.studentAttendance.findMany({
      where: {
        date,
        student: {
          user: { schoolId },
        },
      },
    });

    const totalStudents = await prisma.student.count({
      where: {
        isActive: true,
        user: { schoolId },
      },
    });

    // Teacher stats
    const teacherAttendances = await prisma.teacherAttendance.findMany({
      where: {
        date,
        teacher: {
          user: { schoolId },
        },
      },
    });

    const totalTeachers = await prisma.teacher.count({
      where: {
        isActive: true,
        user: { schoolId },
      },
    });

    return {
      students: {
        total: totalStudents,
        present: studentAttendances.filter((a) => a.status === 'PRESENT').length,
        absent: studentAttendances.filter((a) => a.status === 'ABSENT').length,
        late: studentAttendances.filter((a) => a.status === 'LATE').length,
        unmarked:
          totalStudents - studentAttendances.length,
      },
      teachers: {
        total: totalTeachers,
        present: teacherAttendances.filter((a) => a.status === 'PRESENT').length,
        absent: teacherAttendances.filter((a) => a.status === 'ABSENT').length,
        late: teacherAttendances.filter((a) => a.status === 'LATE').length,
        unmarked:
          totalTeachers - teacherAttendances.length,
      },
    };
  }
}

export const attendanceService = new AttendanceService();
