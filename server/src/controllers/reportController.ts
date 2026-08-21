import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { calculateNetWorkingDaysForMonth } from './holidayController';

// Helper function to extract month date range (e.g., July 2026 -> 2026-07-01 to 2026-07-31)
function getMonthDateBounds(monthName: string, year: number) {
  const monthMap: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const monthIdx = monthMap[monthName.toLowerCase()] ?? 6;
  const startDate = new Date(Date.UTC(year, monthIdx, 1));
  const endDate = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59));

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  return { startStr, endStr, startDate, endDate };
}

// 1. Core Excel-Like Report Generator
export const getMonthlyAttendanceReport = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, monthId } = req.query;

    if (!classId || !monthId) {
      return res.status(400).json({ error: 'Class and Academic Month are required' });
    }

    // Fetch Class & Academic Month
    const [cls, month, settings] = await Promise.all([
      prisma.class.findUnique({
        where: { id: String(classId) },
        include: { academicYear: true },
      }),
      prisma.academicMonth.findUnique({
        where: { id: String(monthId) },
        include: { academicYear: true },
      }),
      prisma.systemSettings.findFirst(),
    ]);

    if (!cls || !month) {
      return res.status(404).json({ error: 'Class or Academic Month not found' });
    }

    // Dynamic Net Working Days Calculation
    const totalWorkingDays = await calculateNetWorkingDaysForMonth(month.id);

    const threshold = settings?.attendanceThreshold || 75.0;
    const { startStr, endStr } = getMonthDateBounds(month.monthName, month.year);

    // Fetch active students in class
    const students = await prisma.student.findMany({
      where: { classId: cls.id, active: true },
      orderBy: { rollNumber: 'asc' },
    });

    // Fetch active class-subject assignments
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId: cls.id, active: true },
      include: {
        subject: true,
        teacher: true,
        subjectMonthlyConfigs: {
          where: { monthId: month.id },
        },
      },
      orderBy: { subject: { name: 'asc' } },
    });

    // Compute Subject Summaries & Taken Classes
    const subjectSummaries = await Promise.all(
      classSubjects.map(async (cs, index) => {
        const config = cs.subjectMonthlyConfigs[0];
        const available = config ? config.availableClasses : totalWorkingDays;

        // Taken class count (count of distinct sessions conducted)
        const takenCount = await prisma.attendanceSession.count({
          where: {
            classSubjectId: cs.id,
            date: { gte: startStr, lte: endStr },
          },
        });

        const notTaken = Math.max(0, available - takenCount);

        return {
          slNo: index + 1,
          classSubjectId: cs.id,
          subjectId: cs.subject.id,
          subjectName: cs.subject.name,
          arabicName: cs.subject.arabicName || cs.subject.name,
          teacherName: cs.teacher.name,
          availableClasses: available,
          takenClasses: takenCount,
          notTakenClasses: notTaken,
        };
      })
    );

    const grandTotalTaken = subjectSummaries.reduce((sum, s) => sum + s.takenClasses, 0);

    // Build Student Row Matrix
    const studentRows = await Promise.all(
      students.map(async (student, sIdx) => {
        let grandTotalAttended = 0;

        // Subject Breakdown for Student
        const subjectStats = await Promise.all(
          subjectSummaries.map(async (subj) => {
            const attendedCount = await prisma.attendanceRecord.count({
              where: {
                studentId: student.id,
                status: 'PRESENT',
                session: {
                  classSubjectId: subj.classSubjectId,
                  date: { gte: startStr, lte: endStr },
                },
              },
            });

            grandTotalAttended += attendedCount;

            const percentage = subj.takenClasses > 0
              ? Number(((attendedCount / subj.takenClasses) * 100).toFixed(2))
              : 0;

            return {
              classSubjectId: subj.classSubjectId,
              subjectName: subj.subjectName,
              attended: attendedCount,
              taken: subj.takenClasses,
              percentage,
            };
          })
        );

        // Overall Percentage
        const overallPercentage = grandTotalTaken > 0
          ? Number(((grandTotalAttended / grandTotalTaken) * 100).toFixed(2))
          : 0;

        // Day-wise Attendance
        const presentDaysCount = await prisma.dailyAttendance.count({
          where: {
            studentId: student.id,
            classId: cls.id,
            status: 'PRESENT',
            date: { gte: startStr, lte: endStr },
          },
        });

        const monthlyLeave = Math.max(0, totalWorkingDays - presentDaysCount);
        const dayWisePercentage = totalWorkingDays > 0
          ? Number(((presentDaysCount / totalWorkingDays) * 100).toFixed(2))
          : 0;

        const isAtRisk = overallPercentage < threshold || dayWisePercentage < threshold;

        return {
          slNo: sIdx + 1,
          studentId: student.id,
          registerNumber: student.registerNumber,
          rollNumber: student.rollNumber,
          studentName: student.name,
          subjectStats,
          grandTotalAttended,
          grandTotalTaken,
          overallPercentage,
          workingDays: totalWorkingDays,
          presentDays: presentDaysCount,
          monthlyLeave,
          dayWisePercentage,
          isAtRisk,
        };
      })
    );

    res.json({
      className: cls.name,
      academicYearName: cls.academicYear.name,
      monthName: month.monthName,
      year: month.year,
      workingDays: totalWorkingDays,
      threshold,
      subjectSummaries,
      students: studentRows,
    });
  } catch (error: any) {
    console.error('Report calculation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate monthly attendance report' });
  }
};

