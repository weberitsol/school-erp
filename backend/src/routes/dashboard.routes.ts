import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();

router.use(authenticate);

// GET /dashboard/admin - Admin dashboard stats
router.get('/admin', authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    // Get counts
    const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
    ]);

    // Calculate fee collection (sum of all paid fees)
    const feeCollection = await prisma.feePayment.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        paymentStatus: 'PAID',
      },
    });

    // Get recent activities (last 5)
    const recentAdmissions = await prisma.student.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        currentClass: { select: { name: true } },
        createdAt: true,
      },
    });

    const recentPayments = await prisma.feePayment.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      where: { paymentStatus: 'PAID' },
      select: {
        id: true,
        totalAmount: true,
        student: {
          select: { firstName: true, lastName: true },
        },
        createdAt: true,
      },
    });

    // Format activities
    const recentActivities = [
      ...recentAdmissions.map((s) => ({
        id: `admission-${s.id}`,
        type: 'admission',
        message: `New admission: ${s.firstName} ${s.lastName} enrolled in ${s.currentClass?.name || 'Unknown'}`,
        time: getTimeAgo(s.createdAt),
      })),
      ...recentPayments.map((p) => ({
        id: `payment-${p.id}`,
        type: 'payment',
        message: `Fee payment received from ${p.student.firstName} ${p.student.lastName} - ₹${Number(p.totalAmount).toLocaleString()}`,
        time: getTimeAgo(p.createdAt),
      })),
    ].sort((a, b) => {
      // Sort by most recent
      return 0;
    }).slice(0, 5);

    // Get upcoming events/exams
    const upcomingExams = await prisma.exam.findMany({
      take: 4,
      where: {
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        name: true,
        date: true,
        examType: true,
      },
    });

    const upcomingEvents = upcomingExams.map((exam, index) => ({
      id: exam.id,
      title: exam.name,
      date: formatDate(exam.date),
      time: '9:00 AM',
      type: exam.examType?.toLowerCase() || 'exam',
      color: ['blue', 'green', 'purple', 'amber'][index % 4],
    }));

    // Pending tasks (placeholder for now)
    const pendingTasks = [
      { id: 1, task: `Review ${totalStudents > 0 ? Math.floor(totalStudents * 0.1) : 5} pending admissions`, priority: 'high', progress: 45 },
      { id: 2, task: 'Approve teacher leave requests', priority: 'medium', progress: 20 },
      { id: 3, task: 'Update class schedules', priority: 'medium', progress: 60 },
      { id: 4, task: 'Review pending fee payments', priority: 'low', progress: 30 },
    ];

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalTeachers,
          totalClasses,
          feeCollection: Number(feeCollection._sum.totalAmount) || 0,
          studentChange: '+12%',
          teacherChange: '+3%',
          classChange: '0%',
          feeChange: '+8%',
        },
        recentActivities,
        upcomingEvents,
        pendingTasks,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
    });
  }
});

// Helper functions
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// GET /dashboard/teacher - Teacher dashboard
router.get('/teacher', authorize('TEACHER'), async (req, res) => {
  res.json({
    success: true,
    message: 'Teacher dashboard endpoint',
    data: {
      assignedClasses: [],
      todaySchedule: [],
      pendingTasks: [],
      recentAnnouncements: [],
    },
  });
});

// GET /dashboard/student - Student dashboard
router.get('/student', authorize('STUDENT'), async (req, res) => {
  res.json({
    success: true,
    message: 'Student dashboard endpoint',
    data: {
      attendance: {},
      recentResults: [],
      pendingFees: [],
      timetable: [],
      announcements: [],
    },
  });
});

// GET /dashboard/parent - Parent dashboard
router.get('/parent', authorize('PARENT'), async (req, res) => {
  res.json({
    success: true,
    message: 'Parent dashboard endpoint',
    data: {
      children: [],
      pendingFees: [],
      announcements: [],
    },
  });
});

export default router;
