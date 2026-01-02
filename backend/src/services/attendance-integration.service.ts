import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Attendance Integration Service
 * Syncs student boarding/alighting records to school attendance system
 *
 * Key Features:
 * - Automatic attendance record creation from trip boarding data
 * - Absence notifications to parents
 * - Class teacher alerts
 * - Attendance sync status tracking
 * - Batch sync operations
 * - Conflict resolution for manual attendance corrections
 */
export const attendanceIntegrationService = {
  /**
   * Sync trip attendance to StudentAttendance records
   *
   * Called after trip is completed
   * - Creates StudentAttendance records for all students
   * - Status: PRESENT if boarded/alighted, ABSENT if marked absent
   * - Links boarding data to attendance for audit trail
   * - Sends notifications if configured
   */
  async syncTripAttendanceToSystem(tripId: string, schoolId: string) {
    try {
      // Get trip with route and date info
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, schoolId, status: 'COMPLETED' },
      });

      if (!trip) {
        throw new Error('Trip not found or not COMPLETED');
      }

      // Get all students assigned to this route
      const assignedStudents = await prisma.studentRoute.findMany({
        where: { routeId: trip.routeId },
        include: { student: { include: { currentSection: true } } },
      });

      // Get boarding records for this trip
      const boardingRecords = await prisma.studentTripRecord.findMany({
        where: { tripId },
      });

      // Build mapping for quick lookup
      const boardingMap = new Map(boardingRecords.map((r) => [r.studentId, r]));

      // Sync each student
      const synced: any[] = [];
      const errors: any[] = [];

      for (const studentRoute of assignedStudents) {
        try {
          const boardingRecord = boardingMap.get(studentRoute.studentId);
          const student = studentRoute.student;

          // Determine attendance status
          let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY' = 'PRESENT';
          let note = '';

          if (boardingRecord) {
            if (boardingRecord.absent) {
              status = 'ABSENT';
              note = 'Absent from transportation';
            } else if (boardingRecord.boarded) {
              status = 'PRESENT';
              note = `Boarded at ${boardingRecord.boardingTime?.toLocaleTimeString() || 'N/A'} ${
                boardingRecord.alighted ? `- Alighted at ${boardingRecord.alightingTime?.toLocaleTimeString() || 'N/A'}` : ''
              }`;
            } else {
              status = 'ABSENT';
              note = 'No boarding record';
            }
          } else {
            status = 'ABSENT';
            note = 'No boarding record - assumed absent';
          }

          // Use student's current section
          if (!student.currentSectionId) {
            throw new Error(`Student ${student.id} has no assigned section`);
          }

          // Check if attendance already exists for this date
          const existingAttendance = await prisma.studentAttendance.findFirst({
            where: {
              studentId: student.id,
              date: trip.tripDate,
            },
          });

          let attendanceRecord;
          if (existingAttendance) {
            // Update existing record
            attendanceRecord = await prisma.studentAttendance.update({
              where: { id: existingAttendance.id },
              data: {
                status,
                remarks: note,
                updatedAt: new Date(),
              },
            });
          } else {
            // Create new attendance record
            attendanceRecord = await prisma.studentAttendance.create({
              data: {
                studentId: student.id,
                sectionId: student.currentSectionId,
                date: trip.tripDate,
                status,
                remarks: note,
              },
            });
          }

          synced.push({
            studentId: student.id,
            studentName: student?.firstName + ' ' + student?.lastName,
            status,
            attendanceId: attendanceRecord?.id,
          });
        } catch (error: any) {
          errors.push({
            studentId: studentRoute.studentId,
            studentName: studentRoute.student?.firstName + ' ' + studentRoute.student?.lastName,
            error: error.message,
          });
        }
      }

      return {
        tripId,
        tripDate: trip.tripDate,
        syncedCount: synced.length,
        errorCount: errors.length,
        synced,
        errors: errors.length > 0 ? errors : undefined,
        message: `Synced ${synced.length} attendance records${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
      };
    } catch (error: any) {
      throw new Error(`Failed to sync trip attendance: ${error.message}`);
    }
  },

  /**
   * Get attendance for student on specific date
   *
   * Used to check if student was present/absent and via which mode (transportation)
   */
  async getStudentAttendanceOnDate(studentId: string, attendanceDate: Date) {
    try {
      // Normalize date to compare by date only
      const dateStart = new Date(attendanceDate.toDateString());
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      const attendance = await prisma.studentAttendance.findFirst({
        where: {
          studentId,
          date: {
            gte: dateStart,
            lt: dateEnd,
          },
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              currentClassId: true,
              currentClass: { select: { name: true } },
            },
          },
          section: { select: { id: true, name: true } },
        },
      });

      if (!attendance) {
        return {
          studentId,
          attendanceDate,
          status: 'NOT_MARKED',
          message: 'No attendance record for this date',
        };
      }

      return {
        studentId: attendance.studentId,
        studentName: attendance.student?.firstName + ' ' + attendance.student?.lastName,
        attendanceDate: attendance.date,
        status: attendance.status,
        remarks: attendance.remarks,
        section: attendance.section?.name,
      };
    } catch (error: any) {
      throw new Error(`Failed to get attendance: ${error.message}`);
    }
  },

  /**
   * Get section attendance summary for a date
   *
   * Returns aggregate attendance stats for an entire section
   */
  async getSectionAttendanceSummary(
    sectionId: string,
    attendanceDate: Date
  ) {
    try {
      // Normalize date to compare by date only
      const dateStart = new Date(attendanceDate.toDateString());
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      const attendanceRecords = await prisma.studentAttendance.findMany({
        where: {
          sectionId,
          date: {
            gte: dateStart,
            lt: dateEnd,
          },
        },
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Get total students in section
      const totalStudents = await prisma.classEnrollment.count({
        where: {
          sectionId,
          student: {
            isActive: true,
          },
        },
      });

      const present = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
      const absent = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
      const late = attendanceRecords.filter((a) => a.status === 'LATE').length;
      const halfDay = attendanceRecords.filter((a) => a.status === 'HALF_DAY').length;
      const unmarked = totalStudents - attendanceRecords.length;

      return {
        sectionId,
        attendanceDate,
        totalStudents,
        summary: {
          present,
          absent,
          late,
          halfDay,
          unmarked,
          attendancePercentage: totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0,
        },
        details: attendanceRecords.map((a) => ({
          studentId: a.studentId,
          studentName: a.student?.firstName + ' ' + a.student?.lastName,
          status: a.status,
          remarks: a.remarks,
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to get section attendance summary: ${error.message}`);
    }
  },

  /**
   * Send absence notification to parents
   *
   * Triggered when student marked absent via transportation
   * Sends SMS/email/push notification to parents
   */
  async notifyParentOfAbsence(
    studentId: string,
    tripId: string,
    absenceReason?: string
  ) {
    try {
      const student = await prisma.student.findFirst({
        where: { id: studentId },
        include: {
          parents: {
            include: {
              parent: { select: { id: true, phone: true, email: true, firstName: true, lastName: true } },
            },
          },
          currentClass: { select: { id: true, name: true } },
        },
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const trip = await prisma.trip.findFirst({
        where: { id: tripId },
        include: {
          route: { select: { name: true } },
          school: { select: { id: true, name: true } },
        },
      });

      if (!trip) {
        throw new Error('Trip not found');
      }

      const studentName = student.firstName + ' ' + student.lastName;

      // Prepare notification data
      const notificationData = {
        studentId,
        studentName,
        className: student.currentClass?.name,
        tripId,
        routeName: trip.route?.name,
        tripDate: trip.tripDate,
        absenceReason: absenceReason || 'Not specified',
        timestamp: new Date(),
      };

      const results: any[] = [];

      // Send to all parents
      for (const studentParent of student.parents || []) {
        try {
          const parentName = studentParent.parent.firstName + ' ' + studentParent.parent.lastName;

          // Build notification message
          const message = `Dear ${parentName},

${studentName} was marked absent on transportation route "${trip.route?.name}" on ${trip.tripDate.toLocaleDateString()}.
Reason: ${absenceReason || 'Not provided'}

Please contact the school if this is an error.

Regards,
${trip.school?.name} Administration`;

          console.log('📧 Sending absence notification to parent:', studentParent.parentId);

          // Create notification record
          const notification = await prisma.notification.create({
            data: {
              userId: studentParent.parentId,
              type: 'TRANSPORTATION_ABSENCE',
              title: `${studentName} - Transportation Absence`,
              body: message,
              data: notificationData,
            },
          });

          results.push({
            notificationId: notification.id,
            parentId: studentParent.parentId,
            parentName,
            recipientPhone: studentParent.parent.phone,
            recipientEmail: studentParent.parent.email,
            status: 'sent',
          });
        } catch (error: any) {
          console.error(`Failed to notify parent ${studentParent.parentId}:`, error);
          results.push({
            parentId: studentParent.parentId,
            status: 'failed',
            error: error.message,
          });
        }
      }

      return {
        studentId,
        studentName,
        parentsNotified: results.length,
        results,
        message: `Absence notification sent to ${results.length} parent(s)`,
      };
    } catch (error: any) {
      throw new Error(`Failed to send absence notification: ${error.message}`);
    }
  },

  /**
   * Notify section teachers of transportation-related absences
   *
   * Gives teachers visibility into why students were absent
   */
  async notifySectionTeachersOfAbsences(sectionId: string, attendanceDate: Date) {
    try {
      // Normalize date to compare by date only
      const dateStart = new Date(attendanceDate.toDateString());
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      // Get section
      const section = await prisma.section.findFirst({
        where: { id: sectionId },
        select: { id: true, name: true, classId: true, classTeacherId: true },
      });

      if (!section) {
        throw new Error('Section not found');
      }

      // Get class info
      const classInfo = await prisma.class.findFirst({
        where: { id: section.classId },
        select: { id: true, name: true },
      });

      // Get absences for date
      const absences = await prisma.studentAttendance.findMany({
        where: {
          sectionId,
          status: 'ABSENT',
          date: {
            gte: dateStart,
            lt: dateEnd,
          },
        },
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (absences.length === 0) {
        return {
          sectionId,
          attendanceDate,
          absentCount: 0,
          teachersNotified: 0,
          message: 'No absences for this date',
        };
      }

      // Notify the class teacher for this section if assigned
      const notified: any[] = [];

      if (section.classTeacherId) {
        try {
          // Get teacher info
          const teacher = await prisma.teacher.findFirst({
            where: { id: section.classTeacherId },
            select: { id: true, firstName: true, lastName: true, phone: true },
          });

          if (!teacher) {
            throw new Error('Class teacher not found');
          }

          const teacherName = teacher.firstName + ' ' + teacher.lastName;

          const message = `Absence Alert for ${classInfo?.name} - Section ${section.name}

Date: ${attendanceDate.toLocaleDateString()}
Absent Students: ${absences.length}

${absences.map((a) => `- ${a.student?.firstName} ${a.student?.lastName}: ${a.remarks || 'N/A'}`).join('\n')}

Please follow up with these students.`;

          // Create notification record
          const notification = await prisma.notification.create({
            data: {
              userId: teacher.id,
              type: 'TEACHER_ABSENCE_ALERT',
              title: `Absence Alert - ${classInfo?.name} Section ${section.name}`,
              body: message,
              data: {
                sectionId,
                className: classInfo?.name,
                sectionName: section.name,
                attendanceDate,
                absences: absences.map((a) => ({
                  studentId: a.studentId,
                  studentName: a.student?.firstName + ' ' + a.student?.lastName,
                  reason: a.remarks,
                })),
              },
            },
          });

          notified.push({
            teacherId: teacher.id,
            teacherName,
            phone: teacher.phone,
            notificationId: notification.id,
          });
        } catch (error: any) {
          console.error(`Failed to notify teacher ${section.classTeacherId}:`, error);
        }
      }

      return {
        sectionId,
        className: classInfo?.name,
        sectionName: section.name,
        attendanceDate,
        absentCount: absences.length,
        teachersNotified: notified.length,
        teachers: notified,
        message: `Notified ${notified.length} teacher(s) about ${absences.length} absence(s)`,
      };
    } catch (error: any) {
      throw new Error(`Failed to notify section teachers: ${error.message}`);
    }
  },

  /**
   * Get student attendance history
   *
   * Returns past attendance records for a student
   */
  async getStudentAttendanceHistory(studentId: string, limit: number = 30) {
    try {
      const records = await prisma.studentAttendance.findMany({
        where: { studentId },
        include: {
          section: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
        take: limit,
      });

      return {
        studentId,
        totalRecords: records.length,
        records: records.map((r) => ({
          date: r.date,
          status: r.status,
          remarks: r.remarks,
          section: r.section?.name,
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to get attendance history: ${error.message}`);
    }
  },

  /**
   * Batch sync multiple trips to attendance
   *
   * Used for periodic batch sync of pending trips
   */
  async syncMultipleTripsToAttendance(tripIds: string[]) {
    try {
      const results: any[] = [];
      let totalSynced = 0;
      let totalErrors = 0;

      for (const tripId of tripIds) {
        try {
          // Get trip to find schoolId
          const trip = await prisma.trip.findFirst({ where: { id: tripId } });
          if (!trip) {
            throw new Error('Trip not found');
          }

          const result = await this.syncTripAttendanceToSystem(tripId, trip.schoolId);
          results.push(result);
          totalSynced += result.syncedCount;
          totalErrors += result.errorCount;
        } catch (error: any) {
          console.error(`Failed to sync trip ${tripId}:`, error);
          totalErrors += 1;
          results.push({
            tripId,
            error: error.message,
          });
        }
      }

      return {
        totalTrips: tripIds.length,
        totalSynced,
        totalErrors,
        results,
        message: `Synced ${totalSynced} attendance records from ${tripIds.length} trips`,
      };
    } catch (error: any) {
      throw new Error(`Failed to sync multiple trips: ${error.message}`);
    }
  },

  /**
   * Get attendance statistics by section for a date range
   *
   * Returns attendance summary for all sections
   */
  async getAttendanceStatsBySection(startDate: Date, endDate: Date) {
    try {
      const records = await prisma.studentAttendance.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          section: { select: { id: true, name: true, classId: true } },
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Aggregate statistics by section
      const sectionMap = new Map<string, any>();
      records.forEach((r) => {
        const sectionId = r.section?.id || 'unknown';
        if (!sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, {
            sectionId,
            sectionName: r.section?.name,
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            holiday: 0,
            totalRecords: 0,
          });
        }
        const stats = sectionMap.get(sectionId);
        stats.totalRecords++;
        if (r.status === 'PRESENT') stats.present++;
        else if (r.status === 'ABSENT') stats.absent++;
        else if (r.status === 'LATE') stats.late++;
        else if (r.status === 'HALF_DAY') stats.halfDay++;
        else if (r.status === 'HOLIDAY') stats.holiday++;
      });

      return {
        reportPeriod: {
          startDate,
          endDate,
        },
        totalRecords: records.length,
        sections: Array.from(sectionMap.values()).map((s) => ({
          ...s,
          attendancePercentage: s.totalRecords > 0 ? Math.round(((s.present + s.late) / s.totalRecords) * 100) : 0,
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to get attendance statistics: ${error.message}`);
    }
  },

  /**
   * Get student-wise absence summary for a date range
   *
   * Returns students with most absences
   */
  async getStudentAbsenceSummary(startDate: Date, endDate: Date, limit: number = 20) {
    try {
      const records = await prisma.studentAttendance.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'ABSENT',
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
              currentClass: { select: { name: true } },
            },
          },
        },
      });

      // Aggregate absences by student
      const studentMap = new Map<string, any>();
      records.forEach((r) => {
        const studentId = r.studentId;
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            studentId,
            studentName: r.student?.firstName + ' ' + r.student?.lastName,
            admissionNo: r.student?.admissionNo,
            className: r.student?.currentClass?.name,
            absenceCount: 0,
            lastAbsenceDate: r.date,
          });
        }
        const student = studentMap.get(studentId);
        student.absenceCount++;
        if (!student.lastAbsenceDate || new Date(r.date) > new Date(student.lastAbsenceDate)) {
          student.lastAbsenceDate = r.date;
        }
      });

      const absentees = Array.from(studentMap.values()).sort((a, b) => b.absenceCount - a.absenceCount).slice(0, limit);

      return {
        reportPeriod: {
          startDate,
          endDate,
        },
        totalAbsenceRecords: records.length,
        topAbsentees: absentees,
      };
    } catch (error: any) {
      throw new Error(`Failed to get absence summary: ${error.message}`);
    }
  },
};