// 2. Admin Dashboard Overview Stats & Charts
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { monthId } = req.query;

    const [totalStudents, totalClasses, totalSubjects, totalTeachers, settings] = await Promise.all([
      prisma.student.count({ where: { active: true } }),
      prisma.class.count({ where: { active: true } }),
      prisma.subject.count({ where: { active: true } }),
      prisma.teacher.count({ where: { active: true } }),
      prisma.systemSettings.findFirst(),
    ]);

    let activeMonth = null;
    if (monthId) {
      activeMonth = await prisma.academicMonth.findUnique({
        where: { id: String(monthId) },
        include: { academicYear: true },
      });
    }

    if (!activeMonth) {
      const now = new Date();
      const currentMonthName = now.toLocaleString('default', { month: 'long' }).toLowerCase();
      const currentYear = now.getFullYear();

      const allMonths = await prisma.academicMonth.findMany({ include: { academicYear: true } });
      activeMonth = allMonths.find(
        (m) => m.year === currentYear && m.monthName.toLowerCase() === currentMonthName
      ) || null;

      if (!activeMonth) {
        activeMonth = allMonths[0] || null;
      }
    }

    const threshold = settings?.attendanceThreshold || 75.0;

    // Recent Sessions
    const recentSessions = await prisma.attendanceSession.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        class: true,
        classSubject: {
          include: { subject: true, teacher: true },
        },
      },
    });

    // Class-wise attendance summary for active month
    let classChartData: any[] = [];
    if (activeMonth) {
      const classes = await prisma.class.findMany({ where: { active: true } });
      const { startStr, endStr } = getMonthDateBounds(activeMonth.monthName, activeMonth.year);

      for (const c of classes) {
        const totalRecords = await prisma.attendanceRecord.count({
          where: {
            session: { classId: c.id, date: { gte: startStr, lte: endStr } },
          },
        });
        const presentRecords = await prisma.attendanceRecord.count({
          where: {
            status: 'PRESENT',
            session: { classId: c.id, date: { gte: startStr, lte: endStr } },
          },
        });
        const percentage = totalRecords > 0 ? Number(((presentRecords / totalRecords) * 100).toFixed(1)) : 0;
        classChartData.push({
          className: c.name,
          percentage,
          totalSessions: await prisma.attendanceSession.count({
            where: { classId: c.id, date: { gte: startStr, lte: endStr } },
          }),
        });
      }
    }

    res.json({
      totalStudents,
      totalClasses,
      totalSubjects,
      totalTeachers,
      threshold,
      activeMonthName: activeMonth ? `${activeMonth.monthName} ${activeMonth.year}` : 'N/A',
      recentSessions,
      classChartData,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard statistics' });
  }
};

// 3. Students At Risk (Below Threshold)
export const getStudentsAtRisk = async (req: AuthRequest, res: Response) => {
  try {
    const { monthId } = req.query;

    let month = null;
    if (monthId) {
      month = await prisma.academicMonth.findUnique({ where: { id: String(monthId) } });
    }

    if (!month) {
      const now = new Date();
      const currentMonthName = now.toLocaleString('default', { month: 'long' }).toLowerCase();
      const currentYear = now.getFullYear();
      const allMonths = await prisma.academicMonth.findMany();
      month = allMonths.find(
        (m) => m.year === currentYear && m.monthName.toLowerCase() === currentMonthName
      ) || allMonths[0] || null;
    }

    if (!month) {
      return res.json([]);
    }

    const settings = await prisma.systemSettings.findFirst();
    const threshold = settings?.attendanceThreshold || 75.0;
    const { startStr, endStr } = getMonthDateBounds(month.monthName, month.year);

    const students = await prisma.student.findMany({
      where: { active: true },
      include: { class: true },
    });

    const atRiskList: any[] = [];

    for (const student of students) {
      const totalRecords = await prisma.attendanceRecord.count({
        where: {
          studentId: student.id,
          session: { date: { gte: startStr, lte: endStr } },
        },
      });

      if (totalRecords === 0) continue;

      const presentRecords = await prisma.attendanceRecord.count({
        where: {
          studentId: student.id,
          status: 'PRESENT',
          session: { date: { gte: startStr, lte: endStr } },
        },
      });

      const percentage = Number(((presentRecords / totalRecords) * 100).toFixed(2));

      if (percentage < threshold) {
        atRiskList.push({
          studentId: student.id,
          name: student.name,
          registerNumber: student.registerNumber,
          rollNumber: student.rollNumber,
          className: student.class.name,
          totalRecords,
          presentRecords,
          percentage,
          threshold,
        });
      }
    }

    res.json(atRiskList);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch students at risk' });
  }
};
